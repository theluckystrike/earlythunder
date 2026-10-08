#!/usr/bin/env node
/**
 * fix-meta-jargon.mjs - removes internal pipeline jargon ("S39 40-AGENT
 * VALIDATED", "Sprint 20 REDUCE", "199→186" score deltas) and one stale market
 * cap from one_liner fields. one_liners feed the meta descriptions Google shows,
 * so a searcher saw our sprint labels in the snippet.
 *
 * Replacements are EXPLICIT LITERAL one_liner values, each read in context
 * (memory: earlythunder-blind-replace-corruption). No patterns, no word swaps.
 * Each old value is matched as its full JSON string, so nothing outside that one
 * field can change. Idempotent. Run with --dry to review without writing.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");

const OPP = [
  ["Institutional settlement layer with commodity classification. Burn collapsed but moat intact. 199→186.",
   "Institutional settlement layer with commodity classification. Burn collapsed but moat intact."],
  ["Pre-token Solana trading terminal generating $366M/yr annualized revenue. Highest-priority farming target in Sprint 20.",
   "Pre-token Solana trading terminal generating $366M/yr annualized revenue, with no token yet."],
  ["S39 40-AGENT VALIDATED: Solana's DeFi superapp, 93.6% aggregator share, $2.9B TVL, $129M rev. Revenue -78% but net-zero emissions + vesting complete.",
   "Solana's DeFi superapp, 93.6% aggregator share, $2.9B TVL, $129M rev. Revenue -78% but net-zero emissions + vesting complete."],
  ["VALIDATED: DeFi revenue leader ($246M net, P/S 5.4x)",
   "DeFi revenue leader ($246M net, P/S 5.4x)"],
  ["Intent-based batch auction DEX. $87B vol 2025, P/S 3.1x, net deflationary. 150→167 HOLD.",
   "Intent-based batch auction DEX. $87B vol 2025, P/S 3.1x, net deflationary."],
  ["Sprint 20 REDUCE: Fees declining -48% MoM.", "Fees declining -48% MoM."],
  ["Sprint 21 TRIM: Losing market share to Hyperliquid.", "Losing market share to Hyperliquid."],
  ["S38 40-AGENT VALIDATED: #1 Solana lending ($3.2B TVL, $14.3M rev)", "#1 Solana lending ($3.2B TVL, $14.3M rev)"],
  ["Sprint 21 AVOID: Single counterparty risk.", "Single counterparty risk."],
  ["The number three ZK perp DEX, up sharply this week to a $534M cap. But that rally sits on a hard truth.",
   "The number three ZK perp DEX. Its recent rally sits on a hard truth."],
];

const SCORECARD = [
  ["S38 validated: #1 Solana lending, $3.2B TVL", "#1 Solana lending, $3.2B TVL"],
  ["S39 validated: Solana's DeFi superapp. 93.6% aggregator share", "Solana's DeFi superapp. 93.6% aggregator share"],
];

const TARGETS = [
  ["opportunities.json", OPP],
  ["altcoin-scorecard.json", SCORECARD],
  ["scorecard-analytics.json", SCORECARD],
  ["scorecard-rankings.json", SCORECARD],
];

const dry = process.argv.includes("--dry");

/** Every edit must sit inside a "one_liner" value: prefix the old text with the key. */
function applyFile(name, pairs) {
  const path = join(REPO, "data", name);
  let text = readFileSync(path, "utf8");
  let changed = 0;
  for (const [oldText, newText] of pairs) {
    for (const sep of ['"one_liner": "', '"one_liner":"']) {
      const needle = sep + JSON.stringify(oldText).slice(1, -1);
      const count = text.split(needle).length - 1;
      if (count === 0) continue;
      text = text.split(needle).join(sep + JSON.stringify(newText).slice(1, -1));
      changed += count;
    }
  }
  if (!dry && changed > 0) writeFileSync(path, text);
  console.log(`${name}: ${changed} one_liner value(s) ${dry ? "would change" : "changed"}`);
  return changed;
}

let total = 0;
for (const [name, pairs] of TARGETS) total += applyFile(name, pairs);
JSON.parse(readFileSync(join(REPO, "data", "opportunities.json"), "utf8"));
console.log(`total ${total}`);
