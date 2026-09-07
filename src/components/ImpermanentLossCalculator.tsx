"use client";

import { useMemo, useState } from "react";
import {
  IL_WINDOWS,
  WINDOW_LABELS,
  impermanentLossFromChanges,
  positionOutcome,
  type IlWindow,
  type PositionOutcome,
} from "@/lib/impermanent-loss";

export interface IlToken {
  readonly symbol: string;
  readonly name: string;
  readonly isStablecoin: boolean;
  readonly change24h: number | null;
  readonly change7d: number | null;
  readonly change30d: number | null;
  readonly change200d: number | null;
  readonly change1y: number | null;
}

interface CalculatorProps {
  readonly tokens: readonly IlToken[];
  readonly fetchedAt: string;
  readonly defaultSymbolA: string;
  readonly defaultSymbolB: string;
  readonly defaultWindow: IlWindow;
}

type SourceMode = "measured" | "manual";

interface FormState {
  readonly source: SourceMode;
  readonly symbolA: string;
  readonly symbolB: string;
  readonly window: IlWindow;
  readonly positionUsd: string;
  readonly manualA: string;
  readonly manualB: string;
}

type TextField = "positionUsd" | "manualA" | "manualB";

const MAX_TEXT_LENGTH = 24;
const MAX_POSITION_USD = 1_000_000_000_000;
const MAX_MANUAL_CHANGE = 100_000;
const MIN_MANUAL_CHANGE = -100;
const UNSIGNED_PATTERN = /^(?:\d+(?:\.\d{0,8})?|\.\d{1,8})$/;
const SIGNED_PATTERN = /^-?(?:\d+(?:\.\d{0,8})?|\.\d{1,8})$/;

function changeForWindow(token: IlToken, window: IlWindow): number | null {
  if (window === "24h") return token.change24h;
  if (window === "7d") return token.change7d;
  if (window === "30d") return token.change30d;
  if (window === "200d") return token.change200d;
  return token.change1y;
}

function findToken(tokens: readonly IlToken[], symbol: string): IlToken | null {
  if (typeof symbol !== "string" || symbol.length === 0) return null;
  for (const token of tokens) {
    if (token.symbol === symbol) return token;
  }
  return null;
}

function parseUnsigned(value: string, label: string, minimum: number, maximum: number): [number | null, string?] {
  if (value.length === 0) return [null, `${label} is required.`];
  if (value.length > MAX_TEXT_LENGTH) return [null, `${label} is too long.`];
  if (UNSIGNED_PATTERN.test(value) === false) return [null, `${label} must be a number with up to 8 decimals.`];
  const number = Number(value);
  if (Number.isFinite(number) === false) return [null, `${label} must be finite.`];
  if (number < minimum || number > maximum) return [null, `${label} must be greater than 0 and no more than ${maximum}.`];
  return [number];
}

function parseSigned(value: string, label: string): [number | null, string?] {
  if (value.length === 0) return [null, `${label} is required.`];
  if (value.length > MAX_TEXT_LENGTH) return [null, `${label} is too long.`];
  if (SIGNED_PATTERN.test(value) === false) return [null, `${label} must be a number with up to 8 decimals.`];
  const number = Number(value);
  if (Number.isFinite(number) === false) return [null, `${label} must be finite.`];
  if (number < MIN_MANUAL_CHANGE || number > MAX_MANUAL_CHANGE) {
    return [null, `${label} must be from ${MIN_MANUAL_CHANGE} to ${MAX_MANUAL_CHANGE}.`];
  }
  if (number === MIN_MANUAL_CHANGE) return [null, `${label} of minus 100 percent leaves no price ratio to compute.`];
  return [number];
}

function usd(value: number): string {
  const magnitude = Math.abs(value);
  const decimals = magnitude > 0 && magnitude < 0.01 ? 6 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function percentFromFraction(fraction: number, digits = 2): string {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(fraction * 100)}%`;
}

function percentFromPercent(value: number, digits = 2): string {
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`;
}

function ratioText(value: number): string {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
}

function TextInput({ name, label, value, error, hint, onChange }: {
  readonly name: TextField;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly hint?: string;
  readonly onChange: (name: TextField, value: string) => void;
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
        : hint ? <span id={hintId} className="mt-2 block text-xs text-text-tertiary">{hint}</span> : null}
    </label>
  );
}

