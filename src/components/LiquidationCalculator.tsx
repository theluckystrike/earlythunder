"use client";

import { useMemo, useState } from "react";
import {
  MAX_LEVERAGE,
  MAX_MAINTENANCE_MARGIN_PERCENT,
  MAX_POSITION_SIZE_USD,
  MAX_PRICE_USD,
  MAX_TOKENS,
  MIN_LEVERAGE,
  WINDOW_LABELS,
  WINDOW_ORDER,
  calculateLiquidation,
  compareWindows,
  largestMeasuredMoveFraction,
  liquidationDistanceFraction,
  maxSafeLeverage,
  readWindow,
  tallySurvival,
  type ChangeWindow,
  type LiquidationInput,
  type LiquidationResult,
  type LiquidationSnapshot,
  type LiquidationToken,
  type MarginMode,
  type PositionSide,
  type SurvivalTally,
  type WindowComparison,
} from "@/lib/liquidation-math";

interface CalculatorProps {
  readonly snapshot: LiquidationSnapshot;
}

type NumericField = "entryPrice" | "positionSizeUsd" | "leverage" | "maintenanceMarginPercent" | "extraBalanceUsd";

interface FormState {
  readonly symbol: string;
  readonly side: PositionSide;
  readonly marginMode: MarginMode;
  readonly entryPrice: string;
  readonly positionSizeUsd: string;
  readonly leverage: string;
  readonly maintenanceMarginPercent: string;
  readonly extraBalanceUsd: string;
}

interface ParsedForm {
  readonly input: LiquidationInput | null;
  readonly errors: Readonly<Partial<Record<NumericField, string>>>;
}

const MAX_TEXT_LENGTH = 24;
const MAX_SURVIVAL_ROWS = 24;
const DECIMAL_PATTERN = /^(?:\d+(?:\.\d{0,12})?|\.\d{1,12})$/;
const DEFAULT_MAINTENANCE_PERCENT = "0.5";
const DEFAULT_POSITION_SIZE = "1000";
const DEFAULT_LEVERAGE = "10";

/** Narrows a select value to a known window, falling back to the 30 day one. */
function toChangeWindow(value: string): ChangeWindow {
  for (let i = 0; i < WINDOW_ORDER.length && i < 8; i += 1) {
    if (WINDOW_ORDER[i] === value) return WINDOW_ORDER[i];
  }
  return "change30d";
}

