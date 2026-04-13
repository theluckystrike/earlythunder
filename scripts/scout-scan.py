#!/usr/bin/env python3
"""Weekly scout scanner for earlythunder.com.

Scans CoinGecko trending and DeFiLlama TVL data to discover new
opportunity candidates not yet in the main dataset.
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
CANDIDATES_FILE: str = str(Path(DATA_DIR) / "scout-candidates.json")
COINGECKO_TRENDING_URL: str = "https://api.coingecko.com/api/v3/search/trending"
DEFILLAMA_PROTOCOLS_URL: str = "https://api.llama.fi/protocols"
API_TIMEOUT_SEC: int = 10
MAX_RETRIES: int = 3
RETRY_BACKOFF_SEC: float = 2.0
COINGECKO_RATE_LIMIT_SEC: float = 1.2
MAX_TRENDING_ITEMS: int = 15
MAX_DEFILLAMA_SCAN: int = 500
MAX_DEFILLAMA_CANDIDATES: int = 30
MIN_TVL_USD: float = 50_000_000.0
TVL_GROWTH_THRESHOLD_PCT: float = 10.0
HIGH_TVL_USD: float = 500_000_000.0


def fetch_with_retry(url: str, timeout: int = API_TIMEOUT_SEC) -> Any:
    """HTTP GET with retry. Returns parsed JSON or None."""
    import requests

    assert url, "URL must not be empty"
    assert timeout > 0, "timeout must be positive"

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.get(url, timeout=timeout)
            if resp.status_code == 200:
                result = resp.json()
                assert result is not None, "Response body was null"
                return result
            print(f"  [WARN] HTTP {resp.status_code} for {url} (attempt {attempt + 1})")
        except Exception as exc:
            last_error = exc
            print(f"  [WARN] Request failed: {exc} (attempt {attempt + 1})")

        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_BACKOFF_SEC * (attempt + 1))

    print(f"  [ERROR] All {MAX_RETRIES} attempts failed for {url}: {last_error}")
    return None


def load_existing_slugs(filepath: str) -> frozenset[str]:
    """Load existing opportunity slugs to detect duplicates."""
    assert filepath, "filepath must not be empty"

    path = Path(filepath)
    if not path.exists():
        print(f"  [INFO] No existing file at {filepath}, starting fresh")
        return frozenset()

    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    assert isinstance(data, list), "Top-level must be a JSON array"
    slugs = frozenset(opp.get("slug", "") for opp in data)
    return slugs


def load_existing_tickers(filepath: str) -> frozenset[str]:
    """Load existing opportunity tickers for dedup."""
    assert filepath, "filepath must not be empty"

    path = Path(filepath)
    if not path.exists():
        return frozenset()

    with open(filepath, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    assert isinstance(data, list), "Top-level must be a JSON array"
    tickers = frozenset(
        opp.get("ticker", "").upper()
        for opp in data
        if opp.get("ticker")
    )
    return tickers


def make_slug(name: str) -> str:
    """Convert a name into a URL-safe slug."""
    assert name, "name must not be empty"
    assert isinstance(name, str), "name must be a string"

    slug = name.lower().strip()
    cleaned: list[str] = []
    for ch in slug[:100]:
        if ch.isalnum():
            cleaned.append(ch)
        elif ch in (" ", "-", "_", "."):
            cleaned.append("-")
    result = "-".join(part for part in "".join(cleaned).split("-") if part)
    return result


def estimate_trend_momentum(market_cap_rank: int | None) -> int:
    """Estimate narrative momentum score (0-100) from market cap rank."""
    assert market_cap_rank is None or isinstance(market_cap_rank, (int, float))

    if market_cap_rank is None:
        return 50
    rank = int(market_cap_rank)
    RANK_TIER_10 = 90
    RANK_TIER_50 = 75
    RANK_TIER_200 = 60
    RANK_TIER_DEFAULT = 50

    if rank <= 10:
        return RANK_TIER_10
    elif rank <= 50:
        return RANK_TIER_50
    elif rank <= 200:
        return RANK_TIER_200
    return RANK_TIER_DEFAULT


def scan_coingecko_trending(
    existing_slugs: frozenset[str],
    existing_tickers: frozenset[str],
) -> list[dict[str, Any]]:
    """Fetch CoinGecko trending coins and filter new candidates."""
    assert isinstance(existing_slugs, frozenset)
    assert isinstance(existing_tickers, frozenset)

    print("\n--- CoinGecko Trending Scan ---")
    data = fetch_with_retry(COINGECKO_TRENDING_URL)
    if data is None:
        print("  [ERROR] Could not fetch trending data")
        return []

    coins_data = data.get("coins", [])
    assert isinstance(coins_data, list), "coins must be a list"

    candidates: list[dict[str, Any]] = []
    time.sleep(COINGECKO_RATE_LIMIT_SEC)

    for _idx, item in enumerate(coins_data[:MAX_TRENDING_ITEMS]):
        coin = item.get("item", {})
        name = coin.get("name", "")
        symbol = coin.get("symbol", "")
        market_cap_rank = coin.get("market_cap_rank")

        if not name:
            continue

        slug = make_slug(name)
        ticker_upper = symbol.upper() if symbol else ""

        if slug in existing_slugs:
            print(f"  [SKIP] {name} ({symbol}): slug already tracked")
            continue
        if ticker_upper and ticker_upper in existing_tickers:
            print(f"  [SKIP] {name} ({symbol}): ticker already tracked")
            continue

        candidate = {
            "name": name,
            "ticker": ticker_upper,
            "category": "Trending (auto-detected)",
            "source": "coingecko_trending",
            "initial_signals": {
                "narrative": estimate_trend_momentum(market_cap_rank),
                "market_cap_rank": market_cap_rank,
            },
            "reason_flagged": f"Trending on CoinGecko (rank #{market_cap_rank})",
            "slug_candidate": slug,
            "scanned_at": datetime.now(timezone.utc).isoformat(),
        }
        candidates.append(candidate)
        print(f"  [NEW] {name} ({symbol}) - rank #{market_cap_rank}")

    print(f"  Found {len(candidates)} new candidates from CoinGecko trending")
    return candidates


def _build_defillama_candidate(
    name: str,
    symbol: str,
    tvl: float,
    change_7d_val: float,
    defi_category: str,
    slug: str,
) -> dict[str, Any]:
    """Build a candidate dict from DeFiLlama protocol data."""
    assert name, "name must not be empty"
    assert isinstance(tvl, (int, float)), "tvl must be numeric"

    reason_parts: list[str] = []
    if float(tvl) >= HIGH_TVL_USD:
        reason_parts.append(f"TVL ${tvl / 1e9:.2f}B")
    if change_7d_val >= TVL_GROWTH_THRESHOLD_PCT:
        reason_parts.append(f"7d growth {change_7d_val:.1f}%")

    ticker_upper = symbol.upper() if symbol else ""
    return {
        "name": name,
        "ticker": ticker_upper,
        "category": defi_category if defi_category else "DeFi (uncategorized)",
        "source": "defillama_protocols",
        "initial_signals": {
            "tvl_usd": tvl,
            "change_7d_pct": change_7d_val,
            "defi_category": defi_category,
        },
        "reason_flagged": f"DeFiLlama: {', '.join(reason_parts)}",
        "slug_candidate": slug,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    }


def scan_defillama_protocols(
    existing_slugs: frozenset[str],
    existing_tickers: frozenset[str],
) -> list[dict[str, Any]]:
    """Fetch DeFiLlama protocols and find high-TVL/high-growth candidates."""
    assert isinstance(existing_slugs, frozenset)
    assert isinstance(existing_tickers, frozenset)

    print("\n--- DeFiLlama Protocol Scan ---")
    data = fetch_with_retry(DEFILLAMA_PROTOCOLS_URL)
    if data is None:
        print("  [ERROR] Could not fetch DeFiLlama data")
        return []

    assert isinstance(data, list), "DeFiLlama response must be a list"

    candidates: list[dict[str, Any]] = []
    found_count = 0

    for _idx, protocol in enumerate(data[:MAX_DEFILLAMA_SCAN]):
        if found_count >= MAX_DEFILLAMA_CANDIDATES:
            break

        name = protocol.get("name", "")
        tvl = protocol.get("tvl", 0)
        change_7d = protocol.get("change_7d")
        symbol = protocol.get("symbol", "")
        defi_category = protocol.get("category", "")

        if not name or not isinstance(tvl, (int, float)):
            continue
        if tvl < MIN_TVL_USD:
            continue

        change_7d_val = float(change_7d) if isinstance(change_7d, (int, float)) else 0.0
        slug = make_slug(name)
        ticker_upper = symbol.upper() if symbol else ""

        if slug in existing_slugs:
            continue
        if ticker_upper and ticker_upper in existing_tickers:
            continue
        if change_7d_val < TVL_GROWTH_THRESHOLD_PCT and float(tvl) < HIGH_TVL_USD:
            continue

        found_count += 1
        candidate = _build_defillama_candidate(
            name, symbol, tvl, change_7d_val, defi_category, slug,
        )
        candidates.append(candidate)
        print(f"  [NEW] {name} ({symbol}) - TVL ${tvl / 1e6:.0f}M, 7d {change_7d_val:.1f}%")

    print(f"  Found {len(candidates)} new candidates from DeFiLlama")
    return candidates


def save_candidates(filepath: str, candidates: list[dict[str, Any]]) -> None:
    """Write scout candidates to disk."""
    assert filepath, "filepath must not be empty"
    assert isinstance(candidates, list), "candidates must be a list"

    output = {
        "meta": {
            "scanned_at": datetime.now(timezone.utc).isoformat(),
            "total_candidates": len(candidates),
            "sources": ["coingecko_trending", "defillama_protocols"],
            "status": "pending_review",
        },
        "candidates": candidates,
    }

    tmp_path = filepath + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(output, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    Path(tmp_path).replace(filepath)
    print(f"\n[OK] Saved {len(candidates)} candidates to {filepath}")


def main() -> int:
    """Entry point. Returns exit code."""
    print("=" * 60)
    print("EarlyThunder Weekly Scout Scan")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    existing_slugs = load_existing_slugs(OPPORTUNITIES_FILE)
    existing_tickers = load_existing_tickers(OPPORTUNITIES_FILE)
    print(f"Existing tracked: {len(existing_slugs)} slugs, {len(existing_tickers)} tickers")

    all_candidates: list[dict[str, Any]] = []

    cg_candidates = scan_coingecko_trending(existing_slugs, existing_tickers)
    all_candidates.extend(cg_candidates)

    dl_candidates = scan_defillama_protocols(existing_slugs, existing_tickers)
    all_candidates.extend(dl_candidates)

    save_candidates(CANDIDATES_FILE, all_candidates)

    print("\n" + "=" * 60)
    print(f"Scout scan complete: {len(all_candidates)} total candidates")
    print("  These require MANUAL REVIEW before adding to the main dataset.")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
