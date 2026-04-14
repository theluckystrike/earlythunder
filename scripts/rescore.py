#!/usr/bin/env python3
"""Migrate signal fields from old names to new names and recalculate scores."""
import json
from pathlib import Path

DATA_PATH = Path("/Users/mike/earlythunder/data/opportunities.json")

# New signal weights
WEIGHTS = {
    "working_code": 0.20,
    "dev_activity": 0.15,
    "smart_money": 0.10,
    "community": 0.10,
    "catalyst": 0.15,
    "narrative": 0.05,
    "valuation_gap": 0.15,
    "obscurity": 0.10,
}

WELL_KNOWN = [
    "cameco", "ionq", "d-wave", "nexgen", "mp materials", "first solar",
    "marvell", "ginkgo", "bittensor", "filecoin", "worldcoin", "helium",
    "ondo", "eigenlayer", "near protocol", "render", "united therapeutics",
    "sprott", "ouster", "evolv", "american superconductor",
]

TRULY_OBSCURE = [
    "hairdao", "cryodao", "valleydao", "acurast", "dawn", "molecule",
    "aminochain", "cortical labs", "finalspark", "koniku", "biomemory",
    "fourth power", "circulate health", "arkreen", "silencio", "opulous",
    "spacecoin", "namada",
]

def parse_market_cap(mcap):
    """Parse market_cap_usd which is a number or null."""
    if mcap is None:
        return None
    if isinstance(mcap, (int, float)) and mcap > 0:
        return float(mcap)
    return None

def calc_valuation_gap(mcap, asset_class):
    """Score valuation gap based on market cap."""
    if mcap is None:
        return 90 if asset_class == "private_markets" else 75
    if mcap < 5e6: return 97
    if mcap < 25e6: return 85
    if mcap < 100e6: return 72
    if mcap < 500e6: return 55
    if mcap < 2e9: return 35
    if mcap < 10e9: return 18
    if mcap < 50e9: return 7
    return 2

def calc_obscurity(mcap, name):
    """Score obscurity based on market cap and name recognition."""
    name_lower = name.lower()

    # Well-known penalty
    if any(wk in name_lower for wk in WELL_KNOWN):
        base = 25
        if mcap is not None:
            if mcap < 100e6: return min(base, 40)
            if mcap < 1e9: return min(base, 30)
        return base

    # Truly obscure boost
    if any(obs in name_lower for obs in TRULY_OBSCURE):
        if mcap is None:
            return 90
        if mcap < 5e6: return 95
        if mcap < 25e6: return 90
        return 85

    # Base from market cap
    if mcap is None: return 80
    if mcap < 5e6: return 90
    if mcap < 25e6: return 80
    if mcap < 100e6: return 65
    if mcap < 500e6: return 50
    if mcap < 2e9: return 35
    if mcap < 10e9: return 20
    if mcap < 50e9: return 10
    return 5

def calc_composite(signals):
    """Calculate weighted composite score."""
    total = 0.0
    for key, weight in WEIGHTS.items():
        val = signals.get(key, 0)
        if not isinstance(val, (int, float)):
            val = 0
        clamped = max(0, min(100, val))
        total += clamped * weight
    return round(total, 1)

def derive_tier(score, is_graveyard):
    """Assign tier based on composite score."""
    if is_graveyard:
        return 3
    if score >= 75:
        return 1
    if score >= 55:
        return 2
    return 3

def main():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    changes = []

    for opp in data:
        name = opp.get("name", "")
        signals = opp.get("signals", {})
        mcap = parse_market_cap(opp.get("market_cap_usd"))
        asset_class = opp.get("asset_class", "")
        is_graveyard = opp.get("is_graveyard", False)
        old_score = opp.get("composite_score", 0)

        # Step 1: Remove old signal keys
        signals.pop("toy_phase", None)
        signals.pop("hard_to_buy", None)

        # Step 2: Always recalculate valuation_gap and obscurity for consistency
        # Well-known names MUST get penalized even if A3 set high values
        name_lower = name.lower()
        is_well_known = any(wk in name_lower for wk in WELL_KNOWN)
        is_truly_obscure = any(obs in name_lower for obs in TRULY_OBSCURE)

        # Recalculate valuation_gap from market cap (authoritative source)
        signals["valuation_gap"] = calc_valuation_gap(mcap, asset_class)

        # Force recalculate obscurity for well-known/truly-obscure names
        # For others, keep A3 value if it exists, else calculate
        if is_well_known or is_truly_obscure:
            signals["obscurity"] = calc_obscurity(mcap, name)
        elif "obscurity" not in signals or signals.get("obscurity") is None:
            signals["obscurity"] = calc_obscurity(mcap, name)

        # Ensure all expected keys exist
        for key in WEIGHTS:
            if key not in signals:
                signals[key] = 50  # default

        # Step 3: Recalculate composite
        new_score = calc_composite(signals)
        new_tier = derive_tier(new_score, is_graveyard)

        # Update opportunity
        opp["signals"] = signals
        opp["composite_score"] = new_score
        opp["tier"] = new_tier

        # Also set convenience fields
        opp["valuation_gap_score"] = signals.get("valuation_gap", 50)
        opp["obscurity_score"] = signals.get("obscurity", 50)

        if abs(new_score - old_score) > 3:
            changes.append((name, old_score, new_score, new_tier, mcap))

    # Sort ALL entries by composite_score descending
    data.sort(key=lambda x: x.get("composite_score", 0), reverse=True)

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    # Report
    print(f"Processed {len(data)} entries")
    print(f"\nSignificant score changes (>3 points):")
    changes.sort(key=lambda x: abs(x[2] - x[1]), reverse=True)
    for name, old, new, tier, mcap in changes[:30]:
        mcap_str = f"${mcap/1e6:.0f}M" if mcap and mcap < 1e9 else f"${mcap/1e9:.1f}B" if mcap else "Private"
        arrow = "up" if new > old else "down"
        print(f"  {name:35s}  {old:5.1f} -> {new:5.1f}  T{tier}  {mcap_str}  ({arrow})")

    # New top 20
    active = [o for o in data if not o.get("is_graveyard")]
    print(f"\n=== NEW TOP 20 ===")
    for i, o in enumerate(active[:20], 1):
        vg = o["signals"].get("valuation_gap", "?")
        obs = o["signals"].get("obscurity", "?")
        mcap = o.get("market_cap_usd")
        mcap_str = f"${mcap/1e6:.0f}M" if mcap and mcap < 1e9 else f"${mcap/1e9:.1f}B" if mcap else "Private"
        print(f"  {i:2d}. {o['name']:35s}  Score: {o['composite_score']:5.1f}  T{o['tier']}  VG:{vg}  Obs:{obs}  {mcap_str}")

if __name__ == "__main__":
    main()
