// Dev instrument. Runs the shared build time loaders outside Next.
// `server-only` is a bundler alias inside Next and is not a real package, so
// running this under tsx needs a local no-op stub:
//   mkdir -p node_modules/server-only
//   printf 'module.exports = {};' > node_modules/server-only/index.js
//   printf '{"name":"server-only","version":"0.0.0-local","main":"index.js"}' > node_modules/server-only/package.json
// node_modules is gitignored, so the stub never reaches a build or a deploy.

import { getMarketUniverse } from "../src/lib/market-universe";
import { computeSeasonIndex, computeFundamentalsSplit, readScorecardScores, buildDepthCurve } from "../src/lib/altcoin-season";
import scorecardFile from "../data/altcoin-scorecard.json";

async function main() {
  const u = await getMarketUniverse();
  const scores = readScorecardScores(scorecardFile);
  console.log("scorecard symbols:", scores.size);
  for (const w of ["24h","7d","30d","200d","1y"] as const) {
    const idx = computeSeasonIndex(u.rows, u.bitcoin, w, 50);
    console.log(`window ${w.padEnd(5)} depth50 index=${idx ? idx.value : "null"} beat=${idx?.beat}/${idx?.comparable} band=${idx?.band}`);
  }
  console.log("\ndepth curve, 30d:");
  for (const p of buildDepthCurve(u.rows, u.bitcoin, "30d")) {
    console.log("  depth", String(p.depth).padStart(3), "index", p.index ? p.index.value : "null", "comparable", p.index?.comparable ?? 0);
  }
  console.log("\nfundamentals split, 30d:");
  for (const d of [50,100,200]) {
    const s = computeFundamentalsSplit(u.rows, u.bitcoin, "30d", d, scores);
    console.log(`  depth ${String(d).padStart(3)} matched=${s.matched} halfSize=${s.halfSize} median=${s.medianScore} meaningful=${s.meaningful} above=${s.aboveMedian?.value ?? "null"} below=${s.belowMedian?.value ?? "null"}`);
  }
}
main().catch(e => { console.error("FAIL", e); process.exit(1); });
