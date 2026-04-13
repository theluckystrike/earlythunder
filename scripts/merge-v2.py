#!/usr/bin/env python3
"""
Merge v2: Add new Invisible Layer entries + apply live price/mcap/volume data.
"""
import json
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
DATA = PROJECT / "data"
OPPS = DATA / "opportunities.json"
GAP = DATA / "gap-fill"
MAX_ENTRIES = 600

SIGNAL_KEYS = ["toy_phase", "working_code", "community", "dev_activity",
               "smart_money", "narrative", "hard_to_buy", "catalyst"]
SIGNAL_WEIGHTS = [0.15, 0.20, 0.10, 0.15, 0.15, 0.05, 0.05, 0.15]


def norm(name: str) -> str:
    assert isinstance(name, str) and len(name) > 0
    return name.lower().strip().replace("-", " ").replace("_", " ").replace(".", " ")


def gen_slug(name: str) -> str:
    assert isinstance(name, str) and len(name) > 0
    s = name.lower().strip()
    for ch in " _./()'\",":
        s = s.replace(ch, "-")
    while "--" in s:
        s = s.replace("--", "-")
    return s.strip("-")[:80]


def load_json(path: Path) -> list:
    assert path.exists(), f"Missing: {path}"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data[:MAX_ENTRIES]
    return []


def load_json_dict(path: Path, nested_key: str = "") -> dict:
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, dict), f"Expected dict in {path}"
    if nested_key and nested_key in data:
        inner = data[nested_key]
        assert isinstance(inner, dict)
        return inner
    return data


def merge_new_entries(existing: list, new_files: list) -> list:
    """Merge new entries, dedup by normalized name, keep higher score."""
    seen: dict[str, dict] = {}
    dupes = 0

    for entry in existing[:MAX_ENTRIES]:
        n = norm(entry.get("name", ""))
        seen[n] = entry

    for fpath in new_files[:10]:
        if not fpath.exists():
            print(f"  SKIP (missing): {fpath.name}")
            continue
        entries = load_json(fpath)
        print(f"  Loading {len(entries)} from {fpath.name}")
        for entry in entries[:MAX_ENTRIES]:
            n = norm(entry.get("name", ""))
            if n in seen:
                dupes += 1
                old_score = seen[n].get("composite_score", 0)
                new_score = entry.get("composite_score", 0)
                if new_score > old_score:
                    print(f"    REPLACE: {seen[n]['name']} ({old_score}) -> {entry['name']} ({new_score})")
                    seen[n] = entry
                else:
                    print(f"    KEEP: {seen[n]['name']} ({old_score}), skip {entry['name']} ({new_score})")
            else:
                seen[n] = entry

    print(f"  Duplicates resolved: {dupes}")
    return list(seen.values())


