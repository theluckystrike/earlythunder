"use client";

import { useMemo, useState } from "react";
import {
  buildRecoveryCurve,
  calculateCryptoProfit,
  type CalculatorInput,
  type CalculatorMode,
  type CalculatorResult,
  type RecoveryPoint,
} from "@/lib/crypto-calculator";
import type { BitcoinSnapshot } from "@/lib/bitcoin-snapshot";

interface CalculatorProps {
  readonly snapshot: BitcoinSnapshot;
}

interface FormState {
  readonly mode: CalculatorMode;
  readonly buyPrice: string;
  readonly sellPrice: string;
  readonly amount: string;
  readonly buyFeePercent: string;
  readonly sellFeePercent: string;
}

interface ParsedForm {
  readonly input: CalculatorInput | null;
  readonly errors: Readonly<Partial<Record<keyof FormState, string>>>;
}

const MAX_TEXT_LENGTH = 24;
const DECIMAL_PATTERN = /^(?:\d+(?:\.\d{0,12})?|\.\d{1,12})$/;

function initialForm(snapshot: BitcoinSnapshot): FormState {
  return {
    mode: "quantity",
    buyPrice: String(snapshot.allTimeHigh),
    sellPrice: String(snapshot.price),
    amount: "1",
    buyFeePercent: "0",
    sellFeePercent: "0",
  };
}

function parseField(value: string, label: string, minimum: number, maximum: number): [number | null, string?] {
  if (value.length === 0) return [null, `${label} is required.`];
  if (value.length > MAX_TEXT_LENGTH) return [null, `${label} is too long.`];
  if (DECIMAL_PATTERN.test(value) === false) return [null, `${label} must be a number with up to 12 decimals.`];
  const number = Number(value);
  if (Number.isFinite(number) === false) return [null, `${label} must be finite.`];
  if (number < minimum || number > maximum) {
    const range = minimum === Number.EPSILON ? `greater than 0 and no more than ${maximum}` : `from ${minimum} to ${maximum}`;
    return [null, `${label} must be ${range}.`];
  }
  return [number];
}

function parseForm(form: FormState): ParsedForm {
  const buy = parseField(form.buyPrice, "Buy price", Number.EPSILON, 1_000_000_000);
  const sell = parseField(form.sellPrice, "Sell price", 0, 1_000_000_000);
  const amount = parseField(form.amount, form.mode === "cash" ? "Total entry cash" : "Quantity", Number.EPSILON, 1_000_000_000_000);
  const buyFee = parseField(form.buyFeePercent, "Buy fee", 0, 99);
  const sellFee = parseField(form.sellFeePercent, "Sell fee", 0, 99);
  const errors = {
    buyPrice: buy[1], sellPrice: sell[1], amount: amount[1],
    buyFeePercent: buyFee[1], sellFeePercent: sellFee[1],
  };
  if (Object.values(errors).some(Boolean)) return { input: null, errors };
  return {
    input: {
      mode: form.mode,
      buyPrice: buy[0] as number,
      sellPrice: sell[0] as number,
      amount: amount[0] as number,
      buyFeePercent: buyFee[0] as number,
      sellFeePercent: sellFee[0] as number,
    },
    errors,
  };
}

function usd(value: number): string {
  const decimals = Math.abs(value) < 0.01 && Boolean(value) ? 8 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}

function percent(rate: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(rate * 100) + "%";
}

function quantity(value: number): string {
  if (Math.abs(value) < 1e-8 && Boolean(value)) return value.toExponential(8);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value);
}

function Field({ name, label, value, error, onChange }: {
  readonly name: Exclude<keyof FormState, "mode">;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly onChange: (name: Exclude<keyof FormState, "mode">, value: string) => void;
}) {
  const errorId = `${name}-error`;
  return (
    <label className="block text-sm text-text-secondary">
      <span className="mb-2 block font-medium text-text-primary">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        inputMode="decimal"
        maxLength={MAX_TEXT_LENGTH}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
      />
      {error && <span id={errorId} className="mt-2 block text-sm text-negative">{error}</span>}
    </label>
  );
}

