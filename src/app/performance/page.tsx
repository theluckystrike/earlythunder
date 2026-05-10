import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Performance",
  description:
    "Track record and performance metrics of the 1000x Discovery System. Signal history, pipeline stats, and methodology.",
  openGraph: {
    title: "Performance | Early Thunder",
    description:
      "Track record and performance metrics of the 1000x Discovery System.",
    url: "https://earlythunder.com/performance",
  },
  alternates: {
    canonical: "https://earlythunder.com/performance",
  },
};

export default function PerformancePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader />
      <SystemOverview />
      <SignalHistory />
      <PipelineStats />
      <MethodologySection />
      <CtaSection />
      <ExploreMoreSection />
    </div>
  );
}

/* ---------- Page Header ---------- */

function PageHeader() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        Performance
      </h1>
      <p className="mt-4 max-w-2xl text-xl text-text-secondary">
        Track record of the 1000x Discovery System. Every signal investigated,
        every verdict rendered, every metric tracked.
      </p>
    </div>
  );
}

/* ---------- Section 1: System Overview ---------- */

function SystemOverview() {
  return (
    <section className="mt-16">
      <SectionLabel number="01" title="The 1000x Discovery System" />
      <p className="mt-4 max-w-3xl leading-relaxed text-text-secondary">
        An automated 4-scanner pipeline that monitors new contract deployments,
        VC wallet movements, elite developer migrations, and DEX liquidity
        events in real-time. Signals from each dimension are cross-referenced
        and scored to produce a composite conviction rating. The system is
        designed to find tokens at Phase 0-1 &mdash; before they appear on
        CoinGecko or major exchanges.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScoreCard
          range="3 &ndash; 5"
          tier="MONITOR"
          color="text-score-mid"
          description="Meets minimum thresholds in at least one dimension. Worth tracking but not actionable yet."
        />
        <ScoreCard
          range="6 &ndash; 8"
          tier="INVESTIGATE"
          color="text-score-mid"
          description="Multiple dimensions firing. Requires deep-dive research to determine if conviction is warranted."
        />
        <ScoreCard
          range="9 &ndash; 12"
          tier="HIGH CONVICTION"
          color="text-score-high"
          description="Strong signals across most or all dimensions. Rare. The pipeline was built to surface exactly these."
        />
      </div>
    </section>
  );
}

