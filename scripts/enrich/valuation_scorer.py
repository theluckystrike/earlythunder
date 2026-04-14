#!/usr/bin/env python3
"""Calculate valuation_gap signal score for all opportunity entries.

Scoring logic:
  market_cap_usd < $5M        -> 97
  $5M - $25M                  -> 85
  $25M - $100M                -> 72
  $100M - $500M               -> 55
  $500M - $2B                 -> 35
  $2B - $10B                  -> 18
  $10B - $50B                 -> 7
  > $50B                      -> 2
  null cap + private_markets   -> 90
  null cap + unknown           -> 75
"""

import json
import sys
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "opportunities.json"

# Valuation tiers: (upper_bound_exclusive, score)
# Checked in order; first match wins
VALUATION_TIERS = [
    (5_000_000, 97),
    (25_000_000, 85),
    (100_000_000, 72),
    (500_000_000, 55),
    (2_000_000_000, 35),
    (10_000_000_000, 18),
    (50_000_000_000, 7),
    (float("inf"), 2),
]


def load_opportunities():
    """Load opportunities from JSON file."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_opportunities(data):
    """Save opportunities to JSON file."""
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def compute_valuation_gap(opp):
    """Compute the valuation_gap score for a single opportunity."""
    if opp.get("is_graveyard"):
        return None  # skip graveyard entries

    mcap = opp.get("market_cap_usd")

    if mcap is not None and isinstance(mcap, (int, float)):
        for upper_bound, score in VALUATION_TIERS:
            if mcap < upper_bound:
                return score
        return 2  # fallback for extremely large values

    # Null market cap: check asset_class
    asset_class = opp.get("asset_class", "")
    if asset_class == "private_markets":
        return 90
    return 75  # unknown / pre-token


def format_mcap(mcap):
    """Format market cap for display."""
    if mcap is None:
        return "null"
    if mcap >= 1_000_000_000:
        return f"${mcap / 1_000_000_000:.1f}B"
    if mcap >= 1_000_000:
        return f"${mcap / 1_000_000:.1f}M"
    return f"${mcap:,.0f}"


def main():
    """Main scoring pipeline for valuation gap."""
    data = load_opportunities()
    if not isinstance(data, list):
        print("Error: opportunities.json is not a list")
        sys.exit(1)

    print(f"Loaded {len(data)} opportunities")

    scored = 0
    skipped = 0
    results = []

    for opp in data:
        score = compute_valuation_gap(opp)

        if score is None:
            skipped += 1
            continue

        # Ensure signals object exists
        if "signals" not in opp or not isinstance(opp["signals"], dict):
            opp["signals"] = {}

        opp["signals"]["valuation_gap"] = score
        opp["valuation_gap_score"] = score
        scored += 1

        results.append({
            "slug": opp.get("slug", "?"),
            "name": opp.get("name", "?"),
            "mcap": opp.get("market_cap_usd"),
            "asset_class": opp.get("asset_class", "?"),
            "score": score,
        })

    save_opportunities(data)

    # Sort by score descending, then by name
    results.sort(key=lambda r: (-r["score"], r["name"]))

    print(f"\nScored {scored} entries, skipped {skipped} graveyard entries")
    print(f"\n{'='*80}")
    print(f"TOP 20 BY VALUATION GAP SCORE")
    print(f"{'='*80}")
    print(f"{'#':>3}  {'Score':>5}  {'Market Cap':>12}  {'Asset Class':>16}  {'Name'}")
    print(f"{'-'*3}  {'-'*5}  {'-'*12}  {'-'*16}  {'-'*30}")

    for i, r in enumerate(results[:20], 1):
        mcap_str = format_mcap(r["mcap"])
        print(f"{i:>3}  {r['score']:>5}  {mcap_str:>12}  {r['asset_class']:>16}  {r['name']}")

    # Also show distribution
    print(f"\n{'='*80}")
    print(f"SCORE DISTRIBUTION")
    print(f"{'='*80}")
    from collections import Counter
    dist = Counter(r["score"] for r in results)
    for score in sorted(dist.keys(), reverse=True):
        count = dist[score]
        bar = "#" * count
        print(f"  {score:>3}: {count:>3} entries  {bar}")


if __name__ == "__main__":
    main()
