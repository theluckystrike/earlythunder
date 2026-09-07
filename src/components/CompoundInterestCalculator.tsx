"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  MAX_PERIODS_PER_YEAR,
  MAX_PRICE_CHANGE_PERCENT,
  MAX_PRICE_USD,
  MAX_RATE_PERCENT,
  MAX_TOKENS,
  MAX_YEARS,
  MIN_PRICE_CHANGE_PERCENT,
  MIN_YEARS,
  projectCompound,
  type CompoundInput,
  type CompoundResult,
  type CompoundYearRow,
} from "@/lib/compound-math";

export interface PoolOption {
  readonly key: string;
  readonly symbol: string;
  readonly project: string;
  readonly chain: string;
  readonly tvlUsd: number;
  readonly apy: number;
  readonly apyBase: number | null;
  readonly apyReward: number | null;
  readonly apyMean30d: number | null;
  readonly stablecoin: boolean;
}

export interface AssetOption {
  readonly symbol: string;
  readonly name: string;
  readonly priceUsd: number;
  readonly change24h: number | null;
  readonly change7d: number | null;
  readonly change30d: number | null;
  readonly change200d: number | null;
  readonly change1y: number | null;
}

export interface CompoundSnapshot {
  readonly yieldFetchedAt: string;
  readonly universeFetchedAt: string;
  readonly pools: readonly PoolOption[];
  readonly assets: readonly AssetOption[];
  /** Pool the form opens on, chosen at build time so the rate and the price belong to the same asset. */
  readonly defaultPoolKey: string | null;
  readonly bitcoin: AssetOption;
}

interface FormState {
  readonly assetSymbol: string;
  readonly poolKey: string;
  readonly priceUsd: string;
  readonly startTokens: string;
  readonly contributionTokens: string;
  readonly ratePercent: string;
  readonly periodsPerYear: string;
  readonly years: string;
  readonly annualPriceChangePercent: string;
}

type FieldName = "priceUsd" | "startTokens" | "contributionTokens" | "ratePercent" | "years" | "annualPriceChangePercent";

type FieldErrors = Readonly<Partial<Record<FieldName, string>>>;

interface ParsedForm {
  readonly input: CompoundInput | null;
  readonly errors: FieldErrors;
}

const MAX_TEXT_LENGTH = 24;
const UNSIGNED_PATTERN = /^(?:\d+(?:\.\d{0,10})?|\.\d{1,10})$/;
const SIGNED_PATTERN = /^-?(?:\d+(?:\.\d{0,10})?|\.\d{1,10})$/;
const PERIOD_CHOICES = [
  { value: "1", label: "Once a year" },
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
  { value: "52", label: "Weekly" },
  { value: "365", label: "Daily" },
] as const;
const CUSTOM_POOL = "custom";

function poolLabel(pool: PoolOption): string {
  return `${pool.symbol} on ${pool.project} (${pool.chain}), ${pool.apy.toFixed(2)}% APY`;
}

function initialForm(snapshot: CompoundSnapshot): FormState {
  const preferred = snapshot.defaultPoolKey === null
    ? undefined
    : snapshot.pools.find((row) => row.key === snapshot.defaultPoolKey);
  const pool = preferred ?? (snapshot.pools.length > 0 ? snapshot.pools[0] : null) ?? null;
  const asset = snapshot.assets.length > 0 ? snapshot.assets[0] : snapshot.bitcoin;
  const matched = pool === null ? null : snapshot.assets.find((row) => row.symbol === pool.symbol) ?? null;
  const chosen = matched ?? asset;
  return {
    assetSymbol: chosen.symbol,
    poolKey: pool === null ? CUSTOM_POOL : pool.key,
    priceUsd: String(chosen.priceUsd),
    startTokens: "1",
    contributionTokens: "0",
    ratePercent: pool === null ? "5" : String(pool.apy.toFixed(4)),
    periodsPerYear: "1",
    years: "5",
    annualPriceChangePercent: "0",
  };
}

