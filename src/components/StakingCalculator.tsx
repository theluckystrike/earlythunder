"use client";

import { useMemo, useState } from "react";
import {
  COMPOUNDING_CHOICES,
  MAX_AMOUNT_TOKENS,
  MAX_PRICE_USD,
  MAX_RATE_PERCENT,
  MAX_TERM_YEARS,
  calculateStaking,
  type ScorecardScale,
  type StakingInput,
  type StakingPoolOption,
  type StakingResult,
} from "@/lib/staking-math";

interface StakingCalculatorProps {
  readonly pools: readonly StakingPoolOption[];
  readonly snapshotFetchedAt: string;
  readonly scorecardUpdatedAt: string;
  readonly scale: ScorecardScale;
}

type NumericFieldName = "amountTokens" | "apyPercent" | "termYears" | "issuancePercent" | "priceUsd";

interface FormState {
  readonly poolId: string;
  readonly amountTokens: string;
  readonly apyPercent: string;
  readonly termYears: string;
  readonly periodsPerYear: string;
  readonly issuancePercent: string;
  readonly priceUsd: string;
}

type FieldErrors = Readonly<Partial<Record<NumericFieldName, string>>>;

interface ParsedForm {
  readonly input: StakingInput | null;
  readonly errors: FieldErrors;
}

const MAX_TEXT_LENGTH = 24;
const DECIMAL_PATTERN = /^(?:\d+(?:\.\d{0,12})?|\.\d{1,12})$/;
const CUSTOM_POOL_ID = "custom";
const DEFAULT_TERM_YEARS = "5";
const DEFAULT_ISSUANCE = "0";
const DEFAULT_PERIODS = "1";

function findPool(pools: readonly StakingPoolOption[], poolId: string): StakingPoolOption | null {
  if (poolId === CUSTOM_POOL_ID) return null;
  for (const pool of pools) {
    if (pool.id === poolId) return pool;
  }
  return null;
}

function initialForm(pools: readonly StakingPoolOption[]): FormState {
  const first = pools.length > 0 ? pools[0] : null;
  return {
    poolId: first ? first.id : CUSTOM_POOL_ID,
    amountTokens: "100",
    apyPercent: first ? String(Number(first.apy.toFixed(4))) : "5",
    termYears: DEFAULT_TERM_YEARS,
    periodsPerYear: DEFAULT_PERIODS,
    issuancePercent: DEFAULT_ISSUANCE,
    priceUsd: first && first.basePriceUsd !== null ? String(first.basePriceUsd) : "",
  };
}

function parseNumber(
  value: string,
  label: string,
  minimum: number,
  maximum: number,
): readonly [number | null, string | undefined] {
  if (value.length === 0) return [null, `${label} is required.`];
  if (value.length > MAX_TEXT_LENGTH) return [null, `${label} is too long.`];
  if (DECIMAL_PATTERN.test(value) === false) return [null, `${label} must be a number with up to 12 decimals.`];
  const parsed = Number(value);
  if (Number.isFinite(parsed) === false) return [null, `${label} must be finite.`];
  if (parsed < minimum || parsed > maximum) {
    const range = minimum === Number.EPSILON ? `greater than 0 and no more than ${maximum}` : `from ${minimum} to ${maximum}`;
    return [null, `${label} must be ${range}.`];
  }
  return [parsed, undefined];
}

function parseOptionalPrice(value: string): readonly [number | null, string | undefined] {
  if (value.length === 0) return [null, undefined];
  return parseNumber(value, "Token price", 0, MAX_PRICE_USD);
}

function parsePeriods(value: string): number {
  const parsed = Number(value);
  for (const choice of COMPOUNDING_CHOICES) {
    if (choice.periodsPerYear === parsed) return choice.periodsPerYear;
  }
  return 1;
}

