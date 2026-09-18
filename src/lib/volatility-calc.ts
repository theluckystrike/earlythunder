// Volatility model for the Crypto Volatility Calculator.
//
// Pure functions only. Given two prices and the calendar days between them,
// the model derives the daily return between the readings, an annualized
// volatility estimate built on that single return, and the expected daily move
// range at one standard deviation. Annualization scales a daily return by the
// square root of 365, the convention finance uses to turn daily dispersion into
// an annual figure.

export interface VolatilityInput {
  readonly price1: number;
  readonly price2: number;
  readonly daysBetween: number;
  readonly annualize?: boolean;
}

export interface VolatilityResult {
  readonly dailyReturnPercent: number;
  readonly annualizedVolPercent: number;
  readonly sigmaDailyPercent: number;
  readonly sigmaDailyLowPercent: number;
  readonly sigmaDailyHighPercent: number;
}

const TRADING_DAYS_PER_YEAR = 365;

function safe(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

// The logged daily return between two prices, in percent. Using the natural
// log keeps upside and downside moves symmetric, matching how volatility is
// usually measured on price series.
export function dailyReturn(price1: number, price2: number): number {
  const first = safe(price1);
  const second = safe(price2);
  if (first <= 0 || second <= 0) return 0;
  return Math.log(second / first) * 100;
}

// A single observed return scaled to an annual figure. The scaling factor is
// the square root of the number of days in a year, a proxy for how much a daily
// move would compound if it repeated all year. A wider price gap and a shorter
// window both push the annual figure higher.
export function annualizedVol(price1: number, price2: number, daysBetween: number): number {
  const first = safe(price1);
  const second = safe(price2);
  const days = Math.max(0, Math.floor(safe(daysBetween)));
  const move = Math.abs(dailyReturn(first, second)) / 100;
  if (move === 0 || days === 0) return 0;
  return move * Math.sqrt(TRADING_DAYS_PER_YEAR / days) * 100;
}

// The one standard deviation daily move band in percent, centered on zero. The
// band spans from the low to the high reading; the low is negative to express a
// down move.
export function sigmaRange(price1: number, price2: number, daysBetween: number): {
  readonly lowPercent: number;
  readonly highPercent: number;
} {
  const first = safe(price1);
  const second = safe(price2);
  const days = Math.max(0, Math.floor(safe(daysBetween)));
  const move = Math.abs(dailyReturn(first, second)) / 100;
  if (move === 0 || days === 0) return { lowPercent: 0, highPercent: 0 };
  const sigma = (move / Math.sqrt(days)) * 100;
  return { lowPercent: -sigma, highPercent: sigma };
}

export function calculateVolatility(input: VolatilityInput): VolatilityResult {
  const first = safe(input.price1);
  const second = safe(input.price2);
  const days = Math.max(0, Math.floor(safe(input.daysBetween)));
  const annualize = input.annualize !== false;

  const daily = dailyReturn(first, second);
  const annual = annualize ? annualizedVol(first, second, days) : 0;
  const range = sigmaRange(first, second, days);

  return {
    dailyReturnPercent: daily,
    annualizedVolPercent: annual,
    sigmaDailyPercent: daily,
    sigmaDailyLowPercent: range.lowPercent,
    sigmaDailyHighPercent: range.highPercent,
  };
}

export function volatilityTitle(): string {
  return "Crypto volatility calculator with real Bitcoin data";
}

export function volatilityIntroText(price1: number, price2: number, days: number): string {
  return [
    `Enter a first reading of ${formatNumber(price1)} and a second of ${formatNumber(price2)}, ${days} days apart.`,
    "The model turns the gap between the two into a daily return and an annualized volatility estimate.",
    "It also gives the one standard deviation daily move band you would expect around the middle reading.",
  ].join(" ");
}

export function volatilityDisclosureText(): string {
  return [
    "A two price point sample is a rough volatility gauge, not a full statistical estimate.",
    "Real daily returns cluster and jump, so one pair of readings cannot capture the true shape of the distribution.",
    "Annualizing assumes a move repeats evenly all year, which prices rarely do.",
    "Crypto can move far beyond any single standard deviation band.",
    "Treat the numbers as a planning sketch and confirm against a fuller dataset before acting.",
  ].join(" ");
}

function formatNumber(value: number): string {
  if (Number.isFinite(value) === false) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
