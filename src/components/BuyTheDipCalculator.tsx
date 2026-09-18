"use client";

import { useMemo, useState } from "react";
import {
  buildSyntheticPath,
  MAX_FEE_PERCENT,
  MAX_MONEY,
  MAX_TRANCHES,
  MAX_THRESHOLD_PERCENT,
  runDipPlan,
} from "@/lib/dip-calc";

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

function number(value: number, digits = 4): string {
  if (Number.isFinite(value) === false) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function percent(value: number): string {
  if (Number.isFinite(value) === false) return "0.00%";
  return `${number(value, 2)}%`;
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

export default function BuyTheDipCalculator() {
  const [totalCash, setTotalCash] = useState("10000");
  const [tranches, setTranches] = useState("4");
  const [threshold, setThreshold] = useState("15");
  const [startPrice, setStartPrice] = useState("50000");
  const [endPrice, setEndPrice] = useState("80000");
  const [fee, setFee] = useState("0.25");

  const result = useMemo(() => {
    const rows = buildSyntheticPath(Number(startPrice), Number(endPrice), 365, Number(threshold), 60);
    return runDipPlan(rows, {
      totalCash: Number(totalCash),
      tranches: Number(tranches),
      dipThresholdPercent: Number(threshold),
      feePercent: Number(fee),
    });
  }, [totalCash, tranches, threshold, startPrice, endPrice, fee]);

  const deployedDuringDips = result.dipsDeployed > 0;

  return (
    <CalculatorShell
      results={
        <>
          <Metric label="Cash deployed in dips" value={money(result.cashDeployedDuringDips)} note={`${percent(result.percentDuringDips)} of the ${result.totalTranches} tranches bought on drawdowns`} />
          <Metric label="Cash deployed at end" value={money(result.cashDeployedAtEnd)} note={deployedDuringDips ? "Leftover cash buys at the final price" : "No dip crossed the threshold, so all cash buys at the end"} />
          <Metric label="Units accumulated" value={number(result.units, 8)} />
          <Metric label="Average cost" value={result.units > 0 ? money(result.averageCost) : "Not available"} note="Cash invested divided by units received" />
          <Metric label="Ending value" value={money(result.finalValue)} note={`At a final price of ${money(result.finalPrice)}`} />
          <Metric label="ROI" value={percent(result.roiPercent)} note={`Gain of ${money(result.gain)} on ${money(result.invested)} invested`} />
        </>
      }
    >
      <Field label="Total cash to deploy" value={totalCash} onChange={setTotalCash} prefix="$" max={MAX_MONEY} />
      <Field label="Number of dip tranches" value={tranches} onChange={setTranches} step="1" max={MAX_TRANCHES} integer />
      <Field label="Dip trigger below high" value={threshold} onChange={setThreshold} suffix="%" max={MAX_THRESHOLD_PERCENT} />
      <Field label="Starting asset price" value={startPrice} onChange={setStartPrice} prefix="$" max={MAX_MONEY} />
      <Field label="Ending asset price" value={endPrice} onChange={setEndPrice} prefix="$" max={MAX_MONEY} />
      <Field label="Fee per purchase" value={fee} onChange={setFee} suffix="%" max={MAX_FEE_PERCENT} />
    </CalculatorShell>
  );
}
