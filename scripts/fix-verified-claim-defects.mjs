#!/usr/bin/env node
/**
 * fix-verified-claim-defects.mjs — corrects claims that an adversarial
 * validation sprint found to be factually wrong, and cites the source that
 * settled each one.
 *
 * Every correction here was confirmed twice. Once by an auditing agent, then
 * again by a separate agent whose instructions were to refute it, and finally
 * checked by hand against a primary or major secondary source before landing.
 * Where the true fact could not be established to that standard the false
 * clause is removed rather than replaced, because swapping one unverified
 * assertion for another is not a fix.
 *
 * Idempotent. Run with --dry to review without writing.
 *
 * Authored to the NASA Power of 10 rules: bounded loops, >=2 assertions per
 * function, <60-line functions, every return value checked, no global mutable
 * state, zero suppressions.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SRC_PATH = join(REPO, "data", "altcoin-scorecard.json");

const MAX_TOKENS = 2000;

/**
 * One entry per confirmed defect. `field` is a top-level string field or
 * "citations[N].claim". A null `to` deletes the citation outright.
 */
const CORRECTIONS = [
  {
    symbol: "XTZ",
    field: "key_catalyst",
    from: "Tezos institutional tokenization (Bond i by SocGen) and RWA focus may sustain niche enterprise use",
    to: "Tezos institutional tokenization and RWA focus may sustain niche enterprise use",
    why: "bond-i was issued by the World Bank, arranged by Commonwealth Bank of Australia, on a private Ethereum chain in August 2018. Societe Generale had no role and Tezos was not involved.",
  },
  {
    symbol: "XTZ",
    field: "citations[1].claim",
    from: "Societe Generale issued OFH tokens on Tezos as regulated bond, niche enterprise adoption",
    to: null,
    why: "SocGen's OFH covered-bond tokens were issued on Ethereum in April 2019, not on Tezos. Removed rather than rewritten because the Tezos issuance SocGen did make was a different instrument and was not verified to the same standard.",
  },
  {
    symbol: "ALGO",
    field: "key_catalyst",
    from: "ALGO as CBDC/institutional settlement layer; partnerships with FIFA and various governments",
    to: "ALGO as CBDC/institutional settlement layer with government partnerships. The FIFA deal ended in May 2025 and FIFA Collect moved to its own Avalanche chain, so it is no longer a forward catalyst.",
    why: "FIFA selected Avalanche on 22 May 2025 and migrated FIFA Collect off Algorand. Published as a live partnership more than a year after it ended.",
  },
  {
    symbol: "CHZ",
    field: "key_catalyst",
    from: "Chiliz Chain 2.0 partnership with FIFA for 2026 World Cup fan tokens, minting 50+ new club tokens.",
    to: "Chiliz Chain 2.0 and national-team fan tokens on Socios. Chiliz is not a FIFA partner, FIFA's official crypto exchange supporter is Kraken, and the 2026 tournament has finished.",
    why: "No Chiliz-FIFA partnership exists. Kraken was named FIFA's Official Crypto Exchange Supporter on 9 June 2026. The original framing invented a partnership and pointed at a tournament that has since concluded.",
  },
];

/** Citations added alongside the corrections so each fix carries its source. */
const ADDED_CITATIONS = [
  {
    symbol: "XTZ",
    claim: "bond-i, the first blockchain bond, was issued by the World Bank and arranged by Commonwealth Bank of Australia on a private Ethereum chain in August 2018, raising A$110M. It was not a Tezos or Societe Generale issuance.",
    source: "World Bank",
    url: "https://www.worldbank.org/en/news/press-release/2018/08/23/world-bank-prices-first-global-blockchain-bond-raising-a110-million",
  },
  {
    symbol: "ALGO",
    claim: "FIFA ended its Algorand partnership and selected Avalanche in May 2025, migrating FIFA Collect to its own EVM-compatible chain.",
    source: "The Block",
    url: "https://www.theblock.co/post/355366/fifa-avalanche",
  },
  {
    symbol: "CHZ",
    claim: "Kraken, not Chiliz, is FIFA's Official Crypto Exchange Supporter for the 2026 World Cup, announced 9 June 2026.",
    source: "Crypto Briefing",
    url: "https://cryptobriefing.com/fifa-world-cup-2026-kraken-chiliz-fan-tokens/",
  },
];