function priceToField(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "0";
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

function firstToken(snapshot: LiquidationSnapshot): LiquidationToken | null {
  if (snapshot.tokens.length === 0) return null;
  return snapshot.tokens[0];
}

function findToken(snapshot: LiquidationSnapshot, symbol: string): LiquidationToken | null {
  const ceiling = snapshot.tokens.length > MAX_TOKENS ? MAX_TOKENS : snapshot.tokens.length;
  for (let i = 0; i < ceiling; i += 1) {
    if (snapshot.tokens[i].symbol === symbol) return snapshot.tokens[i];
  }
  return null;
}

function initialForm(snapshot: LiquidationSnapshot): FormState {
  const token = firstToken(snapshot);
  return {
    symbol: token === null ? "" : token.symbol,
    side: "long",
    marginMode: "isolated",
    entryPrice: token === null ? "0" : priceToField(token.price),
    positionSizeUsd: DEFAULT_POSITION_SIZE,
    leverage: DEFAULT_LEVERAGE,
    maintenanceMarginPercent: DEFAULT_MAINTENANCE_PERCENT,
    extraBalanceUsd: "0",
  };
}

function parseField(value: string, label: string, minimum: number, maximum: number): [number | null, string?] {
  if (value.length === 0) return [null, `${label} is required.`];
  if (value.length > MAX_TEXT_LENGTH) return [null, `${label} is too long.`];
  if (DECIMAL_PATTERN.test(value) === false) return [null, `${label} must be a number with up to 12 decimals.`];
  const parsed = Number(value);
  if (Number.isFinite(parsed) === false) return [null, `${label} must be finite.`];
  if (parsed < minimum || parsed > maximum) {
    const floor = minimum === Number.EPSILON ? "greater than 0" : `at least ${minimum}`;
    return [null, `${label} must be ${floor} and no more than ${maximum}.`];
  }
  return [parsed];
}

function parseForm(form: FormState): ParsedForm {
  const entry = parseField(form.entryPrice, "Entry price", Number.EPSILON, MAX_PRICE_USD);
  const size = parseField(form.positionSizeUsd, "Position size", Number.EPSILON, MAX_POSITION_SIZE_USD);
  const leverage = parseField(form.leverage, "Leverage", MIN_LEVERAGE, MAX_LEVERAGE);
  const maintenance = parseField(form.maintenanceMarginPercent, "Maintenance margin rate", 0, MAX_MAINTENANCE_MARGIN_PERCENT);
  const extra = parseField(form.extraBalanceUsd, "Free wallet balance", 0, MAX_POSITION_SIZE_USD);
  const errors = {
    entryPrice: entry[1],
    positionSizeUsd: size[1],
    leverage: leverage[1],
    maintenanceMarginPercent: maintenance[1],
    extraBalanceUsd: extra[1],
  };
  if (Object.values(errors).some(Boolean)) return { input: null, errors };
  if (entry[0] === null || size[0] === null || leverage[0] === null) return { input: null, errors };
  if (maintenance[0] === null || extra[0] === null) return { input: null, errors };
  return {
    input: {
      side: form.side,
      marginMode: form.marginMode,
      entryPrice: entry[0],
      positionSizeUsd: size[0],
      leverage: leverage[0],
      maintenanceMarginPercent: maintenance[0],
      extraBalanceUsd: extra[0],
    },
    errors,
  };
}

function usd(value: number): string {
  const decimals = Math.abs(value) < 0.01 && Boolean(value) ? 8 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function percentOfOne(fraction: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(fraction * 100)}%`;
}

function signedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

function quantityText(value: number): string {
  if (Math.abs(value) < 1e-8 && Boolean(value)) return value.toExponential(6);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value);
}

function Field({ name, label, value, error, hint, onChange }: {
  readonly name: NumericField;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly hint?: string;
  readonly onChange: (name: NumericField, value: string) => void;
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
      {error
        ? <span id={errorId} className="mt-2 block text-sm text-negative">{error}</span>
        : hint
          ? <span id={hintId} className="mt-2 block text-xs text-text-tertiary">{hint}</span>
          : null}
    </label>
  );
}

function Toggle<T extends string>({ legend, options, value, onChange, name }: {
  readonly legend: string;
  readonly name: string;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T;
  readonly onChange: (next: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-text-primary">{legend}</legend>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm transition-colors ${value === option.value ? "bg-bg-elevated text-text-primary" : "text-text-secondary"}`}
          >
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
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

function Results({ result, input, safeText }: {
  readonly result: LiquidationResult;
  readonly input: LiquidationInput;
  readonly safeText: string;
}) {
  return (
    <div aria-live="polite" aria-atomic="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultTile
          label={`Liquidation price, ${input.side}`}
          value={result.unreachable ? "Below zero, unreachable" : usd(result.liquidationPrice)}
          tone={input.side === "long" ? "negative" : "positive"}
        />
        <ResultTile label="Distance from entry" value={percentOfOne(result.distanceFraction)} />
        <ResultTile label="Distance in dollars" value={usd(result.distanceUsd)} />
        <ResultTile label="Margin lost at liquidation" value={usd(result.marginLostUsd)} tone="negative" />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-subtle pt-6 text-sm sm:grid-cols-3">
        <Breakdown label="Token quantity" value={quantityText(result.quantity)} />
        <Breakdown label="Position notional" value={usd(input.positionSizeUsd)} />
        <Breakdown label="Initial margin" value={usd(result.initialMarginUsd)} />
        <Breakdown label="Maintenance requirement" value={usd(result.maintenanceMarginUsd)} />
        <Breakdown label="Free balance counted" value={usd(result.extraBalanceUsd)} />
        <Breakdown label="Highest leverage that clears every window" value={safeText} />
      </dl>
    </div>
  );
}

function WindowRow({ row, distanceFraction }: {
  readonly row: WindowComparison;
  readonly distanceFraction: number;
}) {
  if (row.changePercent === null || row.absoluteMovePercent === null) {
    return (
      <tr className="border-b border-border-subtle last:border-0">
        <td className="break-words px-2 py-3 text-text-primary sm:px-3">{row.label}</td>
        <td className="break-words px-2 py-3 font-mono text-text-tertiary sm:px-3">Not available</td>
        <td className="break-words px-2 py-3 font-mono text-text-tertiary sm:px-3">Not available</td>
        <td className="break-words px-2 py-3 text-text-tertiary sm:px-3">Excluded</td>
      </tr>
    );
  }
  return (
    <tr className="border-b border-border-subtle last:border-0">
      <td className="break-words px-2 py-3 text-text-primary sm:px-3">{row.label}</td>
      <td className={`break-words px-2 py-3 font-mono sm:px-3 ${row.changePercent >= 0 ? "text-positive" : "text-negative"}`}>
        {signedPercent(row.changePercent)}
      </td>
      <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">
        {signedPercent(Math.abs(row.changePercent)).replace("+", "")}
      </td>
      <td className={`break-words px-2 py-3 sm:px-3 ${row.exceedsDistance ? "text-negative" : "text-text-secondary"}`}>
        {row.exceedsDistance ? `Reached ${percentOfOne(distanceFraction)}` : "Did not reach it"}
      </td>
    </tr>
  );
}

function TokenContext({ token, result, comparisons }: {
  readonly token: LiquidationToken;
  readonly result: LiquidationResult;
  readonly comparisons: readonly WindowComparison[];
}) {
  const evaluated = comparisons.filter((row) => row.changePercent !== null).length;
  const breached = comparisons.filter((row) => row.exceedsDistance).length;
  const athDrawdown = Math.abs(token.fromAllTimeHighPercent) / 100;
  const athReached = athDrawdown >= result.distanceFraction;
  return (
    <section className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6" aria-labelledby="context-heading">
      <h3 id="context-heading" className="text-lg font-semibold text-text-primary">
        What {token.symbol} has already done
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
        The position is liquidated after a move of {percentOfOne(result.distanceFraction)} against it. These are the
        measured changes {token.name} recorded in the five windows the source serves, with the sign kept so the
        direction is visible and the absolute size compared against the liquidation distance.
      </p>
      <p className="mt-4 text-[1.0625rem] font-medium leading-relaxed text-text-primary">
        {evaluated === 0
          ? "The source served no change reading for this token in any of the five windows, so no window comparison is possible."
          : `${breached} of the ${evaluated} windows with a reading already contain a move at least as large as the liquidation distance.`}
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
          <caption className="sr-only">Measured price changes for {token.name} against the liquidation distance</caption>
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Window</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Change</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Size</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Against the distance</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row) => (
              <WindowRow key={row.window} row={row} distanceFraction={result.distanceFraction} />
            ))}
            <tr className="border-b border-border-subtle last:border-0">
              <td className="break-words px-2 py-3 text-text-primary sm:px-3">From all-time high</td>
              <td className="break-words px-2 py-3 font-mono text-negative sm:px-3">
                {signedPercent(token.fromAllTimeHighPercent)}
              </td>
              <td className="break-words px-2 py-3 font-mono text-text-primary sm:px-3">
                {signedPercent(athDrawdown * 100).replace("+", "")}
              </td>
              <td className={`break-words px-2 py-3 sm:px-3 ${athReached ? "text-negative" : "text-text-secondary"}`}>
                {athReached ? `Reached ${percentOfOne(result.distanceFraction)}` : "Did not reach it"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
        All-time high {usd(token.allTimeHigh)} on {token.allTimeHighDate.slice(0, 10)}. A past move of a given size is a
        record of what happened. It is not a probability that the same move repeats.
      </p>
    </section>
  );
}

