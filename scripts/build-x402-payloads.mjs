// Regenerates the JSON snapshots served by the paid x402 API (functions/api/x402/v1/_*.json)
// from the canonical research data in data/. Run before `wrangler pages deploy` so the
// daily data refresh reaches the API without touching function code.
//
// SKU design (priced against the measured Bazaar catalog distribution, 2026-07-17):
//   scores        $0.01  teaser: ranked score+tier+one-liner for all assets
//   thesis/{slug} $0.25  the differentiated SKU: full cited deep-value thesis per asset
//   catalysts     $0.03  curated dated deadline/catalyst calendar with urgency + sources
//   scorecard     $0.05  251-token quant scorecard with methodology
//   earnings      $0.01  teaser: protocol earnings yields with risk ratings
import fs from "node:fs";

const score = JSON.parse(fs.readFileSync("data/altcoin-scorecard.json", "utf8"));
const opps = JSON.parse(fs.readFileSync("data/opportunities.json", "utf8"));
const deadlines = JSON.parse(fs.readFileSync("data/deadlines.json", "utf8"));
const earnings = JSON.parse(fs.readFileSync("data/earnings-top.json", "utf8"));

const ranked = [...opps].sort(
  (a, b) => (b.composite_score || 0) - (a.composite_score || 0),
);

// Drop deadlines already in the past; a paid calendar must not sell expired dates.
const today = new Date().toISOString().slice(0, 10);
const liveDeadlines = deadlines.filter(
  (d) => !d.end_date || d.end_date >= today,
);

const scores = ranked.map((o) => ({
  slug: o.slug,
  name: o.name,
  ticker: o.ticker,
  category: o.category,
  asset_class: o.asset_class,
  tier: o.tier,
  composite_score: o.composite_score,
  one_liner: o.one_liner,
}));

const theses = {};
for (const o of ranked) {
  theses[o.slug] = {
    slug: o.slug,
    name: o.name,
    ticker: o.ticker,
    category: o.category,
    asset_class: o.asset_class,
    tier: o.tier,
    composite_score: o.composite_score,
    one_liner: o.one_liner,
    thesis: o.thesis,
  };
}

const payloads = {
  scores: {
    updated_at: score.updated_at,
    generated_at: new Date().toISOString(),
    count: scores.length,
    source: "EarlyThunder Research, https://earlythunder.com/methodology",
    items: scores,
  },
  theses: {
    updated_at: score.updated_at,
    generated_at: new Date().toISOString(),
    count: ranked.length,
    source: "EarlyThunder Research, https://earlythunder.com/methodology",
    bySlug: theses,
  },
  catalysts: {
    updated_at: score.updated_at,
    generated_at: new Date().toISOString(),
    count: liveDeadlines.length,
    source: "EarlyThunder Research, https://earlythunder.com/deadlines",
    items: liveDeadlines,
  },
  scorecard: {
    updated_at: score.updated_at,
    generated_at: new Date().toISOString(),
    methodology: score.methodology,
    benchmark: score.benchmark,
    count: (score.tokens || []).length,
    tokens: score.tokens,
  },
  earnings: {
    updated_at: score.updated_at,
    generated_at: new Date().toISOString(),
    count: earnings.length,
    source: "EarlyThunder Research",
    items: earnings,
  },
};

for (const [name, value] of Object.entries(payloads)) {
  fs.writeFileSync(`functions/api/x402/v1/_${name}.json`, JSON.stringify(value));
  process.stdout.write(`${name}: ${Math.round(JSON.stringify(value).length / 1024)}KB\n`);
}
