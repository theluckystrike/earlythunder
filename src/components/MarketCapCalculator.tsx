"use client";

import { useMemo, useState } from "react";
import {
  compareLegs,
  formatCompactUsd,
  formatMultiple,
  formatPercent,
  formatRank,
  formatSupply,
  formatUsd,
  overhangMultiple,
  supplyBasisLabel,
  type Comparison,
  type Lane,
  type MarketCapRow,
  type MarketCapSnapshot,
  type ShareReading,
} from "@/lib/market-cap-math";

interface CalculatorProps {
  readonly snapshot: MarketCapSnapshot;
}

type ValuationMode = "target" | "custom";

/** Hard ceilings. No loop and no rendered list may exceed these. */
const MAX_SEARCH_LENGTH = 24;
const MAX_VALUATION_LENGTH = 20;
const MAX_OPTIONS = 60;
const MIN_CUSTOM_VALUATION = 1_000;
const MAX_CUSTOM_VALUATION = 1e15;
const DECIMAL_PATTERN = /^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/;

function findRow(rows: readonly MarketCapRow[], id: string): MarketCapRow | null {
  if (typeof id !== "string" || id.length === 0) return null;
  if (rows.length === 0) return null;
  const ceiling = Math.min(rows.length, MAX_OPTIONS * 20);
  for (let index = 0; index < ceiling; index += 1) {
    const row = rows[index];
    if (row.id === id) return row;
  }
  return null;
}

function filterRows(rows: readonly MarketCapRow[], query: string, selectedId: string): readonly MarketCapRow[] {
  if (rows.length === 0) return [];
  const needle = query.trim().toLowerCase().slice(0, MAX_SEARCH_LENGTH);
  const matches: MarketCapRow[] = [];
  const ceiling = Math.min(rows.length, MAX_OPTIONS * 20);
  for (let index = 0; index < ceiling; index += 1) {
    if (matches.length >= MAX_OPTIONS) break;
    const row = rows[index];
    if (needle.length === 0 || row.symbol.toLowerCase().includes(needle) || row.name.toLowerCase().includes(needle)) {
      matches.push(row);
    }
  }
  const selected = findRow(rows, selectedId);
  if (selected !== null && !matches.some((row) => row.id === selected.id)) return [selected, ...matches].slice(0, MAX_OPTIONS);
  return matches;
}

function parseValuation(value: string): [number | null, string?] {
  if (value.length === 0) return [null, "Target market cap is required."];
  if (value.length > MAX_VALUATION_LENGTH) return [null, "Target market cap is too long."];
  if (DECIMAL_PATTERN.test(value) === false) return [null, "Target market cap must be a number with up to 4 decimals."];
  const parsed = Number(value);
  if (Number.isFinite(parsed) === false) return [null, "Target market cap must be finite."];
  if (parsed < MIN_CUSTOM_VALUATION || parsed > MAX_CUSTOM_VALUATION) {
    return [null, `Target market cap must be from ${MIN_CUSTOM_VALUATION} to 1,000,000,000,000,000 USD.`];
  }
  return [parsed];
}

function shareText(share: ShareReading): string {
  if (share.percent === null) return "Not reported";
  const denominator = share.basis === "max" ? "maximum supply" : "total supply";
  return `${formatPercent(share.percent)} of ${denominator}`;
}

