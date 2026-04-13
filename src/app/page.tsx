import { getActiveOpportunities } from "@/lib/data";
import Ticker from "@/components/Ticker";
import OpportunityCard from "@/components/OpportunityCard";
import EmailCapture from "@/components/EmailCapture";

const TOP_OPPORTUNITIES_COUNT = 6;

export default function HomePage() {
  const opportunities = getActiveOpportunities();
  const topOpportunities = opportunities.slice(0, TOP_OPPORTUNITIES_COUNT);

  return (
    <>
      <Ticker opportunities={opportunities} />
      <HeroSection />
      <FeaturedGrid opportunities={topOpportunities} />
      <HowItWorks />
      <MetricsSection />
      <CTASection />
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,166,35,0.08)_0%,_transparent_60%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Hear the storm{" "}
          <span className="text-amber">before anyone else</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
          Early Thunder surfaces pre-mainstream asymmetric opportunities using
          our 8-Signal Pattern Filter. We track digital assets, public equities,
          and private markets — so you see the signal before it becomes noise.
        </p>
        <div className="mt-10">
          <EmailCapture />
        </div>
        <p className="mt-4 text-xs text-text-secondary">
          Free tier available. No credit card required.
        </p>
      </div>
    </section>
  );
}

function FeaturedGrid({
  opportunities,
}: {
  readonly opportunities: ReturnType<typeof getActiveOpportunities>;
}) {
  if (!Array.isArray(opportunities) || opportunities.length === 0) return null;

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl">
            Top Opportunities
          </h2>
          <p className="mt-2 text-text-secondary">
            Highest-scoring active opportunities across all asset classes
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.slug} opportunity={opp} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-border bg-surface/50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="font-display text-3xl">
            The 8-Signal Pattern Filter
          </h2>
          <p className="mt-2 text-text-secondary">
            Every opportunity passes through eight critical dimensions
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SIGNALS.map((signal) => (
            <SignalCard
              key={signal.name}
              name={signal.name}
              description={signal.description}
              icon={signal.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const SIGNALS = [
  { name: "Toy Phase", description: "Still dismissed by incumbents — maximum asymmetry window.", icon: "1" },
  { name: "Working Code", description: "Deployed, functional technology — not vaporware.", icon: "2" },
  { name: "Community", description: "Organic growth of genuine users and advocates.", icon: "3" },
  { name: "Dev Activity", description: "Active development with contributor diversity.", icon: "4" },
  { name: "Smart Money", description: "Sophisticated capital flowing before the crowd.", icon: "5" },
  { name: "Narrative", description: "Compelling story that spreads virally.", icon: "6" },
  { name: "Hard to Buy", description: "Friction creates opportunity for the diligent.", icon: "7" },
  { name: "Catalyst", description: "Identifiable near-term events to unlock value.", icon: "8" },
] as const;

function SignalCard({
  name,
  description,
  icon,
}: {
  readonly name: string;
  readonly description: string;
  readonly icon: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/10 font-mono text-sm font-bold text-amber">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-text-primary">{name}</h3>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
    </div>
  );
}

function MetricsSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-8 sm:grid-cols-4">
          {METRICS.map((m) => (
            <MetricCard key={m.label} value={m.value} label={m.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

const METRICS = [
  { value: "150+", label: "Opportunities Tracked" },
  { value: "8", label: "Signal Dimensions" },
  { value: "3", label: "Asset Classes" },
  { value: "24/7", label: "Automated Monitoring" },
] as const;

function MetricCard({
  value,
  label,
}: {
  readonly value: string;
  readonly label: string;
}) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl font-bold text-amber">{value}</div>
      <div className="mt-1 text-sm text-text-secondary">{label}</div>
    </div>
  );
}

function CTASection() {
  return (
    <section className="border-t border-border bg-surface/50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl">
          Start tracking the{" "}
          <span className="text-amber">early signals</span>
        </h2>
        <p className="mt-4 text-text-secondary">
          Join Early Thunder and get access to our full opportunity database,
          signal analysis, and research reports.
        </p>
        <div className="mt-8">
          <EmailCapture />
        </div>
      </div>
    </section>
  );
}