function parseForm(form: FormState): ParsedForm {
  const amount = parseNumber(form.amountTokens, "Amount staked", Number.EPSILON, MAX_AMOUNT_TOKENS);
  const apy = parseNumber(form.apyPercent, "Annual rate", 0, MAX_RATE_PERCENT);
  const term = parseNumber(form.termYears, "Term in years", Number.EPSILON, MAX_TERM_YEARS);
  const issuance = parseNumber(form.issuancePercent, "Issuance rate", 0, MAX_RATE_PERCENT);
  const price = parseOptionalPrice(form.priceUsd);
  const errors: FieldErrors = {
    amountTokens: amount[1],
    apyPercent: apy[1],
    termYears: term[1],
    issuancePercent: issuance[1],
    priceUsd: price[1],
  };
  if (amount[0] === null || apy[0] === null || term[0] === null || issuance[0] === null) {
    return { input: null, errors };
  }
  if (price[1] !== undefined) return { input: null, errors };
  return {
    input: {
      amountTokens: amount[0],
      apyPercent: apy[0],
      termYears: term[0],
      periodsPerYear: parsePeriods(form.periodsPerYear),
      issuancePercent: issuance[0],
      priceUsd: price[0],
    },
    errors,
  };
}

function safeCalculate(input: StakingInput | null): { readonly result: StakingResult | null; readonly failure: string | null } {
  if (input === null) return { result: null, failure: null };
  try {
    return { result: calculateStaking(input), failure: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The inputs could not be evaluated.";
    return { result: null, failure: message };
  }
}

function usd(value: number): string {
  const decimals = Math.abs(value) < 0.01 && value !== 0 ? 6 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function usdOrMissing(value: number | null): string {
  return value === null ? "No price sourced" : usd(value);
}

function tokens(value: number): string {
  if (Math.abs(value) < 1e-8 && value !== 0) return value.toExponential(6);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
}

function pct(value: number, digits = 3): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value)}%`;
}

function pctOrMissing(value: number | null, digits = 3): string {
  return value === null ? "Not reported" : pct(value, digits);
}

function compactUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function Field({ name, label, hint, value, error, onChange }: {
  readonly name: NumericFieldName;
  readonly label: string;
  readonly hint?: string;
  readonly value: string;
  readonly error?: string;
  readonly onChange: (name: NumericFieldName, value: string) => void;
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
      {error ? (
        <span id={errorId} className="mt-2 block text-sm text-negative">{error}</span>
      ) : hint ? (
        <span id={hintId} className="mt-2 block text-xs leading-relaxed text-text-tertiary">{hint}</span>
      ) : null}
    </label>
  );
}

function ResultTile({ label, value, tone }: {
  readonly label: string;
  readonly value: string;
  readonly tone?: "positive" | "negative";
}) {
  const color = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-text-primary";
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className={`mt-2 break-words font-mono text-xl font-semibold ${color}`}>{value}</dd>
    </div>
  );
}

function Breakdown({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <dt className="text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words font-mono text-text-primary">{value}</dd>
    </div>
  );
}

function Results({ result, unit }: { readonly result: StakingResult; readonly unit: string }) {
  const realTone = result.realYieldPercent > 0 ? "positive" : result.realYieldPercent < 0 ? "negative" : undefined;
  return (
    <div aria-live="polite" aria-atomic="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultTile label={`Ending balance in ${unit}`} value={tokens(result.endingTokens)} />
        <ResultTile label={`Rewards earned in ${unit}`} value={tokens(result.rewardTokens)} tone="positive" />
        <ResultTile label="Real yield after issuance" value={pct(result.realYieldPercent)} tone={realTone} />
        <ResultTile label="Ending value at the entered price" value={usdOrMissing(result.endingValueUsd)} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-subtle pt-6 text-sm sm:grid-cols-3">
        <Breakdown label="Nominal effective annual" value={pct(result.effectiveAnnualPercent)} />
        <Breakdown label="Rate per period" value={pct(result.periodicRatePercent, 6)} />
        <Breakdown label="Compounding steps" value={new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(result.compoundingSteps)} />
        <Breakdown label="Growth multiple" value={`${result.growthMultiple.toFixed(6)}x`} />
        <Breakdown label="Break even issuance" value={pct(result.breakEvenIssuancePercent)} />
        <Breakdown label="Starting value" value={usdOrMissing(result.startingValueUsd)} />
        <Breakdown label={`Supply share balance in ${unit}`} value={tokens(result.realEndingTokens)} />
        <Breakdown label="Supply share change" value={pct(result.supplyShareChangePercent)} />
        <Breakdown label="Supply share value" value={usdOrMissing(result.realEndingValueUsd)} />
      </dl>
    </div>
  );
}

function ScorecardPanel({ pool, scorecardUpdatedAt, scale }: {
  readonly pool: StakingPoolOption;
  readonly scorecardUpdatedAt: string;
  readonly scale: ScorecardScale;
}) {
  const matched = pool.score !== null && pool.verdict !== null;
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-text-primary">Fundamentals overlay</h3>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
          Research snapshot {scorecardUpdatedAt.slice(0, 10)}
        </span>
      </div>
      {matched ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
          <Breakdown label={`${pool.baseSymbol} score`} value={`${pool.score} of ${scale.compositeMax}`} />
          <Breakdown label="Verdict" value={pool.verdict === null ? "Not scored" : pool.verdict} />
          <Breakdown label="Staking yield sub score" value={pool.stakingYieldScore === null ? "Not scored" : `${pool.stakingYieldScore} of ${scale.subScoreMax}`} />
          <Breakdown label="Supply inflation sub score" value={pool.supplyInflationScore === null ? "Not scored" : `${pool.supplyInflationScore} of ${scale.subScoreMax}`} />
        </dl>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Not scored. The underlying asset for this pool has no row in the 251 token research file, so no score,
          verdict or sub score is shown for it.
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
        Sub scores run to {scale.subScoreMax} and the composite aggregates {scale.variables} variables. They are a
        dated read of fundamentals on the stated date, not a live figure and not a forecast.
      </p>
    </div>
  );
}

function PoolPanel({ pool, scorecardUpdatedAt, scale }: {
  readonly pool: StakingPoolOption;
  readonly scorecardUpdatedAt: string;
  readonly scale: ScorecardScale;
}) {
  const rewardShare = pool.apyReward !== null && pool.apy > 0 ? (pool.apyReward / pool.apy) * 100 : null;
  const drift = pool.apyMean30d !== null ? pool.apy - pool.apyMean30d : null;
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-border-subtle bg-bg-tertiary p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-text-primary">{pool.project} {pool.symbol}</h3>
          <span className="font-mono text-[11px] uppercase tracking-wider text-text-tertiary">{pool.chain}</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <Breakdown label="Total value locked" value={compactUsd(pool.tvlUsd)} />
          <Breakdown label="Headline APY" value={pct(pool.apy)} />
          <Breakdown label="Base APY" value={pctOrMissing(pool.apyBase)} />
          <Breakdown label="Reward APY" value={pctOrMissing(pool.apyReward)} />
          <Breakdown label="Reward share of headline" value={rewardShare === null ? "Not reported" : pct(rewardShare, 2)} />
          <Breakdown label="30 day mean APY" value={pctOrMissing(pool.apyMean30d)} />
          <Breakdown label="Today against 30 day mean" value={drift === null ? "Not reported" : `${drift >= 0 ? "+" : ""}${pct(drift)}`} />
          <Breakdown label="Underlying asset" value={pool.baseSymbol === null ? "Not mapped" : `${pool.baseSymbol}${pool.baseName === null ? "" : ` ${pool.baseName}`}`} />
          <Breakdown label="Spot price used" value={usdOrMissing(pool.basePriceUsd)} />
          <Breakdown label="Undistributed supply" value={pool.overhangPercent === null ? "Not available" : pct(pool.overhangPercent, 2)} />
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
          Base APY is what the pool pays from protocol revenue or consensus rewards. Reward APY is a token emission
          that a protocol can reduce or end. Undistributed supply is the share of total supply that is minted but not
          yet circulating, which is a distribution overhang and not an issuance rate.
        </p>
      </div>
      <ScorecardPanel pool={pool} scorecardUpdatedAt={scorecardUpdatedAt} scale={scale} />
    </div>
  );
}

export default function StakingCalculator({ pools, snapshotFetchedAt, scorecardUpdatedAt, scale }: StakingCalculatorProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(pools));
  const selected = useMemo(() => findPool(pools, form.poolId), [pools, form.poolId]);
  const parsed = useMemo(() => parseForm(form), [form]);
  const evaluated = useMemo(() => safeCalculate(parsed.input), [parsed.input]);
  const unit = selected && selected.baseSymbol !== null ? selected.baseSymbol : "tokens";

  const updateField = (name: NumericFieldName, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const selectPool = (poolId: string) => {
    const pool = findPool(pools, poolId);
    setForm((current) => ({
      ...current,
      poolId,
      apyPercent: pool ? String(Number(pool.apy.toFixed(4))) : current.apyPercent,
      priceUsd: pool ? (pool.basePriceUsd === null ? "" : String(pool.basePriceUsd)) : current.priceUsd,
    }));
  };

  return (
    <section className="mt-16" aria-labelledby="calculator-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span>
            <h2 id="calculator-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
              Nominal reward and real yield
            </h2>
          </div>
          <p className="font-mono text-xs leading-relaxed text-text-secondary">
            Pools fetched <time dateTime={snapshotFetchedAt}>{snapshotFetchedAt.slice(0, 19).replace("T", " ")}</time> UTC
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <label className="block text-sm text-text-secondary">
              <span className="mb-2 block font-medium text-text-primary">Staking pool from the build snapshot</span>
              <select
                name="poolId"
                value={form.poolId}
                onChange={(event) => selectPool(event.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-sm text-text-primary outline-none transition-colors focus:border-amber"
              >
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.project} {pool.symbol} on {pool.chain}, {pool.apy.toFixed(2)}%
                  </option>
                ))}
                <option value={CUSTOM_POOL_ID}>Enter my own rate</option>
              </select>
            </label>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                name="amountTokens"
                label={`Amount staked in ${unit}`}
                value={form.amountTokens}
                error={parsed.errors.amountTokens}
                onChange={updateField}
              />
              <Field
                name="apyPercent"
                label="Annual rate percent"
                value={form.apyPercent}
                error={parsed.errors.apyPercent}
                onChange={updateField}
              />
              <Field
                name="termYears"
                label="Term in years"
                value={form.termYears}
                error={parsed.errors.termYears}
                onChange={updateField}
              />
              <label className="block text-sm text-text-secondary">
                <span className="mb-2 block font-medium text-text-primary">Compounding frequency</span>
                <select
                  name="periodsPerYear"
                  value={form.periodsPerYear}
                  onChange={(event) => setForm((current) => ({ ...current, periodsPerYear: event.target.value }))}
                  className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
                >
                  {COMPOUNDING_CHOICES.map((choice) => (
                    <option key={choice.periodsPerYear} value={String(choice.periodsPerYear)}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                <span className="mt-2 block text-xs leading-relaxed text-text-tertiary">
                  At annual the entered rate is used exactly as quoted. Any higher frequency treats it as a nominal
                  rate and compounds it, which overstates a provider figure that was already annualised.
                </span>
              </label>
              <Field
                name="issuancePercent"
                label="Annual supply issuance percent"
                hint="Left at zero on purpose. No annual issuance rate is fetched for any asset on this page, so nothing is prefilled here."
                value={form.issuancePercent}
                error={parsed.errors.issuancePercent}
                onChange={updateField}
              />
              <Field
                name="priceUsd"
                label="Token price in USD"
                hint="Prefilled from the build time spot price of the underlying asset when one was matched. Clear it to hide the USD columns."
                value={form.priceUsd}
                error={parsed.errors.priceUsd}
                onChange={updateField}
              />
            </div>
          </div>

          <div>
            {evaluated.result ? (
              <Results result={evaluated.result} unit={unit} />
            ) : (
              <div aria-live="polite" className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">
                {evaluated.failure ?? "Correct the highlighted inputs to calculate a result."}
              </div>
            )}
          </div>
        </div>

        {selected && <PoolPanel pool={selected} scorecardUpdatedAt={scorecardUpdatedAt} scale={scale} />}
      </div>
    </section>
  );
}