function Fundamentals({ token, scorecardUpdatedAt }: {
  readonly token: LiquidationToken;
  readonly scorecardUpdatedAt: string;
}) {
  const matched = token.score !== null && token.verdict !== null;
  return (
    <section className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6" aria-labelledby="fundamentals-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h3 id="fundamentals-heading" className="text-lg font-semibold text-text-primary">
          Early Thunder research on {token.symbol}
        </h3>
        <p className="font-mono text-xs text-text-secondary">
          Dated research snapshot, <time dateTime={scorecardUpdatedAt}>{scorecardUpdatedAt.slice(0, 10)}</time>
        </p>
      </div>
      {matched ? (
        <>
          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResultTile label="Composite score" value={`${token.score} of ${token.maxScore}`} />
            <ResultTile label="Verdict" value={token.verdict === null ? "Not scored" : token.verdict} />
            <ResultTile
              label="Exchange depth sub score"
              value={token.exchangeDepth === null ? "Not scored" : `${token.exchangeDepth} of 10`}
            />
          </dl>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {token.exchangeDepth === null || token.exchangeDepthMedian === null
              ? "The exchange depth sub score is absent for this token, so no depth comparison is shown."
              : `The universe median exchange depth sub score is ${token.exchangeDepthMedian} of 10. Thin depth is the mechanism that turns one forced close into a cascade, because the liquidation engine sells into a book that cannot absorb it and the next position down the ladder is hit by the print that follows.`}
          </p>
        </>
      ) : (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
          Not scored. {token.symbol} has no row in the 251 token research file, so no score, verdict or exchange depth
          reading is available for it here.
        </p>
      )}
    </section>
  );
}

