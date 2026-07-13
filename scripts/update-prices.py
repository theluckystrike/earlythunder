#!/usr/bin/env python3
"""Daily price integrity pass for earlythunder.com opportunities.

The authoritative pricer is scripts/fetch-opportunity-prices.mjs
(refresh-opportunity-prices.yml, 07:30 UTC). This job runs after it and
acts as an independent verifier and healer:

  - digital_assets: one batched CoinGecko /simple/price call for every
    mapped ticker, then per-entry compare. Prices within TOLERANCE of the
    stored value are counted as verified and left untouched. Null or
    deviant prices are healed (rewritten) and stamped with updated_at.
  - public_equities: verified per ticker via yfinance with the same
    tolerance; only null/deviant entries are healed.

It never fights the .mjs pipeline: agreement within tolerance writes
nothing, so the daily commit is empty unless something was truly broken.
"""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# --- Named Constants ---
DATA_DIR: str = str(Path(__file__).resolve().parent.parent / "data")
OPPORTUNITIES_FILE: str = str(Path(DATA_DIR) / "opportunities.json")
COINGECKO_BASE_URL: str = "https://api.coingecko.com/api/v3"
API_TIMEOUT_SEC: int = 20
MAX_RETRIES: int = 4
RETRY_BACKOFF_SEC: float = 5.0
MAX_OPPORTUNITIES: int = 1000          # matches validate-data.py ceiling
MAX_IDS_PER_REQUEST: int = 150         # CoinGecko documents ~250; stay under
PRICE_TOLERANCE: float = 0.25          # |stored-live|/live above this = heal
ASSET_CLASS_DIGITAL: str = "digital_assets"
ASSET_CLASS_EQUITIES: str = "public_equities"

# Ticker -> CoinGecko id. Every id verified against the live API on
# 2026-07-13 (symbol + name matched to the opportunity, dead ids replaced:
# matic-network -> polygon-ecosystem-token). Extend when new digital
# assets are added; scripts/fetch-opportunity-prices.mjs resolves ids
# dynamically, so a miss here only reduces verification coverage.
TICKER_TO_COINGECKO_ID: dict[str, str] = {
    "1INCH": "1inch",
    "AAVE": "aave",
    "ACU": "acurast",
    "ADA": "cardano",
    "AERO": "aerodrome-finance",
    "AI": "gensyn",
    "AI16Z": "ai16z",
    "AKRE": "arkreen-token",
    "AKT": "akash-network",
    "ALEO": "aleo",
    "ALGO": "algorand",
    "APT": "aptos",
    "AR": "arweave",
    "ARB": "arbitrum",
    "ATOM": "cosmos",
    "AVAX": "avalanche-2",
    "AXS": "axie-infinity",
    "BABY": "babylon",
    "BAL": "balancer",
    "BANANA": "banana-gun",
    "BB": "bouncebit",
    "BERA": "berachain-bera",
    "BIO": "bio-protocol",
    "BLUR": "blur",
    "BNB": "binancecoin",
    "BONK": "bonk",
    "BTC": "bitcoin",
    "CELO": "celo",
    "CETUS": "cetus-protocol",
    "COMP": "compound-governance-token",
    "COW": "cow-protocol",
    "CRV": "curve-dao-token",
    "CVX": "convex-finance",
    "DIMO": "dimo",
    "DOGE": "dogecoin",
    "DOLO": "dolomite",
    "DOT": "polkadot",
    "DYDX": "dydx-chain",
    "EIGEN": "eigenlayer",
    "EKUBO": "ekubo-protocol",
    "ELIZAOS": "elizaos",
    "ENA": "ethena",
    "ENS": "ethereum-name-service",
    "ESP": "espresso",
    "ETH": "ethereum",
    "ETHFI": "ether-fi",
    "EUL": "euler",
    "FET": "fetch-ai",
    "FIL": "filecoin",
    "FLOKI": "floki",
    "FLUID": "instadapp",
    "FXS": "frax-share",
    "GALA": "gala",
    "GEOD": "geodnet",
    "GFI": "goldfinch",
    "GMX": "gmx",
    "GNS": "gains-network",
    "GRAM": "the-open-network",
    "GRASS": "grass",
    "GROW": "valleydao",
    "GRT": "the-graph",
    "HAIR": "hairdao",
    "HNT": "helium",
    "HONEY": "hivemapper",
    "HUMA": "huma-finance",
    "HYPE": "hyperliquid",
    "ICP": "internet-computer",
    "IMX": "immutable-x",
    "INJ": "injective-protocol",
    "IO": "io",
    "ISLM": "islamic-coin",
    "IP": "story-2",
    "JTO": "jito-governance-token",
    "JUP": "jupiter-exchange-solana",
    "KMNO": "kamino",
    "LDO": "lido-dao",
    "LINK": "chainlink",
    "LIT": "lighter",
    "LQTY": "liquity",
    "MANA": "decentraland",
    "MATIC": "polygon-ecosystem-token",
    "MEGA": "megaeth",
    "NAM": "namada",
    "METH": "mantle-staked-ether",
    "MINA": "mina-protocol",
    "MKR": "maker",
    "MORPHO": "morpho",
    "NAVX": "navi",
    "NEAR": "near",
    "OBOL": "obol-2",
    "OLAS": "autonolas",
    "ONDO": "ondo-finance",
    "OP": "optimism",
    "OPUL": "opulous",
    "PENDLE": "pendle",
    "PEPE": "pepe",
    "PYTH": "pyth-network",
    "QUBIC": "qubic-network",
    "QUICK": "quickswap",
    "RAY": "raydium",
    "RENDER": "render-token",
    "RPL": "rocket-pool",
    "RSC": "researchcoin",
    "RUNE": "thorchain",
    "SAFE": "safe",
    "SAND": "the-sandbox",
    "SCA": "scallop-2",
    "SD": "stader",
    "SDT": "stake-dao",
    "SEI": "sei-network",
    "SHIB": "shiba-inu",
    "SKY": "sky",
    "SLC": "silencio",
    "SNX": "havven",
    "SOL": "solana",
    "SPACE": "spacecoin-2",
    "SPK": "spark-2",
    "STRK": "starknet",
    "STX": "blockstack",
    "SUI": "sui",
    "SUSHI": "sushi",
    "SYRUP": "syrup",
    "TAO": "bittensor",
    "THETA": "theta-token",
    "TIA": "celestia",
    "UNI": "uniswap",
    "VIRTUAL": "virtual-protocol",
    "VITA": "vitadao",
    "W": "wormhole",
    "WIF": "dogwifcoin",
    "WLD": "worldcoin-wld",
    "XAN": "anoma",
    "XRP": "ripple",
    "YFI": "yearn-finance",
    "ZK": "zksync",
    "ZORA": "zora",
}


