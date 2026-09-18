"use client";

import { useMemo, useState } from "react";
import { calculateInvestment } from "@/lib/investment-calc";
import { MAX_FEE_PERCENT, MAX_MONEY, MAX_PERIODS, MAX_YEARS } from "@/lib/planning-calculators";

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

function bounded(raw: string | number, max: number): number {
  const parsed = Number(raw);
  if (Number.isFinite(parsed) === false || parsed < 0) return 0;
  return Math.min(parsed, max);
}

function Field({ label, value, onChange, prefix, suffix, min = 0, max, step = "any", integer = false }: FieldProps) {
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
          onBlur={() => (max === undefined ? undefined : onChange(String(integer ? Math.floor(bounded(value, max)) : bounded(value, max))))}
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

export default function InvestmentCalculator() {
  const [initial, setInitial] = useState("5000");
  const [recurring, setRecurring] = useState("500");
  const [periods, setPeriods] = useState("12");
  const [startPrice, setStartPrice] = useState("60000");
  const [endPrice, setEndPrice] = useState("90000");
  const [fee, setFee] = useState("0.5");
  const [years, setYears] = useState("1");

  const result = useMemo(
    () =>
      calculateInvestment({
        initial: bounded(initial, MAX_MONEY),
        recurring: bounded(recurring, MAX_MONEY),
        periods: Math.floor(bounded(periods, MAX_PERIODS)),
        startPrice: bounded(startPrice, MAX_MONEY),
        endPrice: bounded(endPrice, MAX_MONEY),
        feePercent: bounded(fee, MAX_FEE_PERCENT),
        years: Math.floor(bounded(years, MAX_YEARS)),
      }),
    [initial, recurring, periods, startPrice, endPrice, fee, years],
  );

  return (
    <section className="mt-12 grid gap-6 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-sm md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" aria-label="Interactive calculator">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-text-primary">Your inputs</h2>
        <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <Field label="Initial investment" value={initial} onChange={setInitial} prefix="$" max={MAX_MONEY} />
          <Field label="Recurring contribution each period" value={recurring} onChange={setRecurring} prefix="$" max={MAX_MONEY} />
          <Field label="Number of periods" value={periods} onChange={setPeriods} step="1" max={MAX_PERIODS} integer />
          <Field label="Starting asset price" value={startPrice} onChange={setStartPrice} prefix="$" max={MAX_MONEY} />
          <Field label="Ending asset price" value={endPrice} onChange={setEndPrice} prefix="$" max={MAX_MONEY} />
          <Field label="Fee per purchase" value={fee} onChange={setFee} suffix="%" max={MAX_FEE_PERCENT} />
          <Field label="Holding window for CAGR" value={years} onChange={setYears} suffix="years" step="1" max={MAX_YEARS} integer />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-text-secondary">Inputs and results stay in this browser. Values are capped to keep calculations finite and responsive.</p>
      </div>
      <div className="min-w-0 rounded-2xl bg-bg-secondary p-5 md:p-6" aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-semibold text-text-primary">Calculated result</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Metric label="Total invested" value={money(result.totalInvested)} />
          <Metric label="Units accumulated" value={number(result.units, 8)} />
          <Metric label="Average cost" value={result.units > 0 ? money(result.averageCost) : "Not available"} note="Cash invested divided by units received" />
          <Metric label="Ending value" value={money(result.endingValue)} />
          <Metric label="Return on investment" value={percent(result.roiPercent)} />
          <Metric label="Annualized return" value={result.cagrPercent === null ? "Not available" : percent(result.cagrPercent)} note="CAGR over the holding window you entered" />
          <Metric label="Fee cost vs no fee" value={money(result.feeCostDollars)} note="Foregone value from the fee you entered" />
        </dl>
        <div className="mt-8 border-t border-border-subtle pt-5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-text-secondary">Ending price scenarios</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {result.scenarios.map((row) => (
              <div key={row.multiplier} className="rounded-lg border border-border-subtle bg-bg-primary px-4 py-3">
                <dt className="text-xs text-text-secondary">{percent((row.multiplier - 1) * 100)} off start price</dt>
                <dd className="mt-1 break-words font-mono text-base font-semibold text-text-primary">{money(row.endingValue)} <span className="text-xs font-normal text-text-secondary">({percent(row.roiPercent)})</span></dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
