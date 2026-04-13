import type { Opportunity } from "@/lib/types";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";
import SignalRadar from "./SignalRadar";
import PaywallBlur from "./PaywallBlur";

interface PremiumSectionProps {
  readonly opportunity: Opportunity;
}

/** Premium content section with paywall blur overlay. */
export function PremiumSection({ opportunity }: PremiumSectionProps) {
  if (!opportunity) return null;

  return (
    <PaywallBlur>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          <ThesisBlock thesis={opportunity.thesis} />
          <CatalystsBlock catalysts={opportunity.catalysts} />
          <RisksBlock risks={opportunity.risks} />
        </div>
        <div className="space-y-8">
          <SignalRadar
            signals={opportunity.signals}
            compositeScore={opportunity.composite_score}
          />
          <SignalBreakdownTable opportunity={opportunity} />
        </div>
      </div>
    </PaywallBlur>
  );
}

function ThesisBlock({ thesis }: { readonly thesis: string }) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xs text-text-tertiary uppercase tracking-widest font-mono">
        Thesis
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {thesis}
      </p>
    </div>
  );
}

function CatalystsBlock({
  catalysts,
}: {
  readonly catalysts: readonly string[];
}) {
  if (!Array.isArray(catalysts) || catalysts.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xs text-text-tertiary uppercase tracking-widest font-mono">
        Catalysts
      </h2>
      <ul className="mt-3 space-y-2">
        {catalysts.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-0.5 text-text-tertiary">+</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RisksBlock({ risks }: { readonly risks: readonly string[] }) {
  if (!Array.isArray(risks) || risks.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xs text-text-tertiary uppercase tracking-widest font-mono">
        Risks
      </h2>
      <ul className="mt-3 space-y-2">
        {risks.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-0.5 text-text-tertiary">-</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignalBreakdownTable({
  opportunity,
}: {
  readonly opportunity: Opportunity;
}) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6">
      <h2 className="text-xs text-text-tertiary uppercase tracking-widest font-mono">
        Signal Breakdown
      </h2>
      <div className="mt-4 space-y-3">
        {SIGNAL_KEYS.map((key) => {
          const value = opportunity.signals[key];
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {SIGNAL_LABELS[key]}
              </span>
              <span className={`font-mono text-sm font-semibold ${getSignalColor(value)}`}>
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getSignalColor(score: number): string {
  if (score >= 75) return "text-score-high";
  if (score >= 55) return "text-score-mid";
  return "text-score-low";
}
