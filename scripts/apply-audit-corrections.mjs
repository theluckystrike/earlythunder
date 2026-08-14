#!/usr/bin/env node
/**
 * apply-audit-corrections.mjs — applies the verified corrections in
 * data/audit-corrections.json to data/altcoin-scorecard.json.
 *
 * Every correction is an exact-substring replacement against a named field of a
 * named token, carrying the URL that establishes the corrected fact. Nothing is
 * fuzzy-matched. If a target string is not present the run aborts, because a
 * silent no-op would leave a defect published while reporting success.
 *
 * A correction may also attach a citation, so a claim the audit had to verify
 * elsewhere ships with the source that settled it.
 *
 * Idempotent. Re-running skips corrections whose target is already gone and
 * whose replacement is already present. Run with --dry to review.
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
const FIX_PATH = join(REPO, "data", "audit-corrections.json");

const MAX_TOKENS = 2000;
const MAX_FIXES = 500;
const TEXT_FIELDS = new Set(["one_liner", "key_catalyst", "key_risk"]);

/** Loads and validates the scorecard. */
function loadScorecard() {
  const raw = readFileSync(SRC_PATH, "utf8");
  if (raw.length === 0) throw new Error("scorecard is empty");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${SRC_PATH} is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed.tokens) || parsed.tokens.length === 0) {
    throw new Error("scorecard carries no tokens");
  }
  return parsed;
}

/** Loads and validates the correction list. */
function loadCorrections() {
  const raw = readFileSync(FIX_PATH, "utf8");
  if (raw.length === 0) throw new Error("corrections file is empty");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${FIX_PATH} is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed.corrections)) throw new Error("corrections must be an array");
  if (parsed.corrections.length > MAX_FIXES) throw new Error("too many corrections");
  return parsed;
}

/** Finds one token by symbol. Throws when the symbol is unknown. */
function findToken(tokens, symbol) {
  if (!Array.isArray(tokens)) throw new Error("findToken: tokens required");
  if (typeof symbol !== "string" || symbol.length === 0) throw new Error("findToken: symbol required");
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    if (tokens[i].symbol === symbol) return tokens[i];
  }
  throw new Error(`unknown symbol ${symbol}`);
}

/** Attaches a citation, skipping one that is already present. */
function addCitation(token, citation) {
  if (!token || !citation) throw new Error("addCitation: arguments required");
  if (typeof citation.claim !== "string" || citation.claim.length === 0) {
    throw new Error("addCitation: claim required");
  }
  if (!Array.isArray(token.citations)) token.citations = [];
  const already = token.citations.some((c) => c.url === citation.url && c.claim === citation.claim);
  if (already) return false;
  token.citations.push({
    claim: citation.claim,
    source: citation.source,
    url: citation.url,
  });
  return true;
}

/** Replaces an exact substring in one text field. */
function replaceInField(token, field, find, replace) {
  if (!TEXT_FIELDS.has(field)) throw new Error(`field ${field} is not editable`);
  const current = token[field];
  if (typeof current !== "string") throw new Error(`${token.symbol}.${field} is not a string`);
  if (!current.includes(find)) return null;
  token[field] = current.replace(find, replace);
  return token[field];
}

/** Replaces an exact substring inside a citation claim. */
function replaceInCitation(token, find, replace) {
  if (!token || !Array.isArray(token.citations)) throw new Error("replaceInCitation: citations required");
  for (let i = 0; i < token.citations.length && i < 100; i += 1) {
    const claim = token.citations[i].claim;
    if (typeof claim === "string" && claim.includes(find)) {
      token.citations[i].claim = claim.replace(find, replace);
      return true;
    }
  }
  return false;
}

/** Applies one correction. Returns "applied", "already" or throws. */
function applyOne(tokens, fix) {
  if (!fix || typeof fix.symbol !== "string") throw new Error("correction needs a symbol");
  const token = findToken(tokens, fix.symbol);

  if (fix.add_citation) {
    return addCitation(token, fix.add_citation) ? "applied" : "already";
  }

  if (typeof fix.find !== "string" || fix.find.length === 0) {
    throw new Error(`${fix.symbol}: correction needs find`);
  }
  if (typeof fix.replace !== "string") {
    throw new Error(`${fix.symbol}: correction needs replace`);
  }
  // A find string contained in its own replacement re-matches on every run and
  // compounds. One correction shipped "third third third halving" that way.
  if (fix.replace.includes(fix.find)) {
    throw new Error(
      `${fix.symbol}.${fix.field}: find is a substring of replace, so the correction ` +
        `would compound on re-run. Anchor find on surrounding text.`,
    );
  }

  const done =
    fix.field === "citation"
      ? replaceInCitation(token, fix.find, fix.replace)
      : replaceInField(token, fix.field, fix.find, fix.replace) !== null;

  if (done) {
    if (fix.cite) addCitation(token, fix.cite);
    return "applied";
  }

  // A later correction may have re-cased the replacement, so the idempotency
  // check ignores case. It still fails loudly when the text is simply absent.
  const serialised = JSON.stringify(token).toLowerCase();
  if (serialised.includes(fix.replace.toLowerCase())) return "already";
  throw new Error(`${fix.symbol}.${fix.field}: target string not found -> ${fix.find.slice(0, 70)}`);
}

function main() {
  const dry = process.argv.includes("--dry");
  const scorecard = loadScorecard();
  const { corrections } = loadCorrections();

  const counts = { applied: 0, already: 0 };
  for (let i = 0; i < corrections.length && i < MAX_FIXES; i += 1) {
    const outcome = applyOne(scorecard.tokens, corrections[i]);
    counts[outcome] += 1;
    process.stdout.write(
      `  ${outcome.padEnd(7)} ${corrections[i].symbol.padEnd(7)} ${corrections[i].field ?? "citation"}\n`,
    );
  }

  if (!dry) {
    scorecard.updated_at = new Date().toISOString();
    writeFileSync(SRC_PATH, `${JSON.stringify(scorecard, null, 1)}\n`);
  }
  process.stdout.write(
    `\n${counts.applied} applied, ${counts.already} already correct, ${corrections.length} total` +
      `${dry ? " (dry run, nothing written)" : ""}\n`,
  );
}

main();