function parseField(
  value: string,
  label: string,
  minimum: number,
  maximum: number,
  allowNegative: boolean,
): readonly [number | null, string | undefined] {
  if (value.length === 0) return [null, `${label} is required.`];
  if (value.length > MAX_TEXT_LENGTH) return [null, `${label} is too long.`];
  const pattern = allowNegative ? SIGNED_PATTERN : UNSIGNED_PATTERN;
  if (pattern.test(value) === false) return [null, `${label} must be a number with up to 10 decimals.`];
  const parsed = Number(value);
  if (Number.isFinite(parsed) === false) return [null, `${label} must be finite.`];
  if (parsed < minimum || parsed > maximum) return [null, `${label} must be from ${minimum} to ${maximum}.`];
  return [parsed, undefined];
}

function parsePeriods(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 1 || parsed > MAX_PERIODS_PER_YEAR) return null;
  return parsed;
}

function parseForm(form: FormState): ParsedForm {
  const price = parseField(form.priceUsd, "Token price", Number.EPSILON, MAX_PRICE_USD, false);
  const start = parseField(form.startTokens, "Starting balance", 0, MAX_TOKENS, false);
  const contribution = parseField(form.contributionTokens, "Contribution", 0, MAX_TOKENS, false);
  const rate = parseField(form.ratePercent, "Rate", 0, MAX_RATE_PERCENT, false);
  const years = parseField(form.years, "Term", MIN_YEARS, MAX_YEARS, false);
  const priceChange = parseField(
    form.annualPriceChangePercent,
    "Annual price change",
    MIN_PRICE_CHANGE_PERCENT,
    MAX_PRICE_CHANGE_PERCENT,
    true,
  );
  const periods = parsePeriods(form.periodsPerYear);
  const errors: FieldErrors = {
    priceUsd: price[1],
    startTokens: start[1],
    contributionTokens: contribution[1],
    ratePercent: rate[1],
    years: years[1],
    annualPriceChangePercent: priceChange[1],
  };
  if (Object.values(errors).some((entry) => typeof entry === "string")) return { input: null, errors };
  if (price[0] === null || start[0] === null || contribution[0] === null) return { input: null, errors };
  if (rate[0] === null || years[0] === null || priceChange[0] === null || periods === null) return { input: null, errors };
  if (start[0] === 0 && contribution[0] === 0) {
    return { input: null, errors: { ...errors, startTokens: "Enter a starting balance or a contribution above zero." } };
  }
  return {
    input: {
      startTokens: start[0],
      contributionTokens: contribution[0],
      ratePercent: rate[0],
      periodsPerYear: periods,
      years: years[0],
      priceUsd: price[0],
      annualPriceChangePercent: priceChange[0],
    },
    errors,
  };
}

function usd(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits }).format(value);
}

function tokens(value: number): string {
  if (!Number.isFinite(value)) return "Not available";
  if (Math.abs(value) >= 1e12) return value.toExponential(4);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
}

