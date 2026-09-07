"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_DEPTH,
  DEFAULT_WINDOW,
  MAX_DEPTH,
  MIN_COMPARABLE,
  MIN_SPLIT_HALF,
  SEASON_DEPTHS,
  SEASON_WINDOWS,
  bandLabel,
  buildContributors,
  buildDepthCurve,
  computeFundamentalsSplit,
  computeSeasonIndex,
  formatIndexValue,
  formatSignedPercent,
  windowLabel,
  type FundamentalsSplit,
  type SeasonContributor,
  type SeasonIndex,
  type SeasonRow,
  type SeasonWindow,
} from "@/lib/altcoin-season";

export interface SeasonSnapshot {
  /** ISO timestamp of the single build time market fetch. */
  readonly fetchedAt: string;
  /** ISO timestamp carried by the altcoin scorecard research file. */
  readonly scorecardUpdatedAt: string | null;
  readonly bitcoin: SeasonRow;
  readonly rows: readonly SeasonRow[];
  /** Ticker to fundamental score pairs, already joined to the embedded rows. */
  readonly scores: readonly (readonly [string, number])[];
}

interface FormState {
  readonly window: SeasonWindow;
  readonly depth: string;
  readonly minMargin: string;
}

interface ParsedForm {
  readonly depth: number | null;
  readonly minMargin: number | null;
  readonly errors: Readonly<{ depth?: string; minMargin?: string }>;
}

const MAX_DEPTH_TEXT_LENGTH = 3;
const MAX_MARGIN_TEXT_LENGTH = 12;
const DEPTH_PATTERN = /^\d{1,3}$/;
const MARGIN_PATTERN = /^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/;
const MIN_DEPTH_INPUT = 2;
const MAX_MARGIN_INPUT = 1000;
/** Bounded render. A user typed depth cannot grow the table without limit. */
const MAX_VISIBLE_ROWS = 60;

function parseDepth(value: string): [number | null, string?] {
  if (value.length === 0) return [null, "Depth is required."];
  if (value.length > MAX_DEPTH_TEXT_LENGTH) return [null, "Depth is too long."];
  if (DEPTH_PATTERN.test(value) === false) return [null, "Depth must be a whole number."];
  const parsed = Number(value);
  if (Number.isInteger(parsed) === false) return [null, "Depth must be a whole number."];
  if (parsed < MIN_DEPTH_INPUT || parsed > MAX_DEPTH) return [null, `Depth must be from ${MIN_DEPTH_INPUT} to ${MAX_DEPTH}.`];
  return [parsed];
}

function parseMargin(value: string): [number | null, string?] {
  if (value.length === 0) return [null, "Minimum margin is required."];
  if (value.length > MAX_MARGIN_TEXT_LENGTH) return [null, "Minimum margin is too long."];
  if (MARGIN_PATTERN.test(value) === false) return [null, "Minimum margin must be a number with up to 4 decimals."];
  const parsed = Number(value);
  if (Number.isFinite(parsed) === false) return [null, "Minimum margin must be finite."];
  if (parsed < 0 || parsed > MAX_MARGIN_INPUT) return [null, `Minimum margin must be from 0 to ${MAX_MARGIN_INPUT}.`];
  return [parsed];
}

function parseForm(form: FormState): ParsedForm {
  const depth = parseDepth(form.depth);
  const margin = parseMargin(form.minMargin);
  return { depth: depth[0], minMargin: margin[0], errors: { depth: depth[1], minMargin: margin[1] } };
}

function toneFor(band: string): string {
  if (band === "altcoin-season") return "text-positive";
  if (band === "bitcoin-season") return "text-amber";
  return "text-text-primary";
}

function integer(value: number): string {
  if (!Number.isFinite(value)) return "not available";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function NumberField({ name, label, value, hint, error, onChange, maxLength, mode }: {
  readonly name: "depth" | "minMargin";
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly error?: string;
  readonly onChange: (name: "depth" | "minMargin", value: string) => void;
  readonly maxLength: number;
  readonly mode: "numeric" | "decimal";
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <label className="block text-sm text-text-secondary">
      <span className="mb-2 block font-medium text-text-primary">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        inputMode={mode}
        maxLength={maxLength}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hintId}
        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
      />
      {error
        ? <span id={errorId} className="mt-2 block text-sm text-negative">{error}</span>
        : <span id={hintId} className="mt-2 block text-sm text-text-secondary">{hint}</span>}
    </label>
  );
}