function TokenPicker({
  legend,
  rows,
  selectedId,
  query,
  onQuery,
  onSelect,
}: {
  readonly legend: string;
  readonly rows: readonly MarketCapRow[];
  readonly selectedId: string;
  readonly query: string;
  readonly onQuery: (value: string) => void;
  readonly onSelect: (id: string) => void;
}) {
  const options = filterRows(rows, query, selectedId);
  const searchId = `${legend.replace(/\s+/g, "-").toLowerCase()}-search`;
  const selectId = `${legend.replace(/\s+/g, "-").toLowerCase()}-select`;
  const emptyId = `${selectId}-empty`;
  const empty = options.length === 0;
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-medium text-text-primary">{legend}</legend>
      <label className="block text-sm text-text-secondary" htmlFor={searchId}>
        <span className="sr-only">Search tokens for {legend}</span>
      </label>
      <input
        id={searchId}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Search by name or symbol"
        maxLength={MAX_SEARCH_LENGTH}
        autoComplete="off"
        spellCheck={false}
        type="search"
        aria-invalid={empty}
        aria-describedby={empty ? emptyId : undefined}
        className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber"
      />
      <select
        id={selectId}
        value={selectedId}
        onChange={(event) => onSelect(event.target.value)}
        aria-label={legend}
        size={6}
        className="mt-3 w-full rounded-lg border border-border-subtle bg-bg-primary px-2 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-amber"
      >
        {options.map((row) => (
          <option key={row.id} value={row.id}>
            {row.symbol} {row.name.slice(0, 22)} {formatCompactUsd(row.marketCap)}
          </option>
        ))}
      </select>
      {empty && (
        <span id={emptyId} className="mt-2 block text-sm text-negative">
          No token in the embedded snapshot matches that search.
        </span>
      )}
    </fieldset>
  );
}

function Tile({ label, value, note }: { readonly label: string; readonly value: string; readonly note?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="mt-2 break-words font-mono text-xl font-semibold text-text-primary">{value}</dd>
      {note && <p className="mt-2 text-xs leading-relaxed text-text-tertiary">{note}</p>}
    </div>
  );
}

function LanePanel({
  title,
  caption,
  lane,
  tone,
}: {
  readonly title: string;
  readonly caption: string;
  readonly lane: Lane;
  readonly tone: "naive" | "honest";
}) {
  const accent = tone === "honest" ? "border-amber/40" : "border-border-subtle";
  return (
    <div className={`rounded-2xl border ${accent} bg-bg-secondary p-5`}>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{caption}</p>
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tile label="Implied price" value={formatUsd(lane.impliedPrice)} />
        <Tile label="Multiple from today" value={formatMultiple(lane.multiple)} />
        <Tile label="Implied rank" value={formatRank(lane.impliedRank)} />
      </dl>
      <p className="mt-4 font-mono text-xs leading-relaxed text-text-tertiary">
        Target value {formatCompactUsd(lane.targetValuationUsd)} divided by {formatSupply(lane.supplyUnits)} tokens, taken from {supplyBasisLabel(lane.supplyBasis)}.
      </p>
    </div>
  );
}

function HaircutPanel({ comparison }: { readonly comparison: Comparison }) {
  const haircut = comparison.dilutionHaircutPercent;
  if (haircut === null) {
    return (
      <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-tertiary p-5">
        <h3 className="text-lg font-semibold text-text-primary">Dilution haircut</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          One side of this pair does not report a supply figure the fully diluted answer needs, so no haircut is shown. Nothing is estimated in its place.
        </p>
      </div>
    );
  }
  const direction = haircut > 0
    ? "lower than the circulating answer, because the token being repriced still has supply to issue"
    : haircut < 0
      ? "higher than the circulating answer, because the reference token carries the larger supply overhang"
      : "the same as the circulating answer, because both sides are effectively fully circulating";
  return (
    <div className="mt-4 rounded-2xl border border-amber/40 bg-bg-tertiary p-5">
      <h3 className="text-lg font-semibold text-text-primary">Dilution haircut</h3>
      <p className="mt-2 font-mono text-3xl font-semibold text-amber">{formatPercent(haircut)}</p>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
        The fully diluted answer sits {formatPercent(Math.abs(haircut))} {direction}. Sites that print only the circulating figure never show this gap.
      </p>
    </div>
  );
}

function SupplyPanel({
  source,
  target,
  comparison,
}: {
  readonly source: MarketCapRow;
  readonly target: MarketCapRow | null;
  readonly comparison: Comparison;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-secondary p-5">
      <h3 className="text-lg font-semibold text-text-primary">Circulating share of each side</h3>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Tile
          label={`${source.symbol} circulating share`}
          value={shareText(comparison.sourceShare)}
          note={`Fully diluted valuation ${formatCompactUsd(source.fullyDilutedValuation)} against market cap ${formatCompactUsd(source.marketCap)}`}
        />
        <Tile
          label={target === null ? "Reference circulating share" : `${target.symbol} circulating share`}
          value={comparison.targetShare === null ? "Not available" : shareText(comparison.targetShare)}
          note={target === null ? "No reference token selected." : `Overhang ${formatMultiple(overhangMultiple(target))} of circulating market cap`}
        />
      </dl>
    </div>
  );
}