function ratePercent(fraction: number | null): string {
  if (fraction === null || !Number.isFinite(fraction)) return "Not available";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(fraction * 100)}%`;
}

function signedPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Not available";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, signDisplay: "exceptZero" }).format(value);
  return `${formatted}%`;
}

function points(value: number): string {
  if (!Number.isFinite(value)) return "an unknown number of";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3, signDisplay: "exceptZero" }).format(value);
}

function millions(value: number): string {
  if (!Number.isFinite(value)) return "Not available";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  return `${(value / 1e6).toFixed(0)}M`;
}

function Field({ name, label, value, error, hint, onChange }: {
  readonly name: FieldName;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly hint?: string;
  readonly onChange: (name: FieldName, value: string) => void;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const described = error ? errorId : hint ? hintId : undefined;
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
        aria-describedby={described}
        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
      />
      {error && <span id={errorId} className="mt-2 block text-sm text-negative">{error}</span>}
      {!error && hint && <span id={hintId} className="mt-2 block text-xs leading-relaxed text-text-tertiary">{hint}</span>}
    </label>
  );
}

function SelectRow({ id, label, value, hint, children, onChange }: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly children: ReactNode;
  readonly onChange: (value: string) => void;
}) {
  const hintId = `${id}-hint`;
  return (
    <label className="block text-sm text-text-secondary" htmlFor={id}>
      <span className="mb-2 block font-medium text-text-primary">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint ? hintId : undefined}
        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 text-base text-text-primary outline-none transition-colors focus:border-amber"
      >
        {children}
      </select>
      {hint && <span id={hintId} className="mt-2 block text-xs leading-relaxed text-text-tertiary">{hint}</span>}
    </label>
  );
}

function ResultTile({ label, value, tone, note }: {
  readonly label: string;
  readonly value: string;
  readonly tone?: "positive" | "negative";
  readonly note?: string;
}) {
  const color = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-text-primary";
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className={`mt-2 break-words font-mono text-xl font-semibold ${color}`}>{value}</dd>
      {note && <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{note}</p>}
    </div>
  );
}

function Results({ result, symbol }: { readonly result: CompoundResult; readonly symbol: string }) {
  const dollarTone = result.finalValueUsd > result.contributedValueUsd ? "positive" : result.finalValueUsd < result.contributedValueUsd ? "negative" : undefined;
  return (
    <div aria-live="polite" aria-atomic="true">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultTile label={`Token balance at the end, in ${symbol}`} value={tokens(result.finalTokens)} tone="positive" note="This leg grows at the rate you entered and does not depend on price." />
        <ResultTile label="Dollar value at the end" value={usd(result.finalValueUsd)} tone={dollarTone} note="Token balance multiplied by the price your assumption produces." />
        <ResultTile label={`Total put in, in ${symbol}`} value={tokens(result.contributedTokens)} note={`Worth ${usd(result.contributedValueUsd)} at the entry price.`} />
        <ResultTile label={`Interest earned, in ${symbol}`} value={tokens(result.interestTokens)} tone="positive" note={`Worth ${usd(result.finalTokens > 0 ? result.interestTokens * result.finalPriceUsd : 0)} at the ending price.`} />
        <ResultTile label="Break even annual price change" value={ratePercent(result.breakEvenAnnualPriceChange)} note="Below this yearly price change the dollar value ends under the dollars put in, even though the token count rose." />
        <ResultTile label="Effective annual rate" value={ratePercent(result.effectiveAnnualRate)} note={`${result.periods} compounding periods over the term.`} />
      </dl>
      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-border-subtle pt-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-secondary">Dollar value if the price never moves</dt>
          <dd className="mt-1 break-words font-mono text-text-primary">{usd(result.flatPriceValueUsd)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Ending price under your assumption</dt>
          <dd className="mt-1 break-words font-mono text-text-primary">{usd(result.finalPriceUsd, 6)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Price decline that cancels the rate</dt>
          <dd className="mt-1 break-words font-mono text-text-primary">{ratePercent(result.yieldCancellingPriceChange)}</dd>
        </div>
        <div>
          <dt className="text-text-secondary">Rate applied each period</dt>
          <dd className="mt-1 break-words font-mono text-text-primary">{ratePercent(result.ratePerPeriod)}</dd>
        </div>
      </dl>
    </div>
  );
}

function YearTable({ rows, symbol }: { readonly rows: readonly CompoundYearRow[]; readonly symbol: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary">Year by year, both legs</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
        The token column only ever rises while the rate is above zero. The dollar column follows your price assumption and can fall while the token column rises.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Year</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">{symbol} balance</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">{symbol} put in</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">{symbol} earned</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Price</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Dollar value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.elapsedYears} className="border-b border-border-subtle last:border-0">
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{row.elapsedYears}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{tokens(row.tokens)}</td>
                <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{tokens(row.contributedTokens)}</td>
                <td className="px-2 py-3 font-mono text-positive sm:px-3">{tokens(row.interestTokens)}</td>
                <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{usd(row.priceUsd, 6)}</td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{usd(row.valueUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PoolDetail({ pool }: { readonly pool: PoolOption }) {
  const rewardShare = pool.apy > 0 && pool.apyReward !== null ? pool.apyReward / pool.apy : null;
  const drift = pool.apyMean30d === null ? null : pool.apy - pool.apyMean30d;
  return (
    <div className="mt-5 rounded-xl border border-border-subtle bg-bg-primary p-4">
      <p className="text-sm font-medium text-text-primary">{pool.symbol} on {pool.project}, {pool.chain}{pool.stablecoin ? ", a stablecoin pool" : ""}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <div><dt className="text-text-secondary">Value locked</dt><dd className="mt-1 font-mono text-text-primary">{millions(pool.tvlUsd)}</dd></div>
        <div><dt className="text-text-secondary">Base rate</dt><dd className="mt-1 font-mono text-text-primary">{pool.apyBase === null ? "Not reported" : `${pool.apyBase.toFixed(3)}%`}</dd></div>
        <div><dt className="text-text-secondary">Reward rate</dt><dd className="mt-1 font-mono text-text-primary">{pool.apyReward === null ? "Not reported" : `${pool.apyReward.toFixed(3)}%`}</dd></div>
        <div><dt className="text-text-secondary">30 day mean</dt><dd className="mt-1 font-mono text-text-primary">{pool.apyMean30d === null ? "Not reported" : `${pool.apyMean30d.toFixed(3)}%`}</dd></div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
        {rewardShare === null
          ? "This pool reports no reward component, so the whole rate is a base rate."
          : `Emissions supply ${(rewardShare * 100).toFixed(1)}% of this rate, and an issuer can switch that part off.`}
        {" "}
        {drift === null
          ? "No 30 day mean is published for this pool, so there is nothing to compare the current rate against."
          : `The current rate sits ${points(drift)} rate points against its own 30 day mean.`}
      </p>
    </div>
  );
}

function ChangeCell({ value }: { readonly value: number | null }) {
  if (value === null) {
    return <td className="px-2 py-3 font-mono text-text-tertiary sm:px-3">Not available</td>;
  }
  const tone = value > 0 ? "text-positive" : value < 0 ? "text-negative" : "text-text-primary";
  return <td className={`px-2 py-3 font-mono sm:px-3 ${tone}`}>{signedPercent(value)}</td>;
}

function RealityCheck({ asset, bitcoin, years, annualPriceChangePercent, universeFetchedAt }: {
  readonly asset: AssetOption;
  readonly bitcoin: AssetOption;
  readonly years: number | null;
  readonly annualPriceChangePercent: number | null;
  readonly universeFetchedAt: string;
}) {
  const rows: readonly AssetOption[] = asset.symbol === bitcoin.symbol ? [bitcoin] : [asset, bitcoin];
  const horizon = years === null || annualPriceChangePercent === null
    ? "Correct the inputs to compare the projection against measured windows."
    : `The projection above runs for ${years} years at an assumed ${signedPercent(annualPriceChangePercent)} a year. The columns below are what these assets actually did over the windows the source serves.`;
  return (
    <div className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary">Measured price change against your assumption</h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{horizon}</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Asset</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">24 hours</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">7 days</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">30 days</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">200 days</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">1 year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-b border-border-subtle last:border-0">
                <th scope="row" className="px-2 py-3 text-left font-medium text-text-primary sm:px-3">{row.name}</th>
                <ChangeCell value={row.change24h} />
                <ChangeCell value={row.change7d} />
                <ChangeCell value={row.change30d} />
                <ChangeCell value={row.change200d} />
                <ChangeCell value={row.change1y} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
        A window shown as not available means the source published no figure for it, and nothing has been substituted. The source serves 24 hour, 7 day, 30 day, 200 day and 1 year windows only. Prices fetched {universeFetchedAt.slice(0, 19).replace("T", " ")} UTC.
      </p>
    </div>
  );
}

export default function CompoundInterestCalculator({ snapshot }: { readonly snapshot: CompoundSnapshot }) {
  const [form, setForm] = useState<FormState>(() => initialForm(snapshot));
  const parsed = useMemo(() => parseForm(form), [form]);
  const result = useMemo(() => (parsed.input === null ? null : projectCompound(parsed.input)), [parsed.input]);
  const asset = useMemo(
    () => snapshot.assets.find((row) => row.symbol === form.assetSymbol) ?? snapshot.bitcoin,
    [snapshot, form.assetSymbol],
  );
  const pool = useMemo(
    () => snapshot.pools.find((row) => row.key === form.poolKey) ?? null,
    [snapshot, form.poolKey],
  );

  const updateField = (name: FieldName, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const selectAsset = (symbol: string) => setForm((current) => {
    const next = snapshot.assets.find((row) => row.symbol === symbol);
    if (next === undefined) return current;
    return { ...current, assetSymbol: next.symbol, priceUsd: String(next.priceUsd) };
  });

  const selectPool = (key: string) => setForm((current) => {
    if (key === CUSTOM_POOL) return { ...current, poolKey: CUSTOM_POOL };
    const next = snapshot.pools.find((row) => row.key === key);
    if (next === undefined) return current;
    const matched = snapshot.assets.find((row) => row.symbol === next.symbol);
    return {
      ...current,
      poolKey: next.key,
      ratePercent: next.apy.toFixed(4),
      periodsPerYear: "1",
      assetSymbol: matched === undefined ? current.assetSymbol : matched.symbol,
      priceUsd: matched === undefined ? current.priceUsd : String(matched.priceUsd),
    };
  });

  return (
    <section className="mt-16" aria-labelledby="calculator-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span>
            <h2 id="calculator-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Compound the token, then price it</h2>
          </div>
          <p className="font-mono text-xs leading-relaxed text-text-secondary">
            Rates fetched <time dateTime={snapshot.yieldFetchedAt}>{snapshot.yieldFetchedAt.slice(0, 19).replace("T", " ")}</time> UTC
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <SelectRow
              id="pool-select"
              label="Prefill the rate from a live pool"
              value={form.poolKey}
              hint="Rates come from the build time snapshot. Choosing a pool sets compounding to once a year because a quoted APY is already compounded."
              onChange={selectPool}
            >
              {snapshot.pools.map((option) => <option key={option.key} value={option.key}>{poolLabel(option)}</option>)}
              <option value={CUSTOM_POOL}>Type my own rate</option>
            </SelectRow>

            <SelectRow
              id="asset-select"
              label="Price the position in"
              value={form.assetSymbol}
              hint="Sets the entry price and the measured windows shown below."
              onChange={selectAsset}
            >
              {snapshot.assets.map((option) => <option key={option.symbol} value={option.symbol}>{option.name} ({option.symbol})</option>)}
            </SelectRow>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field name="startTokens" label={`Starting balance in ${asset.symbol}`} value={form.startTokens} error={parsed.errors.startTokens} onChange={updateField} />
              <Field name="contributionTokens" label={`Added each period in ${asset.symbol}`} value={form.contributionTokens} error={parsed.errors.contributionTokens} onChange={updateField} />
              <Field name="ratePercent" label="Annual rate percent" value={form.ratePercent} error={parsed.errors.ratePercent} onChange={updateField} />
              <Field name="years" label="Term in years" value={form.years} error={parsed.errors.years} onChange={updateField} />
              <Field name="priceUsd" label={`${asset.symbol} price in USD`} value={form.priceUsd} error={parsed.errors.priceUsd} onChange={updateField} />
              <Field name="annualPriceChangePercent" label="Annual price change percent" value={form.annualPriceChangePercent} error={parsed.errors.annualPriceChangePercent} hint="Your own assumption. Zero holds the price flat." onChange={updateField} />
            </div>

            <SelectRow
              id="periods-select"
              label="Compounding periods a year"
              value={form.periodsPerYear}
              hint="Leave this at once a year when the rate came from a quoted APY. A higher setting treats the entered rate as nominal and compounds it again."
              onChange={(value) => setForm((current) => ({ ...current, periodsPerYear: value }))}
            >
              {PERIOD_CHOICES.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
            </SelectRow>

            {pool !== null && <PoolDetail pool={pool} />}
          </div>

          <div>
            {result === null
              ? <div aria-live="polite" className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">{parsed.input === null ? "Correct the highlighted inputs to calculate a result." : "This combination runs past the bounds the model will report. Lower the rate, the term or the compounding frequency."}</div>
              : <Results result={result} symbol={asset.symbol} />}
          </div>
        </div>
      </div>

      {result !== null && <YearTable rows={result.rows} symbol={asset.symbol} />}
      <RealityCheck
        asset={asset}
        bitcoin={snapshot.bitcoin}
        years={parsed.input === null ? null : parsed.input.years}
        annualPriceChangePercent={parsed.input === null ? null : parsed.input.annualPriceChangePercent}
        universeFetchedAt={snapshot.universeFetchedAt}
      />
    </section>
  );
}
