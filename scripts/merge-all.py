#!/usr/bin/env python3
"""
Merge all opportunity data sources into a single validated dataset.
Deduplicates by normalized name, keeps entry with higher composite_score.
Validates all entries against the earlythunder schema.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# --- Constants ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
GAP_FILL_DIR = DATA_DIR / "gap-fill"
OUTPUT_FILE = DATA_DIR / "opportunities.json"
REPORT_FILE = DATA_DIR / "merge-report.txt"

REQUIRED_FIELDS = [
    "name", "category", "asset_class", "tier",
    "composite_score", "one_liner", "thesis", "signals",
    "catalysts", "risks", "updated_at", "is_graveyard",
]
SIGNAL_KEYS = [
    "toy_phase", "working_code", "community", "dev_activity",
    "smart_money", "narrative", "hard_to_buy", "catalyst",
]
SIGNAL_WEIGHTS = [0.15, 0.20, 0.10, 0.15, 0.15, 0.05, 0.05, 0.15]
VALID_ASSET_CLASSES = {"digital_assets", "public_equities", "private_markets"}
VALID_TIERS = {1, 2, 3}
MAX_ENTRIES = 500
MAX_SCORE = 100.0
SCORE_TOLERANCE = 5.1


def normalize_name(name: str) -> str:
    """Normalize a project name for dedup comparison."""
    assert isinstance(name, str), f"Name must be string, got {type(name)}"
    assert len(name) > 0, "Name must not be empty"
    return name.lower().strip().replace("-", " ").replace("_", " ").replace(".", " ")


def generate_slug(name: str) -> str:
    """Generate a URL-safe slug from a project name."""
    assert isinstance(name, str) and len(name) > 0
    slug = name.lower().strip()
    # Replace common separators
    for ch in [" ", "_", ".", "/", "(", ")", "'", '"', ","]:
        slug = slug.replace(ch, "-")
    # Remove consecutive hyphens
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")[:80]


def load_json_array(filepath: Path) -> list:
    """Load a JSON file that contains an array."""
    assert filepath.exists(), f"File not found: {filepath}"
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list), f"Expected array in {filepath.name}, got {type(data)}"
    return data[:MAX_ENTRIES]


def calculate_composite(signals: dict) -> float:
    """Calculate composite score from signal scores."""
    assert isinstance(signals, dict), "Signals must be a dict"
    total = 0.0
    for key, weight in zip(SIGNAL_KEYS, SIGNAL_WEIGHTS):
        val = signals.get(key, 0)
        if not isinstance(val, (int, float)):
            val = 0
        total += val * weight
    return round(total, 1)


def validate_entry(entry: dict, idx: int) -> list[str]:
    """Validate a single entry. Returns list of error strings."""
    assert isinstance(entry, dict), f"Entry {idx} must be dict"
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in entry:
            errors.append(f"[{idx}] Missing field: {field}")

    name = entry.get("name", f"UNKNOWN-{idx}")

    # Validate asset_class
    ac = entry.get("asset_class")
    if ac not in VALID_ASSET_CLASSES:
        errors.append(f"[{name}] Invalid asset_class: {ac}")

    # Validate tier
    tier = entry.get("tier")
    if tier not in VALID_TIERS:
        errors.append(f"[{name}] Invalid tier: {tier}")

    # Validate signals
    signals = entry.get("signals", {})
    if not isinstance(signals, dict):
        errors.append(f"[{name}] Signals must be dict")
    else:
        for key in SIGNAL_KEYS:
            val = signals.get(key)
            if not isinstance(val, (int, float)):
                errors.append(f"[{name}] Signal {key} not numeric: {val}")
            elif val < 0 or val > MAX_SCORE:
                errors.append(f"[{name}] Signal {key} out of range: {val}")

    # Validate composite matches formula
    score = entry.get("composite_score", 0)
    if isinstance(signals, dict):
        expected = calculate_composite(signals)
        if abs(score - expected) > SCORE_TOLERANCE:
            errors.append(
                f"[{name}] Score mismatch: got {score}, expected {expected}"
            )

    # Validate arrays
    for arr_field in ["catalysts", "risks"]:
        val = entry.get(arr_field, [])
        if not isinstance(val, list) or len(val) < 1:
            errors.append(f"[{name}] {arr_field} must be non-empty array")

    return errors


def merge_datasets() -> None:
    """Main merge function."""
    all_entries: list[dict] = []
    source_counts: dict[str, int] = {}

    # 1. Load existing A2 data
    a2_file = OUTPUT_FILE
    if a2_file.exists():
        a2_data = load_json_array(a2_file)
        all_entries.extend(a2_data)
        source_counts["a2-seed (existing)"] = len(a2_data)
        print(f"  Loaded {len(a2_data)} entries from existing opportunities.json")

    # 2. Load all gap-fill files
    if GAP_FILL_DIR.exists():
        gap_files = sorted(GAP_FILL_DIR.glob("*.json"))
        for gf in gap_files[:20]:  # Fixed upper bound
            data = load_json_array(gf)
            all_entries.extend(data)
            source_counts[gf.stem] = len(data)
            print(f"  Loaded {len(data)} entries from gap-fill/{gf.name}")

    print(f"\n  Total pre-dedup: {len(all_entries)} entries")

    # 3. Deduplicate by normalized name (keep higher score)
    seen: dict[str, dict] = {}
    dupes = 0
    for entry in all_entries[:MAX_ENTRIES]:
        name = entry.get("name", "")
        norm = normalize_name(name)
        if norm in seen:
            dupes += 1
            existing_score = seen[norm].get("composite_score", 0)
            new_score = entry.get("composite_score", 0)
            if new_score > existing_score:
                print(f"  DEDUP: Replacing '{seen[norm]['name']}' ({existing_score}) with '{name}' ({new_score})")
                seen[norm] = entry
            else:
                print(f"  DEDUP: Keeping '{seen[norm]['name']}' ({existing_score}), skipping '{name}' ({new_score})")
        else:
            seen[norm] = entry

    unique_entries = list(seen.values())
    print(f"  Removed {dupes} duplicates → {len(unique_entries)} unique entries")

    # 4. Ensure all entries have slug and related_slugs
    all_slugs = set()
    for entry in unique_entries[:MAX_ENTRIES]:
        if "slug" not in entry or not entry["slug"]:
            entry["slug"] = generate_slug(entry.get("name", "unknown"))
        all_slugs.add(entry["slug"])

    # Fix related_slugs to only reference existing slugs
    for entry in unique_entries[:MAX_ENTRIES]:
        if "related_slugs" not in entry:
            entry["related_slugs"] = []
        entry["related_slugs"] = [
            s for s in entry["related_slugs"][:10]
            if s in all_slugs and s != entry["slug"]
        ]

    # Ensure ticker field exists
    for entry in unique_entries[:MAX_ENTRIES]:
        if "ticker" not in entry:
            entry["ticker"] = None

    # Ensure citations field exists
    for entry in unique_entries[:MAX_ENTRIES]:
        if "citations" not in entry:
            entry["citations"] = []

    # 5. Validate all entries
    all_errors = []
    for i, entry in enumerate(unique_entries[:MAX_ENTRIES]):
        errs = validate_entry(entry, i)
        all_errors.extend(errs)

    if all_errors:
        print(f"\n  WARNINGS ({len(all_errors)}):")
        for err in all_errors[:50]:  # Show max 50
            print(f"    {err}")

    # 6. Sort by composite_score descending
    unique_entries.sort(
        key=lambda e: e.get("composite_score", 0), reverse=True
    )

    # 7. Compute stats
    tier_counts = {1: 0, 2: 0, 3: 0}
    asset_counts: dict[str, int] = {}
    category_counts: dict[str, int] = {}
    graveyard_count = 0

    for entry in unique_entries[:MAX_ENTRIES]:
        t = entry.get("tier", 3)
        if t in tier_counts:
            tier_counts[t] += 1
        ac = entry.get("asset_class", "unknown")
        asset_counts[ac] = asset_counts.get(ac, 0) + 1
        cat = entry.get("category", "unknown")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if entry.get("is_graveyard", False):
            graveyard_count += 1

    # 8. Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(unique_entries, f, indent=2, ensure_ascii=False)

    # 9. Print report
    report_lines = [
        "=" * 60,
        "  MERGE REPORT",
        "=" * 60,
        f"  Total entries: {len(unique_entries)}",
        f"  Duplicates removed: {dupes}",
        f"  Graveyard entries: {graveyard_count}",
        f"  Validation warnings: {len(all_errors)}",
        "",
        "  --- Sources ---",
    ]
    for src, count in sorted(source_counts.items()):
        report_lines.append(f"    {src}: {count}")
    report_lines.append("")
    report_lines.append("  --- Tiers ---")
    for tier in [1, 2, 3]:
        report_lines.append(f"    Tier {tier}: {tier_counts[tier]}")
    report_lines.append("")
    report_lines.append("  --- Asset Classes ---")
    for ac, count in sorted(asset_counts.items(), key=lambda x: -x[1]):
        report_lines.append(f"    {ac}: {count}")
    report_lines.append("")
    report_lines.append("  --- Categories ---")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        report_lines.append(f"    {cat}: {count}")
    report_lines.append("")
    report_lines.append("  --- Top 10 by Score ---")
    for entry in unique_entries[:10]:
        name = entry.get("name", "?")
        score = entry.get("composite_score", 0)
        tier = entry.get("tier", "?")
        report_lines.append(f"    {score:5.1f}  T{tier}  {name}")
    report_lines.append("=" * 60)

    report_text = "\n".join(report_lines)
    print(report_text)

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"\n  Written to: {OUTPUT_FILE}")
    print(f"  Report to: {REPORT_FILE}")

    # Exit with error if critical issues
    critical = [e for e in all_errors if "Missing field" in e or "not numeric" in e]
    if len(critical) > 10:
        print(f"\n  CRITICAL: {len(critical)} critical errors. Review needed.")
        sys.exit(1)


if __name__ == "__main__":
    print("\n  Starting merge...\n")
    merge_datasets()
    print("\n  Done.\n")
