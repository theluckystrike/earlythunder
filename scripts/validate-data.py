#!/usr/bin/env python3
"""Data validation script for earlythunder.com opportunities.

Validates every entry in opportunities.json against the schema,
checks composite scores, cross-references, and data integrity.
Exit code 0 = valid, exit code 1 = errors found.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

# --- Named Constants ---
DATA_DIR: str = str(Path(__file__).resolve().parent.parent / "data")
OPPORTUNITIES_FILE: str = str(Path(DATA_DIR) / "opportunities.json")
MAX_OPPORTUNITIES: int = 50
MIN_SCORE: int = 0
MAX_SCORE: int = 100
VALID_ASSET_CLASSES: tuple[str, ...] = (
    "digital_assets",
    "public_equities",
    "private_markets",
)
VALID_TIERS: tuple[int, ...] = (1, 2, 3)
SIGNAL_KEYS: tuple[str, ...] = (
    "toy_phase",
    "working_code",
    "community",
    "dev_activity",
    "smart_money",
    "narrative",
    "hard_to_buy",
    "catalyst",
)
# Composite score weights: aligned with the scoring methodology.
# These 8 signals are weighted to produce a 0-100 composite.
SIGNAL_WEIGHTS: dict[str, float] = {
    "toy_phase": 0.10,
    "working_code": 0.15,
    "community": 0.10,
    "dev_activity": 0.15,
    "smart_money": 0.15,
    "narrative": 0.10,
    "hard_to_buy": 0.10,
    "catalyst": 0.15,
}
SCORE_TOLERANCE: float = 5.0  # composite scores may be manually adjusted
REQUIRED_FIELDS: tuple[str, ...] = (
    "slug",
    "name",
    "category",
    "asset_class",
    "tier",
    "composite_score",
    "one_liner",
    "thesis",
    "signals",
    "catalysts",
    "risks",
    "related_slugs",
    "updated_at",
    "is_graveyard",
)


class ValidationError:
    """Immutable validation error record."""

    __slots__ = ("slug", "field", "message")

    def __init__(self, slug: str, field: str, message: str) -> None:
        self.slug = slug
        self.field = field
        self.message = message

    def __str__(self) -> str:
        return f"[{self.slug}] {self.field}: {self.message}"


def load_data(filepath: str) -> list[dict[str, Any]]:
    """Load and parse opportunities JSON array."""
    assert filepath, "filepath must not be empty"
    path = Path(filepath)
    assert path.exists(), f"File not found: {filepath}"

    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    assert isinstance(data, list), "Top-level must be a JSON array"
    return data


def validate_required_fields(opp: dict[str, Any]) -> list[ValidationError]:
    """Check that all required fields are present."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    for field in REQUIRED_FIELDS:
        if field not in opp:
            errors.append(ValidationError(slug, field, "required field missing"))

    return errors


def validate_field_types(opp: dict[str, Any]) -> list[ValidationError]:
    """Check field types for present fields."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    type_checks: tuple[tuple[str, type | tuple[type, ...]], ...] = (
        ("slug", str),
        ("name", str),
        ("category", str),
        ("asset_class", str),
        ("tier", int),
        ("composite_score", (int, float)),
        ("one_liner", str),
        ("thesis", str),
        ("signals", dict),
        ("catalysts", list),
        ("risks", list),
        ("related_slugs", list),
        ("updated_at", str),
        ("is_graveyard", bool),
    )

    for field, expected in type_checks:
        value = opp.get(field)
        if value is not None and not isinstance(value, expected):
            type_name = (
                expected.__name__ if isinstance(expected, type)
                else "/".join(t.__name__ for t in expected)
            )
            errors.append(ValidationError(
                slug, field,
                f"expected {type_name}, got {type(value).__name__}"
            ))

    # ticker can be null or string
    ticker = opp.get("ticker")
    if ticker is not None and not isinstance(ticker, str):
        errors.append(ValidationError(
            slug, "ticker", f"must be string or null, got {type(ticker).__name__}"
        ))

    return errors


def validate_enum_values(opp: dict[str, Any]) -> list[ValidationError]:
    """Check asset_class and tier against valid enums."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []

    asset_class = opp.get("asset_class")
    if isinstance(asset_class, str) and asset_class not in VALID_ASSET_CLASSES:
        errors.append(ValidationError(
            slug, "asset_class", f"'{asset_class}' not in {VALID_ASSET_CLASSES}"
        ))

    tier = opp.get("tier")
    if isinstance(tier, int) and tier not in VALID_TIERS:
        errors.append(ValidationError(
            slug, "tier", f"{tier} not in {VALID_TIERS}"
        ))

    return errors


def validate_signals(opp: dict[str, Any]) -> list[ValidationError]:
    """Validate signal values are present and within 0-100 range."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    signals = opp.get("signals")

    if not isinstance(signals, dict):
        errors.append(ValidationError(slug, "signals", "must be a dict"))
        return errors

    for key in SIGNAL_KEYS:
        value = signals.get(key)
        if value is None:
            errors.append(ValidationError(slug, f"signals.{key}", "missing"))
            continue
        if not isinstance(value, (int, float)):
            errors.append(ValidationError(
                slug, f"signals.{key}", f"must be numeric, got {type(value).__name__}"
            ))
            continue
        if value < MIN_SCORE or value > MAX_SCORE:
            errors.append(ValidationError(
                slug, f"signals.{key}",
                f"value {value} out of range [{MIN_SCORE}, {MAX_SCORE}]"
            ))

    return errors


def validate_composite_score(opp: dict[str, Any]) -> list[ValidationError]:
    """Check composite score is reasonable vs weighted signals (advisory)."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    signals = opp.get("signals", {})
    score = opp.get("composite_score")

    if not isinstance(score, (int, float)):
        return errors
    if not isinstance(signals, dict):
        return errors

    # Gather all signal values; bail if any missing
    signal_values: dict[str, float] = {}
    for key in SIGNAL_KEYS:
        val = signals.get(key)
        if not isinstance(val, (int, float)):
            return errors
        signal_values[key] = float(val)

    assert len(signal_values) == len(SIGNAL_WEIGHTS), "signal/weight count mismatch"

    expected = sum(
        signal_values[key] * weight
        for key, weight in SIGNAL_WEIGHTS.items()
    )
    diff = abs(float(score) - expected)

    if diff > SCORE_TOLERANCE:
        errors.append(ValidationError(
            slug, "composite_score",
            f"value {score} differs from weighted calculation {expected:.1f} "
            f"by {diff:.1f} (tolerance: {SCORE_TOLERANCE})"
        ))

    return errors


