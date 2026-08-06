# PLAN — Scorecard data expansion + long-tail architecture

## Problem found (measured, 2026-08-06)
- `data/altcoin-scorecard.json` holds 251 tokens x 25 scored variables + verdict, catalyst,
  risk, supply, FDV, ATH, TVL and 152 citation sets. **158 of those tokens have no page
  anywhere on the site.** They exist only as rows inside one monolithic `/scorecard`.
- `out/scorecard.html` is **5,298,046 bytes** (5.3 MB). It renders the full 251-token set
  four separate times (rankings table, mobile card list, verdict card grid, 25x251 heatmap,
  raw supply table). That is a crawl-budget, render-budget and Core Web Vitals problem, and
  it buries every token's research inside a single URL that can rank for nothing specific.
- Consequence: the most expensive research asset on the site (40+ agent scoring sprint,
  13-agent verification sprint) is generating close to zero long-tail surface.

## Approach
Do not write new prose claims. **Derive** new, defensible data from what is already
verified, then give each derived entity its own URL. Every number on a new page traces to
`altcoin-scorecard.json` or to arithmetic over it.

## Chunks
- [x] C1 Audit data model, routes, sitemap, SEO baseline
- [ ] C2 `scripts/build-scorecard-analytics.mjs` -> `data/scorecard-analytics.json`
      Per token: overall rank + percentile, per-variable rank + percentile vs 251,
      strengths/weaknesses vs universe, score delta, dilution overhang math, ATH recovery
      multiple, mcap/TVL ratio, nearest fundamental-profile neighbours (shape-normalised
      cosine over the 25-vector), verdict + chain peers.
      Per variable: mean, median, decile distribution across the universe.
      Per group (verdict, chain, score band): aggregates + members.
- [ ] C3 `/scorecard/[symbol]` — 251 token pages, each carrying computed percentile context,
      full 25-variable breakdown, dilution + ATH math, citations, similar-profile tokens.
- [ ] C4 `/scorecard/verdict/[verdict]` + `/scorecard/chain/[chain]` — league-table hubs.
- [ ] C5 Rebuild `/scorecard` as an index (kill the duplicated card grid + heatmap bloat),
      restoring it as the crawl path into the 251 leaves.
- [ ] C6 SEO: sitemap entries, canonicals, BreadcrumbList + Dataset/FAQ JSON-LD, internal
      link graph, metadata generators, no-fabrication check.
- [ ] C7 Build, verify page weights, humanize gate, deploy.

## Hard rules
- No fabricated numbers. Derived values only, plus what the source file already cites.
- Scorecard prices are stamped `price_updated_at` (June 2026) and are STALE. Present score,
  supply, ratios and rankings as the durable content; label any price with its as-of date,
  never as "current".
- Design system: PageChrome primitives only (`src/components/PageChrome.tsx`).
- No emojis. Humanize gate: "unlock" and "ecosystem" are banned words, use
  "vesting / cliff / enters circulation" and "network".
