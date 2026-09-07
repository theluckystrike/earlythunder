/**
 * Pure liquidation-price arithmetic for the crypto liquidation price calculator.
 *
 * Nothing in this module touches the network, the filesystem or a global. Every
 * exported function validates its own arguments at the boundary and throws a
 * RangeError or TypeError rather than returning NaN or Infinity.
 *
 * Model. A perpetual position is opened with notional N at entry price P using
 * leverage L, so the posted initial margin is N / L. In cross margin an extra
 * free wallet balance E also stands behind the position. The exchange closes the
 * position when the unrealised loss has eaten the margin down to the maintenance
 * requirement, taken here as the maintenance margin rate M applied to the entry
 * notional. Solving for the price at which that happens gives:
 *
 *   long  liquidation price = P * (1 - 1 / L - E / N + M)
 *   short liquidation price = P * (1 + 1 / L + E / N - M)
 *
 * The distance from entry to that level is therefore 1 / L + E / N - M in both
 * directions, which is why the side never changes how far the move has to be.
 */

/** Trade direction. */
export type PositionSide = "long" | "short";

/** Margin mode. Isolated ring fences the posted margin, cross does not. */
export type MarginMode = "isolated" | "cross";

/** Named change window carried by the embedded universe snapshot. */
export type ChangeWindow = "change24h" | "change7d" | "change30d" | "change200d" | "change1y";

/** One embedded token row. Built at build time, read in the browser. */
export interface LiquidationToken {
  readonly symbol: string;
  readonly name: string;
  readonly rank: number;
  readonly price: number;
  readonly allTimeHigh: number;
  readonly allTimeHighDate: string;
  readonly fromAllTimeHighPercent: number;
  readonly change24h: number | null;
  readonly change7d: number | null;
  readonly change30d: number | null;
  readonly change200d: number | null;
  readonly change1y: number | null;
  /** Composite score from data/altcoin-scorecard.json, null when unmatched. */
  readonly score: number | null;
  readonly maxScore: number | null;
  readonly verdict: string | null;
  readonly exchangeDepth: number | null;
  readonly exchangeDepthMedian: number | null;
}

/** Everything the browser component needs, embedded at build time. */
export interface LiquidationSnapshot {
  readonly fetchedAt: string;
  readonly scorecardUpdatedAt: string;
  readonly universeRows: number;
  readonly stablecoinCount: number;
  readonly crossCheckedCount: number;
  readonly worstPriceSpreadPercent: number;
  readonly scorecardMatches: number;
  readonly tokens: readonly LiquidationToken[];
}

/** Inputs to a single liquidation calculation. Prices and sizes are in USD. */
export interface LiquidationInput {
  readonly side: PositionSide;
  readonly marginMode: MarginMode;
  readonly entryPrice: number;
  readonly positionSizeUsd: number;
  readonly leverage: number;
  readonly maintenanceMarginPercent: number;
  /** Free wallet balance behind the position. Ignored when isolated. */
  readonly extraBalanceUsd: number;
}

/** Everything one calculation produces. No field is ever NaN or Infinity. */
export interface LiquidationResult {
  readonly liquidationPrice: number;
  /** Fraction of entry price, always positive. 0.091 means 9.1 percent away. */
  readonly distanceFraction: number;
  /** Absolute price gap in USD between entry and the liquidation level. */
  readonly distanceUsd: number;
  readonly quantity: number;
  readonly initialMarginUsd: number;
  readonly extraBalanceUsd: number;
  readonly maintenanceMarginUsd: number;
  /** Margin destroyed by a liquidation at the computed level. */
  readonly marginLostUsd: number;
  /** True when the level sits at or below zero, which cannot be reached. */
  readonly unreachable: boolean;
}

/** One measured window compared against the liquidation distance. */
export interface WindowComparison {
  readonly window: ChangeWindow;
  readonly label: string;
  readonly changePercent: number | null;
  readonly absoluteMovePercent: number | null;
  readonly exceedsDistance: boolean;
}

/** Backward looking count of tokens whose measured move reached the distance. */
export interface SurvivalTally {
  readonly breached: number;
  readonly evaluated: number;
  readonly excluded: number;
  readonly breachedShare: number | null;
}

export const MIN_LEVERAGE = 1;
export const MAX_LEVERAGE = 125;
export const MIN_MAINTENANCE_MARGIN_PERCENT = 0;
export const MAX_MAINTENANCE_MARGIN_PERCENT = 50;
export const MAX_PRICE_USD = 1_000_000_000;
export const MAX_POSITION_SIZE_USD = 1_000_000_000_000;
export const MAX_TOKENS = 400;

const PERCENT_DIVISOR = 100;
const MIN_POSITIVE = Number.EPSILON;

/** Human labels for the five windows CoinGecko serves on this endpoint. */
export const WINDOW_LABELS: Readonly<Record<ChangeWindow, string>> = {
  change24h: "24 hour",
  change7d: "7 day",
  change30d: "30 day",
  change200d: "200 day",
  change1y: "1 year",
};

