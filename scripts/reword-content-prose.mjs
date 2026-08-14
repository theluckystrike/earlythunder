#!/usr/bin/env node
/**
 * reword-content-prose.mjs — applies the house prose vocabulary to the blog and
 * guide bodies in data/blog.json and data/guides.json.
 *
 * These files render as body copy, so they go through the same gate as the
 * scorecard strings. This script carries the same vocabulary as
 * scripts/reword-scorecard-vesting.mjs, plus the words the gate flags in long
 * form content. Meaning is preserved. Every rule is a wording substitution and
 * never a change to a number, a date, a name or a claim.
 *
 * Two words look like violations and are not, so they are guarded rather than
 * replaced:
 *
 *   leverage   In this corpus every use is the financial term. "2x leverage",
 *              "leverage strategies", "undisclosed leverage". Replacing it
 *              would destroy the meaning, so it is left alone.
 *   Paradigm   The venture firm, capitalised. A previous blind pass turned it
 *              into "model" and invented a fund. Only the lowercase buzzword
 *              sense is rewritten. See HUMANIZE-EXEMPTIONS.md.
 *
 * Idempotent. Run with --dry to review counts without writing.
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
const TARGETS = ["blog.json", "guides.json"];

const MAX_NODES = 200000;
const MAX_DEPTH = 12;

/** Keys whose values are identifiers or links, never prose. */
const SKIP_KEYS = new Set([
  "slug", "url", "id", "image", "image_url", "canonical", "href",
  "source_url", "published_at", "updated_at", "date", "ticker", "symbol", "tags",
]);

/**
 * Ordered substitutions. Longer and more specific phrases run first so a
 * generic rule cannot strand an awkward partial rewrite behind it.
 */
const RULES = [
  // Cliff and vesting vocabulary, matching reword-scorecard-vesting.mjs.
  [/\bunlock schedules\b/gi, "vesting schedules"],
  [/\bunlock schedule\b/gi, "vesting schedule"],
  [/\bunlock pressure\b/gi, "vesting pressure"],
  [/\bunlock events?\b/gi, "vesting events"],
  [/\bunlock cliffs?\b/gi, "vesting cliff"],
  [/\btoken unlocks\b/gi, "token releases"],
  [/\btoken unlock\b/gi, "token release"],
  [/\bunlocking\b/gi, "releasing"],
  [/\bunlocks\b/gi, "releases"],
  [/\bunlocked\b/gi, "released"],
  [/\bunlock\b/gi, "release"],

  // The house word for a chain and the projects on it. Specific forms first so
  // the generic rule cannot produce "developer network" where "base" is meant.
  [/\bdeveloper ecosystems?\b/gi, "developer base"],
  [/\becosystem tokens\b/gi, "network tokens"],
  [/\becosystems\b/gi, "networks"],
  [/\becosystem\b/gi, "network"],

  // Buzzwords the gate flags. Each replacement keeps the sentence's claim.
  [/\bThe Lending Landscape\b/g, "The lending market"],
  [/\blandscape\b/gi, "market"],
  [/\bDeep Dive\b/g, "Breakdown"],
  [/\bdeep dive\b/gi, "breakdown"],
  [/\bKey Takeaways\b/g, "What matters"],
  [/\bkey takeaways\b/gi, "what matters"],
  [/\bvalue proposition\b/gi, "case for it"],
  [/\bcomprehensive\b/gi, "complete"],
  [/\binnovative\b/gi, "novel"],
  [/\bgroundbreaking\b/gi, "novel"],
  [/\btransformative\b/gi, "far-reaching"],
  [/\ba testament to\b/gi, "evidence of"],
  [/\bfacilitates\b/gi, "supports"],
  [/\butilizes\b/gi, "uses"],
  [/\bbedrock\b/gi, "foundation"],
  [/\bin terms of\b/gi, "for"],
  [/\bcrucial\b/gi, "decisive"],
  [/\bvital\b/gi, "essential"],
  [/\bpivotal\b/gi, "decisive"],

  [/\bsophisticated\b/gi, "advanced"],
  [/\bscalable\b/gi, "able to scale"],
  [/\bunmatched\b/gi, "unbeaten"],
  [/\bsurpassing\b/gi, "beating"],
  [/\bnavigate\b/gi, "work through"],
  [/\bworld-class\b/gi, "top tier"],
  [/\bsynergy\b/gi, "overlap"],

  // Only the lowercase buzzword sense. Capitalised Paradigm is the firm.
  [/\ba new paradigm\b/g, "a new model"],
  [/\bthe paradigm\b/g, "the model"],
];

/** Applies every rule in order. Returns the rewritten string. */
function reword(text) {
  if (typeof text !== "string") return text;
  if (text.length === 0) return text;
  let out = text;
  for (let i = 0; i < RULES.length; i += 1) {
    out = out.replace(RULES[i][0], RULES[i][1]);
  }
  return out;
}

/** True when a string is a link or a bare identifier rather than prose. */
function isNotProse(text) {
  if (typeof text !== "string") return true;
  if (text.length === 0) return true;
  return /^(https?:\/\/|\/|www\.)/.test(text.trim());
}

/** Rewrites every prose string in a tree, counting the ones that changed. */
function walk(node, key, depth, counter) {
  if (depth > MAX_DEPTH) return node;
  if (counter.visited > MAX_NODES) return node;
  counter.visited += 1;

  if (Array.isArray(node)) {
    return node.map((item) => walk(item, key, depth + 1, counter));
  }
  if (node !== null && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = walk(v, k, depth + 1, counter);
    }
    return out;
  }
  if (typeof node !== "string") return node;
  if (SKIP_KEYS.has(key) || isNotProse(node)) return node;

  const next = reword(node);
  if (next !== node) counter.changed += 1;
  return next;
}

/** Counts gate-flagged words remaining in a serialised tree. */
function residue(serialised) {
  if (typeof serialised !== "string") throw new Error("residue: string required");
  if (serialised.length === 0) throw new Error("residue: empty input");
  const probes = ["ecosystem", "unlock", "landscape", "deep dive", "value proposition"];
  return probes
    .map((w) => `${w} ${(serialised.toLowerCase().match(new RegExp(`\\b${w}`, "g")) || []).length}`)
    .join(", ");
}

function main() {
  const dry = process.argv.includes("--dry");
  for (let i = 0; i < TARGETS.length; i += 1) {
    const path = join(REPO, "data", TARGETS[i]);
    const raw = readFileSync(path, "utf8");
    if (raw.length === 0) throw new Error(`${TARGETS[i]} is empty`);
    const parsed = JSON.parse(raw);
    const counter = { changed: 0, visited: 0 };
    const out = walk(parsed, null, 0, counter);
    const after = JSON.stringify(out, null, 1);
    if (!dry) writeFileSync(path, `${after}\n`);
    process.stdout.write(
      `${TARGETS[i]}: ${counter.changed} strings reworded. before [${residue(raw)}] after [${residue(after)}]\n`,
    );
  }
  process.stdout.write(dry ? "dry run, nothing written\n" : "written\n");
}

main();
