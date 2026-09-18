"use client";

import { useMemo, useState } from "react";
import { calculateTax, DEFAULT_LONG_TERM_RATE } from "@/lib/tax-calc";
import { MAX_MONEY } from "@/lib/planning-calculators";

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

const MAX_DAYS = 36500;
const MAX_RATE = 100;
// Trading fees sit in the sub one percent range, so this input allows four decimals.
const MAX_TX_FEE = 100;

export default function TaxCalculator() {
  const [buyPrice, setBuyPrice] = useState("40000");
  const [sellPrice, setSellPrice] = useState("60000");
  const [quantity, setQuantity] = useState("1");
  const [buyFee, setBuyFee] = useState("0.5");
  const [sellFee, setSellFee] = useState("0.5");
  const [holdingDays, setHoldingDays] = useState("200");
  const [bracket, setBracket] = useState("24");
  const [longTermRate, setLongTermRate] = useState(String(DEFAULT_LONG_TERM_RATE));

  const result = useMemo(
    () =>
      calculateTax({
        buyPrice: bounded(buyPrice, MAX_MONEY),
        sellPrice: bounded(sellPrice, MAX_MONEY),
        quantity: bounded(quantity, MAX_MONEY),
        buyFeePercent: bounded(buyFee, MAX_TX_FEE),
        sellFeePercent: bounded(sellFee, MAX_TX_FEE),
        holdingDays: Math.floor(bounded(holdingDays, MAX_DAYS)),
        incomeBracketPercent: bounded(bracket, MAX_RATE),
        longTermRatePercent: bounded(longTermRate, MAX_RATE),
      }),
    [buyPrice, sellPrice, quantity, buyFee, sellFee, holdingDays, bracket, longTermRate],
  );

  const termLabel = result.isLongTerm ? "Long term" : "Short term";

  return (
    <section className="mt-12 grid gap-6 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-sm md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" aria-label="Interactive calculator">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-text-primary">Your inputs</h2>
        <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <Field label="Buy price per unit" value={buyPrice} onChange={setBuyPrice} prefix="$" max={MAX_MONEY} />
          <Field label="Sell price per unit" value={sellPrice} onChange={setSellPrice} prefix="$" max={MAX_MONEY} />
          <Field label="Quantity sold" value={quantity} onChange={setQuantity} max={MAX_MONEY} />
          <Field label="Buy fee" value={buyFee} onChange={setBuyFee} suffix="%" max={MAX_TX_FEE} />
          <Field label="Sell fee" value={sellFee} onChange={setSellFee} suffix="%" max={MAX_TX_FEE} />
          <Field label="Days held" value={holdingDays} onChange={setHoldingDays} suffix="days" step="1" max={MAX_DAYS} integer />
          <Field label="Income tax bracket (short term)" value={bracket} onChange={setBracket} suffix="%" max={MAX_RATE} />
          <Field label="Long term capital gains rate" value={longTermRate} onChange={setLongTermRate} suffix="%" max={MAX_RATE} />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-text-secondary">Inputs and results stay in this browser. Hold longer than 365 days and the model switches to your long term rate.</p>
      </div>
      <div className="min-w-0 rounded-2xl bg-bg-secondary p-5 md:p-6" aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-semibold text-text-primary">Estimated tax bill</h2>
        <p className="mt-2 font-mono text-xs uppercase tracking-wider text-amber">{termLabel} at {percent(result.ratePercent)}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Metric label="Cost basis" value={money(result.costBasis)} note="Buy notional plus the buy fee" />
          <Metric label="Sale proceeds" value={money(result.proceeds)} note="Sell notional minus the sell fee" />
          <Metric
            label={result.gain < 0 ? "Capital loss" : "Capital gain"}
            value={money(result.gain)}
            note="Proceeds minus cost basis"
          />
          <Metric label="Tax owed" value={money(result.taxOwed)} note={result.gain <= 0 ? "Losses carry no bill in this model" : `Gain times the ${percent(result.ratePercent)} rate`} />
          <Metric label="After tax proceeds" value={money(result.afterTaxProceeds)} note="Cash left once the tax is set aside" />
          <Metric label="After tax gain" value={money(result.afterTaxGain)} note="After tax proceeds minus cost basis" />
          <Metric label="Effective tax drag" value={money(result.taxOwed)} note={`${percent(result.taxDragPercent)} of your cost basis`} />
          <Metric label="Total fees paid" value={money(result.totalFees)} note="Buy fee plus sell fee in dollars" />
          <Metric label="Break even sell price" value={result.breakEvenPrice > 0 ? money(result.breakEvenPrice) : "Not available"} note="Price where proceeds match your cost basis" />
          <Metric label="Net return on basis" value={percent(result.costBasis > 0 ? (result.afterTaxGain / result.costBasis) * 100 : 0)} note="What you keep against what you paid" />
        </dl>
        <div className="mt-8 border-t border-border-subtle pt-5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-text-secondary">Tax at other sell prices</h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {[0.5, 0.75, 1, 1.5, 2].map((multiplier) => {
              const scenarioPrice = bounded(sellPrice, MAX_MONEY) * multiplier;
              const run = calculateTax({
                buyPrice: bounded(buyPrice, MAX_MONEY),
                sellPrice: scenarioPrice,
                quantity: bounded(quantity, MAX_MONEY),
                buyFeePercent: bounded(buyFee, MAX_TX_FEE),
                sellFeePercent: bounded(sellFee, MAX_TX_FEE),
                holdingDays: Math.floor(bounded(holdingDays, MAX_DAYS)),
                incomeBracketPercent: bounded(bracket, MAX_RATE),
                longTermRatePercent: bounded(longTermRate, MAX_RATE),
              });
              return (
                <div key={multiplier} className="rounded-lg border border-border-subtle bg-bg-primary px-4 py-3">
                  <dt className="text-xs text-text-secondary">Sell at {money(scenarioPrice)}</dt>
                  <dd className="mt-1 break-words font-mono text-base font-semibold text-text-primary">{money(run.taxOwed)} <span className="text-xs font-normal text-text-secondary">({money(run.afterTaxProceeds)} after tax)</span></dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}
