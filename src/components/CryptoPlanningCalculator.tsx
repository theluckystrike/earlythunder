"use client";

import { useMemo, useState } from "react";
import { bounded, calculateApy, calculateAveragePrice, calculateDca, calculateFees, calculatePositionSize, MAX_PERCENT } from "@/lib/planning-calculators";

export type PlanningCalculatorKind = "dca" | "average-price" | "fees" | "apy" | "position-size";

interface Props {
  readonly kind: PlanningCalculatorKind;
}

interface FieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly min?: number;
  readonly step?: string;
}

interface MetricProps {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
}

function money(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) < 1 ? 6 : 2,
  }).format(value);
}

function number(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function percent(value: number): string {
  if (!Number.isFinite(value)) return "0.00%";
  return `${number(value, 2)}%`;
}

function Field({ label, value, onChange, prefix, suffix, min = 0, step = "any" }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-text-primary">{label}</span>
      <span className="flex min-h-12 items-center rounded-xl border border-border-subtle bg-bg-primary px-4 focus-within:border-amber">
        {prefix ? <span className="mr-2 font-mono text-sm text-text-secondary">{prefix}</span> : null}
        <input
          className="min-w-0 flex-1 bg-transparent py-3 font-mono text-base text-text-primary outline-none"
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Your inputs</h2>
        <div className="mt-6 grid gap-5">{children}</div>
        <p className="mt-5 text-xs leading-relaxed text-text-secondary">Inputs and results stay in this browser. Values are capped to keep calculations finite and responsive.</p>
      </div>
      <div className="rounded-2xl bg-bg-secondary p-5 md:p-6">
        <h2 className="text-xl font-semibold text-text-primary">Calculated result</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">{results}</dl>
      </div>
    </section>
  );
}

function DcaCalculator() {
  const [contribution, setContribution] = useState("250");
  const [periods, setPeriods] = useState("24");
  const [startPrice, setStartPrice] = useState("50000");
  const [endPrice, setEndPrice] = useState("80000");
  const [fee, setFee] = useState("0.25");
  const result = useMemo(() => calculateDca({ contribution: Number(contribution), periods: Number(periods), startPrice: Number(startPrice), endPrice: Number(endPrice), feePercent: Number(fee) }), [contribution, periods, startPrice, endPrice, fee]);
  return <CalculatorShell results={<><Metric label="Total invested" value={money(result.invested)} /><Metric label="Units accumulated" value={number(result.units, 8)} /><Metric label="Average cost" value={money(result.average)} note="Cash invested divided by units received" /><Metric label="Ending value" value={money(result.value)} /><Metric label="Gain or loss" value={money(result.gain)} /><Metric label="Purchases" value={number(result.count, 0)} /></>}><Field label="Contribution each period" value={contribution} onChange={setContribution} prefix="$" /><Field label="Number of purchases" value={periods} onChange={setPeriods} step="1" /><Field label="Starting asset price" value={startPrice} onChange={setStartPrice} prefix="$" /><Field label="Ending asset price" value={endPrice} onChange={setEndPrice} prefix="$" /><Field label="Fee per purchase" value={fee} onChange={setFee} suffix="%" /></CalculatorShell>;
}

function AveragePriceCalculator() {
  const [firstUnits, setFirstUnits] = useState("1.25");
  const [firstPrice, setFirstPrice] = useState("42000");
  const [secondUnits, setSecondUnits] = useState("0.75");
  const [secondPrice, setSecondPrice] = useState("58000");
  const [fee, setFee] = useState("0.2");
  const result = useMemo(() => calculateAveragePrice({ firstUnits: Number(firstUnits), firstPrice: Number(firstPrice), secondUnits: Number(secondUnits), secondPrice: Number(secondPrice), feePercent: Number(fee) }), [firstUnits, firstPrice, secondUnits, secondPrice, fee]);
  return <CalculatorShell results={<><Metric label="Weighted average price" value={money(result.average)} /><Metric label="Total units" value={number(result.totalUnits, 8)} /><Metric label="Gross purchase cost" value={money(result.grossCost)} /><Metric label="Purchase fees" value={money(result.fees)} /><Metric label="Total cost basis" value={money(result.totalCost)} /><Metric label="Break-even before sell fee" value={money(result.average)} /></>}><Field label="Units in first purchase" value={firstUnits} onChange={setFirstUnits} /><Field label="Price in first purchase" value={firstPrice} onChange={setFirstPrice} prefix="$" /><Field label="Units in second purchase" value={secondUnits} onChange={setSecondUnits} /><Field label="Price in second purchase" value={secondPrice} onChange={setSecondPrice} prefix="$" /><Field label="Fee on each purchase" value={fee} onChange={setFee} suffix="%" /></CalculatorShell>;
}