function ScorecardCell({ row }: { readonly row: MarketCapRow | null }) {
  if (row === null) {
    return <p className="mt-2 text-sm text-text-secondary">No token selected.</p>;
  }
  const card = row.scorecard;
  if (card === null) {
    return (
      <p className="mt-2 text-sm text-text-secondary">
        {row.symbol} is not scored. It sits outside the 251 tokens in the research file, so no score, verdict or sub score is shown for it.
      </p>
    );
  }
  return (
    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <div>
        <dt className="text-text-secondary">Score</dt>
        <dd className="mt-1 font-mono text-text-primary">{card.score} of {card.maxScore}</dd>
      </div>
      <div>
        <dt className="text-text-secondary">Verdict</dt>
        <dd className="mt-1 font-mono text-text-primary">{card.verdict}</dd>
      </div>
      <div>
        <dt className="text-text-secondary">Unlock schedule</dt>
        <dd className="mt-1 font-mono text-text-primary">{card.unlockSchedule} of 10</dd>
      </div>
      <div>
        <dt className="text-text-secondary">Circulating to FDV</dt>
        <dd className="mt-1 font-mono text-text-primary">{card.circFdvRatio} of 10</dd>
      </div>
    </dl>
  );
}

function ScorecardPanel({
  source,
  target,
  updatedAt,
}: {
  readonly source: MarketCapRow;
  readonly target: MarketCapRow | null;
  readonly updatedAt: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-border-subtle bg-bg-secondary p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Early Thunder research overlay</h3>
        <p className="font-mono text-xs text-text-secondary">
          Dated research snapshot, <time dateTime={updatedAt}>{updatedAt.slice(0, 10)}</time>
        </p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <h4 className="font-mono text-xs uppercase tracking-wider text-text-secondary">{source.symbol} priced side</h4>
          <ScorecardCell row={source} />
        </div>
        <div className="min-w-0">
          <h4 className="font-mono text-xs uppercase tracking-wider text-text-secondary">
            {target === null ? "Reference side" : `${target.symbol} reference side`}
          </h4>
          <ScorecardCell row={target} />
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-text-tertiary">
        These are fundamentals scores recorded on the stated date, not live values and not a forecast. A higher unlock schedule sub score means less supply still to be issued.
      </p>
    </div>
  );
}

