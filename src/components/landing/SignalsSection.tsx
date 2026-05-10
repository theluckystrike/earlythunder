/* SignalsExplainer — 8-signal methodology grid. Server Component. */

import Link from "next/link";

/* ─── Data ─── */

interface Signal {
  readonly n: string;
  readonly name: string;
  readonly desc: string;
  readonly source: string;
}

const SIGNALS: readonly Signal[] = [
  { n: "01", name: "Toy Phase", desc: "Pre-hype asymmetry", source: "Github stars x Discord growth, < 10k DAU window" },
  { n: "02", name: "Working Code", desc: "Deployed technology", source: "Mainnet TVL >= $10M sustained 30d" },
  { n: "03", name: "Community", desc: "Organic user growth", source: "Twitter velocity / paid CPI < 0.4" },
  { n: "04", name: "Dev Activity", desc: "Active contributors", source: "GH commits 30d / 30 unique authors" },
  { n: "05", name: "Smart Money", desc: "Capital inflows", source: "Nansen smart wallets net flow 14d" },
  { n: "06", name: "Narrative", desc: "Viral story potential", source: "Tier-1 founder mentions, mindshare delta" },
  { n: "07", name: "Earnings Yield", desc: "Revenue vs market cap", source: "Annualized fees / FDV >= 25%" },
  { n: "08", name: "Catalyst", desc: "Near-term triggers", source: "Token unlock, mainnet, governance vote" },
] as const;

/* ─── SignalCell ─── */

function SignalCell({ signal }: { readonly signal: Signal }) {
  return (
    <div className="signal">
      <div className="signal__top">
        <span className="signal__n mono">{signal.n}</span>
        <span className="signal__weight mono">12.5%</span>
      </div>
      <div className="signal__name">{signal.name}</div>
      <div className="signal__desc t-sec">{signal.desc}</div>
      <div className="signal__source mono">
        <span className="signal__source-label">SOURCE</span>
        {signal.source}
      </div>
    </div>
  );
}

/* ─── Main Export ─── */

export default function SignalsSection() {
  return (
    <section className="signals-section">
      <div className="section__head">
        <div>
          <div className="section__eyebrow mono">05 &mdash; METHODOLOGY</div>
          <h2 className="section__title">How we score: 8 signals</h2>
          <p className="section__sub">
            Every opportunity is scored across 8 dimensions, equally weighted at
            12.5%. Combined score determines conviction.
          </p>
        </div>
        <Link className="ghost-btn" href="/methodology">Read full methodology <span className="arr">&rarr;</span></Link>
      </div>
      <div className="signals">
        {SIGNALS.map((s) => (
          <SignalCell key={s.n} signal={s} />
        ))}
      </div>
    </section>
  );
}