def normalize_ticker(ticker: str) -> str:
    """Strip the $ prefix the dataset uses and uppercase."""
    assert isinstance(ticker, str), "ticker must be a string"
    return ticker.lstrip("$").strip().upper()


def load_opportunities(filepath: str) -> list[dict[str, Any]]:
    """Load opportunities JSON array from disk."""
    assert filepath, "filepath must not be empty"
    path = Path(filepath)
    assert path.exists(), f"File not found: {filepath}"
    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    assert isinstance(data, list), "Top-level must be a JSON array"
    assert len(data) <= MAX_OPPORTUNITIES, (
        f"Too many opportunities: {len(data)} > {MAX_OPPORTUNITIES}"
    )
    return data


def save_opportunities(filepath: str, data: list[dict[str, Any]]) -> None:
    """Write opportunities JSON array to disk atomically."""
    assert filepath, "filepath must not be empty"
    assert isinstance(data, list), "data must be a list"
    tmp_path = filepath + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    Path(tmp_path).replace(filepath)
    print(f"[OK] Saved {len(data)} opportunities to {filepath}")


def fetch_json(url: str) -> Any:
    """HTTP GET with retry and 429-aware backoff. None on failure."""
    import requests

    assert url, "URL must not be empty"
    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, timeout=API_TIMEOUT_SEC,
                                headers={"User-Agent": "earlythunder-ci"})
            if resp.status_code == 200:
                return resp.json()
            wait = RETRY_BACKOFF_SEC * (attempt + 1)
            if resp.status_code == 429:
                wait = max(wait, 30.0)
            print(f"  [WARN] HTTP {resp.status_code} (attempt {attempt + 1}), wait {wait:.0f}s")
        except Exception as exc:
            last_error = exc
            wait = RETRY_BACKOFF_SEC * (attempt + 1)
            print(f"  [WARN] Request failed: {exc} (attempt {attempt + 1})")
        if attempt < MAX_RETRIES - 1:
            time.sleep(wait)
    print(f"  [ERROR] All {MAX_RETRIES} attempts failed for {url}: {last_error}")
    return None


def fetch_coingecko_prices(ids: list[str]) -> dict[str, float]:
    """Batched USD prices for a list of CoinGecko ids."""
    assert isinstance(ids, list), "ids must be a list"
    prices: dict[str, float] = {}
    for start in range(0, len(ids), MAX_IDS_PER_REQUEST):
        chunk = ids[start:start + MAX_IDS_PER_REQUEST]
        url = (f"{COINGECKO_BASE_URL}/simple/price"
               f"?ids={','.join(chunk)}&vs_currencies=usd")
        data = fetch_json(url)
        if data is None:
            continue
        for cid in chunk:
            entry = data.get(cid)
            # A dead/renamed id returns {} rather than being omitted.
            if isinstance(entry, dict) and isinstance(entry.get("usd"), (int, float)):
                prices[cid] = float(entry["usd"])
    return prices