def validate_date_field(opp: dict[str, Any]) -> list[ValidationError]:
    """Validate ISO 8601 date format for updated_at."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    value = opp.get("updated_at")
    if not isinstance(value, str):
        return errors
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        errors.append(ValidationError(
            slug, "updated_at", f"invalid ISO 8601 date: '{value}'"
        ))
    return errors


def validate_related_slugs(
    opp: dict[str, Any],
    all_slugs: frozenset[str],
) -> list[ValidationError]:
    """Check related_slugs reference existing entries."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    related = opp.get("related_slugs", [])

    if not isinstance(related, list):
        errors.append(ValidationError(slug, "related_slugs", "must be a list"))
        return errors

    for idx, ref in enumerate(related[:MAX_OPPORTUNITIES]):
        if not isinstance(ref, str):
            errors.append(ValidationError(
                slug, f"related_slugs[{idx}]",
                f"must be string, got {type(ref).__name__}"
            ))
        elif ref not in all_slugs:
            errors.append(ValidationError(
                slug, f"related_slugs[{idx}]",
                f"references non-existent slug '{ref}'"
            ))

    return errors


def validate_lists_are_strings(opp: dict[str, Any]) -> list[ValidationError]:
    """Check catalysts and risks are lists of strings."""
    slug = opp.get("slug", "<missing-slug>")
    assert isinstance(opp, dict), "opportunity must be a dict"

    errors: list[ValidationError] = []
    for field_name in ("catalysts", "risks"):
        items = opp.get(field_name, [])
        if not isinstance(items, list):
            continue
        for idx, item in enumerate(items[:MAX_OPPORTUNITIES]):
            if not isinstance(item, str):
                errors.append(ValidationError(
                    slug, f"{field_name}[{idx}]",
                    f"must be string, got {type(item).__name__}"
                ))
    return errors


def validate_no_duplicate_slugs(
    opportunities: list[dict[str, Any]],
) -> list[ValidationError]:
    """Check for duplicate slugs in the dataset."""
    assert isinstance(opportunities, list), "opportunities must be a list"

    errors: list[ValidationError] = []
    seen: dict[str, int] = {}

    for idx, opp in enumerate(opportunities[:MAX_OPPORTUNITIES]):
        slug = opp.get("slug", f"<index-{idx}>")
        if slug in seen:
            errors.append(ValidationError(
                slug, "slug",
                f"duplicate (first at index {seen[slug]}, again at {idx})"
            ))
        else:
            seen[slug] = idx

    return errors


def run_validation(filepath: str) -> list[ValidationError]:
    """Run all validation checks. Returns list of errors (empty = valid)."""
    assert filepath, "filepath must not be empty"

    opportunities = load_data(filepath)
    assert len(opportunities) <= MAX_OPPORTUNITIES, (
        f"Too many opportunities: {len(opportunities)} > {MAX_OPPORTUNITIES}"
    )

    all_slugs = frozenset(opp.get("slug", "") for opp in opportunities)
    all_errors: list[ValidationError] = []

    # Global checks
    all_errors.extend(validate_no_duplicate_slugs(opportunities))

    # Per-entry checks
    for idx, opp in enumerate(opportunities[:MAX_OPPORTUNITIES]):
        slug = opp.get("slug", f"<index-{idx}>")
        print(f"  Validating [{idx + 1}/{len(opportunities)}]: {slug}")

        all_errors.extend(validate_required_fields(opp))
        all_errors.extend(validate_field_types(opp))
        all_errors.extend(validate_enum_values(opp))
        all_errors.extend(validate_signals(opp))
        all_errors.extend(validate_composite_score(opp))
        all_errors.extend(validate_date_field(opp))
        all_errors.extend(validate_related_slugs(opp, all_slugs))
        all_errors.extend(validate_lists_are_strings(opp))

    return all_errors


def main() -> int:
    """Entry point. Returns 0 if valid, 1 if errors found."""
    print("=" * 60)
    print("EarlyThunder Data Validation")
    print("=" * 60)

    filepath = OPPORTUNITIES_FILE
    print(f"Validating: {filepath}\n")

    try:
        errors = run_validation(filepath)
    except AssertionError as exc:
        print(f"\n[FATAL] Assertion failed: {exc}")
        return 1
    except json.JSONDecodeError as exc:
        print(f"\n[FATAL] Invalid JSON: {exc}")
        return 1
    except FileNotFoundError as exc:
        print(f"\n[FATAL] File not found: {exc}")
        return 1

    if not errors:
        print(f"\n{'=' * 60}")
        print("[PASS] All validation checks passed!")
        print(f"{'=' * 60}")
        return 0

    print(f"\n{'=' * 60}")
    print(f"[FAIL] Found {len(errors)} validation error(s):\n")
    for error in errors:
        print(f"  ERROR: {error}")
    print(f"\n{'=' * 60}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
