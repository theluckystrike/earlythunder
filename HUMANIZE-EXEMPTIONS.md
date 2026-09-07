# Humanize exemptions for this repo

The prose gate at `~/Desktop/humanize/scan.py` bans a list of words. Some of
those words are also the legal names of real companies in this dataset. Running
a blind find-and-replace over the data has already corrupted this repo twice,
so the rule is simple.

**Never replace a banned word that is functioning as a proper noun.** HUMANIZE.md
says it plainly under "Preserve, never change these": facts, numbers, dates,
names, quotes, URLs, links and code. A company name is a name.

## Known collisions, leave these alone

`paradigm` — Paradigm is a crypto venture firm. It leads or co-leads rounds for
Morpho, Babylon, Commonware, Symbiotic and Echelon Prime, and is the largest
known HYPE holder. A pass that rewrote it to "model" produced 33 corruptions
across `data/altcoin-scorecard.json` and `data/opportunities.json`, credited a
$175M round to a fund that does not exist, erased the real co-lead, and broke
two citation URLs by rewriting the word inside the slug. Repaired by
`scripts/fix-paradigm-substitution.mjs`. The gate will keep reporting this as a
soft `banned_words` tell on any page mentioning the firm. That report is
expected and must be ignored.

`unlock` — TokenUnlocks is a data provider cited in the dataset, and
`token.unlocks.app` appears in citation URLs. The word is correctly rewritten to
vesting, cliff or release vocabulary in ordinary prose, which
`scripts/reword-scorecard-vesting.mjs` does, but the source name stays.

`ecosystem` — an earlier pass stripped "eco" and left "system tiny" and "Solana
system growth" across 79 strings. Prose now uses "network" instead. If a future
project is literally named Ecosystem, it is exempt on the same grounds.

## Before running any prose pass over `data/`

1. Diff it. `--dry` first, read every replacement.
2. Check for proper nouns and URLs in the match set. A hit inside a URL slug is
   always wrong.
3. Re-run `node scripts/check-citation-urls.mjs` afterwards. A rewritten URL
   shows up there as a fresh 404.

## Sprint 2 tool pages, 2026-09-07

`leverage` on `/crypto-liquidation-price-calculator` and `/impermanent-loss-calculator`.
The scanner bans it as the AI verb, "leverage our platform". On these two pages it is the
noun that names the thing being calculated. A 10x leveraged position has a leverage ratio,
and there is no synonym for it in derivatives. Leave it.

`unlock` on `/crypto-market-cap-calculator`. A token unlock schedule is the vesting release
calendar. The scorecard's own sub score is literally named `unlock_schedule`. The banned
phrase is "unlock the power", which does not appear. Leave it.

`in today's` on `/crypto-market-cap-calculator`. The sentence is "treat the rank as a position
in today's frozen list rather than a place the token would land". The banned phrase is
"in today's fast paced world". The scanner substring matches the first three words. The
sentence is doing real work and states a real limitation of the implied rank calculation.
Leave it.

`Infinity` on `/crypto-liquidation-price-calculator`. A render defect scan flags the string.
The match is "Axie Infinity", a token in the picker list. Leave it.

## One fix applied to another workstream's file

`src/components/WorkbenchCTA.tsx` shipped "Get the Workbench — $29" with an em dash. That
component renders in the footer of every page, so a single character was failing the strict
humanize gate site wide, on 1,747 pages, including pages that had previously passed it. It was
changed to the middle dot that `Header.tsx` and `Footer.tsx` already use for the same offer.