function WindowControl({ lookback, onChange }: {
  readonly lookback: SeasonWindow;
  readonly onChange: (window: SeasonWindow) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-text-primary">Lookback window</legend>
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1 sm:grid-cols-5">
        {SEASON_WINDOWS.map((option) => (
          <label
            key={option}
            className={`cursor-pointer rounded-lg px-2 py-2 text-center font-mono text-sm transition-colors ${lookback === option ? "bg-bg-elevated text-text-primary" : "text-text-secondary"}`}
          >
            <input className="sr-only" type="radio" name="season-window" value={option} checked={lookback === option} onChange={() => onChange(option)} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Headline({ index, lookback, depth }: {
  readonly index: SeasonIndex | null;
  readonly lookback: SeasonWindow;
  readonly depth: number | null;
}) {
  if (index === null || depth === null) {
    return (
      <div aria-live="polite" className="rounded-2xl border border-negative/40 bg-negative/10 p-6 text-sm leading-relaxed text-negative">
        No index for this selection. The window needs at least {MIN_COMPARABLE} assets carrying a price change inside the chosen depth, and this one does not have them.
      </div>
    );
  }
  return (
    <div aria-live="polite" aria-atomic="true" className="rounded-2xl border border-border-subtle bg-bg-card p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
        Top {integer(depth)} altcoins over {windowLabel(lookback)}
      </p>
      <p className={`mt-3 font-mono text-5xl font-semibold leading-none ${toneFor(index.band)}`}>{formatIndexValue(index.value)}</p>
      <p className="mt-3 text-lg font-semibold text-text-primary">{bandLabel(index.band)}</p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {integer(index.beat)} of {integer(index.comparable)} assets beat Bitcoin, which moved {formatSignedPercent(index.bitcoinChange)} over the same window.
        {index.excluded > 0 ? ` ${integer(index.excluded)} assets in the slice carried no change for this window and were dropped from both sides of the ratio.` : " Every asset in the slice carried a change for this window."}
      </p>
    </div>
  );
}

function DepthLadder({ lookback, points }: {
  readonly lookback: SeasonWindow;
  readonly points: readonly { readonly depth: number; readonly index: SeasonIndex | null }[];
}) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary">Breadth by depth over {windowLabel(lookback)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        The same ratio recomputed at five cut off points. A reading that falls as the depth grows means the outperformance sits in the largest assets only.
      </p>
      <ul className="mt-5 space-y-3">
        {points.map((point) => {
          const value = point.index === null ? null : point.index.value;
          return (
            <li key={point.depth} className="flex items-center gap-3">
              <span className="w-16 shrink-0 font-mono text-xs text-text-secondary">Top {point.depth}</span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-primary">
                <span
                  className="block h-2 rounded-full bg-amber"
                  style={{ width: value === null ? "0%" : `${Math.max(0, Math.min(100, value))}%` }}
                />
              </span>
              <span className="w-28 shrink-0 text-right font-mono text-xs text-text-primary">
                {point.index === null ? "not available" : `${formatIndexValue(value)} (${point.index.beat}/${point.index.comparable})`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SplitPanel({ split, scorecardUpdatedAt }: {
  readonly split: FundamentalsSplit | null;
  readonly scorecardUpdatedAt: string | null;
}) {
  const dated = scorecardUpdatedAt === null ? "an undated research file" : `the research snapshot dated ${scorecardUpdatedAt.slice(0, 10)}`;
  if (split === null) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <h3 className="text-lg font-semibold text-text-primary">Split by fundamental score</h3>
        <p className="mt-5 rounded-xl border border-border-subtle bg-bg-card p-4 text-sm leading-relaxed text-text-secondary">
          Waiting on a valid depth. Correct the depth field and the split recomputes.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary">Split by fundamental score in the top {integer(split.depth)}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Assets in the slice are joined on ticker symbol to {dated}, then split at the median score. Both halves are priced live, and the scores themselves are not.
      </p>
      {split.meaningful && split.aboveMedian && split.belowMedian ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
              <p className="text-sm text-text-secondary">Above the median score</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">{formatIndexValue(split.aboveMedian.value)}</p>
              <p className="mt-2 font-mono text-xs text-text-secondary">{split.aboveMedian.beat} of {split.aboveMedian.comparable} beat Bitcoin</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
              <p className="text-sm text-text-secondary">Below the median score</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">{formatIndexValue(split.belowMedian.value)}</p>
              <p className="mt-2 font-mono text-xs text-text-secondary">{split.belowMedian.beat} of {split.belowMedian.comparable} beat Bitcoin</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            {integer(split.matched)} assets in the slice matched a scored token, {integer(split.halfSize)} to a half, at a median score of {split.medianScore === null ? "not available" : split.medianScore.toFixed(1)}.
            The higher scoring half reads {formatIndexValue(split.aboveMedian.value)} against {formatIndexValue(split.belowMedian.value)}, a gap of {Math.abs(Math.round((split.aboveMedian.value - split.belowMedian.value) * 10) / 10).toFixed(1)} index points.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-xl border border-border-subtle bg-bg-card p-4 text-sm leading-relaxed text-text-secondary">
          Not meaningful at this depth. Only {integer(split.matched)} assets in the slice matched a scored token, which leaves {integer(split.halfSize)} per half against a floor of {MIN_SPLIT_HALF}. Raise the depth to widen the join rather than read a share off a thin sample.
        </p>
      )}
    </div>
  );
}

function ContributorTable({ contributors, lookback, hidden }: {
  readonly contributors: readonly SeasonContributor[];
  readonly lookback: SeasonWindow;
  readonly hidden: number;
}) {
  if (contributors.length === 0) {
    return (
      <p aria-live="polite" className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 text-sm leading-relaxed text-text-secondary">
        No asset in the slice clears the margin filter over {windowLabel(lookback)}.
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
      <h3 className="text-lg font-semibold text-text-primary">Assets ranked by margin over Bitcoin</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Margin is the asset percentage change minus the Bitcoin percentage change over {windowLabel(lookback)}, in percentage points. Score is the earlythunder research score where the ticker joined, and a dash where it did not.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-secondary">
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Rank</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Asset</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Change</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Margin</th>
              <th scope="col" className="px-2 py-3 font-medium sm:px-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((row) => (
              <tr key={row.symbol} className="border-b border-border-subtle last:border-0">
                <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{integer(row.rank)}</td>
                <td className="px-2 py-3 sm:px-3"><span className="font-mono text-text-primary">{row.symbol}</span><span className="ml-2 hidden text-text-secondary sm:inline">{row.name}</span></td>
                <td className="px-2 py-3 font-mono text-text-primary sm:px-3">{formatSignedPercent(row.change)}</td>
                <td className={`px-2 py-3 font-mono sm:px-3 ${row.margin > 0 ? "text-positive" : "text-negative"}`}>{formatSignedPercent(row.margin)}</td>
                <td className="px-2 py-3 font-mono text-text-secondary sm:px-3">{row.score === null ? "-" : integer(row.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 && (
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          {integer(hidden)} further assets match the filter and are held back to keep the table readable. Narrow the depth or raise the margin filter to see them.
        </p>
      )}
    </div>
  );
}

export default function AltcoinSeasonIndex({ snapshot }: { readonly snapshot: SeasonSnapshot }) {
  const [form, setForm] = useState<FormState>({ window: DEFAULT_WINDOW, depth: String(DEFAULT_DEPTH), minMargin: "0" });
  const parsed = useMemo(() => parseForm(form), [form]);
  const scores = useMemo(() => new Map<string, number>(snapshot.scores.map((pair) => [pair[0], pair[1]])), [snapshot.scores]);
  const depth = parsed.depth;
  const index = useMemo(
    () => (depth === null ? null : computeSeasonIndex(snapshot.rows, snapshot.bitcoin, form.window, depth)),
    [snapshot.rows, snapshot.bitcoin, form.window, depth],
  );
  const ladder = useMemo(
    () => buildDepthCurve(snapshot.rows, snapshot.bitcoin, form.window, SEASON_DEPTHS),
    [snapshot.rows, snapshot.bitcoin, form.window],
  );
  const split = useMemo(
    () => (depth === null ? null : computeFundamentalsSplit(snapshot.rows, snapshot.bitcoin, form.window, depth, scores)),
    [snapshot.rows, snapshot.bitcoin, form.window, depth, scores],
  );
  const filtered = useMemo(() => {
    if (depth === null || parsed.minMargin === null) return [];
    const floor = parsed.minMargin;
    return buildContributors(snapshot.rows, snapshot.bitcoin, form.window, depth, scores)
      .filter((row) => Math.abs(row.margin) >= floor);
  }, [snapshot.rows, snapshot.bitcoin, form.window, depth, parsed.minMargin, scores]);
  const visible = filtered.slice(0, MAX_VISIBLE_ROWS);
  const update = (name: "depth" | "minMargin", value: string) => setForm((current) => ({ ...current, [name]: value }));

  return (
    <section className="mt-16" aria-labelledby="index-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span>
            <h2 id="index-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">Recompute the index</h2>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => setForm({ window: DEFAULT_WINDOW, depth: String(DEFAULT_DEPTH), minMargin: "0" })}
          >
            Reset to top 50 over 30 days
          </button>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <WindowControl lookback={form.window} onChange={(next) => setForm((current) => ({ ...current, window: next }))} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <NumberField
                name="depth" label="Depth by market cap rank" value={form.depth}
                hint={`Whole number from ${MIN_DEPTH_INPUT} to ${MAX_DEPTH}.`}
                error={parsed.errors.depth} onChange={update} maxLength={MAX_DEPTH_TEXT_LENGTH} mode="numeric"
              />
              <NumberField
                name="minMargin" label="Minimum margin filter" value={form.minMargin}
                hint={`Percentage points, 0 to ${MAX_MARGIN_INPUT}. Filters the table only.`}
                error={parsed.errors.minMargin} onChange={update} maxLength={MAX_MARGIN_TEXT_LENGTH} mode="decimal"
              />
            </div>
            <p className="text-sm leading-relaxed text-text-secondary">
              Stablecoins and Bitcoin are both removed before the depth is cut, so a depth of 50 means the 50 largest assets other than Bitcoin. Every figure recomputes from the snapshot embedded at build time on <time dateTime={snapshot.fetchedAt}>{snapshot.fetchedAt.slice(0, 10)}</time>, and your browser makes no market data request.
            </p>
          </div>
          <Headline index={index} lookback={form.window} depth={depth} />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DepthLadder lookback={form.window} points={ladder} />
        <SplitPanel split={split} scorecardUpdatedAt={snapshot.scorecardUpdatedAt} />
      </div>
      <div className="mt-6">
        <ContributorTable contributors={visible} lookback={form.window} hidden={filtered.length - visible.length} />
      </div>
    </section>
  );
}
