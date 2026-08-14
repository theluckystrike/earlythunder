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

## Phase 2 (2026-08-14) — SHIPPED, commit 68672ad

Phase 2 was referenced in three consecutive briefs and its content was never
supplied. Rather than stall a fourth time it was defined here, explicitly as an
assumption, as the next iteration of the same programme. Two constraints set the
shape, both measured in this session: the Cloudflare file ceiling leaves roughly
389 pages of headroom, and phase 1 produced a universe-level finding that no
page applied to an individual token. So phase 2 deepens rather than multiplies.

- [x] `buildTokenPricingFinding()` gives all 251 token pages a reading of their
      own scores against what the market pays for. Seven branches fire across
      the universe, the largest covering 63 pages. The 113 tokens clearing 7 on
      nothing get their best three read against the same question rather than a
      dead end, which was added after measuring that the naive version left 45%
      of pages saying nothing useful.
- [x] `/scorecard/size/[tier]` x5, through the existing hub component and a new
      optional insight slot. Bands are round market numbers, not quantiles, so a
      token cannot change tier because the universe changed.
- [x] The finding those pages exist to carry: score tracks size across bands
      (median 157 mega, 121 large, 120 mid, 104 small, 95 micro) and stops
      tracking it inside one (rho -0.11, 0.03, -0.03). The two smallest bands
      fall under the n=30 floor and say so rather than printing a number.

### Defect found by widening the QA, shipped in sprint 3
Token pages linked their chain hub unconditionally, but chain hubs exist only
for chains with enough rated members: 8 of 89. **86 token pages across 81 chains
linked to a 404.** The link now renders as plain text where no hub exists. The
lesson is to run the link check over every page a change touches, not only the
pages it creates.

## Validation sprint (2026-08-14) — SHIPPED, commits 5e91878 + 302b398

The scorecard text was written by LLM research agents and had never been checked
against sources. This sprint checked it and found the failure rate is real.

### Method
Eight parallel auditors received the EXACT published strings for the 42
highest-visibility tokens, never a paraphrase, because paraphrase checking
produced false flags on this dataset before. Independent agents then tried to
refute every finding, defaulting to refuted when they could not confirm the
defect against a loading source. Survivors were confirmed by hand.

74 candidates, 9 killed at the refute stage, 65 confirmed, 64 corrections
written. The refute stage earned its place: it killed a claim about Hyperliquid
perp share where the sources measure different venue universes, and a Sky USDS
reading where the auditor had cherry-picked a peak.

### What was wrong, and it was not mostly invention
Stale figures published as current, 40 of 74. Dated events advertised as
forthcoming after they had happened, 12. Claims the cited source does not make,
6. Outright fabrication, 9.

Worst of them, all live until this sprint:
- DRIFT was described as the most active perp DEX on Solana with a June 2026
  launch ahead of it. It was exploited for $286M on 1 April 2026 through a
  compromised admin key and has been offline since. The principal risk field did
  not mention the exploit at all.
- LTC claimed a fourth halving. Litecoin has had three.
- BNB claimed a 2.3M token quarterly burn against an actual 1,371,803.77.
- XMR listed a mandatory ring signatures upgrade in 2025. RingCT has been
  mandatory since September 2017.
- BTC advertised accelerating ETF inflows during record outflows.
- MKR published a 10.7% Sky migration when about 81% had converted.

### How corrections ship
`data/audit-corrections.json` holds every correction with the URL that
establishes it. `scripts/apply-audit-corrections.mjs` matches exact substrings
and aborts rather than silently no-op when a target is missing, which is how the
one genuinely ambiguous case surfaced. Idempotent. 20 evidence citations added,
all verified to resolve. Citations 757 to 777.

### Coverage is partial and the gaps are named
Three of the eight audit agents died, so LINK, ETHFI, PENDLE, RETH, CBETH, AERO,
MORPHO, AAVE, VIRTUAL, LQTY, JUP, CETUS, SUI, LDO and FLUID were never checked.
The 209 tokens outside the top 42 were out of scope. Two confirmed findings were
left unfixed because no loading source settled them.

### Prose rules applied site wide
Em dashes in rendered prose 743 to 0. Title colons 1,125 to 2, both the Next 404
string. Hard gate failures 8 to 0 across 134 scanned pages.
`scripts/reword-content-prose.mjs` carries the vesting rewriter vocabulary into
the blog and guides. Two words are guarded rather than replaced and the script
says why: every use of leverage here is the financial term, and capitalised
Paradigm is the venture firm a blind pass once turned into "model".

## Not done
- 15 tokens the failed audit agents never reached, listed above.
- The 209 tokens below the top 42 have never been source-checked.
- 66 "this is" sentence openers remain across long-form articles. Soft tells,
  and mechanical rewriting risks the meaning for little gain.
