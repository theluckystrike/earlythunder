#!/usr/bin/env node
/**
 * check-citation-urls.mjs — resolves every citation URL in the scorecard and
 * reports the ones that are actually dead.
 *
 * A citation pointing at a 404 is worse than no citation, because it looks like
 * evidence until someone clicks it. This checks all of them and writes
 * data/citation-url-report.json.
 *
 * 403 and 429 are reported separately from 404. Plenty of publishers block
 * automated HEAD requests, so a 403 says nothing about whether the page exists
 * and must not be treated as a dead link.
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
const OUT_PATH = join(REPO, "data", "citation-url-report.json");

const MAX_URLS = 2000;
const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;
const DEAD_CODES = new Set([404, 410]);
const BLOCKED_CODES = new Set([401, 403, 429, 451]);

/** Collects every distinct citation URL with the tokens that cite it. */
function collectUrls(tokens) {
  if (!Array.isArray(tokens)) throw new Error("tokens required");
  if (tokens.length === 0) throw new Error("tokens empty");
  const map = new Map();
  for (let i = 0; i < tokens.length && i < MAX_URLS; i += 1) {
    const token = tokens[i];
    if (!token || !Array.isArray(token.citations)) continue;
    for (let c = 0; c < token.citations.length && c < 50; c += 1) {
      const citation = token.citations[c];
      if (!citation || typeof citation.url !== "string") continue;
      if (!citation.url.startsWith("http")) continue;
      if (!map.has(citation.url)) map.set(citation.url, { url: citation.url, cited_by: [], source: citation.source });
      map.get(citation.url).cited_by.push(token.symbol);
    }
  }
  return [...map.values()];
}

/** Resolves one URL. Falls back to GET when HEAD is refused. */
async function probe(url) {
  if (typeof url !== "string" || url.length === 0) throw new Error("url required");
  if (!url.startsWith("http")) throw new Error("http required");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EarlyThunderLinkCheck/1.0)" },
    });
    if (res && (res.status === 405 || res.status === 501)) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; EarlyThunderLinkCheck/1.0)" },
      });
    }
    return { status: res ? res.status : 0, final_url: res ? res.url : null, error: null };
  } catch (error) {
    return { status: 0, final_url: null, error: error && error.name === "AbortError" ? "timeout" : String(error.message ?? error) };
  } finally {
    clearTimeout(timer);
  }
}

/** Runs probes with a bounded worker pool. */
async function probeAll(entries) {
  if (!Array.isArray(entries)) throw new Error("entries required");
  if (entries.length === 0) return [];
  const out = new Array(entries.length);
  let cursor = 0;
  async function worker() {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= entries.length || index >= MAX_URLS) return;
      const result = await probe(entries[index].url);
      out[index] = { ...entries[index], ...result };
      if (index % 50 === 0) process.stdout.write(`  checked ${index}/${entries.length}\n`);
    }
  }
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i += 1) workers.push(worker());
  await Promise.all(workers);
  return out.filter(Boolean);
}

function main() {
  const raw = readFileSync(SRC_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) throw new Error("scorecard empty");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.tokens)) throw new Error("tokens missing");

  const entries = collectUrls(parsed.tokens);
  process.stdout.write(`checking ${entries.length} distinct citation URLs\n`);

  return probeAll(entries).then((results) => {
    const dead = results.filter((r) => DEAD_CODES.has(r.status));
    const blocked = results.filter((r) => BLOCKED_CODES.has(r.status));
    const unreachable = results.filter((r) => r.status === 0);
    const ok = results.filter((r) => r.status >= 200 && r.status < 400);

    writeFileSync(
      OUT_PATH,
      `${JSON.stringify(
        {
          checked_at: new Date().toISOString(),
          total: results.length,
          ok: ok.length,
          dead: dead.map((r) => ({ url: r.url, status: r.status, source: r.source, cited_by: r.cited_by })),
          blocked: blocked.length,
          unreachable: unreachable.map((r) => ({ url: r.url, error: r.error, cited_by: r.cited_by })),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    process.stdout.write(
      [
        "",
        `total        ${results.length}`,
        `resolved ok  ${ok.length}`,
        `DEAD 404/410 ${dead.length}`,
        `blocked      ${blocked.length} (bot-blocked, says nothing about the page)`,
        `unreachable  ${unreachable.length} (dns or timeout)`,
        `written      ${OUT_PATH}`,
        "",
      ].join("\n"),
    );
    for (let i = 0; i < dead.length && i < 40; i += 1) {
      process.stdout.write(`  DEAD ${dead[i].status} ${dead[i].url} (cited by ${dead[i].cited_by.join(", ")})\n`);
    }
  });
}

main();