def fetch_yahoo_price(ticker: str) -> float | None:
    """Current price from Yahoo Finance, or None."""
    assert ticker, "ticker must not be empty"
    try:
        import yfinance as yf
        info = yf.Ticker(ticker).fast_info
        price = getattr(info, "last_price", None) or getattr(info, "previous_close", None)
        if isinstance(price, (int, float)) and price > 0:
            return float(price)
        print(f"  [WARN] No usable Yahoo price for {ticker}")
        return None
    except Exception as exc:
        print(f"  [WARN] yfinance failed for {ticker}: {exc}")
        return None


def reconcile(opp: dict[str, Any], live: float, now_iso: str) -> str:
    """Compare stored price to live; heal if null or deviant.

    Both outcomes stamp updated_at: a verified price is confirmed
    live-current today, and this job is the only writer of updated_at
    (the .mjs pricer never stamps it), so the site's "Last updated"
    and JSON-LD dateModified stay truthful. The stamp is date-only
    (midnight Z), so same-day re-runs are idempotent.

    Returns one of: verified, healed.
    """
    assert live > 0, "live price must be positive"
    stored = opp.get("current_price_usd")
    outcome = "healed"
    if isinstance(stored, (int, float)) and stored > 0:
        deviation = abs(stored - live) / live
        if deviation <= PRICE_TOLERANCE:
            outcome = "verified"
        else:
            print(f"  [HEAL] {opp['slug']}: stored {stored} deviates "
                  f"{deviation:.0%} from live {live}")
    else:
        print(f"  [HEAL] {opp['slug']}: no stored price, writing {live}")
    if outcome == "healed":
        opp["current_price_usd"] = live
    opp["updated_at"] = now_iso
    return outcome


def run_price_integrity(filepath: str) -> tuple[int, int, int, int]:
    """Main pass. Returns (verified, healed, skipped, unresolved)."""
    assert filepath, "filepath must not be empty"
    opportunities = load_opportunities(filepath)
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00Z")

    verified = healed = skipped = unresolved = 0

    digital: list[tuple[dict[str, Any], str]] = []
    equities: list[dict[str, Any]] = []
    for opp in opportunities[:MAX_OPPORTUNITIES]:
        asset_class = opp.get("asset_class", "")
        ticker = opp.get("ticker")
        if opp.get("is_graveyard") or not ticker or asset_class not in (
                ASSET_CLASS_DIGITAL, ASSET_CLASS_EQUITIES):
            skipped += 1
            continue
        if asset_class == ASSET_CLASS_DIGITAL:
            cid = TICKER_TO_COINGECKO_ID.get(normalize_ticker(ticker))
            if cid is None:
                print(f"  [SKIP] {opp.get('slug')}: ticker {ticker} not in id map")
                unresolved += 1
                continue
            digital.append((opp, cid))
        else:
            equities.append(opp)

    # Digital assets: one batched call for every unique id.
    unique_ids = sorted({cid for _, cid in digital})
    print(f"\nFetching {len(unique_ids)} CoinGecko ids in "
          f"{(len(unique_ids) + MAX_IDS_PER_REQUEST - 1) // MAX_IDS_PER_REQUEST} request(s)...")
    live_prices = fetch_coingecko_prices(unique_ids)
    print(f"Live prices returned: {len(live_prices)}/{len(unique_ids)}")

    for opp, cid in digital:
        live = live_prices.get(cid)
        if live is None:
            print(f"  [SKIP] {opp.get('slug')}: no live price for id {cid}")
            unresolved += 1
            continue
        if reconcile(opp, live, now_iso) == "healed":
            healed += 1
        else:
            verified += 1

    # Equities: per-ticker via yfinance (bounded, small set).
    print(f"\nVerifying {len(equities)} public equities via Yahoo...")
    for opp in equities:
        live = fetch_yahoo_price(normalize_ticker(opp["ticker"]))
        if live is None:
            unresolved += 1
            continue
        if reconcile(opp, live, now_iso) == "healed":
            healed += 1
        else:
            verified += 1

    if verified + healed > 0:
        save_opportunities(filepath, opportunities)
    else:
        print("\n[WARN] No prices could be checked; nothing written.")
    return (verified, healed, skipped, unresolved)


def main() -> int:
    """Entry point. Returns exit code."""
    print("=" * 60)
    print("EarlyThunder Daily Price Integrity")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    verified, healed, skipped, unresolved = run_price_integrity(OPPORTUNITIES_FILE)

    print("\n" + "=" * 60)
    print(f"Complete: {verified} verified, {healed} healed, "
          f"{skipped} skipped, {unresolved} unresolved")
    print("=" * 60)

    # Red only on systemic failure: nothing could be checked at all.
    if verified + healed == 0:
        print("[ERROR] Zero prices verified or healed; treating as failure.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
