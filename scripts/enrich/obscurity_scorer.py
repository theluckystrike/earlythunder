#!/usr/bin/env python3
"""Calculate obscurity signal score for all opportunity entries.

Scoring logic (heuristic, market-cap-based proxy for true obscurity):

Base score from market cap:
  < $5M        -> 90
  $5M - $25M   -> 80
  $25M - $100M -> 65
  $100M - $500M -> 50
  $500M - $2B  -> 35
  $2B - $10B   -> 20
  $10B - $50B  -> 10
  > $50B       -> 5
  null         -> 80 (pre-token / private)

Adjustments:
  - Well-known names: cap at 35 max
  - Truly obscure names: floor at 85 min
"""

import json
import sys
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "opportunities.json"

# Obscurity tiers by market cap: (upper_bound_exclusive, score)
OBSCURITY_TIERS = [
    (5_000_000, 90),
    (25_000_000, 80),
    (100_000_000, 65),
    (500_000_000, 50),
    (2_000_000_000, 35),
    (10_000_000_000, 20),
    (50_000_000_000, 10),
    (float("inf"), 5),
]

# Well-known names: cap score at 35 regardless of market cap
# These are names that most crypto/tech investors already know
WELL_KNOWN_NAMES = {
    "cameco",
    "ionq",
    "d-wave-quantum",
    "nexgen-energy",
    "mp-materials",
    "first-solar",
    "marvell-celestial-ai",
    "ginkgo-bioworks",
    "bittensor",
    "filecoin",
    "worldcoin-world",
    "helium",
    "ondo-finance",
    "eigenlayer",
    "near-protocol",
    "render-network",
    "solana",
}

# Truly obscure projects: floor score at 85 regardless of market cap
# These are niche projects that very few investors have heard of
TRULY_OBSCURE_SLUGS = {
    "hairdao",
    "cryodao",
    "valleydao",
    "acurast",
    "dawn",
    "molecule-protocol",
    "aminochain",
    "cortical-labs",
    "finalspark",
    "koniku",
    "biomemory",
    "fourth-power",
    "circulate-health",
    "arkreen",
    "silencio",
    "opulous",
    "spacecoin",
    "namada",
}


def load_opportunities():
    """Load opportunities from JSON file."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_opportunities(data):
    """Save opportunities to JSON file."""
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def compute_obscurity(opp):
    """Compute the obscurity score for a single opportunity."""
    if opp.get("is_graveyard"):
        return None  # skip graveyard entries

    slug = opp.get("slug", "")
    mcap = opp.get("market_cap_usd")

    # Base score from market cap
    if mcap is not None and isinstance(mcap, (int, float)):
        base_score = 80  # default
        for upper_bound, score in OBSCURITY_TIERS:
            if mcap < upper_bound:
                base_score = score
                break
    else:
        # Null market cap = pre-token or private
        base_score = 80

    # Apply well-known penalty: cap at 35
    if slug in WELL_KNOWN_NAMES:
        base_score = min(base_score, 35)

    # Apply obscure boost: floor at 85
    if slug in TRULY_OBSCURE_SLUGS:
        base_score = max(base_score, 85)

    return base_score


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
    """Main scoring pipeline for obscurity."""
    data = load_opportunities()
    if not isinstance(data, list):
        print("Error: opportunities.json is not a list")
        sys.exit(1)

    print(f"Loaded {len(data)} opportunities")

    scored = 0
    skipped = 0
    results = []

    for opp in data:
        score = compute_obscurity(opp)

        if score is None:
            skipped += 1
            continue

        # Ensure signals object exists
        if "signals" not in opp or not isinstance(opp["signals"], dict):
            opp["signals"] = {}

        opp["signals"]["obscurity"] = score
        opp["obscurity_score"] = score
        scored += 1

        slug = opp.get("slug", "?")
        modifier = ""
        if slug in WELL_KNOWN_NAMES:
            modifier = " [well-known, capped]"
        elif slug in TRULY_OBSCURE_SLUGS:
            modifier = " [obscure, boosted]"

        results.append({
            "slug": slug,
            "name": opp.get("name", "?"),
            "mcap": opp.get("market_cap_usd"),
            "score": score,
            "modifier": modifier,
        })

    save_opportunities(data)

    # Sort by score descending, then by name
    results.sort(key=lambda r: (-r["score"], r["name"]))

    print(f"\nScored {scored} entries, skipped {skipped} graveyard entries")
    print(f"\n{'='*90}")
    print(f"TOP 20 MOST OBSCURE")
    print(f"{'='*90}")
    print(f"{'#':>3}  {'Score':>5}  {'Market Cap':>12}  {'Name':30s}  {'Notes'}")
    print(f"{'-'*3}  {'-'*5}  {'-'*12}  {'-'*30}  {'-'*20}")

    for i, r in enumerate(results[:20], 1):
        mcap_str = format_mcap(r["mcap"])
        print(f"{i:>3}  {r['score']:>5}  {mcap_str:>12}  {r['name']:30s}  {r['modifier']}")

    # Also show the least obscure (well-known)
    print(f"\n{'='*90}")
    print(f"BOTTOM 10 (LEAST OBSCURE / WELL-KNOWN)")
    print(f"{'='*90}")
    for i, r in enumerate(results[-10:], 1):
        mcap_str = format_mcap(r["mcap"])
        print(f"{i:>3}  {r['score']:>5}  {mcap_str:>12}  {r['name']:30s}  {r['modifier']}")

    # Distribution
    print(f"\n{'='*90}")
    print(f"SCORE DISTRIBUTION")
    print(f"{'='*90}")
    from collections import Counter
    dist = Counter(r["score"] for r in results)
    for score in sorted(dist.keys(), reverse=True):
        count = dist[score]
        bar = "#" * count
        print(f"  {score:>3}: {count:>3} entries  {bar}")


if __name__ == "__main__":
    main()
