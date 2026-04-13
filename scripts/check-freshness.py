#!/usr/bin/env python3
"""
Data freshness monitor for Early Thunder opportunity entries.

Reads data/opportunities.json, checks updated_at timestamps,
and flags stale (>7 days) or critical (>30 days) entries.

Exit code 0: no critical entries found.
Exit code 1: at least one critical entry found.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

STALE_THRESHOLD_DAYS: int = 7
CRITICAL_THRESHOLD_DAYS: int = 30
DATA_FILE_NAME: str = "data/opportunities.json"
MAX_ENTRIES: int = 10_000  # Fixed upper bound for loops

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


class OpportunityEntry(TypedDict, total=False):
    """Minimal shape required for freshness checking.
    Supports both slug/name (actual data) and id/title (generic) schemas.
    """
    slug: str
    name: str
    id: str
    title: str
    updated_at: str


class FreshnessResult(TypedDict):
    """Result of checking a single entry."""
    id: str
    title: str
    days_since_update: int
    status: str  # "ok" | "stale" | "critical"


# ---------------------------------------------------------------------------
# Core functions
# ---------------------------------------------------------------------------


def resolve_data_path(base_dir: Path) -> Path:
    """Resolve the opportunities data file path relative to base_dir."""
    assert isinstance(base_dir, Path), "base_dir must be a Path"
    data_path = base_dir / DATA_FILE_NAME
    assert data_path.suffix == ".json", "Data file must be .json"
    return data_path


def load_opportunities(data_path: Path) -> list[OpportunityEntry]:
    """Load and validate the opportunities JSON file."""
    assert data_path.exists(), f"Data file not found: {data_path}"
    assert data_path.is_file(), f"Path is not a file: {data_path}"

    raw_text = data_path.read_text(encoding="utf-8")
    parsed: object = json.loads(raw_text)

    if not isinstance(parsed, list):
        raise ValueError("Expected a JSON array at top level")

    entries: list[OpportunityEntry] = []
    for i, item in enumerate(parsed):
        if i >= MAX_ENTRIES:
            break
        if not isinstance(item, dict):
            raise ValueError(f"Entry {i} is not a JSON object")
        has_identifier = "id" in item or "slug" in item
        if not has_identifier or "updated_at" not in item:
            raise ValueError(f"Entry {i} missing required fields (id/slug, updated_at)")
        entries.append(item)  # type: ignore[arg-type]

    return entries


def check_entry_freshness(
    entry: OpportunityEntry,
    now: datetime,
) -> FreshnessResult:
    """Evaluate freshness of a single opportunity entry."""
    assert "updated_at" in entry, "Entry must have updated_at field"
    assert now.tzinfo is not None, "now must be timezone-aware"

    raw_ts = entry["updated_at"].replace("Z", "+00:00")
    updated_at = datetime.fromisoformat(raw_ts)
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    delta = now - updated_at
    days = delta.days

    status: str
    if days > CRITICAL_THRESHOLD_DAYS:
        status = "critical"
    elif days > STALE_THRESHOLD_DAYS:
        status = "stale"
    else:
        status = "ok"

    entry_id: str = entry.get("id") or entry.get("slug") or "(unknown)"
    entry_title: str = entry.get("title") or entry.get("name") or "(untitled)"

    return FreshnessResult(
        id=entry_id,
        title=entry_title,
        days_since_update=days,
        status=status,
    )


def evaluate_all_entries(
    entries: list[OpportunityEntry],
) -> list[FreshnessResult]:
    """Check freshness for every entry. Returns list of results."""
    assert isinstance(entries, list), "entries must be a list"
    now = datetime.now(tz=timezone.utc)

    results: list[FreshnessResult] = []
    for i, entry in enumerate(entries):
        if i >= MAX_ENTRIES:
            break
        results.append(check_entry_freshness(entry, now))

    return results


def print_report(results: list[FreshnessResult]) -> bool:
    """Print a human-readable freshness report. Returns True if any critical."""
    assert isinstance(results, list), "results must be a list"

    ok_count = 0
    stale_count = 0
    critical_count = 0

    stale_entries: list[FreshnessResult] = []
    critical_entries: list[FreshnessResult] = []

    for i, r in enumerate(results):
        if i >= MAX_ENTRIES:
            break
        if r["status"] == "critical":
            critical_count += 1
            critical_entries.append(r)
        elif r["status"] == "stale":
            stale_count += 1
            stale_entries.append(r)
        else:
            ok_count += 1

    total = ok_count + stale_count + critical_count

    print("=" * 60)
    print("  EARLY THUNDER - Data Freshness Report")
    print("=" * 60)
    print(f"  Total entries:  {total}")
    print(f"  Fresh (OK):     {ok_count}")
    print(f"  Stale (>7d):    {stale_count}")
    print(f"  Critical (>30d):{critical_count}")
    print("-" * 60)

    if critical_entries:
        print("\n  CRITICAL ENTRIES:")
        for entry in critical_entries[:50]:
            print(f"    [{entry['id']}] {entry['title']} — {entry['days_since_update']}d ago")

    if stale_entries:
        print("\n  STALE ENTRIES:")
        for entry in stale_entries[:50]:
            print(f"    [{entry['id']}] {entry['title']} — {entry['days_since_update']}d ago")

    if not critical_entries and not stale_entries:
        print("\n  All entries are fresh.")

    print("=" * 60)

    return critical_count > 0


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    """Entry point. Returns 0 if no critical, 1 if any critical."""
    base_dir = Path(__file__).resolve().parent.parent
    data_path = resolve_data_path(base_dir)

    if not data_path.exists():
        print(f"WARNING: Data file does not exist yet: {data_path}")
        print("No entries to check. Exiting clean.")
        return 0

    entries = load_opportunities(data_path)

    if len(entries) == 0:
        print("No entries found in opportunities data. Nothing to check.")
        return 0

    results = evaluate_all_entries(entries)
    has_critical = print_report(results)

    return 1 if has_critical else 0


if __name__ == "__main__":
    sys.exit(main())
