// Pure math and copy generators for the Crypto buy the dip calculator.
// Deterministic by construction: no Date.now(), no randomness, no I/O.
// Mirrors the style of src/lib/dca-backtest.ts.

export const MAX_MONEY = 1_000_000_000_000;
export const MAX_TRANCHES = 200;
export const MAX_THRESHOLD_PERCENT = 99.99;
export const MAX_FEE_PERCENT = 99.99;
export const MAX_DAYS = 1200;

export interface PriceRow {
  date: string;
  usd: number;
}

export interface PriceDataset {
  id: string;
  title: string;
  fetched_at: string;
  rows: readonly PriceRow[];
  dropped: readonly { readonly date: string; readonly reason: string }[];
  counts: { readonly window: number; readonly published: number; readonly dropped: number };
  primary: { readonly name: string; readonly url: string; readonly field: string };
  cross_check: { readonly name: string; readonly url: string; readonly field: string; readonly tolerance_percent: number; readonly max_observed_percent: number; readonly matched: number };
  window: { readonly days: number; readonly start: string; readonly end: string };
}

export interface DipOptions {
  totalCash: number;
  tranches: number;
  dipThresholdPercent: number;
  feePercent: number;
}

export interface DipResult {
  units: number;
  invested: number;
  averageCost: number;
  finalPrice: number;
  finalValue: number;
  gain: number;
  roiPercent: number;
  peakPrice: number;
  firstPrice: number;
  dipsDeployed: number;
  totalTranches: number;
  cashDeployedDuringDips: number;
  cashDeployedAtEnd: number;
  percentDuringDips: number;
  percentAtEnd: number;
  endDeploy: boolean;
  firstDipDate: string | null;
}

export interface BaselineResult {
  units: number;
  invested: number;
  finalPrice: number;
  finalValue: number;
  gain: number;
  roiPercent: number;
}

export interface ComparisonResult {
  dip: DipResult;
  baseline: BaselineResult;
  dipBeatsBaseline: boolean;
  gainDifference: number;
}

export function bounded(raw: number, max: number): number {
  if (Number.isFinite(raw) === false || raw < 0) return 0;
  return Math.min(raw, max);
}

// Run the buy-the-dip plan over a chronological price series.
// Cash stays idle until price falls at least thresholdPercent below the
// running high, then one tranche deploys. Leftover cash deploys at the end.
export function runDipPlan(rows: readonly PriceRow[], options: DipOptions): DipResult {
  const cash = bounded(options.totalCash, MAX_MONEY);
  const tranches = Math.floor(bounded(options.tranches, MAX_TRANCHES));
  const threshold = bounded(options.dipThresholdPercent, MAX_THRESHOLD_PERCENT);
  const feeRate = bounded(options.feePercent, MAX_FEE_PERCENT) / 100;
  const data = rows.filter((row) => row.usd > 0);
  const firstPrice = data.length > 0 ? data[0].usd : 0;
  const finalPrice = data.length > 0 ? data[data.length - 1].usd : 0;

  const trancheCash = tranches > 0 ? cash / tranches : 0;
  let peak = 0;
  let units = 0;
  let dipsDeployed = 0;
  let firstDipDate: string | null = null;
  let remaining = tranches;

  for (const row of data) {
    if (row.usd > peak) peak = row.usd;
    if (peak <= 0 || remaining <= 0) continue;
    const drawdownPercent = ((peak - row.usd) / peak) * 100;
    if (drawdownPercent >= threshold) {
      units += (trancheCash * (1 - feeRate)) / row.usd;
      dipsDeployed += 1;
      remaining -= 1;
      if (firstDipDate === null) firstDipDate = row.date;
    }
  }

  const leftoverCash = remaining * trancheCash;
  let endDeploy = false;
  if (leftoverCash > 0 && finalPrice > 0) {
    units += (leftoverCash * (1 - feeRate)) / finalPrice;
    endDeploy = true;
  }

  const invested = cash;
  const finalValue = units * finalPrice;
  const averageCost = units > 0 ? invested / units : 0;
  const percentDuringDips = tranches > 0 ? (dipsDeployed / tranches) * 100 : 0;

  return {
    units,
    invested,
    averageCost,
    finalPrice,
    finalValue,
    gain: finalValue - invested,
    roiPercent: invested > 0 ? ((finalValue - invested) / invested) * 100 : 0,
    peakPrice: peak,
    firstPrice,
    dipsDeployed,
    totalTranches: tranches,
    cashDeployedDuringDips: dipsDeployed * trancheCash,
    cashDeployedAtEnd: leftoverCash,
    percentDuringDips: percentDuringDips,
    percentAtEnd: 100 - percentDuringDips,
    endDeploy,
    firstDipDate,
  };
}

