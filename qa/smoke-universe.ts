// Dev instrument. Runs the shared build time loaders outside Next.
// `server-only` is a bundler alias inside Next and is not a real package, so
// running this under tsx needs a local no-op stub:
//   mkdir -p node_modules/server-only
//   printf 'module.exports = {};' > node_modules/server-only/index.js
//   printf '{"name":"server-only","version":"0.0.0-local","main":"index.js"}' > node_modules/server-only/package.json
// node_modules is gitignored, so the stub never reaches a build or a deploy.

import { getMarketUniverse } from "../src/lib/market-universe";
import { getYieldSnapshot } from "../src/lib/staking-yields";

async function main() {
  const u = await getMarketUniverse();
  console.log("UNIVERSE fetchedAt", u.fetchedAt, "rows", u.rows.length,
    "stablecoins", u.stablecoinCount, "crossChecked", u.crossCheckedCount,
    "worstSpread%", u.worstPriceSpreadPercent.toFixed(3));
  console.log("BTC", u.bitcoin.price, "30d", u.bitcoin.change30d, "1y", u.bitcoin.change1y, "ath", u.bitcoin.allTimeHigh, u.bitcoin.allTimeHighDate);
  const nonStable = u.rows.filter(r => !r.isStablecoin);
  console.log("nonStable", nonStable.length, "with30d", nonStable.filter(r=>r.change30d!==null).length,
    "with200d", nonStable.filter(r=>r.change200d!==null).length, "with1y", nonStable.filter(r=>r.change1y!==null).length);
  const top50 = nonStable.slice(0,50);
  const beat30 = top50.filter(r => r.change30d !== null && u.bitcoin.change30d !== null && r.change30d > u.bitcoin.change30d).length;
  console.log("top50 non-stable beating BTC over 30d:", beat30, "index", Math.round(beat30/top50.length*100));
  const y = await getYieldSnapshot();
  console.log("YIELD fetchedAt", y.fetchedAt, "totalPools", y.totalPools, "kept", y.keptPools);
  for (const r of y.rows.slice(0,5)) console.log("  ", r.project, r.chain, r.symbol, "apy", r.apy, "tvl", Math.round(r.tvlUsd/1e6)+"M", r.exposure, r.ilRisk);
}
main().catch(e => { console.error("FAIL", e); process.exit(1); });
