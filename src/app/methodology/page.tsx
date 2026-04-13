import type { Metadata } from "next";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";
import { SIGNAL_DETAILS, type SignalDetailData } from "@/lib/signal-details";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Early Thunder 8-Signal Pattern Filter works — scoring, signals, and analysis methodology.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader />
      <SignalList />
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
        Early Thunder uses a systematic 8-Signal Pattern Filter to identify
        asymmetric opportunities before they reach mainstream awareness. Every
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
        Weight: {weight}
      </span>
      <p className="mt-4 max-w-3xl leading-relaxed text-text-secondary">
        {signal.description}
      </p>
    </section>
  );
}

function getSignalWeight(index: number): string {
  const weights = ["15%", "15%", "10%", "10%", "15%", "10%", "10%", "15%"];
  return weights[index] ?? "12.5%";
}
