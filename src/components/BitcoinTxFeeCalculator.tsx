"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_MIN_RELAY_TX_FEE_SAT_PER_KVB,
  feeSats as feeSatsFor,
  feeUsd,
  INPUT_SIZES,
  InputType,
  MAX_STANDARD_TX_WEIGHT,
  OUTPUT_SIZES,
  OutputType,
  parseCount,
  parseInput,
  parseRate,
  satPerVbyteFromUsd,
  SIZE_PRESETS,
  txSize,
} from "@/lib/bitcoin-tx-fee";

const fmt = (n: number, d: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

const fmtBudget = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });

const INPUT_TYPES: InputType[] = ["P2PKH", "P2SH-P2WPKH", "P2WPKH", "P2TR"];
const OUTPUT_TYPES: OutputType[] = ["P2PKH", "P2SH", "P2WPKH", "P2TR"];

export default function BitcoinTxFeeCalculator({ btcUsd, priceDate }: { btcUsd: number; priceDate: string }) {
  const [rate, setRate] = useState("20");
  const [usdIn, setUsdIn] = useState("1.00");
  const [inputs, setInputs] = useState<Record<InputType, string>>({ P2PKH: "0", "P2SH-P2WPKH": "0", P2WPKH: "1", P2TR: "0" });
  const [outputs, setOutputs] = useState<Record<OutputType, string>>({ P2PKH: "0", P2SH: "0", P2WPKH: "2", P2TR: "0" });

  const BAD_RATE = "Enter a fee rate above 0 and up to 1,000,000,000 sat/vB, with at most 3 decimals.";
  const BAD_COUNT = "Enter a whole number from 0 to 10,000 in each count. Use at least 1 input and 1 output.";
  const BAD_USD = "Enter a USD amount above 0 and up to 1,000,000,000.";
  const r = parseRate(rate);
  const u = parseInput(usdIn, 1_000_000_000);
  const { inCounts, outCounts, countsBad } = useMemo(() => {
    const inC: Partial<Record<InputType, number>> = {};
    const outC: Partial<Record<OutputType, number>> = {};
    let bad = false;
    for (const t of INPUT_TYPES) {
      const v = parseCount(inputs[t], 10_000);
      if (v === null) bad = true; else if (v > 0) inC[t] = v;
    }
    for (const t of OUTPUT_TYPES) {
      const v = parseCount(outputs[t], 10_000);
      if (v === null) bad = true; else if (v > 0) outC[t] = v;
    }
    return { inCounts: inC, outCounts: outC, countsBad: bad };
  }, [inputs, outputs]);

  const sz = useMemo(() => (countsBad || Object.keys(inCounts).length === 0 || Object.keys(outCounts).length === 0 ? null : txSize(inCounts, outCounts)), [inCounts, outCounts, countsBad]);

  const out = useMemo(() => {
    if (r === null || !sz) return null;
    const sats = feeSatsFor(r, sz.vsize);
    return { sats, btc: sats / 100_000_000, usd: feeUsd(sats, btcUsd) };
  }, [r, sz, btcUsd]);

  const back = useMemo(() => {
    if (u === null || !sz) return null;
    return satPerVbyteFromUsd(u, sz.vsize, btcUsd);
  }, [u, sz, btcUsd]);

  const overStandard = sz !== null && sz.weight > MAX_STANDARD_TX_WEIGHT;
  const belowMinRelay = r !== null && Math.round(r * 1000) < DEFAULT_MIN_RELAY_TX_FEE_SAT_PER_KVB;

  return (
    <section className="mt-12 rounded-2xl border border-border-subtle bg-bg-secondary p-6" aria-labelledby="fee-calc-heading">
      <h2 id="fee-calc-heading" className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Calculate the fee</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block text-sm text-text-secondary">
          Fee rate (sat/vB)
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
      </div>

      <h3 className="mt-8 text-lg font-semibold text-text-primary">Inputs</h3>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {INPUT_TYPES.map((t) => (
          <label key={t} className="block text-sm text-text-secondary">
            {t} count ({INPUT_SIZES[t].base} base + {INPUT_SIZES[t].witness} witness bytes each)
            <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber" inputMode="numeric" value={inputs[t]} onChange={(e) => setInputs({ ...inputs, [t]: e.target.value })} />
          </label>
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text-secondary">P2PKH, P2SH-P2WPKH and P2WPKH input sizes depend on the ECDSA signature length. This page uses 107 bytes of signature and key data, the size that GetDustThreshold uses: a 72-byte signature with its sighash byte, a 33-byte compressed key and 2 length bytes. A 71-byte signature makes a P2PKH input 1 byte smaller and a P2SH-P2WPKH or P2WPKH input 1 witness byte smaller. A P2TR key path input uses a 64-byte signature (SIGHASH_DEFAULT). When an input has witness data, the transaction adds 2 bytes for the marker and the flag, and each P2PKH input adds 1 empty witness byte.</p>

      <h3 className="mt-8 text-lg font-semibold text-text-primary">Outputs</h3>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {OUTPUT_TYPES.map((t) => (
          <label key={t} className="block text-sm text-text-secondary">
            {t} count ({OUTPUT_SIZES[t]} bytes each)
            <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber" inputMode="numeric" value={outputs[t]} onChange={(e) => setOutputs({ ...outputs, [t]: e.target.value })} />
          </label>
        ))}
      </div>

      <p aria-live="polite" className="mt-5 rounded-xl border border-border-subtle bg-bg-primary p-4 font-mono text-sm text-text-primary" data-testid="size-out">
        {sz ? (
          <>{fmt(sz.weight, 0)} weight units, {fmt(sz.vsize, 0)} vB (base size {fmt(sz.baseSize, 0)} bytes, total size {fmt(sz.totalSize, 0)} bytes){overStandard ? ". Above the standard limit of 400,000 weight units. Nodes with default policy reject it as tx-size." : ""}</>
        ) : (
          BAD_COUNT
        )}
      </p>

      <p aria-live="polite" className="mt-5 rounded-xl border border-border-subtle bg-bg-primary p-4 font-mono text-sm text-text-primary" data-testid="fee-out">
        {out ? (
          <>{fmt(out.sats, 0)} sats = {out.btc.toFixed(8)} BTC ≈ ${fmt(out.usd, 4)} at ${fmt(btcUsd, 0)}/BTC (price time {priceDate}){belowMinRelay ? ". This rate is below the default minimum relay fee rate of 0.1 sat/vB (DEFAULT_MIN_RELAY_TX_FEE, 100 sat/kvB)." : ""}</>
        ) : r === null ? BAD_RATE : BAD_COUNT}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block text-sm text-text-secondary">
          Fee budget (USD)
          <input className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-primary px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-amber" inputMode="decimal" value={usdIn} onChange={(e) => setUsdIn(e.target.value)} />
        </label>
      </div>
      <p aria-live="polite" className="mt-5 rounded-xl border border-border-subtle bg-bg-primary p-4 font-mono text-sm text-text-primary" data-testid="rate-out">
        {back !== null && sz ? (
          back >= 0.001 ? (
            <>A ${fmtBudget(u as number)} budget fits a fee rate of up to {fmt(back, 3)} sat/vB for a {fmt(sz.vsize, 0)} vB transaction (rounded down to 0.001 sat/vB).</>
          ) : (
            <>A ${fmtBudget(u as number)} budget is too small for a fee rate of 0.001 sat/vB on a {fmt(sz.vsize, 0)} vB transaction.</>
          )
        ) : u === null ? BAD_USD : BAD_COUNT}
      </p>

      <h3 className="mt-8 text-lg font-semibold text-text-primary">Common spend sizes</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-secondary">
        {SIZE_PRESETS.map((p) => (
          <li key={p.label}>{p.label}, {p.vsize} vB. {p.note}</li>
        ))}
      </ul>
    </section>
  );
}
