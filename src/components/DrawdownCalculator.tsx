"use client";

import { useMemo, useState } from "react";
import {
  analyzeDrawdown,
  MAX_PRICE,
  MAX_TARGET_PERCENT,
  recoveryTable,
} from "@/lib/drawdown-calc";

interface FieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: string;
  readonly integer?: boolean;
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
}

function money(value: number): string {
  if (Number.isFinite(value) === false) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) < 1 ? 6 : 2,
  }).format(value);
}

function number(value: number, digits = 2): string {
  if (Number.isFinite(value) === false) return "Not reachable";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function percent(value: number, digits = 2): string {
  if (Number.isFinite(value) === false) return "Not reachable";
  return `${number(value, digits)}%`;
}

function Field({ label, value, onChange, prefix, suffix, min = 0, max, step = "any", integer = false }: FieldProps) {
  const clamp = (raw: string) => {
    if (max === undefined) return raw;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) === false || parsed < 0) return "0";
    const capped = Math.min(parsed, max);
    return integer ? String(Math.floor(capped)) : String(capped);
  };
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>
      <span className="flex min-h-12 w-full min-w-0 max-w-full items-center rounded-xl border border-border-subtle bg-bg-primary px-4 focus-within:border-amber">
        {prefix ? <span className="mr-2 font-mono text-sm text-text-secondary">{prefix}</span> : null}
        <input
          className="w-0 min-w-0 flex-1 bg-transparent py-3 font-mono text-base text-text-primary outline-none"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onChange(clamp(value))}
        />
        {suffix ? <span className="ml-2 font-mono text-sm text-text-secondary">{suffix}</span> : null}
      </span>
    </label>
  );
}

function Metric({ label, value, note }: MetricProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-primary p-5">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="mt-2 break-words font-mono text-2xl font-semibold text-text-primary">{value}</dd>
      {note ? <p className="mt-2 text-xs leading-relaxed text-text-secondary">{note}</p> : null}
    </div>
  );
}

function CalculatorShell({ children, results }: { readonly children: React.ReactNode; readonly results: React.ReactNode }) {
  return (
    <section className="mt-12 grid gap-6 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-sm md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" aria-label="Interactive calculator">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-text-primary">Your inputs</h2>
        <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">{children}</div>
        <p className="mt-5 text-xs leading-relaxed text-text-secondary">Inputs and results stay in this browser. Values are capped to keep calculations finite and responsive.</p>
      </div>
      <div className="min-w-0 rounded-2xl bg-bg-secondary p-5 md:p-6" aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-semibold text-text-primary">Calculated result</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">{results}</dl>
      </div>
    </section>
  );
}

