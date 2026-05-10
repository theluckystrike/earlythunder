import type { Metadata } from "next";
import { SIGNAL_LABELS } from "@/lib/types";
import { SIGNAL_DETAILS, type SignalDetailData } from "@/lib/signal-details";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Early Thunder 8-Signal Pattern Filter works. Scoring, signals, and analysis methodology.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader />
      <SignalList />
      <SeeItInActionSection />
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-5xl font-semibold tracking-tighter text-text-primary">
        Methodology
      </h1>
      <p className="mt-6 max-w-3xl text-xl leading-relaxed text-text-secondary">
        Early Thunder uses a systematic 8-Signal Pattern Filter combining six
        quality signals with two asymmetry signals to identify opportunities
        before they reach mainstream awareness. Quality measures whether it is
        real. Asymmetry measures whether it is still early enough. Every
        opportunity is scored, tiered, and continuously monitored.
      </p>
    </div>
  );
}

function SignalList() {
  return (
    <div>
      {SIGNAL_DETAILS.map((signal, index) => (
        <SignalSection key={signal.key} signal={signal} index={index} />
      ))}
    </div>
  );
}

function SignalSection({
  signal,
  index,
}: {
  readonly signal: SignalDetailData;
  readonly index: number;
}) {
  const key = signal.key as keyof typeof SIGNAL_LABELS;
  const label = SIGNAL_LABELS[key] ?? signal.key;
  const number = String(index + 1).padStart(2, "0");
  const weight = getSignalWeight(index);

  return (
    <section className="mt-16">
      <span className="font-mono text-sm text-text-tertiary">{number}</span>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
        {label}
      </h2>
      <span className="font-mono text-sm text-text-tertiary">
        {weight} weight
      </span>
      <p className="mt-4 max-w-3xl leading-relaxed text-text-secondary">
        {signal.description}
      </p>
    </section>
  );
}

function getSignalWeight(index: number): string {
  const weights = ["20%", "15%", "10%", "10%", "15%", "5%", "15%", "10%"];
  return weights[index] ?? "12.5%";
}

function SeeItInActionSection() {
  return (
    <section className="mt-20 border-t border-border pt-8">
      <h3 className="text-sm font-mono uppercase tracking-wider text-text-tertiary mb-4">
        See It in Action
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="/intelligence/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
        >
          Intelligence Dashboard
          <span className="block mt-1 font-normal text-text-secondary">
            Watch the 8-signal filter score live opportunities
          </span>
        </a>
        <a
          href="/deadlines/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
        >
          Deadline Tracker
          <span className="block mt-1 font-normal text-text-secondary">
            Time-sensitive catalysts and regulatory dates
          </span>
        </a>
        <a
          href="/earnings/"
          className="rounded-2xl border border-border bg-bg-card p-6 text-sm font-semibold text-text-primary transition-colors hover:border-border-hover"
        >
          Earnings Scanner
          <span className="block mt-1 font-normal text-text-secondary">
            Upcoming earnings across tracked equities
          </span>
        </a>
      </div>
    </section>
  );
}