function FeeCalculator() {
  const [amount, setAmount] = useState("10000");
  const [buyFee, setBuyFee] = useState("0.4");
  const [sellFee, setSellFee] = useState("0.4");
  const [spread, setSpread] = useState("0.15");
  const [network, setNetwork] = useState("8");
  const result = useMemo(() => calculateFees({ amount: Number(amount), buyFeePercent: Number(buyFee), sellFeePercent: Number(sellFee), spreadPercent: Number(spread), fixedCost: Number(network) }), [amount, buyFee, sellFee, spread, network]);
  return <CalculatorShell results={<><Metric label="Estimated total cost" value={money(result.total)} /><Metric label="Effective cost rate" value={percent(result.rate)} /><Metric label="Buy fee" value={money(result.buy)} /><Metric label="Sell fee" value={money(result.sell)} /><Metric label="Spread cost" value={money(result.spreadCost)} /><Metric label="Minimum price gain" value={percent(result.rate)} note="Approximate gain needed to cover entered costs" /></>}><Field label="Trade notional" value={amount} onChange={setAmount} prefix="$" /><Field label="Buy fee" value={buyFee} onChange={setBuyFee} suffix="%" /><Field label="Sell fee" value={sellFee} onChange={setSellFee} suffix="%" /><Field label="Estimated spread" value={spread} onChange={setSpread} suffix="%" /><Field label="Network and withdrawal cost" value={network} onChange={setNetwork} prefix="$" /></CalculatorShell>;
}

function ApyCalculator() {
  const [principal, setPrincipal] = useState("10000");
  const [apr, setApr] = useState("12");
  const [compounds, setCompounds] = useState("365");
  const [years, setYears] = useState("2");
  const [inflation, setInflation] = useState("4");
  const result = useMemo(() => calculateApy({ principal: Number(principal), aprPercent: Number(apr), compoundsPerYear: Number(compounds), years: Number(years), inflationPercent: Number(inflation) }), [principal, apr, compounds, years, inflation]);
  return <CalculatorShell results={<><Metric label="Effective APY" value={percent(result.apy)} /><Metric label="Ending nominal balance" value={money(result.ending)} /><Metric label="Nominal rewards" value={money(result.earned)} /><Metric label="Inflation-adjusted balance" value={money(result.realEnding)} /><Metric label="Inflation-adjusted gain" value={money(result.realEarned)} /><Metric label="Quoted APR" value={percent(bounded(apr, MAX_PERCENT))} /></>}><Field label="Starting principal" value={principal} onChange={setPrincipal} prefix="$" /><Field label="Quoted APR" value={apr} onChange={setApr} suffix="%" /><Field label="Compounds per year" value={compounds} onChange={setCompounds} step="1" /><Field label="Holding period" value={years} onChange={setYears} suffix="years" /><Field label="Annual token inflation" value={inflation} onChange={setInflation} suffix="%" /></CalculatorShell>;
}

function PositionSizeCalculator() {
  const [account, setAccount] = useState("25000");
  const [risk, setRisk] = useState("1");
  const [entry, setEntry] = useState("100");
  const [stop, setStop] = useState("92");
  const [fee, setFee] = useState("0.2");
  const result = useMemo(() => calculatePositionSize({ account: Number(account), riskPercent: Number(risk), entryPrice: Number(entry), stopPrice: Number(stop), feePercent: Number(fee) }), [account, risk, entry, stop, fee]);
  return <CalculatorShell results={<><Metric label="Maximum position size" value={money(result.notional)} /><Metric label="Asset units" value={number(result.units, 8)} /><Metric label="Risk budget" value={money(result.riskBudget)} /><Metric label="Risk per unit" value={money(result.riskPerUnit)} /><Metric label="Portfolio allocation" value={percent(result.allocation)} /><Metric label="Stop distance" value={percent(result.stopDistance)} /></>}><Field label="Trading account value" value={account} onChange={setAccount} prefix="$" /><Field label="Maximum account risk" value={risk} onChange={setRisk} suffix="%" /><Field label="Planned entry price" value={entry} onChange={setEntry} prefix="$" /><Field label="Stop price" value={stop} onChange={setStop} prefix="$" /><Field label="Fee each side" value={fee} onChange={setFee} suffix="%" /></CalculatorShell>;
}

export default function CryptoPlanningCalculator({ kind }: Props) {
  if (kind === "dca") return <DcaCalculator />;
  if (kind === "average-price") return <AveragePriceCalculator />;
  if (kind === "fees") return <FeeCalculator />;
  if (kind === "apy") return <ApyCalculator />;
  return <PositionSizeCalculator />;
}
