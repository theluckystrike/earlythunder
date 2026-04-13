import type { Metadata } from "next";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";
import { SIGNAL_DETAILS, type SignalDetailData } from "@/lib/signal-details";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Early Thunder 8-Signal Pattern Filter works — our scoring, tier system, and analysis methodology explained.",
};

export default function MethodologyPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <PageHeader />
        <SignalFilterSection />
        <ScoringSection />
        <TierSystemSection />
        <ReadingGuide />
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="border-b border-border pb-8">
      <h1 className="font-display text-3xl sm:text-4xl">Methodology</h1>
      <p className="mt-4 text-lg leading-relaxed text-text-secondary">
        Early Thunder uses a systematic 8-Signal Pattern Filter to identify
        asymmetric opportunities before they reach mainstream awareness. Every
        opportunity is scored, tiered, and continuously monitored.
      </p>
    </div>
  );
}

function SignalFilterSection() {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl">The 8-Signal Pattern Filter</h2>
      <p className="mt-4 text-text-secondary">
        Each opportunity is evaluated across eight critical dimensions. Every
        signal is scored from 0 to 100, where higher scores indicate stronger
        conviction in that dimension.
      </p>
      <div className="mt-8 space-y-6">
        {SIGNAL_DETAILS.map((signal) => (
          <SignalDetail key={signal.key} signal={signal} />
        ))}
      </div>
    </section>
  );
}

function SignalDetail({ signal }: { readonly signal: SignalDetailData }) {
  const key = signal.key as keyof typeof SIGNAL_LABELS;
  const label = SIGNAL_LABELS[key] ?? signal.key;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/10 font-mono text-sm font-bold text-amber">
          {SIGNAL_KEYS.indexOf(key) + 1}
        </span>
        <h3 className="font-semibold text-text-primary">{label}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {signal.description}
      </p>
      <p className="mt-2 text-xs text-text-secondary">
        <span className="font-semibold text-data-blue">Example:</span>{" "}
        {signal.example}
      </p>
    </div>
  );
}

function ScoringSection() {
  return (
    <section className="mt-12 border-t border-border pt-12">
      <h2 className="font-display text-2xl">Composite Scoring</h2>
      <p className="mt-4 text-text-secondary">
        The composite score is a weighted aggregation of all eight signals,
        accounting for signal interactions and asset-class-specific adjustments.
        Scores range from 0 to 100.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <ScoreRange range="80-100" label="Exceptional" color="text-success" description="Strongest conviction, rare setup." />
        <ScoreRange range="60-79" label="Strong" color="text-amber" description="Compelling but with caveats." />
        <ScoreRange range="40-59" label="Moderate" color="text-warning" description="Interesting but incomplete pattern." />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ScoreRange range="20-39" label="Weak" color="text-danger" description="Missing critical signals." />
        <ScoreRange range="0-19" label="Avoid" color="text-danger" description="Failed or abandoned. Graveyard candidate." />
        <div />
      </div>
    </section>
  );
}

function ScoreRange({
  range, label, color, description,
}: {
  readonly range: string;
  readonly label: string;
  readonly color: string;
  readonly description: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className={`font-mono text-lg font-bold ${color}`}>{range}</div>
      <div className="mt-1 text-sm font-semibold text-text-primary">{label}</div>
      <div className="mt-1 text-xs text-text-secondary">{description}</div>
    </div>
  );
}

function TierSystemSection() {
  return (
    <section className="mt-12 border-t border-border pt-12">
      <h2 className="font-display text-2xl">Tier System</h2>
      <p className="mt-4 text-text-secondary">
        Opportunities are classified into three tiers based on overall
        conviction, risk profile, and pattern completeness.
      </p>
      <div className="mt-6 space-y-4">
        <TierDetail tier={1} label="Tier 1 — Highest Conviction" color="border-success/30 bg-success/5" description="Complete or near-complete signal pattern. Strong across most dimensions. These are the opportunities we believe have the highest probability of asymmetric returns." />
        <TierDetail tier={2} label="Tier 2 — Strong Setup" color="border-amber/30 bg-amber/5" description="Compelling signal profile with some gaps. May be missing one or two critical signals but shows strong potential. Worth active monitoring and potential position building." />
        <TierDetail tier={3} label="Tier 3 — Speculative" color="border-danger/30 bg-danger/5" description="Incomplete pattern with significant unknowns. May represent very early opportunities or those with elevated risk. Requires higher risk tolerance and smaller position sizing." />
      </div>
    </section>
  );
}

function TierDetail({
  tier, label, color, description,
}: {
  readonly tier: number;
  readonly label: string;
  readonly color: string;
  readonly description: string;
}) {
  if (tier < 1 || tier > 3) return null;
  return (
    <div className={`rounded-xl border p-6 ${color}`}>
      <h3 className="font-semibold text-text-primary">{label}</h3>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function ReadingGuide() {
  return (
    <section className="mt-12 border-t border-border pt-12">
      <h2 className="font-display text-2xl">How to Read Opportunity Pages</h2>
      <div className="mt-6 space-y-4">
        <GuideStep step="1" title="Free Section" description="Every opportunity page shows the name, ticker, asset class, tier badge, composite score, and one-liner summary for free. This gives you enough context to decide if the opportunity warrants deeper analysis." />
        <GuideStep step="2" title="Premium Section" description="Behind the paywall, you get the full thesis, signal radar chart, detailed signal breakdown scores, catalysts, risks, and related opportunities. This is the deep intelligence layer." />
        <GuideStep step="3" title="Signal Radar" description="The radar chart provides an instant visual of the opportunity's signal profile. Look for balanced, high-scoring shapes (strong across all dimensions) versus spiky profiles (strong in some areas, weak in others)." />
        <GuideStep step="4" title="Catalysts & Risks" description="These sections provide specific, actionable intelligence about what could drive the opportunity higher (catalysts) and what could cause it to fail (risks). Always read both." />
      </div>
    </section>
  );
}

function GuideStep({
  step, title, description,
}: {
  readonly step: string;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-data-blue/10 font-mono text-sm font-bold text-data-blue">
        {step}
      </span>
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
