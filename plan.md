# PLAN — Scorecard long-tail architecture

## Sprint 1-2 (2026-08-06) — SHIPPED, commits 0f19341 + 4136ecd

Gave all 251 scored tokens their own page, added verdict and chain hubs, cut
`/scorecard` from 5,298,046 to 707,604 bytes, sitemap 398 -> 662 URLs. A second
adversarial sprint over the shipped pages then fixed, at the source: 31 pages
printing a drawdown their own displayed price disproved, 47 dead citation URLs
of 725, 19 expired catalysts advertised as forthcoming, 33 Paradigm corruptions
from an earlier banned-word pass, and 4 factually wrong claims on XTZ, ALGO and
CHZ. Detail archived in `plan-archive.md` and `HUMANIZE-EXEMPTIONS.md`.

## Sprint 3 (2026-08-14) — SHIPPED, commit b39b0c9

### Problem found (measured)
The scorecard held 251 tokens x 25 variables behind exactly two ways in: the
composite ranking, and the verdict or chain band. Two questions a reader
actually asks had no URL anywhere on the site.

1. **Which tokens lead on one variable.** The data ranks every token on all 25,
   and none of those 25 rankings was reachable. A reader wanting the cleanest
   supply position, the deepest liquidity or the highest protocol revenue had to
   read 251 pages and sort by hand.
2. **How these two compare.** Every token page carried its six nearest
   fundamental profiles as links, and clicking one gave a second page scored on
   the same scale with no gap stated anywhere.

### Delivered
- [x] `scripts/build-longtail-layer.mjs`, derived from the analytics layer, writing
      two files. `data/scorecard-signals.json` carries per variable: the full
      leaderboard, distribution, Pearson correlation with the composite,
      Spearman rank correlation with market capitalisation, and the three
      variables it co-moves with most. `data/scorecard-pairs.json` carries the
      curated pair list.
- [x] `/scorecard/signal/[signal]` x25 plus `/scorecard/signal`, which ranks all
      25 variables by how much the market pays for each.
- [x] `/scorecard/compare/[pair]` x1,033 plus `/scorecard/compare`. Pairs are
      chosen by three rules, never at random: the market-cap head paired within
      10 places (345), each token against its three nearest fundamental profiles
      (588), and the leaders of each network against each other (100).
- [x] SEO: sitemap 662 -> 1,721 URLs, canonical on every page, BreadcrumbList +
      Dataset + ItemList + FAQPage JSON-LD, per-page keyword sets built from the
      pair or variable rather than a shared list.
- [x] Internal linking: footer gains a scorecard column (site-wide crawl path),
      every variable label on a token page links to its ranking, every token
      page carries up to 8 of its own comparisons, `/scorecard` links both hubs,
      `llms.txt` lists the new families.
- [x] `.github/workflows/daily-prices.yml` rebuilds the layer daily, right after
      the analytics rebuild it derives from.

### The original finding this sprint produced
Ranking the 25 variables by rank correlation with live market capitalisation
answers a question no per-token page can: which fundamentals the market is
already charging for.

| Theme | Mean rho vs market cap |
|---|---|
| Position | 0.53 |
| Risk | 0.33 |
| Traction | 0.33 |
| Ownership | 0.21 |
| Cash flow | 0.13 |
| **Supply** | **0.12** |

Exchange Depth leads at 0.67 and Social Mindshare follows at 0.57. Buyback and
Burn sits at 0.06, Insider Selling at 0.05, Supply Inflation at 0.07. The market
prices liquidity and attention. It does not price supply discipline at all. That
is stated on `/scorecard/signal` with the arithmetic beside it, and it is the
single most defensible page added this sprint.

The same pass also found the framework is not 25 independent variables. Supply
Inflation and Vesting Schedule correlate 0.87, Vesting Schedule and Circulating
/ FDV Ratio 0.82: the supply block is close to one measurement taken three
times. Every signal page states its own nearest twin so a reader does not treat
one finding as two.

### Defects found and fixed during the sprint
1. **A comparison could contradict itself.** Where one token won 24 of 25
   variables by one or two points each, the "no variable separates them by 3
   points" branch printed "they are the same asset" beside a 30-point composite
   gap. The branch now detects a broad lead and says so.
2. **A 12-point gap called wide.** The margin sentence had one threshold at 10
   points on a 250-point scale. It now bands narrow / real / wide.
3. **Two slugs carried gate-banned wording.** `unlock_schedule` and
   `ecosystem_growth` are source keys; the URLs are `vesting-schedule` and
   `network-growth`, matching the heading a reader sees.
4. **Twelve titles ran past 70 characters** on pairs of long token names. Those
   fall back to the ticker form.

### Verification
1,061 new pages checked by script: unique title, description and canonical on
every one, zero broken internal links of 1,346, 3,236 JSON-LD blocks all parse,
canonical matches file path everywhere. Humanize gate passes strict on every
signal page and on a 1-in-40 sample of comparisons. The NASA gate passes on all
derivation code, which meant splitting both finding builders into one function
per paragraph.

## Hard rules carried forward
- No fabricated numbers. Derived values only, plus what the source already cites.
- Correlations are described as description, never as cause.
- Design system: PageChrome primitives only.
- No emojis. Gate-banned words: "unlock", "ecosystem". Use vesting / cliff /
  release / enters circulation, and network. This applies to slugs too.
- Re-run `build-scorecard-analytics.mjs` then `build-longtail-layer.mjs` after
  any scorecard data change. The second reads the first.

## Not done
Phase 2 was referenced in the first brief and again in the third. Its content
has never been supplied, so nothing has been assumed about it.