export default function DrawdownCalculator() {
  const [peak, setPeak] = useState("100000");
  const [trough, setTrough] = useState("50000");
  const [targetPercent, setTargetPercent] = useState("0");
  const [recoveryPrice, setRecoveryPrice] = useState("");
  const [fee, setFee] = useState("0.25");

  const result = useMemo(() => {
    const explicit = recoveryPrice.trim() === "" ? null : Number(recoveryPrice);
    return analyzeDrawdown(Number(peak), Number(trough), Number(targetPercent), explicit);
  }, [peak, trough, targetPercent, recoveryPrice]);

  const table = useMemo(() => recoveryTable(), []);

  const feeRate = Number.isFinite(Number(fee)) && Number(fee) > 0 ? Math.min(Number(fee), 99.99) / 100 : 0;
  const troughValue = result.troughPrice > 0 ? result.troughPrice : 0;
  const unitsPerPeakDollar = result.peakPrice > 0 ? (1 - feeRate) / result.peakPrice : 0;
  const valueAtTrough = unitsPerPeakDollar * troughValue;
  const breakevenPrice = unitsPerPeakDollar > 0 ? 1 / unitsPerPeakDollar : 0;

  return (
    <>
      <CalculatorShell
        results={
          <>
            <Metric
              label="Drawdown from peak"
              value={percent(result.drawdownPercent)}
              note={result.priceIsClamped
                ? "The trough sits above the peak, so the fall is treated as zero"
                : `A fall of ${money(Math.max(result.peakPrice - result.troughPrice, 0))} per unit`}
            />
            <Metric
              label="Gain needed to recover"
              value={percent(result.recoveryGainPercent)}
              note="Measured from the trough, not from the peak"
            />
            <Metric
              label="Recovery multiple"
              value={number(result.recoveryMultiple)} 
              note={`The peak is ${number(result.recoveryMultiple)}x the trough value`}
            />
            <Metric
              label="Price for full recovery"
              value={money(result.recoverTargetPrice)}
              note={recoveryPrice.trim() === ""
                ? `Peak plus the ${percent(Number(targetPercent), 1)} recovery target`
                : "Your entered recovery price overrides the target percent"}
            />
            <Metric
              label="Gain per unit from trough"
              value={money(result.gainNeededUsd)}
              note="Dollar move required to reach the recovery price"
            />
            <Metric
              label="Value after the fall"
              value={percent(result.peakPrice > 0 ? (result.troughPrice / result.peakPrice) * 100 : 0)}
              note="Share of the peak price still standing at the trough"
            />
          </>
        }
      >
        <Field label="Peak price" value={peak} onChange={setPeak} prefix="$" max={MAX_PRICE} />
        <Field label="Current or trough price" value={trough} onChange={setTrough} prefix="$" max={MAX_PRICE} />
        <Field label="Recovery target above the peak" value={targetPercent} onChange={setTargetPercent} suffix="%" max={MAX_TARGET_PERCENT} />
        <Field label="Recovery price (optional, overrides the target)" value={recoveryPrice} onChange={setRecoveryPrice} prefix="$" max={MAX_PRICE} />
        <Field label="Round trip fee per buy and sell" value={fee} onChange={setFee} suffix="%" max={99.99} />
      </CalculatorShell>

      <section className="mt-12 rounded-2xl border border-border-subtle bg-bg-card p-5 md:p-8" aria-label="Position view at the trough">
        <h2 className="text-xl font-semibold text-text-primary">A position bought at the peak</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-secondary">Every dollar bought at {money(result.peakPrice)} is worth {money(valueAtTrough)} at the trough of {money(troughValue)} after a {percent(feeRate * 100, 2)} round trip fee. The position is whole again at {money(breakevenPrice)}.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Metric label="Peak dollar value now" value={money(valueAtTrough)} note={`Against ${money(1)} put in at the peak`} />
          <Metric label="Loss on the peak dollar" value={percent(100 - (valueAtTrough * 100))} note="Unrealised until the position is sold" />
          <Metric label="Breakeven price" value={money(breakevenPrice)} note="The peak price grossed up for the round trip fee" />
        </div>
      </section>

      <section className="mt-12" aria-label="Recovery table">
        <h2 className="text-xl font-semibold text-text-primary">Recovery gain required at every drawdown</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border-subtle">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead className="bg-bg-secondary">
              <tr>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-secondary">Drawdown</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-secondary">Value still standing</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-secondary">Gain to recover</th>
                <th scope="col" className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-secondary">Recovery multiple</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => {
                const active = Math.round(result.drawdownPercent) === row.drawdownPercent;
                return (
                  <tr key={row.drawdownPercent} className={active ? "bg-bg-secondary" : "bg-bg-card"}>
                    <td className="border-t border-border-subtle px-4 py-3 font-mono text-sm text-text-primary">-{row.drawdownPercent}%</td>
                    <td className="border-t border-border-subtle px-4 py-3 font-mono text-sm text-text-secondary">{percent(row.remainingValuePercent, 0)}</td>
                    <td className="border-t border-border-subtle px-4 py-3 font-mono text-sm font-semibold text-text-primary">{percent(row.recoveryGainPercent, 1)}</td>
                    <td className="border-t border-border-subtle px-4 py-3 font-mono text-sm text-text-secondary">{number(row.recoveryMultiple)}x</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">The two numbers for a 50% drawdown are 50% down and 100% up. Recovery gains grow faster than drawdowns because each extra point of loss is taken from a smaller base.</p>
      </section>
    </>
  );
}
