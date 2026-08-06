#!/usr/bin/env node
/**
 * fix-paradigm-substitution.mjs — restores the venture firm Paradigm, which an
 * earlier blind find-and-replace turned into the word "model".
 *
 * "paradigm" is on the house prose banned-word list. A pass that swapped it for
 * "model" hit the proper noun as well, so the dataset credited Morpho's $175M
 * round to a non-existent fund called "model" and erased the actual co-lead. It
 * corrupted two citation URLs the same way, which is why they 404.
 *
 * Replacements are EXPLICIT LITERAL STRINGS, not a pattern. The word "model" is
 * legitimate in most of its 200 occurrences here (business model, eUTXO model,
 * ONNX model, actor model, Model Context Protocol), so a regex on investor-ish
 * context would eventually corrupt real prose the same way the original pass
 * did. Every entry below was read in context and confirmed to be the firm.
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
const TARGETS = [
  join(REPO, "data", "altcoin-scorecard.json"),
  join(REPO, "data", "opportunities.json"),
];

const MAX_PASSES = 200;

/**
 * Exact substrings to restore. Ordered longest first so a shorter entry cannot
 * consume part of a longer one.
 */
const REPLACEMENTS = [
  // Corrupted citation URLs. These are why the two Morpho links 404.
  ["morpho-fundraise-a16z-crypto-model-ribbit-capital", "morpho-fundraise-a16z-crypto-paradigm-ribbit-capital"],
  ["why-model-and-a16z-just-poured-175m-into-morpho", "why-paradigm-and-a16z-just-poured-175m-into-morpho"],

  // Morpho round, June 2026.
  ["$175M raised June 9, 2026 led by model, a16z crypto, Ribbit Capital", "$175M raised June 9, 2026 led by Paradigm, a16z crypto, Ribbit Capital"],
  ["raised $175M on June 9, 2026 from model, a16z, and Ribbit Capital", "raised $175M on June 9, 2026 from Paradigm, a16z, and Ribbit Capital"],
  ["$175M raise (largest DeFi ever) from model + a16z + Ribbit", "$175M raise (largest DeFi ever) from Paradigm + a16z + Ribbit"],
  ["$175M raise (Jun 9, 2026) from model/a16z/Ribbit", "$175M raise (Jun 9, 2026) from Paradigm/a16z/Ribbit"],
  ["$175M raise (Jun 9) at $2B from model/a16z/Ribbit", "$175M raise (Jun 9) at $2B from Paradigm/a16z/Ribbit"],
  ["$175M raise Jun 9 by model, a16z, Ribbit", "$175M raise Jun 9 by Paradigm, a16z, Ribbit"],
  ["$175M raise at $2B valuation (model, a16z)", "$175M raise at $2B valuation (Paradigm, a16z)"],
  ["$175M raised Jun 9 at $2B valuation (model, a16z)", "$175M raised Jun 9 at $2B valuation (Paradigm, a16z)"],
  ["Apollo + model could force governance vote", "Apollo + Paradigm could force governance vote"],

  // Commonware / Espresso style rounds.
  ["backed by model, Haun, and Dragonfly", "backed by Paradigm, Haun, and Dragonfly"],
  ["raised $34M from model, Haun Ventures, and Dragonfly", "raised $34M from Paradigm, Haun Ventures, and Dragonfly"],
  ["$34M raised from model, Haun Ventures, Dragonfly", "$34M raised from Paradigm, Haun Ventures, Dragonfly"],

  // Babylon.
  ["$103M+ from model, a16z, and Polychain", "$103M+ from Paradigm, a16z, and Polychain"],
  ["$103M+ total venture funding from model ($70M), a16z, Polychain, Binance Labs", "$103M+ total venture funding from Paradigm ($70M), a16z, Polychain, Binance Labs"],
  ["model ($70M lead), a16z", "Paradigm ($70M lead), a16z"],

  // Symbiotic, Synthetix, Blur, Parallel, Hyperliquid whale, Series B.
  ["$34.8M raised (model $5.8M seed, Pantera $29M Series A)", "$34.8M raised (Paradigm $5.8M seed, Pantera $29M Series A)"],
  ["model + Pantera backed restaking protocol", "Paradigm + Pantera backed restaking protocol"],
  ["Backed by model and co-founded by Lido founders", "Backed by Paradigm and co-founded by Lido founders"],
  ["backed by model and Lido founders", "backed by Paradigm and Lido founders"],
  ["PATRONS NFT fundraise ($50M from model, Spartan Group)", "PATRONS NFT fundraise ($50M from Paradigm, Spartan Group)"],
  ["model and other investors hold large locked positions", "Paradigm and other investors hold large locked positions"],
  ["Parallel TCG gaming token. Backed by model.", "Parallel TCG gaming token. Backed by Paradigm."],
  ["model holds 19.14M HYPE", "Paradigm holds 19.14M HYPE"],
  ["a16z $322M, model 19.14M HYPE", "a16z $322M, Paradigm 19.14M HYPE"],
  ["$165M Series B (2022) from Polychain, a16z, model.", "$165M Series B (2022) from Polychain, a16z, Paradigm."],
  ["\"model (venture partner)\"", "\"Paradigm (venture partner)\""],
  ["\"model\"", "\"Paradigm\""],
];

/** Applies every literal replacement. Returns the text and a per-rule count. */
function restore(text) {
  if (typeof text !== "string") throw new Error("text required");
  if (text.length === 0) throw new Error("text empty");
  let out = text;
  const counts = [];
  for (let i = 0; i < REPLACEMENTS.length && i < MAX_PASSES; i += 1) {
    const [from, to] = REPLACEMENTS[i];
    const parts = out.split(from);
    if (parts.length > 1) counts.push({ from, hits: parts.length - 1 });
    out = parts.join(to);
  }
  return { out, counts };
}

function main() {
  const dryRun = process.argv.includes("--dry");
  let grandTotal = 0;

  for (let t = 0; t < TARGETS.length; t += 1) {
    const path = TARGETS[t];
    const raw = readFileSync(path, "utf8");
    if (typeof raw !== "string" || raw.length === 0) throw new Error(`empty ${path}`);
    const { out, counts } = restore(raw);
    const total = counts.reduce((sum, c) => sum + c.hits, 0);
    grandTotal += total;

    process.stdout.write(`\n${path}\n`);
    for (let i = 0; i < counts.length; i += 1) {
      process.stdout.write(`  ${String(counts[i].hits).padStart(2)}x  ${counts[i].from.slice(0, 78)}\n`);
    }
    if (total === 0) process.stdout.write("  nothing to restore\n");

    // Round-trips through the parser so a bad edit cannot ship malformed JSON.
    JSON.parse(out);
    if (!dryRun && total > 0) writeFileSync(path, out, "utf8");
  }

  process.stdout.write(`\n${grandTotal} substitutions restored${dryRun ? " (dry run, nothing written)" : ""}\n`);
}

main();
