#!/usr/bin/env python3
"""Fetch current price, market cap, and 24h volume for all public equities."""

import yfinance as yf
import json
import sys
import os
from datetime import datetime

# ── Tickers from opportunities.json (public_equities) ──
dataset_tickers = {
    "CCJ":     "Cameco",
    "NXE":     "NexGen Energy",
    "IONQ":    "IonQ",
    "SRUUF":   "Sprott Uranium Trust",
    "DNN":     "Denison Mines",
    "UUUU":    "Energy Fuels",
    "PDN.AX":  "Paladin Energy",
    "QBTS":    "D-Wave Quantum",
    "SMR":     "NuScale Power",
    "GWH":     "ESS Inc",
}

# ── New tickers from latest research document ──
research_tickers = {
    "BRN.AX":  "BrainChip (ASX)",
    "DNA":     "Ginkgo Bioworks",
    "TWST":    "Twist Bioscience",
    "ANIC.L":  "Agronomics (LSE)",
    "RDW":     "Redwire",
    "UTHR":    "United Therapeutics",
    "AMSC":    "American Superconductor",
    "EVLV":    "Evolv Technology",
    "FSLR":    "First Solar",
    "UMAC":    "Unusual Machines",
    "OUST":    "Ouster",
    "NAGE":    "Niagen Bioscience / ChromaDex",
    "MP":      "MP Materials",
    "USAR":    "USA Rare Earth",
    "ERII":    "Energy Recovery",
    "H2O.F":   "Enapter (Frankfurt)",
    "LNZA":    "LanzaTech",
    "MRVL":    "Marvell Technology",
}

# Combine all tickers
all_tickers = {}
all_tickers.update(dataset_tickers)
all_tickers.update(research_tickers)

# Non-USD exchange suffixes for currency notes
non_usd_suffixes = {
    ".AX": "AUD",
    ".L":  "GBP (pence)",
    ".F":  "EUR",
    ".TO": "CAD",
}

def get_currency_note(ticker):
    """Return currency note for non-USD exchanges."""
    for suffix, currency in non_usd_suffixes.items():
        if ticker.endswith(suffix):
            return currency
    return None

results = {}
errors = []

print(f"Fetching data for {len(all_tickers)} tickers...")
print("=" * 60)

for ticker_symbol, expected_name in all_tickers.items():
    try:
        print(f"  Fetching {ticker_symbol} ({expected_name})...", end=" ", flush=True)
        stock = yf.Ticker(ticker_symbol)
        info = stock.info

        # Extract price - try multiple fields
        price = (
            info.get("currentPrice") or
            info.get("regularMarketPrice") or
            info.get("previousClose") or
            info.get("navPrice")
        )

        # Extract market cap
        market_cap = info.get("marketCap")

        # Extract volume
        volume = (
            info.get("volume") or
            info.get("regularMarketVolume") or
            info.get("averageVolume")
        )

        # Name from API or fallback to expected
        name = info.get("shortName") or info.get("longName") or expected_name

        # Currency info
        currency = info.get("currency", "USD")
        currency_note = get_currency_note(ticker_symbol)

        entry = {
            "name": name,
            "current_price": price,
            "currency": currency,
            "market_cap": market_cap,
            "volume_24h": volume,
            "exchange": info.get("exchange", ""),
            "source": "dataset" if ticker_symbol in dataset_tickers else "research_doc",
        }

        if currency_note:
            entry["currency_note"] = f"Price in {currency_note}, not USD"

        results[ticker_symbol] = entry

        price_str = f"${price:,.2f}" if price else "N/A"
        mcap_str = f"${market_cap:,.0f}" if market_cap else "N/A"
        print(f"OK  price={price_str}  mcap={mcap_str}")

    except Exception as e:
        error_msg = str(e)
        print(f"ERROR: {error_msg}")
        results[ticker_symbol] = {
            "name": expected_name,
            "error": error_msg,
            "source": "dataset" if ticker_symbol in dataset_tickers else "research_doc",
        }
        errors.append(ticker_symbol)

# ── Write output ──
output_path = "/Users/mike/earlythunder/data/gap-fill/equity-prices.json"

output = {
    "metadata": {
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "total_tickers": len(all_tickers),
        "successful": len(all_tickers) - len(errors),
        "failed": len(errors),
        "failed_tickers": errors,
        "source_library": "yfinance",
    },
    "equities": results,
}

with open(output_path, "w") as f:
    json.dump(output, f, indent=2)

print("\n" + "=" * 60)
print(f"Done. {len(all_tickers) - len(errors)}/{len(all_tickers)} successful.")
if errors:
    print(f"Failed: {', '.join(errors)}")
print(f"Written to: {output_path}")
