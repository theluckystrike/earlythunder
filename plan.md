# PLAN — Scorecard data expansion + long-tail architecture

Status: SHIPPED 2026-08-06. Live on earlythunder.com, commits 0f19341 + 4136ecd.

## Problem found (measured)
- `data/altcoin-scorecard.json` holds 251 tokens x 25 scored variables + verdict, catalyst,
  risk, supply, FDV, ATH, TVL and 152 citation sets. **158 of those tokens had no page
  anywhere on the site.** They existed only as rows inside one monolithic `/scorecard`.
- `out/scorecard.html` was **5,298,046 bytes**, rendering the full 251-token set five times
  over. Crawl-budget, render-budget and Core Web Vitals problem, and it buried every
  token's research inside a URL that could rank for nothing specific.

## Delivered
- [x] C1 Audit of data model, routes, sitemap, SEO baseline
- [x] C2 `scripts/build-scorecard-analytics.mjs` -> `data/scorecard-analytics.json` (2.8 MB)
- [x] C3 `/scorecard/[symbol]` x251
- [x] C4 `/scorecard/verdict/[verdict]` x5, `/scorecard/chain/[chain]` x8
- [x] C5 `/scorecard` rebuilt as an index: 5,298,046 -> 707,604 bytes (87% smaller)
- [x] C6 SEO: sitemap 398 -> 662 URLs, canonicals, BreadcrumbList + Dataset + FAQPage +
      ItemList JSON-LD, per-token keywords, dense internal link graph
- [x] C7 Build, humanize gate (0 hard fails / 265 pages), deploy, live-verify, IndexNow
- [x] C8 Wired the analytics rebuild into `.github/workflows/daily-prices.yml`

## Data defects found and corrected
1. **Dilution was wrong site-wide.** The old `/scorecard` "Dil." column read the source
   `fdv` field, which is frozen at an older price and disagrees with the computed
   `fully_diluted_valuation` on **127 of 251 tokens**. It published phantom overhang for
   fully circulating assets (ETH 1.33x, NOT 10.66x, DOGE 1.86x, 14 tokens total). Now
   derived from supply counts (eventual/circulating), which do not move with price.
2. **Composite disagreed with its own breakdown** on VIRTUAL (130 vs 151) and FLUID
   (138 vs 145). Composite is now recomputed as the sum of the 25 variables.
3. **Prices are stale.** 131 tokens stamped May 2026, 17 June, 101 carry no stamp at all.
   Where a ticker also has a daily-repriced research note that price is used (93 tokens);
   everything else is labelled with its recorded date, never presented as a live quote.
4. **154 strings damaged by earlier blind find-and-replace.** 79 carried "system tiny" /
   "Solana system growth" (from stripping "eco" out of "ecosystem"); 75 carried the
   gate-banned "unlock". Repaired via `scripts/reword-scorecard-vesting.mjs` (idempotent,
   `--dry` to review). "TokenUnlocks" left intact: it is a third-party source name.

## What makes the new pages defensible rather than doorway pages
Nothing is newly asserted. Each page carries arithmetic over the existing verified set:
per-variable rank and percentile against all 251, strengths/weaknesses vs the universe,
vesting overhang, ATH recovery multiple, mcap per dollar of TVL, and nearest
fundamental-profile neighbours by cosine over the **mean-centred** 25-vector, so
similarity tracks the shape of a token's fundamentals rather than its size. Findings are
emitted only where the data supports them, so pages differ structurally rather than by
slot-filling one template (ETH renders no weakness block, SUI renders a heavy-overhang
block).

## Hard rules carried forward
- No fabricated numbers. Derived values only, plus what the source already cites.
- Design system: PageChrome primitives only.
- No emojis. Gate-banned words: "unlock", "ecosystem". Use vesting / cliff / release /
  enters circulation, and network.
- Re-run `node scripts/build-scorecard-analytics.mjs` after any scorecard data change.

## Sprint 2, validation (2026-08-06)
Adversarial sprint over the shipped pages, 79 agents, every candidate defect
re-checked by a second agent told to refute it, then confirmed by hand.

Fixed at the source, not per page.
1. **Contradictory drawdown on 31 pages.** Cross-filling fresh prices while
   keeping the stored `ath_distance_pct` left pages stating a drawdown their own
   displayed price disproved (BTC read "2.5% off the high" beside a price
   implying 42%). Several stored highs were themselves wrong, BTC carried at
   $111,814 against a real $126,080. `scripts/fetch-scorecard-market.mjs` now
   pulls one live CoinGecko snapshot and everything price-derived reads from it.
   0 contradictions remain. 242 of 251 covered; the 9 unmatched show no price at
   all rather than a stale one. Strict symbol guard caught 7 renames (TON to
   GRAM, MATIC to POL, FXS to FRAX) instead of publishing them silently.
2. **47 dead citation URLs of 725.** `scripts/check-citation-urls.mjs` resolves
   all of them. Dead ones keep the claim, lose the hyperlink, carry a visible
   unverified marker, and are dropped from the JSON-LD `isBasedOn`.
3. **19 expired catalysts.** `key_catalyst` rendered under "Next catalyst" and
   LTC was advertising an August 2023 halving as forthcoming. Passed dates are
   detected at build time and the heading and copy change.
4. **33 Paradigm corruptions.** See `HUMANIZE-EXEMPTIONS.md`. A banned-word pass
   turned the VC firm Paradigm into "model", inventing a fund, erasing the real
   co-lead of Morpho's $175M round, and breaking two citation URLs. Also present
   in `opportunities.json`, so it was corrupting the 259 opportunity pages and
   the paid x402 payloads too.
5. **4 factually wrong claims** on XTZ, ALGO and CHZ, each corrected with a new
   citation to the source that settled it.

CI now refreshes the market snapshot daily and rechecks every citation link
weekly. Humanize gate passes strict, with `paradigm` documented as an expected
soft tell.

## Not done
Phase 2 was referenced in the first brief but its content was never supplied.