function ScoreCard({
  range,
  tier,
  color,
  description,
}: {
  readonly range: string;
  readonly tier: string;
  readonly color: string;
  readonly description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6">
      <div
        className={`font-mono text-2xl font-bold ${color}`}
        dangerouslySetInnerHTML={{ __html: range }}
      />
      <div className="mt-1 font-mono text-xs tracking-widest text-text-tertiary">
        {tier}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}

/* ---------- Section 2: Signal History ---------- */

const SIGNALS = [
  {
    name: "EkuboProtocol",
    date: "2026-05-07",
    category: "DeFi / DEX",
    score: "DEEP ALPHA",
    verdict: "Active Monitoring",
    status: "First real discovery. Uniswap v3/v4 chief engineer building superior DEX on StarkNet + EVM.",
    badgeColor: "bg-score-high/15 text-score-high border-score-high/30",
  },
  {
    name: "soothsayer",
    date: "2026-05-07",
    category: "Memecoin",
    score: "3/12 MONITOR",
    verdict: "NOISE",
    status: "Pump.fun token with no fundamentals. Discarded.",
    badgeColor: "bg-score-low/15 text-score-low border-score-low/30",
  },
  {
    name: "obscuren/astra",
    date: "2026-05-07",
    category: "N/A",
    score: "N/A",
    verdict: "NOISE",
    status: "Video game project. Not a crypto protocol.",
    badgeColor: "bg-score-low/15 text-score-low border-score-low/30",
  },
  {
    name: "dark-bio / Ark I",
    date: "2026-05-07",
    category: "Hardware",
    score: "N/A",
    verdict: "WATCH",
    status: "Pre-launch hardware. Go-ethereum dev (karalabe) involved. Monitoring.",
    badgeColor: "bg-[#4fc3f7]/15 text-[#4fc3f7] border-[#4fc3f7]/30",
  },
  {
    name: "latent-to/bittensor",
    date: "2026-05-07",
    category: "Infra",
    score: "N/A",
    verdict: "NOISE",
    status: "Existing ecosystem. Already priced in.",
    badgeColor: "bg-score-low/15 text-score-low border-score-low/30",
  },
] as const;

function SignalHistory() {
  return (
    <section className="mt-20">
      <SectionLabel number="02" title="Signal History" />
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">
        Every signal the pipeline has surfaced, investigated, and classified.
        Transparency is non-negotiable &mdash; noise and failures are shown
        alongside alpha.
      </p>

      {/* Desktop table */}
      <div className="mt-8 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-text-tertiary">
              <th className="pb-3 pr-4 font-medium">Signal</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">Category</th>
              <th className="pb-3 pr-4 font-medium">Score</th>
              <th className="pb-3 pr-4 font-medium">Verdict</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {SIGNALS.map((signal) => (
              <tr
                key={signal.name}
                className="border-b border-border/50 transition-colors hover:bg-bg-card"
              >
                <td className="py-3 pr-4 font-medium text-text-primary">
                  {signal.name}
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-text-tertiary">
                  {signal.date}
                </td>
                <td className="py-3 pr-4 text-text-secondary">
                  {signal.category}
                </td>
                <td className="py-3 pr-4 font-mono text-xs text-score-mid">
                  {signal.score}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${signal.badgeColor}`}
                  >
                    {signal.verdict}
                  </span>
                </td>
                <td className="max-w-xs py-3 text-xs text-text-secondary">
                  {signal.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-8 space-y-4 md:hidden">
        {SIGNALS.map((signal) => (
          <div
            key={signal.name}
            className="rounded-2xl border border-border bg-bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="font-medium text-text-primary">{signal.name}</div>
              <span
                className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${signal.badgeColor}`}
              >
                {signal.verdict}
              </span>
            </div>
            <div className="mt-2 flex gap-4 font-mono text-xs text-text-tertiary">
              <span>{signal.date}</span>
              <span>{signal.category}</span>
              <span>{signal.score}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {signal.status}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Section 3: Pipeline Stats ---------- */

const STATS = [
  { value: "6", label: "Sessions Run" },
  { value: "5", label: "Signals Investigated" },
  { value: "1", label: "Deep Alpha Found" },
  { value: "161", label: "Elite Devs Tracked" },
  { value: "17", label: "Organizations Monitored" },
  { value: "3/6", label: "Scanners Operational" },
] as const;

function PipelineStats() {
  return (
    <section className="mt-20">
      <SectionLabel number="03" title="Pipeline Statistics" />

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-bg-card p-6 text-center"
          >
            <div className="font-mono text-3xl font-bold text-score-mid">
              {stat.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-text-tertiary">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Scanner Status
        </h3>
        <div className="mt-4 space-y-3">
          <ScannerStatus
            name="DEX Scanner"
            status="OPERATIONAL"
            statusColor="text-score-high"
            note="No API key required. Scans DexScreener for new pairs."
          />
          <ScannerStatus
            name="Developer Tracker"
            status="OPERATIONAL"
            statusColor="text-score-high"
            note="Works without token (rate-limited). GITHUB_TOKEN expands to 20 orgs."
          />
          <ScannerStatus
            name="Cross-Reference Engine"
            status="OPERATIONAL"
            statusColor="text-score-high"
            note="Correlates signals across all dimensions. Produces composite scores."
          />
          <ScannerStatus
            name="Contract Scanner (ETH)"
            status="NEEDS KEY"
            statusColor="text-score-low"
            note="Requires ETHERSCAN_API_KEY (free tier available)."
          />
          <ScannerStatus
            name="Contract Scanner (Base)"
            status="NEEDS KEY"
            statusColor="text-score-low"
            note="Requires BASESCAN_API_KEY."
          />
          <ScannerStatus
            name="VC Wallet Tracker"
            status="NEEDS KEY"
            statusColor="text-score-low"
            note="Requires ETHERSCAN_API_KEY + wallet address list from Arkham."
          />
        </div>
      </div>
    </section>
  );
}

function ScannerStatus({
  name,
  status,
  statusColor,
  note,
}: {
  readonly name: string;
  readonly status: string;
  readonly statusColor: string;
  readonly note: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-sm font-medium text-text-primary">{name}</span>
        <span className="ml-2 text-xs text-text-secondary">{note}</span>
      </div>
      <span
        className={`font-mono text-xs font-bold uppercase tracking-wider ${statusColor}`}
      >
        {status}
      </span>
    </div>
  );
}

/* ---------- Section 4: Methodology ---------- */

const SCANNER_DETAILS = [
  {
    number: "01",
    name: "Contract Scanner",
    description:
      "Monitors Ethereum and Base for newly deployed contracts. Filters by bytecode patterns, constructor arguments, and deployer history to identify potential DeFi protocols, token launches, and novel primitives before any public announcement.",
  },
  {
    number: "02",
    name: "VC Wallet Tracker",
    description:
      "Tracks on-chain movements of known venture capital wallets (a16z, Paradigm, Polychain, etc.). When smart money accumulates a position, the signal fires. On-chain data cannot be fabricated.",
  },
  {
    number: "03",
    name: "Developer Migration Tracker",
    description:
      "Monitors GitHub activity of 161 elite developers across 17 organizations (Uniswap, Aave, Compound, etc.). When a proven builder starts committing to a new project, that is the strongest leading indicator in crypto.",
  },
  {
    number: "04",
    name: "DEX Liquidity Scanner",
    description:
      "Scans DexScreener for new trading pairs. Filters by liquidity depth, buy/sell ratio, holder distribution, and volume patterns. Separates legitimate launches from pump-and-dump schemes using 9 quantitative metrics.",
  },
] as const;

function MethodologySection() {
  return (
    <section className="mt-20">
      <SectionLabel number="04" title="Methodology" />
      <p className="mt-4 max-w-3xl leading-relaxed text-text-secondary">
        The system follows one principle:{" "}
        <span className="font-medium text-text-primary">
          follow the money that cannot lie
        </span>
        . On-chain transactions, GitHub commits, and liquidity pool events are
        objective, timestamped, and immutable. Unlike social media sentiment or
        influencer calls, these signals cannot be faked at scale.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {SCANNER_DETAILS.map((scanner) => (
          <div
            key={scanner.name}
            className="rounded-2xl border border-border bg-bg-card p-6"
          >
            <span className="font-mono text-sm text-text-tertiary">
              {scanner.number}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-text-primary">
              {scanner.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {scanner.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary">
          Cross-Reference Scoring
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Each scanner produces a dimension score from 0 to 3. The composite
          score (0&ndash;12) is the sum of all four dimensions. A token that
          only appears in DEX data scores low. A token deployed by a known VC
          wallet, built by an elite developer, with organic DEX liquidity
          growing &mdash; that scores high. The cross-reference engine runs
          after all scanners complete and produces the final watchlist ranked by
          composite conviction.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-score-mid/30 bg-score-mid/5 p-6">
        <p className="text-sm leading-relaxed text-score-mid">
          <span className="font-semibold">What makes a signal actionable?</span>{" "}
          Multiple independent dimensions must confirm. A developer migration
          alone is interesting. A developer migration plus VC accumulation plus
          a new DEX pair with healthy metrics &mdash; that is actionable. The
          system is designed to produce very few signals, but when it fires,
          conviction should be high.
        </p>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */

function CtaSection() {
  return (
    <section className="mt-20 text-center">
      <h2 className="text-2xl font-semibold tracking-tighter text-text-primary">
        Explore the pipeline
      </h2>
      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/discoveries"
          className="rounded-full bg-text-primary px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          View discoveries &rarr;
        </Link>
        <Link
          href="/methodology"
          className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          Full methodology
        </Link>
      </div>
    </section>
  );
}

/* ---------- Explore More ---------- */

function ExploreMoreSection() {
  return (
    <section className="mt-16 border-t border-border pt-8">
      <h3 className="text-sm font-mono uppercase tracking-wider text-text-secondary mb-4">
        Explore More
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/methodology"
          className="block p-4 rounded-lg border border-border hover:border-accent transition-colors"
        >
          <span className="text-sm font-semibold text-text-primary">Methodology</span>
          <span className="text-xs text-text-secondary mt-1 block">Full scoring framework and signal weights</span>
        </Link>
        <a
          href="/intelligence/"
          className="block p-4 rounded-lg border border-border hover:border-accent transition-colors"
        >
          <span className="text-sm font-semibold text-text-primary">Intelligence Dashboard</span>
          <span className="text-xs text-text-secondary mt-1 block">Live convergence signals</span>
        </a>
        <a
          href="/research/"
          className="block p-4 rounded-lg border border-border hover:border-accent transition-colors"
        >
          <span className="text-sm font-semibold text-text-primary">Research Library</span>
          <span className="text-xs text-text-secondary mt-1 block">Deep-dive analyses and market reports</span>
        </a>
      </div>
    </section>
  );
}

/* ---------- Shared Components ---------- */

function SectionLabel({
  number,
  title,
}: {
  readonly number: string;
  readonly title: string;
}) {
  return (
    <div>
      <span className="font-mono text-sm text-text-tertiary">{number}</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
    </div>
  );
}