// Lump-sum baseline: deploy all cash on day one and hold to the end.
export function lumpSumBaseline(rows: readonly PriceRow[], totalCash: number, feePercent: number): BaselineResult {
  const cash = bounded(totalCash, MAX_MONEY);
  const feeRate = bounded(feePercent, MAX_FEE_PERCENT) / 100;
  const data = rows.filter((row) => row.usd > 0);
  const firstPrice = data.length > 0 ? data[0].usd : 0;
  const finalPrice = data.length > 0 ? data[data.length - 1].usd : 0;
  const units = firstPrice > 0 ? (cash * (1 - feeRate)) / firstPrice : 0;
  const finalValue = units * finalPrice;
  return {
    units,
    invested: cash,
    finalPrice,
    finalValue,
    gain: finalValue - cash,
    roiPercent: cash > 0 ? ((finalValue - cash) / cash) * 100 : 0,
  };
}

export function compareStrategies(rows: readonly PriceRow[], options: DipOptions): ComparisonResult {
  const dip = runDipPlan(rows, options);
  const baseline = lumpSumBaseline(rows, options.totalCash, options.feePercent);
  return {
    dip,
    baseline,
    dipBeatsBaseline: dip.gain >= baseline.gain,
    gainDifference: dip.gain - baseline.gain,
  };
}

// Build a deterministic synthetic price path from startPrice to endPrice.
// A linear baseline rises across `days`; every dipInterval-th day the price
// prints a drawdown of dipDepthPercent so dip triggers are predictable.
export function buildSyntheticPath(
  startPrice: number,
  endPrice: number,
  days: number,
  dipDepthPercent: number,
  dipInterval = 8,
): PriceRow[] {
  const start = bounded(startPrice, MAX_MONEY);
  const end = bounded(endPrice, MAX_MONEY);
  const count = Math.max(2, Math.floor(bounded(days, MAX_DAYS)));
  const depth = bounded(dipDepthPercent, 50) / 100;
  const rows: PriceRow[] = [];
  for (let index = 0; index < count; index += 1) {
    const progress = count === 1 ? 0 : index / (count - 1);
    const baseline = start + (end - start) * progress;
    const onDip = index > 0 && index % dipInterval === 0;
    const price = onDip ? baseline * (1 - depth) : baseline;
    rows.push({ date: `day-${index + 1}`, usd: Math.max(price, 0.00000001) });
  }
  return rows;
}

// ---- copy generators (humanized, sentence case, no em dashes, no colons) ----

export function formatUsd(value: number): string {
  if (Number.isFinite(value) === false) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) < 1 ? 6 : 0,
  }).format(value);
}

export function formatUnits(value: number): string {
  if (Number.isFinite(value) === false) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(value);
}

export function formatPercent(value: number): string {
  if (Number.isFinite(value) === false) return "0.0%";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function formatHumanDate(date: string): string {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const month = months[Number(parts[1]) - 1];
  const day = Number(parts[2]);
  const year = parts[0];
  if (month === undefined || Number.isNaN(day)) return date;
  return `${month} ${day}, ${year}`;
}

export function dipIntroText(): string {
  return "A buy the dip plan keeps cash idle until prices fall. Every tranche waits for a drop below the running high. This page backtests the idea on a year of real Bitcoin prices.";
}

export function dipWorkedExample(threshold: number, tranches: number, cash: number): string {
  const perTranche = tranches > 0 ? cash / tranches : 0;
  return `Say you set ${formatUsd(cash)} of cash across ${tranches} tranches with a ${formatPercent(threshold)} dip trigger. Each tranche is ${formatUsd(perTranche)}. When Bitcoin drops at least ${formatPercent(threshold)} below its recent high, one tranche buys. Cash that never meets the trigger deploys at the end. The model uses real daily prices, so the dates and dollars are concrete.`;
}

export function dipDisclosureText(): string {
  return "A model for thinking, not investment advice. Past prices do not guarantee future results. Fees, slippage, and timing gaps are simplified. Buy the dip plans can wait a long time for a trigger and still lose money in a falling market.";
}

export function methodFormulaText(): string {
  return "Drawdown is the distance below the running high. The running high is the highest price seen so far. When drawdown crosses the threshold, one tranche deploys. Units equal cash after fees divided by the price on that day. The ending value is total units times the final price.";
}

export function dipBacktestSummary(
  comparison: ComparisonResult,
  feePercent: number,
  windowLabel: string,
): string {
  const { dip, baseline } = comparison;
  const winner = dip.gain >= baseline.gain ? "dip buying" : "a single lump sum";
  const gap = formatUsd(Math.abs(dip.gain - baseline.gain));
  return `Over the ${windowLabel} window at a ${formatPercent(feePercent)} fee, the dip plan deployed ${formatUnits(dip.dipsDeployed)} of ${formatUnits(dip.totalTranches)} tranches during dips and ended ${formatUsd(dip.finalValue)}. A lump sum of the same cash ended ${formatUsd(baseline.finalValue)}. On this history ${winner} came out ${gap} ahead. One path, not a prediction.`;
}