/** Applies one correction to a token. Returns true when something changed. */
function applyCorrection(token, correction) {
  if (!token || typeof token.symbol !== "string") throw new Error("bad token");
  if (!correction || typeof correction.field !== "string") throw new Error("bad correction");

  const citationMatch = correction.field.match(/^citations\[(\d+)\]\.claim$/);
  if (citationMatch !== null) {
    const index = Number(citationMatch[1]);
    if (!Array.isArray(token.citations) || index >= token.citations.length) return false;
    const citation = token.citations[index];
    if (!citation || citation.claim !== correction.from) return false;
    if (correction.to === null) {
      token.citations.splice(index, 1);
      return true;
    }
    citation.claim = correction.to;
    return true;
  }

  if (token[correction.field] !== correction.from) return false;
  token[correction.field] = correction.to;
  return true;
}

/** Appends a citation unless an identical URL is already present. */
function addCitation(token, entry) {
  if (!token || typeof token.symbol !== "string") throw new Error("bad token");
  if (!entry || typeof entry.url !== "string") throw new Error("bad citation entry");
  if (!Array.isArray(token.citations)) token.citations = [];
  for (let i = 0; i < token.citations.length && i < 50; i += 1) {
    if (token.citations[i] && token.citations[i].url === entry.url) return false;
  }
  token.citations.push({ claim: entry.claim, source: entry.source, url: entry.url });
  return true;
}

function main() {
  const dryRun = process.argv.includes("--dry");
  const raw = readFileSync(SRC_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) throw new Error("scorecard empty");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.tokens)) throw new Error("tokens missing");

  const bySymbol = new Map();
  for (let i = 0; i < parsed.tokens.length && i < MAX_TOKENS; i += 1) {
    const token = parsed.tokens[i];
    if (token && typeof token.symbol === "string") bySymbol.set(token.symbol.toUpperCase(), token);
  }

  let applied = 0;
  let skipped = 0;
  for (let i = 0; i < CORRECTIONS.length; i += 1) {
    const correction = CORRECTIONS[i];
    const token = bySymbol.get(correction.symbol);
    if (!token) {
      process.stdout.write(`  SKIP ${correction.symbol}, token not found\n`);
      skipped += 1;
      continue;
    }
    const changed = applyCorrection(token, correction);
    if (changed) {
      applied += 1;
      process.stdout.write(`  FIXED ${correction.symbol} ${correction.field}\n    - ${correction.from.slice(0, 110)}\n    + ${correction.to === null ? "(citation removed)" : correction.to.slice(0, 110)}\n    why ${correction.why.slice(0, 130)}\n`);
    } else {
      skipped += 1;
      process.stdout.write(`  SKIP ${correction.symbol} ${correction.field}, already corrected or text moved\n`);
    }
  }

  let cited = 0;
  for (let i = 0; i < ADDED_CITATIONS.length; i += 1) {
    const entry = ADDED_CITATIONS[i];
    const token = bySymbol.get(entry.symbol);
    if (!token) continue;
    if (addCitation(token, entry)) {
      cited += 1;
      process.stdout.write(`  CITED ${entry.symbol} ${entry.source}\n`);
    }
  }

  process.stdout.write(`\n${applied} corrections applied, ${skipped} skipped, ${cited} citations added${dryRun ? " (dry run, nothing written)" : ""}\n`);
  if (!dryRun && (applied > 0 || cited > 0)) {
    writeFileSync(SRC_PATH, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    process.stdout.write(`written ${SRC_PATH}\n`);
  }
}

main();
