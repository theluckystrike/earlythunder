"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ANCHOR_BLOCK,
  eraOf,
  formatBtc,
  formatInt,
  HALVING_INTERVAL,
  issuedThroughSats,
  nextHalvingHeight,
  parseHeight,
  subsidySatsAt,
  ZERO_SUBSIDY_HEIGHT,
} from "@/lib/bitcoin-halving";

function Metric({ label, value, unit, note, wide }: { readonly label: string; readonly value: string; readonly unit?: string; readonly note?: string; readonly wide?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl border border-border-subtle bg-bg-primary p-5${wide ? " sm:col-span-2" : ""}`}>
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="mt-2 break-all font-mono text-base font-semibold text-text-primary min-[380px]:text-lg sm:text-xl md:text-2xl"><span>{value}</span>{unit ? <> <span className="whitespace-nowrap">{unit}</span></> : null}</dd>
      {note ? <p className="mt-2 text-sm leading-relaxed text-text-secondary">{note}</p> : null}
    </div>
  );
}

export default function HalvingTracker() {
  const [raw, setRaw] = useState(String(ANCHOR_BLOCK.height));
  const inputRef = useRef<HTMLInputElement>(null);

  // After the Back button the browser can show a restored page. Read the field again so the result matches it.
  useEffect(() => {
    const sync = () => {
      if (inputRef.current) setRaw(inputRef.current.value);
    };
    window.addEventListener("pageshow", sync);
    return () => window.removeEventListener("pageshow", sync);
  }, []);

  const parsed = useMemo(() => parseHeight(raw), [raw]);

  let body;
  if (parsed.ok) {
    const h = parsed.height;
    const next = nextHalvingHeight(h);
    body = (
      <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric label="Block subsidy" value={formatBtc(subsidySatsAt(h))} unit="BTC" note="New bitcoin that a block at this height can claim" />
        <Metric label="Era" value={formatInt(eraOf(h))} note={`Era = floor(height / ${formatInt(HALVING_INTERVAL)})`} />
        <Metric
          label="Blocks to the next halving"
          wide
          value={next === null ? "None" : formatInt(next - h)}
          note={next === null ? `The subsidy is zero from block ${formatInt(ZERO_SUBSIDY_HEIGHT)}. It does not change after that.` : `Next halving at block ${formatInt(next)}`}
        />
        <Metric
          label="Supply issued by schedule up to this height"
          value={formatBtc(issuedThroughSats(h))}
          unit="BTC"
          wide
          note="Sum of the subsidies for heights 0 to this height, with this height included"
        />
      </dl>
    );
  } else {
    body = <p className="mt-6 text-base text-text-secondary" role="alert">{parsed.message}</p>;
  }

  return (
    <section className="mt-12 grid gap-6 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-sm md:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" aria-label="Halving calculator">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-text-primary">Block height</h2>
        <label className="mt-6 block min-w-0">
          <span className="mb-2 block text-sm font-medium text-text-primary">Block height (0 to {formatInt(HALVING_INTERVAL * 64)})</span>
          <span className="flex min-h-12 w-full min-w-0 max-w-full items-center rounded-xl border border-border-subtle bg-bg-primary px-4 focus-within:border-amber">
            <input
              ref={inputRef}
              className="w-0 min-w-0 flex-1 bg-transparent py-3 font-mono text-base text-text-primary outline-none"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={raw}
              onChange={(event) => setRaw(event.target.value)}
            />
          </span>
        </label>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          The field starts at block {formatInt(ANCHOR_BLOCK.height)}, which has the header timestamp {ANCHOR_BLOCK.timeUtc.replace("T", " ").replace("Z", " UTC")}. You can type commas or spaces. The calculation runs in this browser and sends nothing.
        </p>
      </div>
      <div className="min-w-0 rounded-2xl bg-bg-secondary p-5 md:p-6" aria-live="polite" aria-atomic="true">
        <h2 className="text-xl font-semibold text-text-primary">Schedule at this height</h2>
        {body}
      </div>
    </section>
  );
}