function SurvivalTable({ tokens, window, tally, distanceFraction, leverage, onWindowChange }: {
  readonly tokens: readonly LiquidationToken[];
  readonly window: ChangeWindow;
  readonly tally: SurvivalTally;
  readonly distanceFraction: number;
  readonly leverage: number;
  readonly onWindowChange: (next: ChangeWindow) => void;
}) {
  const rows = useMemo(() => {
    const withReading: { readonly token: LiquidationToken; readonly move: number }[] = [];
    const ceiling = tokens.length > MAX_TOKENS ? MAX_TOKENS : tokens.length;
    for (let i = 0; i < ceiling; i += 1) {
      const change = readWindow(tokens[i], window);
      if (change === null || !Number.isFinite(change)) continue;
      withReading.push({ token: tokens[i], move: Math.abs(change) });
    }
    withReading.sort((left, right) => right.move - left.move);
    return withReading.slice(0, MAX_SURVIVAL_ROWS);
  }, [tokens, window]);

  return (
    <section className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6" aria-labelledby="survival-heading">
      <h3 id="survival-heading" className="text-lg font-semibold text-text-primary">
        How often the whole universe already moved that far
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
        At {leverage}x the liquidation distance is {percentOfOne(distanceFraction)}. This counts the non stablecoin
        tokens in the embedded snapshot whose measured {WINDOW_LABELS[window]} change was at least that large, in either
        direction. It is a backward looking frequency over one window, not a probability that a future position is
        liquidated.
      </p>
      <label className="mt-6 block max-w-xs text-sm text-text-secondary">
        <span className="mb-2 block font-medium text-text-primary">Measurement window</span>
        <select
          value={window}
          onChange={(event) => onWindowChange(toChangeWindow(event.target.value))}
          className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
        >
          {WINDOW_ORDER.map((option) => (
            <option key={option} value={option}>{WINDOW_LABELS[option]}</option>
          ))}
        </select>
      </label>
      <p aria-live="polite" className="mt-6 text-[1.0625rem] leading-relaxed text-text-primary">
        {tally.breached} of {tally.evaluated} tokens moved at least {percentOfOne(distanceFraction)} over the measured
        {" "}{WINDOW_LABELS[window]} window, which is{" "}
        {tally.breachedShare === null ? "not computable" : percentOfOne(tally.breachedShare)} of the tokens with a
        reading. {tally.excluded} tokens were excluded because the source served no {WINDOW_LABELS[window]} change for
        them.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
          <caption className="sr-only">
            Largest measured {WINDOW_LABELS[window]} moves in the embedded universe
          </caption>
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Token</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Change</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Reached the distance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const change = readWindow(row.token, window);
              const reached = row.move / 100 >= distanceFraction;
              return (
                <tr key={row.token.symbol} className="border-b border-border-subtle last:border-0">
                  <td className="break-words px-2 py-3 text-text-primary sm:px-3">
                    {row.token.symbol}
                    <span className="ml-2 text-text-tertiary">{row.token.name}</span>
                  </td>
                  <td className={`break-words px-2 py-3 font-mono sm:px-3 ${change !== null && change >= 0 ? "text-positive" : "text-negative"}`}>
                    {change === null ? "Not available" : signedPercent(change)}
                  </td>
                  <td className={`break-words px-2 py-3 sm:px-3 ${reached ? "text-negative" : "text-text-secondary"}`}>
                    {reached ? "Yes" : "No"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
        The table lists the {rows.length} largest absolute moves in this window. The counts above cover every token in
        the snapshot, not only the listed rows.
      </p>
    </section>
  );
}

export default function LiquidationCalculator({ snapshot }: CalculatorProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(snapshot));
  const [survivalWindow, setSurvivalWindow] = useState<ChangeWindow>("change30d");

  const token = useMemo(() => findToken(snapshot, form.symbol), [snapshot, form.symbol]);
  const parsed = useMemo(() => parseForm(form), [form]);
  const result = useMemo(
    () => (parsed.input === null ? null : calculateLiquidation(parsed.input)),
    [parsed.input],
  );
  const comparisons = useMemo(
    () => (token === null || result === null ? null : compareWindows(token, result.distanceFraction)),
    [token, result],
  );
  const safeText = useMemo(() => {
    if (token === null || parsed.input === null) return "Not available";
    const largest = largestMeasuredMoveFraction(token);
    if (largest === null) return "No measured window, not available";
    const safe = maxSafeLeverage(largest, parsed.input.maintenanceMarginPercent);
    if (safe === null) return "Below 1x, no allowed leverage clears it";
    return `${safe}x`;
  }, [token, parsed.input]);
  const tally = useMemo(() => {
    if (result === null) return null;
    return tallySurvival(snapshot.tokens, survivalWindow, result.distanceFraction);
  }, [snapshot.tokens, survivalWindow, result]);

  const updateField = (name: NumericField, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const selectToken = (symbol: string) => {
    const next = findToken(snapshot, symbol);
    setForm((current) => ({
      ...current,
      symbol,
      entryPrice: next === null ? current.entryPrice : priceToField(next.price),
    }));
  };

  const distanceAtLeverage = useMemo(() => {
    if (parsed.input === null) return null;
    return liquidationDistanceFraction(
      parsed.input.leverage,
      parsed.input.maintenanceMarginPercent,
      parsed.input.marginMode === "cross" ? parsed.input.extraBalanceUsd : 0,
      parsed.input.positionSizeUsd,
    );
  }, [parsed.input]);

  return (
    <section className="mt-16" aria-labelledby="calculator-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span>
            <h2 id="calculator-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
              Compute the liquidation level
            </h2>
          </div>
          <p className="font-mono text-xs leading-relaxed text-text-secondary">
            Prices embedded <time dateTime={snapshot.fetchedAt}>{snapshot.fetchedAt.slice(0, 10)}</time>
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <label className="block text-sm text-text-secondary">
              <span className="mb-2 block font-medium text-text-primary">Token</span>
              <select
                name="symbol"
                value={form.symbol}
                onChange={(event) => selectToken(event.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
              >
                {snapshot.tokens.map((row) => (
                  <option key={row.symbol} value={row.symbol}>{row.symbol} {row.name}</option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-text-tertiary">
                Selecting a token refills the entry price with its embedded price.
              </span>
            </label>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Toggle
                legend="Direction"
                name="side"
                value={form.side}
                options={[{ value: "long", label: "Long" }, { value: "short", label: "Short" }]}
                onChange={(side: PositionSide) => setForm((current) => ({ ...current, side }))}
              />
              <Toggle
                legend="Margin mode"
                name="marginMode"
                value={form.marginMode}
                options={[{ value: "isolated", label: "Isolated" }, { value: "cross", label: "Cross" }]}
                onChange={(marginMode: MarginMode) => setForm((current) => ({ ...current, marginMode }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field name="entryPrice" label="Entry price in USD" value={form.entryPrice} error={parsed.errors.entryPrice} onChange={updateField} />
              <Field name="positionSizeUsd" label="Position size in USD" value={form.positionSizeUsd} error={parsed.errors.positionSizeUsd} onChange={updateField} />
              <Field name="leverage" label="Leverage" value={form.leverage} error={parsed.errors.leverage} hint="1 to 125" onChange={updateField} />
              <Field name="maintenanceMarginPercent" label="Maintenance margin rate percent" value={form.maintenanceMarginPercent} error={parsed.errors.maintenanceMarginPercent} hint="0 to 50, tier dependent on every venue" onChange={updateField} />
              {form.marginMode === "cross" && (
                <Field name="extraBalanceUsd" label="Free wallet balance in USD" value={form.extraBalanceUsd} error={parsed.errors.extraBalanceUsd} hint="Counted only in cross margin" onChange={updateField} />
              )}
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              The maintenance requirement is applied to the entry notional. Funding payments, the venue mark price
              method, closing fees and slippage are all outside this model.
            </p>
          </div>
          <div>
            {result !== null && parsed.input !== null
              ? <Results result={result} input={parsed.input} safeText={safeText} />
              : <div aria-live="polite" className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">Correct the highlighted inputs to calculate a result.</div>}
          </div>
        </div>
      </div>
      {token !== null && result !== null && comparisons !== null && (
        <TokenContext token={token} result={result} comparisons={comparisons} />
      )}
      {tally !== null && distanceAtLeverage !== null && parsed.input !== null && (
        <SurvivalTable
          tokens={snapshot.tokens}
          window={survivalWindow}
          tally={tally}
          distanceFraction={distanceAtLeverage}
          leverage={parsed.input.leverage}
          onWindowChange={setSurvivalWindow}
        />
      )}
      {token !== null && <Fundamentals token={token} scorecardUpdatedAt={snapshot.scorecardUpdatedAt} />}
    </section>
  );
}