def apply_prices(entries: list, crypto_path: Path, equity_path: Path) -> int:
    """Apply price/mcap/volume data from fetched files."""
    crypto = load_json_dict(crypto_path, nested_key="prices")
    equity = load_json_dict(equity_path, nested_key="equities")
    updated = 0

    # Build equity lookup by ticker (uppercase)
    eq_map: dict[str, dict] = {}
    for ticker, data in equity.items():
        if isinstance(data, dict) and "error" not in data:
            eq_map[ticker.upper()] = data

    # Build crypto lookup by coingecko id (lowercase)
    cr_map: dict[str, dict] = {}
    for cg_id, data in crypto.items():
        if isinstance(data, dict) and data.get("current_price_usd") is not None:
            cr_map[cg_id.lower()] = data

    # Slug/name -> CoinGecko ID mapping
    SLUG_TO_CG: dict[str, str] = {
        "bittensor": "bittensor", "eigenlayer": "eigenlayer",
        "babylon": "babylon", "ondo-finance": "ondo-finance",
        "render-network": "render-token", "vitadao": "vitadao",
        "akash-network": "akash-network", "helium": "helium",
        "filecoin": "filecoin", "grass-network": "grass",
        "hivemapper": "hivemapper", "acurast": "acurast",
        "bio-protocol": "bio-protocol", "researchhub": "researchhub",
        "hairdao": "hairdao", "valleydao": "valleydao",
        "cow-protocol": "cow-protocol", "story-protocol": "story-protocol",
        "worldcoin-world": "worldcoin-wld", "zora-attention-markets": "zora",
        "opulous": "opulous", "near-protocol": "near",
        "near-protocol-ai-pivot": "near",
        "autonolas": "autonolas", "elizaos": "elizaos",
        "dimo": "dimo", "io-net": "io-net", "geodnet": "geodnet",
        "mina-protocol": "mina-protocol", "namada": "namada",
        "goldfinch": "goldfinch", "maple-finance": "maple-finance",
        "virtuals-protocol": "virtuals-protocol", "qubic": "qubic",
        "aleo": "aleo", "espresso-systems": "espresso-systems",
        "terra-luna": "terra-luna", "ftx-alameda": "ftx-token",
        "celo": "celo", "haqq-islamic-coin": "islamic-coin",
        "huma-finance": "huma-finance", "arkreen": "arkreen",
        "silencio": "silencio", "spacecoin": "spacecoin-2",
        "penumbra": "penumbra",
    }

    # Ticker -> equity ticker mapping
    TICKER_TO_EQ: dict[str, str] = {
        "CCJ": "CCJ", "NXE": "NXE", "IONQ": "IONQ",
        "SRUUF": "SRUUF", "DNN": "DNN", "UUUU": "UUUU",
        "SMR": "SMR", "GWH": "GWH", "QBTS": "QBTS",
        "BRN": "BRN.AX", "DNA": "DNA", "TWST": "TWST",
        "ANIC": "ANIC.L", "RDW": "RDW", "UTHR": "UTHR",
        "AMSC": "AMSC", "EVLV": "EVLV", "FSLR": "FSLR",
        "UMAC": "UMAC", "OUST": "OUST", "NAGE": "NAGE",
        "MP": "MP", "USAR": "USAR", "ERII": "ERII",
        "H2O": "H2O.F", "LNZA": "LNZA", "MRVL": "MRVL",
        "PDN": "PDN.AX",
    }

    for entry in entries[:MAX_ENTRIES]:
        slug = entry.get("slug", "").lower()
        ticker_raw = (entry.get("ticker") or "").replace("$", "").strip()
        ac = entry.get("asset_class", "")

        # Init fields
        for f in ["current_price_usd", "market_cap_usd", "volume_24h_usd"]:
            if f not in entry:
                entry[f] = None

        # Skip if already has price data
        if entry.get("current_price_usd") is not None:
            updated += 1
            continue

        matched = False

        # Crypto: try slug mapping -> CoinGecko
        if ac == "digital_assets":
            cg_id = SLUG_TO_CG.get(slug, slug)
            if cg_id in cr_map:
                pd = cr_map[cg_id]
                entry["current_price_usd"] = pd.get("current_price_usd")
                entry["market_cap_usd"] = pd.get("market_cap_usd")
                entry["volume_24h_usd"] = pd.get("volume_24h_usd")
                matched = True

        # Equity: try ticker mapping
        if ac == "public_equities" and not matched:
            eq_ticker = TICKER_TO_EQ.get(ticker_raw.upper(), ticker_raw.upper())
            if eq_ticker in eq_map:
                pd = eq_map[eq_ticker]
                entry["current_price_usd"] = pd.get("current_price")
                entry["market_cap_usd"] = pd.get("market_cap")
                entry["volume_24h_usd"] = pd.get("volume_24h")
                matched = True
            else:
                # Try direct ticker
                for variant in [ticker_raw.upper(), ticker_raw.upper() + ".AX",
                                ticker_raw.upper() + ".L", ticker_raw.upper() + ".F"]:
                    if variant in eq_map:
                        pd = eq_map[variant]
                        entry["current_price_usd"] = pd.get("current_price")
                        entry["market_cap_usd"] = pd.get("market_cap")
                        entry["volume_24h_usd"] = pd.get("volume_24h")
                        matched = True
                        break

        if matched and entry.get("current_price_usd") is not None:
            updated += 1

    return updated


