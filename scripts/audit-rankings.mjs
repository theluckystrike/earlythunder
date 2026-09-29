#!/usr/bin/env node
/**
 * audit-rankings.mjs — sprint validation: recompute every /rankings row
 * straight from data/scorecard-analytics.json and diff against
 * data/scorecard-rankings.json. Any mismatch, null-cap slot, or claim the
 * analytics file cannot reproduce is a finding. Exits non-zero on defects.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const A = JSON.parse(readFileSync(join(REPO, "data", "scorecard-analytics.json"), "utf8"));
const R = JSON.parse(readFileSync(join(REPO, "data", "scorecard-rankings.json"), "utf8"));

const bySym = new Map(A.tokens.map((t) => [t.symbol, t]));
const vmap = (t, key) => (t.variables || []).find((v) => v.key === key) || null;

/** Percentile as stored by the scorer (0-100). Falls back to recompute. */
const pct = (t, key) => {
  const v = vmap(t, key);
  if (!v) return null;
  if (Number.isFinite(v.percentile)) return v.percentile;
  const scores = A.tokens.map((x) => vmap(x, key)?.value).filter(Number.isFinite);
  const below = scores.filter((s) => s < v.value).length;
  return Math.round((below / scores.length) * 100);
};

/** Rounds to 2 places, null for unusable input. */
const round2 = (value) => (Number.isFinite(value) ? Math.round(value * 100) / 100 : null);

const findings = [];
const note = (kind, msg) => findings.push(`${kind}: ${msg}`);

for (const rk of R.rankings) {
  for (const m of rk.members) {
    const t = bySym.get(m.symbol);
    if (!t) { note("FATAL", `${rk.slug}: ${m.symbol} not in analytics`); continue; }
    const v = { supply_inflation: vmap(t, "supply_inflation"), buyback_burn: vmap(t, "buyback_burn"), ps_multiple: vmap(t, "ps_multiple") };
    const checks = [
      ["score", t.score, m.score],
      ["rank_overall", t.rank_overall, m.rank_overall],
      ["market_cap", t.market?.market_cap ?? null, m.market_cap],
      ["dilution_x", t.dilution?.dilution_x ?? null, m.dilution_x],
      ["drawdown_pct", t.drawdown?.from_ath_pct ?? t.drawdown?.drawdown_pct ?? null, m.drawdown_pct],
    ];
    if (rk.slug === "most-deflationary") checks.push(["supply_pct", pct(t, "supply_inflation"), m.supply_pct]);
    if (rk.slug === "net-supply-direction") {
      const bp = pct(t, "buyback_burn");
      const sp = pct(t, "supply_inflation");
      checks.push(["buyback_pct", bp, m.buyback_pct]);
      checks.push(["net_pct", round2(((bp ?? 0) + (sp ?? 0)) / 2), m.net_pct]);
    }
    if (rk.slug === "undervalued-ps") checks.push(["ps_pct", pct(t, "ps_multiple"), m.ps_pct]);
    for (const [field, want, got] of checks) {
      const w = want === null ? null : Math.round(want * 100) / 100;
      const g = got === null ? null : Math.round(got * 100) / 100;
      if (w !== g) note("MISMATCH", `${rk.slug}/${m.symbol}.${field}: rankings=${g} analytics=${w}`);
    }
    if (m.impaired && !t.weaknesses?.some?.((w) => typeof w === "string" && /impair/i.test(w)) && !/impair/i.test(t.one_liner || "")) {
      note("REVIEW", `${rk.slug}/${m.symbol}: impaired=true not traceable to weaknesses/one_liner`);
    }
  }
}

// Provenance stamps
if (!R.market_fetched_at) note("PROVENANCE", "market_fetched_at is null in scorecard-rankings.json");
if (!R.source_updated_at) note("PROVENANCE", "source_updated_at missing");
if (R.universe_size !== A.tokens.length) note("PROVENANCE", `universe_size ${R.universe_size} != analytics ${A.tokens.length}`);

console.log(`audited ${R.rankings.reduce((n, r) => n + r.members.length, 0)} rows across ${R.rankings.length} rankings`);
if (findings.length) {
  console.log(`FINDINGS (${findings.length}):`);
  for (const f of findings) console.log("  " + f);
  process.exit(1);
}
console.log("CLEAN: every ranking field reproduces from scorecard-analytics.json");
