import type { Opportunity } from "@/lib/types";
import { SIGNAL_KEYS, SIGNAL_LABELS } from "@/lib/types";
import ScoreBar from "./ScoreBar";
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
          <SignalRadar signals={opportunity.signals} />
          <SignalBreakdownTable opportunity={opportunity} />
        </div>
      </div>
    </PaywallBlur>
  );
}

function ThesisBlock({ thesis }: { readonly thesis: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-display text-xl">Thesis</h2>
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
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-display text-xl">Catalysts</h2>
      <ul className="mt-3 space-y-2">
        {catalysts.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-1 text-success">+</span>
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
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-display text-xl">Risks</h2>
      <ul className="mt-3 space-y-2">
        {risks.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className="mt-1 text-danger">-</span>
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
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="font-display text-xl">Signal Breakdown</h2>
      <div className="mt-4 space-y-3">
        {SIGNAL_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-text-secondary">
              {SIGNAL_LABELS[key]}
            </span>
            <div className="flex-1">
              <ScoreBar score={opportunity.signals[key]} showLabel />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