function ModeControl({ mode, onChange }: { readonly mode: CalculatorMode; readonly onChange: (mode: CalculatorMode) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-text-primary">Entry amount</legend>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1">
        {(["quantity", "cash"] as const).map((option) => (
          <label key={option} className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm transition-colors ${mode === option ? "bg-bg-elevated text-text-primary" : "text-text-secondary"}`}>
            <input className="sr-only" type="radio" name="mode" value={option} checked={mode === option} onChange={() => onChange(option)} />
            {option === "quantity" ? "Token quantity" : "Total cash"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ResultTile({ label, value, tone }: { readonly label: string; readonly value: string; readonly tone?: "positive" | "negative" }) {
  const color = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-text-primary";
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className={`mt-2 break-words font-mono text-xl font-semibold ${color}`}>{value}</dd>
    </div>
  );
}

function Results({ result }: { readonly result: CalculatorResult }) {
  const tone = result.profit > 0 ? "positive" : result.profit < 0 ? "negative" : undefined;
  const recovery = result.recoveryRate === null ? "No finite gain from zero" : percent(result.recoveryRate);
  return (
    <div aria-live="polite" aria-atomic="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultTile label="Net profit or loss" value={usd(result.profit)} tone={tone} />
        <ResultTile label="Return on cost" value={percent(result.roiRate)} tone={tone} />
        <ResultTile label="Break-even sell price" value={usd(result.breakEvenPrice)} />
        <ResultTile label="Gain needed to break even" value={recovery} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-subtle pt-6 text-sm sm:grid-cols-3">
        <Breakdown label="Quantity" value={quantity(result.quantity)} />
        <Breakdown label="Buy notional" value={usd(result.buyNotional)} />
        <Breakdown label="Buy fee" value={usd(result.buyFee)} />
        <Breakdown label="Total cost" value={usd(result.totalCost)} />
        <Breakdown label="Gross exit" value={usd(result.sellNotional)} />
        <Breakdown label="Exit fee" value={usd(result.sellFee)} />
        <Breakdown label="Net proceeds" value={usd(result.netProceeds)} />
      </dl>
    </div>
  );
}

function Breakdown({ label, value }: { readonly label: string; readonly value: string }) {
  return <div><dt className="text-text-secondary">{label}</dt><dd className="mt-1 break-words font-mono text-text-primary">{value}</dd></div>;
}

function RecoveryChart({ points }: { readonly points: readonly RecoveryPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.recoveryRate), Number.EPSILON);
  const plotted = points.map((point, index) => {
    const x = 28 + (index / (points.length - 1)) * 584;
    const y = 204 - (point.recoveryRate / maximum) * 172;
    return `${x},${y}`;
  }).join(" ");
  return (
    <figure className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <figcaption className="text-lg font-semibold text-text-primary">Fee-aware recovery curve</figcaption>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">Each point begins at the selected buy price and applies the shown loss. It then solves for the gain needed to reach the fee-aware break-even price.</p>
      <svg className="mt-6 h-auto w-full" viewBox="0 0 640 232" role="img" aria-label="Required recovery gain rises as the loss from the buy price increases">
        <path className="text-border-active" d="M28 24V204H612" fill="none" stroke="currentColor" strokeWidth="1" />
        <polyline className="text-amber" points={plotted} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => {
          const x = 28 + (index / (points.length - 1)) * 584;
          const y = 204 - (point.recoveryRate / maximum) * 172;
          return <circle className="text-amber" key={point.lossPercent} cx={x} cy={y} r="4" fill="currentColor" />;
        })}
      </svg>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
          <thead><tr className="border-b border-border-subtle text-text-secondary"><th className="px-2 py-3 font-medium sm:px-3">Loss from buy price</th><th className="px-2 py-3 font-medium sm:px-3">Current price</th><th className="px-2 py-3 font-medium sm:px-3">Gain to break even</th></tr></thead>
          <tbody>{points.map((point) => <tr key={point.lossPercent} className="border-b border-border-subtle last:border-0"><td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{point.lossPercent}%</td><td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{usd(point.currentPrice)}</td><td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">{percent(point.recoveryRate)}</td></tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}

export default function CryptoProfitCalculator({ snapshot }: CalculatorProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(snapshot));
  const parsed = useMemo(() => parseForm(form), [form]);
  const result = useMemo(() => parsed.input ? calculateCryptoProfit(parsed.input) : null, [parsed.input]);
  const curve = useMemo(() => parsed.input ? buildRecoveryCurve(parsed.input) : null, [parsed.input]);
  const updateField = (name: Exclude<keyof FormState, "mode">, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const loadSnapshot = () => setForm({ mode: "quantity", buyPrice: String(snapshot.allTimeHigh), sellPrice: String(snapshot.price), amount: "1", buyFeePercent: "0", sellFeePercent: "0" });
  return (
    <section className="mt-16" aria-labelledby="calculator-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span><h2 id="calculator-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Calculate the full trade</h2></div>
          <button type="button" className="primary-btn" onClick={loadSnapshot}>Load BTC build snapshot</button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <ModeControl mode={form.mode} onChange={(mode) => setForm((current) => ({ ...current, mode }))} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field name="buyPrice" label="Buy price in USD" value={form.buyPrice} error={parsed.errors.buyPrice} onChange={updateField} />
              <Field name="sellPrice" label="Sell price in USD" value={form.sellPrice} error={parsed.errors.sellPrice} onChange={updateField} />
              <Field name="amount" label={form.mode === "cash" ? "Total entry cash in USD" : "Token quantity"} value={form.amount} error={parsed.errors.amount} onChange={updateField} />
              <Field name="buyFeePercent" label="Buy fee percent" value={form.buyFeePercent} error={parsed.errors.buyFeePercent} onChange={updateField} />
              <Field name="sellFeePercent" label="Sell fee percent" value={form.sellFeePercent} error={parsed.errors.sellFeePercent} onChange={updateField} />
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">Percentage trading fees are applied separately at entry and exit. The result excludes spread, slippage, funding, gas and tax.</p>
          </div>
          <div>{result ? <Results result={result} /> : <div aria-live="polite" className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">Correct the highlighted inputs to calculate a result.</div>}</div>
        </div>
      </div>
      {curve && <RecoveryChart points={curve} />}
    </section>
  );
}
