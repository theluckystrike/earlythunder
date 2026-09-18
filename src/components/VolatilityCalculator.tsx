"use client";

import { useMemo, useState } from "react";
import { calculateVolatility } from "@/lib/volatility-calc";
import { MAX_MONEY, MAX_PERIODS } from "@/lib/planning-calculators";

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

function number(value: number, digits = 2): string {
  if (Number.isFinite(value) === false) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function percent(value: number): string {
  if (Number.isFinite(value) === false) return "0.00%";
  return `${number(value, 2)}%`;
}

function signedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${percent(value)}`;
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

export default function VolatilityCalculator() {
  const [price1, setPrice1] = useState("60000");
  const [price2, setPrice2] = useState("65400");
  const [daysBetween, setDaysBetween] = useState("30");
  const [annualize, setAnnualize] = useState(true);

  const safePrice1 = bounded(price1, MAX_MONEY);
  const safePrice2 = bounded(price2, MAX_MONEY);
  const safeDays = Math.floor(bounded(daysBetween, MAX_PERIODS));

  const result = useMemo(
    () => calculateVolatility({ price1: safePrice1, price2: safePrice2, daysBetween: safeDays, annualize }),
    [safePrice1, safePrice2, safeDays, annualize],
  );

  const trend = result.dailyReturnPercent > 0 ? "up" : result.dailyReturnPercent < 0 ? "down" : "flat";
  const bandNote = `One standard deviation band around the middle reading, roughly a ${number(Math.abs(result.sigmaDailyPercent))}% move either way on an average day.`;

  return (
    <section className="mt-12 grid gap-6 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-sm md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" aria-label="Interactive calculator">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-text-primary">Your readings</h2>
        <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <Field label="Price reading one" value={price1} onChange={setPrice1} prefix="$" max={MAX_MONEY} />
          <Field label="Price reading two" value={price2} onChange={setPrice2} prefix="$" max={MAX_MONEY} />
          <Field label="Days between readings" value={daysBetween} onChange={setDaysBetween} suffix="days" step="1" max={MAX_PERIODS} integer />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-bg-primary px-4 py-3">
            <input type="checkbox" checked={annualize} onChange={(event) => setAnnualize(event.target.checked)} className="h-4 w-4 accent-amber" />
            <span className="text-sm text-text-primary">Annualize the volatility estimate</span>
          </label>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-text-secondary">Inputs and results stay in this browser. Values are capped to keep calculations finite and responsive.</p>
      </div>
      <div className="min-w-0 rounded-2xl bg-bg-secondary p-5 md:p-6" aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-semibold text-text-primary">Calculated result</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Metric label="Daily return" value={signedPercent(result.dailyReturnPercent)} note={`Price moved ${trend} from the first reading to the second, on a log basis.`} />
          <Metric label="Annualized volatility" value={result.annualizedVolPercent === 0 ? "Off" : percent(result.annualizedVolPercent)} note="Standard deviation proxy from a single daily return scaled by the square root of 365." />
          <Metric label="One sigma daily band" value={`${percent(result.sigmaDailyLowPercent)} to ${percent(result.sigmaDailyHighPercent)}`} note={bandNote} />
        </dl>
        <div className="mt-8 border-t border-border-subtle pt-5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-text-secondary">What the numbers say</h3>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            A {result.annualizedVolPercent === 0 ? "single pair of readings" : `${percent(result.annualizedVolPercent)} annualized volatility`} fits one day at roughly a
            {result.dailyReturnPercent >= 0 ? "n" : ""} {percent(Math.abs(result.sigmaDailyPercent))}% swing in either direction at one standard deviation. On roughly two thirds of days you would expect the move to land inside that band if the same rhythm held. A wide band means a jumpier market; a narrow band means a calmer one.
          </p>
        </div>
      </div>
    </section>
  );
}
