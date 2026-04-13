#!/usr/bin/env python3
"""Daily price update script for earlythunder.com opportunities.

Fetches current prices from CoinGecko (digital_assets) and Yahoo Finance
(public_equities), updates the opportunities.json dataset.
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
COINGECKO_RATE_LIMIT_SEC: float = 1.2
API_TIMEOUT_SEC: int = 10
MAX_RETRIES: int = 3
MAX_OPPORTUNITIES: int = 50
RETRY_BACKOFF_SEC: float = 2.0
ASSET_CLASS_DIGITAL: str = "digital_assets"
ASSET_CLASS_EQUITIES: str = "public_equities"

# Mapping from ticker symbols to CoinGecko API IDs.
# Add new entries here when new digital_assets are added to the dataset.
TICKER_TO_COINGECKO_ID: dict[str, str] = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "EIGEN": "eigenlayer",
    "TIA": "celestia",
    "ENA": "ethena",
    "SOL": "solana",
    "AVAX": "avalanche-2",
    "LINK": "chainlink",
    "ARB": "arbitrum",
    "OP": "optimism",
    "MATIC": "matic-network",
    "ATOM": "cosmos",
    "DOT": "polkadot",
    "ADA": "cardano",
    "UNI": "uniswap",
    "AAVE": "aave",
    "MKR": "maker",
    "SNX": "havven",
    "CRV": "curve-dao-token",
    "LDO": "lido-dao",
    "RPL": "rocket-pool",
    "PENDLE": "pendle",
    "JUP": "jupiter-exchange-solana",
    "JTO": "jito-governance-token",
    "PYTH": "pyth-network",
    "W": "wormhole",
    "STRK": "starknet",
    "ZK": "zksync",
    "DYDX": "dydx-chain",
    "GMX": "gmx",
}


def load_opportunities(filepath: str) -> list[dict[str, Any]]:
    """Load opportunities JSON array from disk."""
    assert filepath, "filepath must not be empty"
    path = Path(filepath)
    assert path.exists(), f"File not found: {filepath}"

    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    assert isinstance(data, list), "Top-level must be a JSON array"
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


def fetch_with_retry(url: str, timeout: int = API_TIMEOUT_SEC) -> Any:
    """HTTP GET with retry logic. Returns parsed JSON or None on failure."""
    import requests

    assert url, "URL must not be empty"
    assert timeout > 0, "timeout must be positive"

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, timeout=timeout)
            if resp.status_code == 200:
                return resp.json()
            print(f"  [WARN] HTTP {resp.status_code} for {url} (attempt {attempt + 1})")
        except Exception as exc:
            last_error = exc
            print(f"  [WARN] Request failed: {exc} (attempt {attempt + 1})")

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_BACKOFF_SEC * (attempt + 1))

    print(f"  [ERROR] All {MAX_RETRIES} attempts failed for {url}: {last_error}")
    return None


def resolve_coingecko_id(ticker: str) -> str | None:
    """Resolve a ticker symbol to a CoinGecko API coin ID."""
    assert isinstance(ticker, str), "ticker must be a string"
    assert ticker, "ticker must not be empty"

    return TICKER_TO_COINGECKO_ID.get(ticker.upper())


def fetch_coingecko_price(coingecko_id: str) -> float | None:
    """Fetch current USD price from CoinGecko for a given coin ID."""
    assert coingecko_id, "coingecko_id must not be empty"
    assert isinstance(coingecko_id, str), "coingecko_id must be a string"

    url = f"{COINGECKO_BASE_URL}/simple/price?ids={coingecko_id}&vs_currencies=usd"
    data = fetch_with_retry(url)
    if data is None:
        return None

    coin_data = data.get(coingecko_id)
    if coin_data is None or "usd" not in coin_data:
        print(f"  [WARN] No USD price in response for {coingecko_id}")
        return None

    price = coin_data["usd"]
    assert isinstance(price, (int, float)), f"Price must be numeric, got {type(price)}"
    return float(price)


def fetch_yahoo_price(ticker: str) -> float | None:
    """Fetch current price from Yahoo Finance for a given ticker."""
    assert ticker, "ticker must not be empty"
    assert isinstance(ticker, str), "ticker must be a string"

    try:
        import yfinance as yf
        stock = yf.Ticker(ticker)
        info = stock.fast_info
        price = getattr(info, "last_price", None)
        if price is None:
            price = getattr(info, "previous_close", None)
        if price is not None:
            assert isinstance(price, (int, float)), f"Price not numeric: {price}"
            return float(price)
        print(f"  [WARN] No price available for {ticker}")
        return None
    except Exception as exc:
        print(f"  [ERROR] yfinance failed for {ticker}: {exc}")
        return None


def update_digital_asset(opp: dict[str, Any], now_iso: str) -> bool:
    """Update price for a single digital asset opportunity."""
    assert "slug" in opp, "Opportunity must have a slug"
    assert now_iso, "now_iso must not be empty"

    ticker = opp.get("ticker")
    if not ticker:
        print(f"  [SKIP] {opp['slug']}: no ticker (null)")
        return False

    coingecko_id = resolve_coingecko_id(ticker)
    if not coingecko_id:
        print(f"  [SKIP] {opp['slug']}: ticker {ticker} not in CoinGecko ID map")
        return False

    price = fetch_coingecko_price(coingecko_id)
    if price is None:
        return False

    opp["current_price_usd"] = price
    opp["updated_at"] = now_iso
    print(f"  [OK] {opp['slug']} ({ticker}): ${price:,.2f}")
    time.sleep(COINGECKO_RATE_LIMIT_SEC)
    return True


def update_public_equity(opp: dict[str, Any], now_iso: str) -> bool:
    """Update price for a single public equity opportunity."""
    assert "slug" in opp, "Opportunity must have a slug"
    assert now_iso, "now_iso must not be empty"

    ticker = opp.get("ticker")
    if not ticker:
        print(f"  [SKIP] {opp['slug']}: no ticker (null)")
        return False

    price = fetch_yahoo_price(ticker)
    if price is None:
        return False

    opp["current_price_usd"] = price
    opp["updated_at"] = now_iso
    print(f"  [OK] {opp['slug']} ({ticker}): ${price:,.2f}")
    return True


def run_price_updates(filepath: str) -> tuple[int, int, int]:
    """Main update loop. Returns (success, failure, skipped) counts."""
    assert filepath, "filepath must not be empty"

    opportunities = load_opportunities(filepath)
    assert len(opportunities) <= MAX_OPPORTUNITIES, (
        f"Too many opportunities: {len(opportunities)} > {MAX_OPPORTUNITIES}"
    )

    now_iso = datetime.now(timezone.utc).isoformat()
    success_count = 0
    failure_count = 0
    skip_count = 0

    for idx, opp in enumerate(opportunities[:MAX_OPPORTUNITIES]):
        asset_class = opp.get("asset_class", "")
        slug = opp.get("slug", f"unknown-{idx}")
        is_graveyard = opp.get("is_graveyard", False)

        print(f"\n[{idx + 1}/{len(opportunities)}] Processing {slug}...")

        if is_graveyard:
            print(f"  [SKIP] {slug}: is_graveyard=true")
            skip_count += 1
            continue

        try:
            if asset_class == ASSET_CLASS_DIGITAL:
                ok = update_digital_asset(opp, now_iso)
            elif asset_class == ASSET_CLASS_EQUITIES:
                ok = update_public_equity(opp, now_iso)
            else:
                print(f"  [SKIP] {slug}: asset_class={asset_class} (not priceable)")
                skip_count += 1
                continue

            if ok:
                success_count += 1
            else:
                failure_count += 1
        except Exception as exc:
            print(f"  [ERROR] Unexpected failure for {slug}: {exc}")
            failure_count += 1

    save_opportunities(filepath, opportunities)
    return (success_count, failure_count, skip_count)


def main() -> int:
    """Entry point. Returns exit code."""
    print("=" * 60)
    print("EarlyThunder Daily Price Update")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    success, failures, skipped = run_price_updates(OPPORTUNITIES_FILE)

    print("\n" + "=" * 60)
    print(f"Complete: {success} updated, {failures} failed, {skipped} skipped")
    print("=" * 60)

    # Exit 0 even with failures -- partial updates are acceptable
    # The validate step will catch data issues
    return 0


if __name__ == "__main__":
    sys.exit(main())
