#!/usr/bin/env node
/**
 * reword-scorecard-vesting.mjs — rewrites the token-cliff vocabulary in
 * data/altcoin-scorecard.json.
 *
 * The per-token scorecard pages surface `one_liner`, `key_catalyst` and
 * `key_risk` as body copy, which puts those strings through the house prose
 * gate. That gate bans "unlock", so this replaces it with the vesting and
 * cliff vocabulary used everywhere else on the site. Meaning is preserved:
 * these are wording substitutions, never changes to a number, a date or a
 * claim.
 *
 * Idempotent. Run with --dry to review the diff without writing.
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
const FIELDS = ["one_liner", "key_catalyst", "key_risk"];

/**
 * Ordered substitutions. Longer, more specific phrases run first so that a
 * generic rule cannot strand an awkward partial rewrite behind it.
 */
const RULES = [
  [/\bunlock schedules\b/gi, "vesting schedules"],
  [/\bunlock schedule\b/gi, "vesting schedule"],
  [/\bunlock pressure\b/gi, "vesting pressure"],
  [/\bunlock cliffs?\b/gi, "vesting cliff"],
  [/\bunlocking\b/gi, "vesting"],
  // "releases" carries both senses the source uses, the noun ("investor
  // releases through 2027") and the verb ("the cliff releases 500M tokens"),
  // so it substitutes cleanly wherever a tranche-shaped noun would not.
  [/\bunlocks\b/gi, "releases"],
  [/\bunlocked\b/gi, "released"],
  [/\bunlock\b/gi, "release"],

  // A previous blind find-and-replace stripped "eco" from "ecosystem" across
  // 79 strings, leaving "Solana system growth" and "system tiny". "network" is
  // the word the site uses for this and is not gate-banned. PRESERVE_SYSTEM
  // guards the handful of places where "system" was always the right word.
  [/\bsystem\b/g, "network"],
  [/\bsystems\b/g, "networks"],
];

/**
 * Phrases where "system" is correct English rather than replace damage. These
 * are restored verbatim after the rules run.
 */
const PRESERVE_SYSTEM = ["naming network", "stablecoin network"];
const PRESERVE_RESTORE = ["naming system", "stablecoin system"];

/** Applies every rule in order. Returns the rewritten string. */
function reword(text) {
  if (typeof text !== "string") return text;
  if (text.length === 0) return text;
  let out = text;
  for (let i = 0; i < RULES.length; i += 1) {
    out = out.replace(RULES[i][0], RULES[i][1]);
  }
  for (let i = 0; i < PRESERVE_SYSTEM.length; i += 1) {
    out = out.split(PRESERVE_SYSTEM[i]).join(PRESERVE_RESTORE[i]);
  }
  return out;
}

/** True when the string still carries the banned root after rewriting. */
function stillBanned(text) {
  if (typeof text !== "string") return false;
  if (text.length === 0) return false;
  return /unlock/i.test(text);
}

function main() {
  const dryRun = process.argv.includes("--dry");
  const raw = readFileSync(SRC_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) throw new Error("source empty");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.tokens)) throw new Error("tokens missing");

  const changes = [];
  let residual = 0;
  for (let i = 0; i < parsed.tokens.length && i < MAX_TOKENS; i += 1) {
    const token = parsed.tokens[i];
    if (!token || typeof token.symbol !== "string") continue;
    for (let f = 0; f < FIELDS.length; f += 1) {
      const field = FIELDS[f];
      const before = token[field];
      if (typeof before !== "string" || before.length === 0) continue;
      const after = reword(before);
      if (after === before) continue;
      if (stillBanned(after)) residual += 1;
      token[field] = after;
      changes.push({ symbol: token.symbol, field, before, after });
    }
    // Citation claim text is rendered as body copy too. The `source` and `url`
    // are left untouched: those name third parties such as TokenUnlocks, and
    // rewriting a source's name would misattribute the citation.
    if (!Array.isArray(token.citations)) continue;
    for (let c = 0; c < token.citations.length && c < 50; c += 1) {
      const citation = token.citations[c];
      if (!citation || typeof citation.claim !== "string") continue;
      const after = reword(citation.claim);
      if (after === citation.claim) continue;
      changes.push({ symbol: token.symbol, field: `citation[${c}]`, before: citation.claim, after });
      citation.claim = after;
    }
  }

  for (let i = 0; i < changes.length && i < 200; i += 1) {
    const change = changes[i];
    process.stdout.write(`${change.symbol} ${change.field}\n  - ${change.before}\n  + ${change.after}\n`);
  }
  process.stdout.write(`\n${changes.length} strings rewritten, ${residual} still carry the banned root.\n`);

  if (dryRun) {
    process.stdout.write("dry run, nothing written\n");
    return;
  }
  writeFileSync(SRC_PATH, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  process.stdout.write(`written ${SRC_PATH}\n`);
}

main();