export default function MarketCapCalculator({ snapshot }: CalculatorProps) {
  const rows = snapshot.rows;
  const [sourceId, setSourceId] = useState<string>(snapshot.defaultSourceId);
  const [targetId, setTargetId] = useState<string>(snapshot.defaultTargetId);
  const [sourceQuery, setSourceQuery] = useState<string>("");
  const [targetQuery, setTargetQuery] = useState<string>("");
  const [mode, setMode] = useState<ValuationMode>("target");
  const [customValuation, setCustomValuation] = useState<string>("");

  const source = useMemo(() => findRow(rows, sourceId), [rows, sourceId]);
  const target = useMemo(() => findRow(rows, targetId), [rows, targetId]);
  const parsedCustom = useMemo(() => (mode === "custom" ? parseValuation(customValuation) : [null] as [number | null, string?]), [mode, customValuation]);
  const customError = mode === "custom" ? parsedCustom[1] : undefined;

  const peerMarketCaps = useMemo(() => {
    const caps: number[] = [];
    const ceiling = Math.min(rows.length, MAX_OPTIONS * 20);
    for (let index = 0; index < ceiling; index += 1) {
      const row = rows[index];
      if (row.id !== sourceId) caps.push(row.marketCap);
    }
    return caps;
  }, [rows, sourceId]);

  const comparison = useMemo(() => {
    if (source === null) return null;
    return compareLegs({
      source,
      target: mode === "custom" ? null : target,
      overrideValuationUsd: mode === "custom" ? parsedCustom[0] : null,
      peerMarketCaps,
    });
  }, [source, target, mode, parsedCustom, peerMarketCaps]);

  const ready = source !== null && comparison !== null && comparison.circulating.impliedPrice !== null;
  const targetLabel = mode === "custom" ? "your entered value" : target === null ? "the reference token" : `${target.symbol} at ${formatCompactUsd(target.marketCap)}`;

  return (
    <section className="mt-16" aria-labelledby="calculator-heading">
      <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6">
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Interactive tool</span>
            <h2 id="calculator-heading" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem] md:leading-[1.15]">
              Price one token at another market cap
            </h2>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setSourceId(snapshot.defaultSourceId);
              setTargetId(snapshot.defaultTargetId);
              setSourceQuery("");
              setTargetQuery("");
              setMode("target");
              setCustomValuation("");
            }}
          >
            Reset to the build default
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TokenPicker
            legend="Token to reprice"
            rows={rows}
            selectedId={sourceId}
            query={sourceQuery}
            onQuery={setSourceQuery}
            onSelect={setSourceId}
          />
          <TokenPicker
            legend="Reference market cap"
            rows={rows}
            selectedId={targetId}
            query={targetQuery}
            onQuery={setTargetQuery}
            onSelect={setTargetId}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text-primary">Target value</legend>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle bg-bg-primary p-1">
              {(["target", "custom"] as const).map((option) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-center text-sm transition-colors ${mode === option ? "bg-bg-elevated text-text-primary" : "text-text-secondary"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="valuation-mode"
                    value={option}
                    checked={mode === option}
                    onChange={() => setMode(option)}
                  />
                  {option === "target" ? "Reference token" : "My own value"}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm text-text-secondary">
            <span className="mb-2 block font-medium text-text-primary">Target market cap in USD</span>
            <input
              name="customValuation"
              value={customValuation}
              onChange={(event) => setCustomValuation(event.target.value)}
              onFocus={() => setMode("custom")}
              inputMode="decimal"
              maxLength={MAX_VALUATION_LENGTH}
              autoComplete="off"
              spellCheck={false}
              placeholder="10000000000"
              disabled={mode !== "custom"}
              aria-invalid={Boolean(customError)}
              aria-describedby={customError ? "custom-valuation-error" : undefined}
              className="w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber disabled:opacity-50"
            />
            {customError && (
              <span id="custom-valuation-error" className="mt-2 block text-sm text-negative">
                {customError}
              </span>
            )}
          </label>
        </div>

        <div className="mt-8" aria-live="polite" aria-atomic="true">
          {ready && source !== null && comparison !== null ? (
            <>
              <p className="text-sm leading-relaxed text-text-secondary">
                {source.symbol} priced at {targetLabel}, shown twice. The first answer is the one the ranked calculators give. The second corrects for supply that has not been issued yet.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <LanePanel
                  title="Circulating basis"
                  caption="Reference circulating market cap divided by the circulating supply of the token being repriced. Every ranked competitor stops here."
                  lane={comparison.circulating}
                  tone="naive"
                />
                <LanePanel
                  title="Fully diluted basis"
                  caption="Reference fully diluted valuation divided by the eventual supply of the token being repriced. Only this version survives the supply schedule."
                  lane={comparison.diluted}
                  tone="honest"
                />
              </div>
              <HaircutPanel comparison={comparison} />
              <SupplyPanel source={source} target={mode === "custom" ? null : target} comparison={comparison} />
              <ScorecardPanel source={source} target={mode === "custom" ? null : target} updatedAt={snapshot.scorecardUpdatedAt} />
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                This answer assumes the target valuation is reached with no other token moving, that supply arrives exactly as the reported total or maximum supply says, and that a buyer exists at every price on the way. None of the three is a safe assumption, and the calculation says nothing about whether the market would ever pay that price.
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">
              Choose a token to reprice and either a reference token or a valid target market cap.
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 font-mono text-xs leading-relaxed text-text-secondary">
        Every figure comes from the snapshot embedded in this page at build time, fetched <time dateTime={snapshot.fetchedAt}>{snapshot.fetchedAt}</time>. The browser makes no market data request.
      </p>
    </section>
  );
}
