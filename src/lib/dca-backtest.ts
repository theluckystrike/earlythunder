/**
 * Real-price DCA backtest, server-only pure functions.
 *
 * Input is the cross-checked daily dataset in data/btc-daily-365.json (see
 * scripts/fetch-btc-daily-365.mjs). Everything rendered on the page is derived here,
 * so no number on the page is hardcoded.
 *
 * Fee convention matches calculateDca in ./planning-calculators: a purchase of
 * `amount` cash buys `amount * (1 - feeRate)` of notional, i.e. the fee reduces the
 * units acquired, and total cash spent is counted in full.
 */

export interface DailyReading {
  readonly date: string;
  readonly usd: number;
}

export interface DroppedReading {
  readonly date: string;
  readonly reason: string;
}

export interface PriceDataset {
  readonly id: string;
  readonly title: string;
  readonly fetched_at: string;
  readonly window: { readonly days: number; readonly start: string; readonly end: string };
  readonly primary: { readonly name: string; readonly url: string; readonly field?: string };
  readonly cross_check: {
    readonly name: string;
    readonly url: string;
    readonly field?: string;
    readonly tolerance_percent?: number;
    readonly max_observed_percent?: number;
    readonly matched?: number;
  };
  readonly rows: readonly DailyReading[];
  readonly dropped: readonly DroppedReading[];
  readonly counts: { readonly window: number; readonly published: number; readonly dropped: number };
}

export interface DcaPlan {
  readonly contributions: number;
  readonly frequencyDays: number;
  readonly contribution: number;
  readonly feePercent: number;
  readonly cash: number;
  readonly units: number;
  readonly averageCost: number;
  readonly finalPrice: number;
  readonly finalValue: number;
  readonly gain: number;
  readonly roiPercent: number;
  readonly firstDate: string;
  readonly lastDate: string;
}

export interface LumpSumPlan {
  readonly cash: number;
  readonly feePercent: number;
  readonly buyDate: string;
  readonly buyPrice: number;
  readonly units: number;
  readonly finalPrice: number;
  readonly finalValue: number;
  readonly gain: number;
  readonly roiPercent: number;
}

export interface FeeDragRow {
  readonly feePercent: number;
  readonly units: number;
  readonly finalValue: number;
  readonly feeCostDollars: number;
  readonly roiPercent: number;
}

/** Pure helpers shared by the page and the tests. */
export function unitsForCash(cash: number, price: number, feePercent: number): number {
  if (!Number.isFinite(cash) || !Number.isFinite(price) || price <= 0) return 0;
  const feeRate = Math.max(0, feePercent) / 100;
  return (cash * (1 - feeRate)) / price;
}

/**
 * Fixed-cash DCA across the dataset, buying on every `frequencyDays`-th reading
 * starting with the first reading. Each purchase pays a fee percent that reduces units.
 */
export function runDcaPlan(
  rows: readonly DailyReading[],
  options: { contribution: number; frequencyDays?: number; feePercent: number },
): DcaPlan {
  const frequencyDays = Math.max(1, Math.floor(options.frequencyDays ?? 7));
  const contribution = Math.max(0, options.contribution);
  const feePercent = Math.max(0, options.feePercent);
  const empty: DcaPlan = {
    contributions: 0, frequencyDays, contribution, feePercent, cash: 0, units: 0, averageCost: 0,
    finalPrice: 0, finalValue: 0, gain: 0, roiPercent: 0, firstDate: "", lastDate: "",
  };
  if (rows.length === 0) return empty;

  let units = 0;
  let cash = 0;
  let contributions = 0;
  for (let index = 0; index < rows.length; index += frequencyDays) {
    const price = rows[index].usd;
    if (!Number.isFinite(price) || price <= 0) continue;
    units += unitsForCash(contribution, price, feePercent);
    cash += contribution;
    contributions += 1;
  }

  const finalPrice = rows[rows.length - 1].usd;
  const finalValue = units * finalPrice;
  return {
    contributions, frequencyDays, contribution, feePercent, cash, units,
    averageCost: units > 0 ? cash / units : 0,
    finalPrice, finalValue,
    gain: finalValue - cash,
    roiPercent: cash > 0 ? ((finalValue - cash) / cash) * 100 : 0,
    firstDate: rows[0].date,
    lastDate: rows[rows.length - 1].date,
  };
}

