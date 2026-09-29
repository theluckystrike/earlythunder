import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto stop loss calculator with fees";
const description = "Calculate the fee-aware planned loss on a crypto position if a stop executes, from entry price, stop price, units held, and round-trip trading fees.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-stop-loss-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-stop-loss-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "stop-loss", slug: "crypto-stop-loss-calculator", eyebrow: "Exit loss model", title, description,
  intro: "A stop order converts an open-ended downside into a planned loss. This model prices that plan: it computes the value lost between entry and stop, adds entry and exit fees on both legs, and reports the loss as a percentage of the position so it can be compared against a risk budget.",
  formulas: ["Position value = entry price × units", "Value at stop = stop price × units", "Planned loss = position value − value at stop + entry fee + exit fee at stop", "Loss percentage = planned loss ÷ position value"],
  sections: [
    { heading: "A stop is a planned loss, not a guaranteed one", paragraphs: ["Setting a stop price is a decision to accept a specific loss if the market moves against the position. Pricing that decision before entry makes it possible to compare trades on risk instead of on notional size. The planned loss here includes fees on both the entry leg and the exit leg, because both are paid whether or not the trade succeeds.", "Real execution can differ from the plan. Stops can slip beyond the trigger price in fast markets, gaps can jump over the stop level, and venue outages can delay execution entirely. The result of this calculator is a planning estimate under the assumption that the stop fills at its trigger price."] },
    { heading: "How fees change the planned loss", paragraphs: ["Trading fees are charged on the value of each leg. The entry fee is computed on the full position value, and the exit fee is computed on the smaller value at the stop. Both are added to the price-based loss. For tight stops on low-volatility assets, fees can be a meaningful share of the total planned loss, which is why the model separates them.", "Spread, slippage, funding, borrow cost, network fees, and taxes are outside the formula. Venues with maker-taker schedules or volume discounts will produce different effective fees than a single flat rate per side."] },
    { heading: "Using the result with position sizing", paragraphs: ["The planned loss percentage can be read directly against an account-level risk limit. If the result exceeds the share of the account you are willing to lose on one trade, the position is too large or the stop is too far. Pair this calculator with position sizing to bring the planned loss inside the budget.", "A stop order and a liquidation threshold are different mechanisms. Leveraged positions can be forced closed before a planned stop if maintenance margin is breached, so leveraged traders should check venue margin rules separately."] },
  ],
  example: { heading: "Ten units from $100 to a $92 stop", body: "A position of 10 units bought at $100 is worth $1,000. At a $92 stop it is worth $920, a price-based loss of $80. With a 0.2% fee on each side, entry costs $2 and the exit at the stop costs $1.84. The total planned loss is $83.84, or 8.384% of the position value." },
  faqs: [
    { question: "Does this include the loss from slippage?", answer: "No. The model assumes the stop fills at its trigger price. Slippage, gaps, and partial fills can make the realized loss larger." },
    { question: "Is the fee applied once or twice?", answer: "Twice. An entry fee is charged on the position value at entry, and an exit fee is charged on the position value at the stop price." },
    { question: "Can I use this for leverage?", answer: "The arithmetic scales with units, but the model does not simulate margin calls, funding, or liquidation, which dominate leveraged outcomes." },
  ],
  sources: [
    { title: "FINRA stop-order risk guidance", href: "https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets", note: "Explains in the securities context that a stop price is not a guaranteed execution price." },
    { title: "CFTC virtual currency risk advisory", href: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html", note: "Covers volatility, platform, and fraud risks that a stop-loss plan does not remove." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