function TokenSelect({ id, label, value, tokens, onChange }: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tokens: readonly IlToken[];
  readonly onChange: (symbol: string) => void;
}) {
  return (
    <label htmlFor={id} className="block text-sm text-text-secondary">
      <span className="mb-2 block font-medium text-text-primary">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
      >
        {tokens.map((token) => (
          <option key={token.symbol} value={token.symbol}>
            {token.symbol} {token.name}
          </option>
        ))}
      </select>
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

function Outcome({ outcome, changeA, changeB, labelA, labelB }: {
  readonly outcome: PositionOutcome;
  readonly changeA: number;
  readonly changeB: number;
  readonly labelA: string;
  readonly labelB: string;
}) {
  const tone = outcome.ilFraction < 0 ? "negative" : undefined;
  return (
    <div aria-live="polite" aria-atomic="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultTile label="Impermanent loss" value={percentFromFraction(outcome.ilFraction, 4)} tone={tone} />
        <ResultTile label="LP behind holding" value={usd(outcome.lpMinusHoldUsd)} tone={tone} />
        <ResultTile label="Value of the LP position" value={usd(outcome.lpValue)} />
        <ResultTile label="Value of simply holding" value={usd(outcome.holdValue)} />
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border-subtle pt-6 text-sm sm:grid-cols-3">
        <Breakdown label={`${labelA} change`} value={percentFromPercent(changeA)} />
        <Breakdown label={`${labelB} change`} value={percentFromPercent(changeB)} />
        <Breakdown label="Price ratio r" value={ratioText(outcome.priceRatio)} />
        <Breakdown label="Starting position" value={usd(outcome.startValue)} />
        <Breakdown label="LP return" value={percentFromFraction(outcome.lpReturnFraction)} />
        <Breakdown label="Hold return" value={percentFromFraction(outcome.holdReturnFraction)} />
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-text-secondary">
        Fees, rewards and gas are excluded. The position starts split evenly by value across the two assets and the loss is only realised on withdrawal.
      </p>
    </div>
  );
}

function Notice({ text }: { readonly text: string }) {
  return (
    <div aria-live="polite" className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">
      {text}
    </div>
  );
}

export default function ImpermanentLossCalculator({
  tokens,
  fetchedAt,
  defaultSymbolA,
  defaultSymbolB,
  defaultWindow,
}: CalculatorProps) {
  const [form, setForm] = useState<FormState>({
    source: "measured",
    symbolA: defaultSymbolA,
    symbolB: defaultSymbolB,
    window: defaultWindow,
    positionUsd: "10000",
    manualA: "50",
    manualB: "0",
  });

  const tokenA = useMemo(() => findToken(tokens, form.symbolA), [tokens, form.symbolA]);
  const tokenB = useMemo(() => findToken(tokens, form.symbolB), [tokens, form.symbolB]);

  const position = useMemo(
    () => parseUnsigned(form.positionUsd, "Position size", Number.EPSILON, MAX_POSITION_USD),
    [form.positionUsd],
  );
  const manualA = useMemo(() => parseSigned(form.manualA, "First asset change"), [form.manualA]);
  const manualB = useMemo(() => parseSigned(form.manualB, "Second asset change"), [form.manualB]);

  const measuredA = tokenA === null ? null : changeForWindow(tokenA, form.window);
  const measuredB = tokenB === null ? null : changeForWindow(tokenB, form.window);

  const usingManual = form.source === "manual";
  const changeA = usingManual ? manualA[0] : measuredA;
  const changeB = usingManual ? manualB[0] : measuredB;

  const outcome = useMemo(() => {
    if (position[0] === null || changeA === null || changeB === null) return null;
    return positionOutcome(position[0], changeA, changeB);
  }, [position, changeA, changeB]);

  const windowCoverage = useMemo(() => {
    if (tokenA === null || tokenB === null) return [];
    return IL_WINDOWS.map((window) => {
      const left = changeForWindow(tokenA, window);
      const right = changeForWindow(tokenB, window);
      const loss = left === null || right === null ? null : impermanentLossFromChanges(left, right);
      return { window, loss };
    });
  }, [tokenA, tokenB]);

  const updateText = (name: TextField, value: string) => setForm((current) => ({ ...current, [name]: value }));

  const labelA = usingManual ? "First asset" : form.symbolA;
  const labelB = usingManual ? "Second asset" : form.symbolB;

  let notice: string | null = null;
  if (position[1]) notice = position[1];
  else if (usingManual && manualA[1]) notice = manualA[1];
  else if (usingManual && manualB[1]) notice = manualB[1];
  else if (tokenA === null || tokenB === null) notice = "Select two tokens from the embedded snapshot.";
  else if (!usingManual && measuredA === null) notice = `${form.symbolA} has no measured ${WINDOW_LABELS[form.window]} change in this snapshot, so the pair is excluded from that window.`;
  else if (!usingManual && measuredB === null) notice = `${form.symbolB} has no measured ${WINDOW_LABELS[form.window]} change in this snapshot, so the pair is excluded from that window.`;
  else if (outcome === null) notice = "These inputs leave no finite price ratio, so no result is shown.";

  return (
    <section className="mt-16" aria-labelledby="calculator-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span>
            <h2 id="calculator-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
              Measure a real pair
            </h2>
          </div>
          <p className="font-mono text-xs leading-relaxed text-text-secondary">
            Snapshot fetched <time dateTime={fetchedAt}>{fetchedAt}</time>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text-primary">Price changes</legend>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1">
                {(["measured", "manual"] as const).map((option) => (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm transition-colors ${form.source === option ? "bg-bg-elevated text-text-primary" : "text-text-secondary"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="source"
                      value={option}
                      checked={form.source === option}
                      onChange={() => setForm((current) => ({ ...current, source: option }))}
                    />
                    {option === "measured" ? "Measured moves" : "Type your own"}
                  </label>
                ))}
              </div>
            </fieldset>

            {usingManual === false && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TokenSelect id="token-a" label="First asset" value={form.symbolA} tokens={tokens} onChange={(symbol) => setForm((current) => ({ ...current, symbolA: symbol }))} />
                <TokenSelect id="token-b" label="Second asset" value={form.symbolB} tokens={tokens} onChange={(symbol) => setForm((current) => ({ ...current, symbolB: symbol }))} />
                <label htmlFor="window-select" className="block text-sm text-text-secondary sm:col-span-2">
                  <span className="mb-2 block font-medium text-text-primary">Window</span>
                  <select
                    id="window-select"
                    value={form.window}
                    onChange={(event) => setForm((current) => ({ ...current, window: event.target.value as IlWindow }))}
                    className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
                  >
                    {IL_WINDOWS.map((window) => <option key={window} value={window}>{WINDOW_LABELS[window]}</option>)}
                  </select>
                </label>
              </div>
            )}

            {usingManual && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextInput name="manualA" label="First asset change percent" value={form.manualA} error={manualA[1]} hint="Use a minus sign for a fall." onChange={updateText} />
                <TextInput name="manualB" label="Second asset change percent" value={form.manualB} error={manualB[1]} hint="Zero keeps the second asset flat." onChange={updateText} />
              </div>
            )}

            <TextInput name="positionUsd" label="Position size in USD" value={form.positionUsd} error={position[1]} hint="Split evenly across the two assets at the start." onChange={updateText} />

            <p className="text-sm leading-relaxed text-text-secondary">
              Measured moves come from the build snapshot embedded in this page. Your browser makes no market data request.
            </p>
          </div>

          <div>{outcome && notice === null && changeA !== null && changeB !== null
            ? <Outcome outcome={outcome} changeA={changeA} changeB={changeB} labelA={labelA} labelB={labelB} />
            : <Notice text={notice ?? "Adjust the inputs to calculate a result."} />}
          </div>
        </div>
      </div>

      {usingManual === false && tokenA !== null && tokenB !== null && (
        <div className="mt-8 rounded-2xl border border-border-subtle bg-bg-secondary p-6">
          <h3 className="text-lg font-semibold text-text-primary">{form.symbolA} against {form.symbolB} across every window</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            The same pair measured over each window the snapshot serves. A window with no figure means one side of the pair carries no change for that period.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[22rem] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-text-secondary">
                  <th scope="col" className="px-2 py-3 font-medium sm:px-3">Window</th>
                  <th scope="col" className="px-2 py-3 font-medium sm:px-3">Impermanent loss</th>
                </tr>
              </thead>
              <tbody>
                {windowCoverage.map((entry) => (
                  <tr key={entry.window} className="border-b border-border-subtle last:border-0">
                    <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{WINDOW_LABELS[entry.window]}</td>
                    <td className={`px-2 py-3 font-mono sm:px-3 ${entry.loss === null ? "text-text-tertiary" : entry.loss < 0 ? "text-negative" : "text-text-primary"}`}>
                      {entry.loss === null ? "Not available" : percentFromFraction(entry.loss, 4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