/** Lump sum: same total cash and one fee, deployed on the first reading's date. */
export function runLumpSumPlan(
  rows: readonly DailyReading[],
  options: { cash: number; feePercent: number },
): LumpSumPlan {
  const empty: LumpSumPlan = {
    cash: 0, feePercent: options.feePercent, buyDate: "", buyPrice: 0, units: 0,
    finalPrice: 0, finalValue: 0, gain: 0, roiPercent: 0,
  };
  if (rows.length === 0) return empty;
  const cash = Math.max(0, options.cash);
  const buyPrice = rows[0].usd;
  const units = unitsForCash(cash, buyPrice, options.feePercent);
  const finalPrice = rows[rows.length - 1].usd;
  const finalValue = units * finalPrice;
  return {
    cash, feePercent: options.feePercent, buyDate: rows[0].date, buyPrice, units,
    finalPrice, finalValue, gain: finalValue - cash,
    roiPercent: cash > 0 ? ((finalValue - cash) / cash) * 100 : 0,
  };
}

/**
 * Fee drag at a list of fee percent levels, on identical cash and schedule.
 * Loss is measured against the zero-fee value of the SAME plan, so it is a real
 * dollar figure rather than zero.
 */
export function buildFeeDragTable(
  rows: readonly DailyReading[],
  options: { contribution: number; frequencyDays?: number; feePercents: readonly number[] },
): readonly FeeDragRow[] {
  // The baseline is an explicit fee-less run, never a row of the input list, so the
  // result does not depend on 0 being present or ordered first in feePercents.
  const feeLess = runDcaPlan(rows, { contribution: options.contribution, frequencyDays: options.frequencyDays, feePercent: 0 });
  return options.feePercents.map((feePercent) => {
    const plan = runDcaPlan(rows, { contribution: options.contribution, frequencyDays: options.frequencyDays, feePercent });
    return {
      feePercent,
      units: plan.units,
      finalValue: plan.finalValue,
      // Loss in dollars against the fee-less value of the same plan and schedule.
      feeCostDollars: feePercent === 0 ? 0 : feeLess.finalValue - plan.finalValue,
      roiPercent: plan.roiPercent,
    };
  });
}

/** Fee drag expressed against an explicit baseline value. */
export function feeDragAgainstBaseline(
  rows: readonly DailyReading[],
  options: { contribution: number; frequencyDays?: number; feePercent: number; baselineValue: number },
): { readonly feePercent: number; readonly finalValue: number; readonly feeCostDollars: number; readonly roiPercent: number; readonly units: number } {
  const plan = runDcaPlan(rows, { contribution: options.contribution, frequencyDays: options.frequencyDays, feePercent: options.feePercent });
  return {
    feePercent: options.feePercent,
    units: plan.units,
    finalValue: plan.finalValue,
    feeCostDollars: options.baselineValue - plan.finalValue,
    roiPercent: plan.roiPercent,
  };
}

/**
 * Disclosure sentences about the published window. Always returns defined strings,
 * never 'undefined' — the dropped list is an array of objects, not named properties.
 */
export function datasetDisclosure(dataset: PriceDataset): readonly string[] {
  const published = dataset.rows.length;
  const window = dataset.counts?.window ?? 365;
  const dropped = dataset.dropped ?? [];
  const lines: string[] = [
    `Published readings: ${published} of ${window} days in the window, from ${dataset.rows[0]?.date ?? dataset.window.start} to ${dataset.rows[dataset.rows.length - 1]?.date ?? dataset.window.end}.`,
    `Prices pulled ${dataset.fetched_at} from ${dataset.primary.name} and cross-checked against ${dataset.cross_check.name} at a ${dataset.cross_check.tolerance_percent ?? 1}% tolerance.`,
  ];
  if (dropped.length === 0) {
    lines.push(`No readings were dropped: every day in the window passed the ${dataset.cross_check.tolerance_percent ?? 1}% cross-check.`);
  } else {
    lines.push(
      `${dropped.length} day${dropped.length === 1 ? "" : "s"} dropped: ${dropped
        .map((entry) => `${entry.date} (${entry.reason})`)
        .join("; ")}.`,
    );
  }
  return lines;
}

/** Plain-language comparison sentence for DCA vs lump sum on the same cash. */
export function comparisonSummary(dca: DcaPlan, lump: LumpSumPlan): string {
  if (dca.cash <= 0 || lump.cash <= 0) return "No cash was deployed, so there is nothing to compare.";
  const difference = dca.finalValue - lump.finalValue;
  const cheaper = dca.averageCost < lump.buyPrice;
  const direction = difference >= 0 ? "more" : "less";
  return `Deploying $${dca.cash.toFixed(0)} the same way either as ${dca.contributions} scheduled buys or as one purchase on ${lump.buyDate} left ${Math.abs(difference).toFixed(2)} dollars ${direction} in the schedule. The scheduled buys averaged $${dca.averageCost.toFixed(2)} per coin against a first-day price of $${lump.buyPrice.toFixed(2)}, so the schedule paid ${cheaper ? "less" : "more"} than the single entry.`;
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUnits(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 });
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
