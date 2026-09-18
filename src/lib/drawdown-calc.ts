// Pure math and copy generators for the Crypto drawdown calculator.
// Deterministic by construction: no Date.now(), no randomness, no I/O.
// Mirrors the style of src/lib/dip-calc.ts and src/lib/dca-backtest.ts.

export const MAX_PRICE = 1_000_000_000_000;
export const MAX_TARGET_PERCENT = 99.99;
export const MAX_DRAWDOWN_PERCENT = 99.99;
export const TABLE_MIN = 10;
export const TABLE_MAX = 90;
export const TABLE_STEP = 10;

export interface DrawdownResult {
  peakPrice: number;
  troughPrice: number;
  drawdownPercent: number;
  recoveryGainPercent: number;
  recoveryMultiple: number;
  recoverTargetPrice: number;
  gainNeededUsd: number;
  priceIsClamped: boolean;
}

export interface RecoveryRow {
  drawdownPercent: number;
  recoveryGainPercent: number;
  recoveryMultiple: number;
  remainingValuePercent: number;
}

export function bounded(raw: number, max: number): number {
  if (Number.isNaN(raw) || raw <= 0) return 0;
  if (raw === Number.POSITIVE_INFINITY) return max;
  return Math.min(raw, max);
}

// Distance below the peak, as a percent of the peak.
// A trough above the peak is clamped to the peak, so the result never goes negative.
export function drawdownPercent(peakPrice: number, troughPrice: number): number {
  const peak = bounded(peakPrice, MAX_PRICE);
  const trough = bounded(troughPrice, MAX_PRICE);
  if (peak <= 0) return 0;
  const usable = Math.min(trough, peak);
  const raw = ((peak - usable) / peak) * 100;
  return Math.min(bounded(raw, MAX_DRAWDOWN_PERCENT), 100);
}

// Gain required to climb from the trough back to the peak, as a percent.
// The algebra is 1 / (1 - drawdown fraction) - 1.
export function recoveryGainPercent(drawdown: number): number {
  const dd = bounded(drawdown, MAX_DRAWDOWN_PERCENT) / 100;
  if (dd <= 0) return 0;
  if (dd >= 1) return Number.POSITIVE_INFINITY;
  return (1 / (1 - dd) - 1) * 100;
}

// How many times the trough value the peak value is.
export function recoveryMultiple(drawdown: number): number {
  const dd = bounded(drawdown, MAX_DRAWDOWN_PERCENT) / 100;
  if (dd <= 0) return 1;
  if (dd >= 1) return Number.POSITIVE_INFINITY;
  return 1 / (1 - dd);
}

// Table of drawdowns from 10% to 90% with the recovery gain each one needs.
export function recoveryTable(
  minPercent = TABLE_MIN,
  maxPercent = TABLE_MAX,
  stepPercent = TABLE_STEP,
): RecoveryRow[] {
  const start = Math.floor(bounded(minPercent, 100));
  const end = Math.min(Math.floor(bounded(maxPercent, 100)), 100);
  const step = Math.max(1, Math.floor(bounded(stepPercent, 100)));
  const rows: RecoveryRow[] = [];
  for (let dd = start; dd <= end; dd += step) {
    const percent = recoveryGainPercent(dd);
    const multiple = recoveryMultiple(dd);
    rows.push({
      drawdownPercent: dd,
      recoveryGainPercent: percent,
      recoveryMultiple: multiple,
      remainingValuePercent: 100 - dd,
    });
  }
  return rows;
}

// Full result for the interactive calculator.
export function analyzeDrawdown(
  peakPrice: number,
  troughPrice: number,
  targetPercent = 0,
  explicitRecoveryPrice: number | null = null,
): DrawdownResult {
  const peak = bounded(peakPrice, MAX_PRICE);
  const rawTrough = bounded(troughPrice, MAX_PRICE);
  const clamped = rawTrough > peak && peak > 0;
  const trough = peak > 0 ? Math.min(rawTrough, peak) : rawTrough;
  const dd = drawdownPercent(peak, trough);
  const target = bounded(targetPercent, MAX_TARGET_PERCENT);
  const explicit = explicitRecoveryPrice !== null && Number.isFinite(explicitRecoveryPrice) === true
    ? bounded(explicitRecoveryPrice, MAX_PRICE)
    : null;
  const recoverTargetPrice = explicit !== null && explicit > 0
    ? explicit
    : peak * (1 + target / 100);

  return {
    peakPrice: peak,
    troughPrice: trough,
    drawdownPercent: dd,
    recoveryGainPercent: recoveryGainPercent(dd),
    recoveryMultiple: recoveryMultiple(dd),
    recoverTargetPrice: recoverTargetPrice,
    gainNeededUsd: Math.max(recoverTargetPrice - trough, 0),
    priceIsClamped: clamped,
  };
}

// ---- copy generators (humanized, sentence case, no em dashes, no colon-openers) ----

export function formatUsd(value: number): string {
  if (Number.isFinite(value) === false) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) < 1 ? 6 : 0,
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  if (Number.isFinite(value) === false) return "not reachable";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value)}%`;
}

export function formatMultiple(value: number, digits = 2): string {
  if (Number.isFinite(value) === false) return "not reachable";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}x`;
}

export function drawdownIntroText(): string {
  return "A drawdown measures how far a price has fallen from its highest point. The climb back needs a larger move than the fall. Enter a peak and a trough and this page shows the exact recovery gain the price has to print.";
}

export function drawdownDisclosureText(): string {
  return "A model for thinking, not investment advice. Past prices do not guarantee future results. The math here assumes one constant holding period with no fees, no taxes, and no cash flows into or out of the position. A price can fall further after any trough and some markets never recover their old peak.";
}

export function recoveryMathNote(drawdown: number, gain: number): string {
  return `Losing ${formatPercent(drawdown)} needs a ${formatPercent(gain)} gain to get back to the peak. The two numbers are not symmetric because the recovery is measured from a smaller base.`;
}

export function drawdownWorkedExample(peak: number, trough: number): string {
  const dd = drawdownPercent(peak, trough);
  const gain = recoveryGainPercent(dd);
  const multiple = recoveryMultiple(dd);
  const gainUsd = Math.max(peak - trough, 0);
  return `Say a coin peaked at ${formatUsd(peak)} and printed a low of ${formatUsd(trough)}. That is a drawdown of ${formatPercent(dd)}, a fall of ${formatUsd(gainUsd)} per unit. Getting back to ${formatUsd(peak)} takes a gain of ${formatPercent(gain)} on the ${formatUsd(trough)} low, which is ${formatMultiple(multiple)} the trough value. A 50% fall from 100000 to 50000 needs a 100% gain, so a fall of roughly half demands a little more than a double.`;
}

export function indexCrashExampleText(indexName: string, peak: number, trough: number): string {
  const dd = drawdownPercent(peak, trough);
  const gain = recoveryGainPercent(dd);
  return `A ${indexName} run from ${formatUsd(peak)} down to ${formatUsd(trough)} is a ${formatPercent(dd)} drawdown. The recovery gain from that low is ${formatPercent(gain)}.`;
}
