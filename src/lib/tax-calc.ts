// Capital gains model for the Crypto Tax Calculator.
//
// Pure functions only. Given a buy price, a sell price, a quantity, buy and
// sell fee percents, a holding period, and a tax rate, the model derives cost
// basis, proceeds, gain or loss, the tax owed, the after tax proceeds, and the
// tax drag in dollars. Short term and long term use different rates. Losses
// carry a zero tax bill.

export const DEFAULT_LONG_TERM_RATE = 15;
export const LONG_TERM_HOLDING_DAYS = 365;

export interface TaxInput {
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly quantity: number;
  readonly buyFeePercent: number;
  readonly sellFeePercent: number;
  readonly holdingDays: number;
  readonly incomeBracketPercent: number;
  readonly longTermRatePercent: number;
}

export interface TaxResult {
  readonly costBasis: number;
  readonly proceeds: number;
  readonly gain: number;
  readonly holdingDays: number;
  readonly isLongTerm: boolean;
  readonly ratePercent: number;
  readonly taxOwed: number;
  readonly afterTaxProceeds: number;
  readonly afterTaxGain: number;
  readonly taxDragPercent: number;
  readonly totalFees: number;
  readonly breakEvenPrice: number;
}

function safe(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function clampRate(value: number): number {
  return Math.min(safe(value), 100);
}

// Cash leaving your account on the buy. The fee is charged on top of the
// trade notional, so it lands in the cost basis.
export function costBasis(buyPrice: number, quantity: number, buyFeePercent: number): number {
  const notional = safe(buyPrice) * safe(quantity);
  return notional * (1 + clampRate(buyFeePercent) / 100);
}

// Cash arriving in your account on the sell. The fee is taken out of the
// notional before it reaches you.
export function proceeds(sellPrice: number, quantity: number, sellFeePercent: number): number {
  const notional = safe(sellPrice) * safe(quantity);
  return notional * (1 - clampRate(sellFeePercent) / 100);
}

export function gain(basis: number, saleProceeds: number): number {
  return safe(saleProceeds) - safe(basis);
}

export function isLongTerm(holdingDays: number): boolean {
  return safe(holdingDays) > LONG_TERM_HOLDING_DAYS;
}

// Losses produce no tax bill in this model. A negative gain returns zero.
export function taxOwed(gainAmount: number, ratePercent: number): number {
  if (!Number.isFinite(gainAmount) || gainAmount <= 0) return 0;
  return gainAmount * (clampRate(ratePercent) / 100);
}

export function taxDragPercent(tax: number, basis: number): number {
  const base = safe(basis);
  if (base === 0) return 0;
  return (safe(tax) / base) * 100;
}

export function calculateTax(input: TaxInput): TaxResult {
  const basis = costBasis(input.buyPrice, input.quantity, input.buyFeePercent);
  const saleProceeds = proceeds(input.sellPrice, input.quantity, input.sellFeePercent);
  const gainAmount = gain(basis, saleProceeds);
  const long = isLongTerm(input.holdingDays);
  const rate = long ? clampRate(input.longTermRatePercent) : clampRate(input.incomeBracketPercent);
  const tax = taxOwed(gainAmount, rate);
  const afterTax = saleProceeds - tax;
  const totalFees =
    basis - safe(input.buyPrice) * safe(input.quantity) +
    (safe(input.sellPrice) * safe(input.quantity) - saleProceeds);
  const breakEven = safe(input.quantity) > 0
    ? basis / (safe(input.quantity) * (1 - clampRate(input.sellFeePercent) / 100))
    : 0;

  return {
    costBasis: basis,
    proceeds: saleProceeds,
    gain: gainAmount,
    holdingDays: safe(input.holdingDays),
    isLongTerm: long,
    ratePercent: rate,
    taxOwed: tax,
    afterTaxProceeds: afterTax,
    afterTaxGain: afterTax - basis,
    taxDragPercent: taxDragPercent(tax, basis),
    totalFees,
    breakEvenPrice: Number.isFinite(breakEven) ? breakEven : 0,
  };
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}%`;
}

export function taxTitle(): string {
  return "Crypto tax calculator: estimate your capital gains bill";
}

// Plain sentences a person would say out loud. No throat clearing.
export function taxIntroText(buyPrice: number, sellPrice: number, quantity: number): string {
  return [
    `You bought at ${formatUsd(buyPrice)} and sold at ${formatUsd(sellPrice)} for ${quantity} units.`,
    "The model adds your buy fee to the cost and subtracts your sell fee from the proceeds.",
    "It then applies one rate to the gain and shows what lands in your account after tax.",
  ].join(" ");
}

export function taxShortTermText(rate: number): string {
  return [
    "A holding period of one year or less counts as short term.",
    `Short term gains stack on your ordinary income, so this model uses your ${formatPercent(rate)} bracket.`,
    "That rate is often the difference between holding a few more weeks or selling now.",
  ].join(" ");
}

export function taxLongTermText(rate: number): string {
  return [
    "Hold longer than one year and the gain can qualify for long term rates.",
    `This model uses ${formatPercent(rate)} as a flat long term rate for the whole gain.`,
    "Real brackets step up with income, so treat the flat rate as a planning shortcut.",
  ].join(" ");
}

export function taxLossText(): string {
  return [
    "The sale came in below your cost basis, so this position booked a loss.",
    "A loss carries no tax bill in this model.",
    "Real rules let you offset other gains and a limited slice of ordinary income, with carryforward for the rest.",
  ].join(" ");
}

export function taxExample(): string {
  return [
    "Say you buy one unit at $40,000 and sell at $60,000 eleven months later.",
    "The buy fee is 0.5% so your basis lands near $40,200.",
    "The sell fee of 0.5% trims the $60,000 notional to $59,700.",
    "The gain is $19,500 and at a 24% bracket the tax is $4,680.",
    "Your after tax proceeds are $55,020 and the tax drag is about 11.6% of basis.",
    "Hold three more months for a long term rate of 15% and the tax drops to $2,925.",
  ].join(" ");
}

export function taxDisclosureText(): string {
  return [
    "This calculator is an educational model, not tax advice.",
    "Real crypto tax rules vary by country, state, and personal situation.",
    "Every trade, swap, spend, and airdrop can create a taxable event.",
    "Wash sale style rules differ for crypto and change over time.",
    "Talk to a qualified tax professional before you file.",
  ].join(" ");
}
