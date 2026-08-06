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
