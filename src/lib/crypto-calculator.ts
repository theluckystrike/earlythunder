export type CalculatorMode = "quantity" | "cash";

export interface CalculatorInput {
  readonly mode: CalculatorMode;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly amount: number;
  readonly buyFeePercent: number;
  readonly sellFeePercent: number;
}

export interface CalculatorResult {
  readonly quantity: number;
  readonly buyNotional: number;
  readonly buyFee: number;
  readonly totalCost: number;
  readonly sellNotional: number;
  readonly sellFee: number;
  readonly netProceeds: number;
  readonly profit: number;
  readonly roiRate: number;
  readonly breakEvenPrice: number;
  readonly recoveryRate: number | null;
}

export interface RecoveryPoint {
  readonly lossPercent: number;
  readonly currentPrice: number;
  readonly recoveryRate: number;
}

const MAX_PRICE = 1_000_000_000;
const MAX_AMOUNT = 1_000_000_000_000;
const MAX_FEE_PERCENT = 99;
const LOSS_LEVELS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const;

function requireRange(value: number, minimum: number, maximum: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
  if (value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function validateInput(input: CalculatorInput): void {
  if (!input || typeof input !== "object") throw new TypeError("Calculator input is required.");
  if (input.mode !== "quantity" && input.mode !== "cash") {
    throw new RangeError("Mode must be quantity or cash.");
  }
  requireRange(input.buyPrice, Number.EPSILON, MAX_PRICE, "Buy price");
  requireRange(input.sellPrice, 0, MAX_PRICE, "Sell price");
  requireRange(input.amount, Number.EPSILON, MAX_AMOUNT, "Amount");
  requireRange(input.buyFeePercent, 0, MAX_FEE_PERCENT, "Buy fee");
  requireRange(input.sellFeePercent, 0, MAX_FEE_PERCENT, "Sell fee");
}

function entryValues(input: CalculatorInput, buyFeeRate: number) {
  if (input.mode === "cash") {
    const buyNotional = input.amount / (1 + buyFeeRate);
    return {
      quantity: buyNotional / input.buyPrice,
      buyNotional,
      buyFee: input.amount - buyNotional,
      totalCost: input.amount,
    };
  }
  const buyNotional = input.buyPrice * input.amount;
  const buyFee = buyNotional * buyFeeRate;
  return { quantity: input.amount, buyNotional, buyFee, totalCost: buyNotional + buyFee };
}

function validateResult(result: CalculatorResult): void {
  const finiteValues = [
    result.quantity,
    result.buyNotional,
    result.buyFee,
    result.totalCost,
    result.sellNotional,
    result.sellFee,
    result.netProceeds,
    result.profit,
    result.roiRate,
    result.breakEvenPrice,
  ];
  if (!finiteValues.every(Number.isFinite)) throw new RangeError("Calculation exceeded finite bounds.");
  if (result.quantity <= 0 || result.totalCost <= 0) {
    throw new RangeError("Calculation produced a nonpositive position.");
  }
}

export function calculateCryptoProfit(input: CalculatorInput): CalculatorResult {
  validateInput(input);
  const buyFeeRate = input.buyFeePercent / 100;
  const sellFeeRate = input.sellFeePercent / 100;
  const entry = entryValues(input, buyFeeRate);
  const sellNotional = input.sellPrice * entry.quantity;
  const sellFee = sellNotional * sellFeeRate;
  const netProceeds = sellNotional - sellFee;
  const profit = netProceeds - entry.totalCost;
  const breakEvenPrice = entry.totalCost / (entry.quantity * (1 - sellFeeRate));
  const result: CalculatorResult = {
    ...entry,
    sellNotional,
    sellFee,
    netProceeds,
    profit,
    roiRate: profit / entry.totalCost,
    breakEvenPrice,
    recoveryRate: input.sellPrice === 0 ? null : Math.max(0, breakEvenPrice / input.sellPrice - 1),
  };
  validateResult(result);
  return result;
}

export function buildRecoveryCurve(input: CalculatorInput): readonly RecoveryPoint[] {
  validateInput(input);
  if (input.buyPrice <= 0 || LOSS_LEVELS.length !== 11) {
    throw new RangeError("Recovery curve requires a positive buy price and bounded loss levels.");
  }
  return LOSS_LEVELS.map((lossPercent) => {
    const currentPrice = input.buyPrice * (1 - lossPercent / 100);
    const result = calculateCryptoProfit({ ...input, sellPrice: currentPrice });
    if (result.recoveryRate === null) throw new RangeError("Recovery curve price must be positive.");
    return { lossPercent, currentPrice, recoveryRate: result.recoveryRate };
  });
}