def ensure_fields(entries: list) -> None:
    """Ensure all entries have required fields."""
    all_slugs = set()
    for e in entries[:MAX_ENTRIES]:
        if not e.get("slug"):
            e["slug"] = gen_slug(e.get("name", "unknown"))
        all_slugs.add(e["slug"])
        if "ticker" not in e:
            e["ticker"] = None
        if "related_slugs" not in e:
            e["related_slugs"] = []
        if "citations" not in e:
            e["citations"] = []
        for field in ["current_price_usd", "market_cap_usd", "volume_24h_usd"]:
            if field not in e:
                e[field] = None

    # Clean related_slugs
    for e in entries[:MAX_ENTRIES]:
        e["related_slugs"] = [s for s in e.get("related_slugs", [])[:10]
                              if s in all_slugs and s != e["slug"]]


def stats(entries: list) -> None:
    """Print dataset stats."""
    total = len(entries)
    tiers = {1: 0, 2: 0, 3: 0}
    acs: dict[str, int] = {}
    cats: dict[str, int] = {}
    priced = 0
    gy = 0
    for e in entries[:MAX_ENTRIES]:
        t = e.get("tier", 3)
        if t in tiers:
            tiers[t] += 1
        ac = e.get("asset_class", "?")
        acs[ac] = acs.get(ac, 0) + 1
        cat = e.get("category", "?")
        cats[cat] = cats.get(cat, 0) + 1
        if e.get("current_price_usd") is not None:
            priced += 1
        if e.get("is_graveyard"):
            gy += 1

    print(f"\n  {'='*50}")
    print(f"  TOTAL: {total} entries ({total - gy} active + {gy} graveyard)")
    print(f"  PRICED: {priced}/{total} have live market data")
    print(f"  TIERS: T1={tiers[1]} | T2={tiers[2]} | T3={tiers[3]}")
    print(f"  ASSETS: " + " | ".join(f"{k}={v}" for k, v in sorted(acs.items(), key=lambda x: -x[1])))
    print(f"  CATEGORIES ({len(cats)}):")
    for cat, n in sorted(cats.items(), key=lambda x: -x[1])[:25]:
        print(f"    {cat}: {n}")
    print(f"  TOP 10:")
    top = sorted(entries, key=lambda e: e.get("composite_score", 0), reverse=True)[:10]
    for e in top:
        price_str = ""
        if e.get("current_price_usd"):
            price_str = f" | ${e['current_price_usd']}"
        mcap_str = ""
        if e.get("market_cap_usd"):
            m = e["market_cap_usd"]
            mcap_str = f" | mcap ${m/1e9:.1f}B" if m > 1e9 else f" | mcap ${m/1e6:.0f}M"
        print(f"    {e.get('composite_score', 0):5.1f} T{e.get('tier', '?')} {e.get('name', '?')}{price_str}{mcap_str}")
    print(f"  {'='*50}")


def main() -> None:
    print("\n  === MERGE V2: New entries + Live prices ===\n")

    # 1. Load existing
    existing = load_json(OPPS)
    print(f"  Existing: {len(existing)} entries")

    # 2. Merge new doc entries
    new_files = [GAP / "new-doc-1-6.json", GAP / "new-doc-7-12.json"]
    merged = merge_new_entries(existing, new_files)
    print(f"  After merge: {len(merged)} entries")

    # 3. Apply price data
    price_count = apply_prices(
        merged,
        crypto_path=GAP / "crypto-prices.json",
        equity_path=GAP / "equity-prices.json",
    )
    print(f"  Prices applied: {price_count} entries enriched")

    # 4. Ensure all fields
    ensure_fields(merged)

    # 5. Sort by score
    merged.sort(key=lambda e: e.get("composite_score", 0), reverse=True)

    # 6. Write
    with open(OPPS, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)
    print(f"\n  Written: {OPPS} ({len(merged)} entries)")

    # 7. Stats
    stats(merged)


if __name__ == "__main__":
    main()