/** Window order used everywhere on the page. */
export const WINDOW_ORDER: readonly ChangeWindow[] = [
  "change24h",
  "change7d",
  "change30d",
  "change200d",
  "change1y",
];

function requireFiniteRange(value: number, minimum: number, maximum: number, label: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`${label} must be a finite number.`);
  }
  if (value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function validateInput(input: LiquidationInput): void {
  if (!input || typeof input !== "object") throw new TypeError("Liquidation input is required.");
  if (input.side !== "long" && input.side !== "short") {
    throw new RangeError("Side must be long or short.");
  }
  if (input.marginMode !== "isolated" && input.marginMode !== "cross") {
    throw new RangeError("Margin mode must be isolated or cross.");
  }
  requireFiniteRange(input.entryPrice, MIN_POSITIVE, MAX_PRICE_USD, "Entry price");
  requireFiniteRange(input.positionSizeUsd, MIN_POSITIVE, MAX_POSITION_SIZE_USD, "Position size");
  requireFiniteRange(input.leverage, MIN_LEVERAGE, MAX_LEVERAGE, "Leverage");
  requireFiniteRange(
    input.maintenanceMarginPercent,
    MIN_MAINTENANCE_MARGIN_PERCENT,
    MAX_MAINTENANCE_MARGIN_PERCENT,
    "Maintenance margin rate",
  );
  requireFiniteRange(input.extraBalanceUsd, 0, MAX_POSITION_SIZE_USD, "Extra wallet balance");
}

/**
 * Fraction of the entry price the market has to move against the position
 * before the maintenance requirement is breached. Always positive.
 */
export function liquidationDistanceFraction(
  leverage: number,
  maintenanceMarginPercent: number,
  extraBalanceUsd = 0,
  positionSizeUsd = 1,
): number {
  requireFiniteRange(leverage, MIN_LEVERAGE, MAX_LEVERAGE, "Leverage");
  requireFiniteRange(
    maintenanceMarginPercent,
    MIN_MAINTENANCE_MARGIN_PERCENT,
    MAX_MAINTENANCE_MARGIN_PERCENT,
    "Maintenance margin rate",
  );
  requireFiniteRange(positionSizeUsd, MIN_POSITIVE, MAX_POSITION_SIZE_USD, "Position size");
  requireFiniteRange(extraBalanceUsd, 0, MAX_POSITION_SIZE_USD, "Extra wallet balance");
  const cushion = extraBalanceUsd / positionSizeUsd;
  const distance = 1 / leverage + cushion - maintenanceMarginPercent / PERCENT_DIVISOR;
  if (!Number.isFinite(distance)) throw new RangeError("Liquidation distance is not finite.");
  return distance <= 0 ? 0 : distance;
}

/** Liquidation price of a long. Never returns a negative number. */
export function longLiquidationPrice(input: LiquidationInput): number {
  validateInput(input);
  const cushion = input.marginMode === "cross" ? input.extraBalanceUsd : 0;
  const distance = liquidationDistanceFraction(
    input.leverage,
    input.maintenanceMarginPercent,
    cushion,
    input.positionSizeUsd,
  );
  const price = input.entryPrice * (1 - distance);
  if (!Number.isFinite(price)) throw new RangeError("Long liquidation price is not finite.");
  return price <= 0 ? 0 : price;
}

/** Liquidation price of a short. Always at or above the entry price. */
export function shortLiquidationPrice(input: LiquidationInput): number {
  validateInput(input);
  const cushion = input.marginMode === "cross" ? input.extraBalanceUsd : 0;
  const distance = liquidationDistanceFraction(
    input.leverage,
    input.maintenanceMarginPercent,
    cushion,
    input.positionSizeUsd,
  );
  const price = input.entryPrice * (1 + distance);
  if (!Number.isFinite(price)) throw new RangeError("Short liquidation price is not finite.");
  return price;
}

/** Full result for one position. Validates once, then derives every field. */
export function calculateLiquidation(input: LiquidationInput): LiquidationResult {
  validateInput(input);
  const cushion = input.marginMode === "cross" ? input.extraBalanceUsd : 0;
  const distanceFraction = liquidationDistanceFraction(
    input.leverage,
    input.maintenanceMarginPercent,
    cushion,
    input.positionSizeUsd,
  );
  const liquidationPrice =
    input.side === "long" ? longLiquidationPrice(input) : shortLiquidationPrice(input);
  const quantity = input.positionSizeUsd / input.entryPrice;
  const initialMarginUsd = input.positionSizeUsd / input.leverage;
  const maintenanceMarginUsd =
    (input.positionSizeUsd * input.maintenanceMarginPercent) / PERCENT_DIVISOR;
  const distanceUsd = Math.abs(input.entryPrice - liquidationPrice);
  // Loss realised by the move from entry to the liquidation level. Equal to the
  // posted margin plus any counted free balance, less the maintenance
  // requirement, except when the level is clamped at zero for a long.
  const marginLostUsd = distanceUsd * (input.positionSizeUsd / input.entryPrice);
  if (!Number.isFinite(quantity)) throw new RangeError("Quantity is not finite.");
  if (!Number.isFinite(marginLostUsd)) throw new RangeError("Margin lost is not finite.");
  return {
    liquidationPrice,
    distanceFraction,
    distanceUsd,
    quantity,
    initialMarginUsd,
    extraBalanceUsd: cushion,
    maintenanceMarginUsd,
    marginLostUsd: marginLostUsd <= 0 ? 0 : marginLostUsd,
    unreachable: input.side === "long" && liquidationPrice <= 0,
  };
}

/**
 * Highest leverage whose liquidation distance still clears a given move.
 *
 * The distance is 1 / L - M, so surviving a move of size m needs
 * L < 1 / (m + M). Returns null when even single leverage cannot clear it.
 */
export function maxSafeLeverage(
  survivableMoveFraction: number,
  maintenanceMarginPercent: number,
): number | null {
  requireFiniteRange(survivableMoveFraction, 0, 1000, "Survivable move");
  requireFiniteRange(
    maintenanceMarginPercent,
    MIN_MAINTENANCE_MARGIN_PERCENT,
    MAX_MAINTENANCE_MARGIN_PERCENT,
    "Maintenance margin rate",
  );
  const denominator = survivableMoveFraction + maintenanceMarginPercent / PERCENT_DIVISOR;
  if (denominator <= MIN_POSITIVE) return MAX_LEVERAGE;
  const raw = 1 / denominator;
  if (!Number.isFinite(raw)) return null;
  const floored = Math.floor(raw);
  if (floored < MIN_LEVERAGE) return null;
  return floored > MAX_LEVERAGE ? MAX_LEVERAGE : floored;
}

/** Reads one change window off a token row without an index signature cast. */
export function readWindow(token: LiquidationToken, window: ChangeWindow): number | null {
  if (!token || typeof token !== "object") throw new TypeError("Token row is required.");
  if (window === "change24h") return token.change24h;
  if (window === "change7d") return token.change7d;
  if (window === "change30d") return token.change30d;
  if (window === "change200d") return token.change200d;
  if (window === "change1y") return token.change1y;
  throw new RangeError("Unknown change window.");
}

/**
 * Compares one token's five measured windows against a liquidation distance.
 * A window with a null change is reported as null and never counted.
 */
export function compareWindows(
  token: LiquidationToken,
  distanceFraction: number,
): readonly WindowComparison[] {
  if (!token || typeof token !== "object") throw new TypeError("Token row is required.");
  requireFiniteRange(distanceFraction, 0, 1000, "Liquidation distance");
  const out: WindowComparison[] = [];
  for (let i = 0; i < WINDOW_ORDER.length && i < 8; i += 1) {
    const window = WINDOW_ORDER[i];
    const changePercent = readWindow(token, window);
    const absolute = changePercent === null ? null : Math.abs(changePercent) / PERCENT_DIVISOR;
    out.push({
      window,
      label: WINDOW_LABELS[window],
      changePercent,
      absoluteMovePercent: absolute === null ? null : absolute * PERCENT_DIVISOR,
      exceedsDistance: absolute !== null && absolute >= distanceFraction,
    });
  }
  return out;
}

/**
 * Backward looking frequency across the embedded universe. Counts how many
 * tokens already moved at least as far as the liquidation distance inside the
 * chosen window. This is a count of what happened, not a forecast.
 */
export function tallySurvival(
  tokens: readonly LiquidationToken[],
  window: ChangeWindow,
  distanceFraction: number,
): SurvivalTally {
  if (!Array.isArray(tokens)) throw new TypeError("Token list is required.");
  requireFiniteRange(distanceFraction, 0, 1000, "Liquidation distance");
  const ceiling = tokens.length > MAX_TOKENS ? MAX_TOKENS : tokens.length;
  let breached = 0;
  let evaluated = 0;
  let excluded = 0;
  for (let i = 0; i < ceiling; i += 1) {
    const change = readWindow(tokens[i], window);
    if (change === null || !Number.isFinite(change)) {
      excluded += 1;
      continue;
    }
    evaluated += 1;
    if (Math.abs(change) / PERCENT_DIVISOR >= distanceFraction) breached += 1;
  }
  return {
    breached,
    evaluated,
    excluded,
    breachedShare: evaluated === 0 ? null : breached / evaluated,
  };
}

/**
 * Largest absolute measured move a token made across the five windows plus its
 * drawdown from the all-time high. Null when every window is missing.
 */
export function largestMeasuredMoveFraction(token: LiquidationToken): number | null {
  if (!token || typeof token !== "object") throw new TypeError("Token row is required.");
  let largest: number | null = null;
  for (let i = 0; i < WINDOW_ORDER.length && i < 8; i += 1) {
    const change = readWindow(token, WINDOW_ORDER[i]);
    if (change === null || !Number.isFinite(change)) continue;
    const absolute = Math.abs(change) / PERCENT_DIVISOR;
    if (largest === null || absolute > largest) largest = absolute;
  }
  return largest;
}
