#!/usr/bin/env python3
"""Enrich opportunities with deep tokenomics data from CoinGecko free API."""

import json
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "opportunities.json"
COINGECKO_API = "https://api.coingecko.com/api/v3"
MAX_TOKENS = 50
RATE_LIMIT_DELAY = 1.5  # seconds between requests (CoinGecko free tier: 10-30 req/min)

# Map opportunity slugs to CoinGecko coin IDs
TOKEN_MAP = {
    "bittensor": "bittensor",
    "eigenlayer": "eigenlayer",
    "ondo-finance": "ondo-finance",
    "babylon": "babylon",
    "virtuals-protocol": "virtual-protocol",
    "autonolas": "autonolas",
    "elizaos": "elizaos",
    "bio-protocol": "bio-protocol",
    "vitadao": "vitadao",
    "researchhub": "researchcoin",
    "centrifuge": "centrifuge",
    "qubic": "qubic-network",
    "akash-network": "akash-network",
    "render-network": "render-token",
    "helium": "helium",
    "grass-network": "grass",
    "filecoin": "filecoin",
    "aleo": "aleo",
    "hivemapper": "hivemapper",
    "dimo": "dimo",
    "goldfinch": "goldfinch",
    "near-protocol": "near",
    "fetch-ai": "fetch-ai",
    "worldcoin-world": "worldcoin-wld",
}


def load_opportunities():
    """Load opportunities from JSON file."""
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_opportunities(data):
    """Save opportunities to JSON file."""
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def coingecko_request(path):
    """Make a CoinGecko API request. Returns parsed JSON or None on error."""
    headers = {
        "Accept": "application/json",
        "User-Agent": "earlythunder-enrichment",
    }
    req = Request(f"{COINGECKO_API}{path}", headers=headers)
    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        if e.code in (429, 403):
            print(f"  Rate limited on {path} (HTTP {e.code}), stopping")
            return None
        if e.code == 404:
            print(f"  Not found: {path}")
            return None
        print(f"  HTTP error {e.code} on {path}")
        return None
    except Exception as e:
        print(f"  Request error on {path}: {e}")
        return None


def format_usd(value):
    """Format a USD value as $X.XM or $X.XB."""
    if value is None or value == 0:
        return None
    if value >= 1_000_000_000:
        return f"${value / 1_000_000_000:.1f}B"
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    if value >= 1_000:
        return f"${value / 1_000:.1f}K"
    return f"${value:.0f}"


def format_pct(value):
    """Format a ratio as a percentage string."""
    if value is None:
        return None
    return f"{value * 100:.1f}%"


def fetch_token_data(cg_id):
    """Fetch tokenomics data for a single CoinGecko coin ID."""
    data = coingecko_request(f"/coins/{cg_id}?localization=false&tickers=false&community_data=false&developer_data=false")
    if data is None:
        return None

    market = data.get("market_data", {})
    if not market:
        return None

    circulating = market.get("circulating_supply")
    total = market.get("total_supply")
    mcap = market.get("market_cap", {}).get("usd")
    fdv = market.get("fully_diluted_valuation", {}).get("usd")

    circulating_pct = None
    if circulating and total and total > 0:
        circulating_pct = circulating / total

    mcap_to_fdv = None
    if mcap and fdv and fdv > 0:
        mcap_to_fdv = mcap / fdv

    return {
        "circulating_supply": circulating,
        "total_supply": total,
        "market_cap": mcap,
        "fdv": fdv,
        "circulating_pct": circulating_pct,
        "mcap_to_fdv": mcap_to_fdv,
    }


def main():
    """Main enrichment pipeline for CoinGecko tokenomics data."""
    data = load_opportunities()
    if not isinstance(data, list):
        print("Error: opportunities.json is not a list")
        sys.exit(1)

    print(f"Loaded {len(data)} opportunities")
    print(f"TOKEN_MAP has {len(TOKEN_MAP)} mappings")

    # Build slug-to-index lookup
    slug_index = {}
    for i, opp in enumerate(data):
        slug_index[opp.get("slug", "")] = i

    enriched = 0
    tokens_checked = 0
    rate_limited = False

    for slug, cg_id in sorted(TOKEN_MAP.items()):
        if tokens_checked >= MAX_TOKENS:
            print(f"Reached MAX_TOKENS limit ({MAX_TOKENS}), stopping")
            break
        if rate_limited:
            break
        if slug not in slug_index:
            print(f"  Slug '{slug}' not found in opportunities, skipping")
            continue

        opp = data[slug_index[slug]]
        if opp.get("is_graveyard"):
            print(f"  Skipping graveyard entry: {slug}")
            continue

        print(f"  Fetching {cg_id} for {opp.get('name', slug)}...")
        time.sleep(RATE_LIMIT_DELAY)

        token_data = fetch_token_data(cg_id)
        tokens_checked += 1

        if token_data is None:
            rate_limited = True
            continue

        # Update opportunity with formatted values
        fdv_fmt = format_usd(token_data["fdv"])
        circ_fmt = format_pct(token_data["circulating_pct"])

        if fdv_fmt:
            opp["fdv"] = fdv_fmt
        if circ_fmt:
            opp["circulating_pct"] = circ_fmt

        # Also store raw numeric values for downstream scoring
        if token_data["fdv"]:
            opp["fdv_usd"] = token_data["fdv"]
        if token_data["circulating_pct"] is not None:
            opp["circulating_pct_raw"] = round(token_data["circulating_pct"], 4)

        enriched += 1
        print(
            f"    {opp.get('name', '?'):30s}  "
            f"FDV={fdv_fmt or 'N/A'}, "
            f"Circ={circ_fmt or 'N/A'}, "
            f"MCap/FDV={token_data['mcap_to_fdv']:.2f}" if token_data["mcap_to_fdv"] else
            f"    {opp.get('name', '?'):30s}  "
            f"FDV={fdv_fmt or 'N/A'}, "
            f"Circ={circ_fmt or 'N/A'}, "
            f"MCap/FDV=N/A"
        )

    save_opportunities(data)
    print(f"\nDone. Enriched {enriched} entries with CoinGecko data ({tokens_checked} tokens checked)")


if __name__ == "__main__":
    main()
