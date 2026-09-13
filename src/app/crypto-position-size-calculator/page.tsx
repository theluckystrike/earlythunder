import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto position size calculator with fees";
const description = "Calculate a fee-aware crypto position size from account value, maximum risk, entry price, stop price, and round-trip trading fees.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-position-size-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-position-size-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "position-size", slug: "crypto-position-size-calculator", eyebrow: "Risk budget model", title, description,
  intro: "Start with the dollars you are willing to lose if the stop executes. The model divides that budget by price risk plus estimated entry and exit fees, then caps the entry cash requirement at the account value because borrowed capital is not modeled.",
  formulas: ["Risk budget = account value × maximum risk percentage", "Price risk per unit = |entry price − stop price|", "Fee-aware risk per unit = price risk + entry fee per unit + stop fee per unit", "Cash-capped units = cash available ÷ (entry price × (1 + entry fee rate))"],
  sections: [
    { heading: "Position size starts with loss tolerance", paragraphs: ["Choosing a dollar risk before choosing the number of units makes the position respond to stop distance. A wider stop creates more risk per unit and therefore a smaller position. A tighter stop creates a larger mathematical size, although real price noise can make that stop easier to hit.", "Maximum account risk is not the same as portfolio allocation. A position can consume a large share of the account while its planned stop limits the modeled loss to a smaller percentage."] },
    { heading: "How fees change the unit count", paragraphs: ["Entry and exit charges use part of the same loss budget. This calculator adds an entry fee based on the entry price and an exit fee based on the stop price to the risk per unit. The resulting unit count is lower than a fee-free calculation.", "Spread, slippage, gaps, funding, borrow cost, network fees, and taxes are outside the formula. In a fast market, a stop can execute beyond its trigger price, so realized loss can exceed the budget."] },
    { heading: "Limits for borrowed and volatile positions", paragraphs: ["A stop order and a liquidation threshold are different. Borrowing can cause forced closure before a planned stop if maintenance margin is breached. Check the venue's exact liquidation method and margin rules separately.", "Correlated positions can also concentrate risk. Five trades each sized at 1% do not guarantee a 1% portfolio loss when they move together. Aggregate exposure, liquidity, custody, and scenario risk still need separate limits."] },
  ],
  example: { heading: "Risking 1% of a $25,000 account", body: "A 1% limit creates a $250 risk budget. With a $100 entry, a $92 stop, and a 0.2% fee on each side, fee-aware risk is $8.384 per unit. Dividing $250 by that amount produces about 29.82 units and a notional position near $2,982, subject to execution and slippage." },
  faqs: [
    { question: "Can a stop guarantee my maximum loss?", answer: "No. Stops can slip or fail to execute at the trigger price during gaps, outages, or thin liquidity. The result is a planning estimate." },
    { question: "Should position size use account balance or available cash?", answer: "Use the capital base your risk policy actually governs. Do not count borrowed or inaccessible funds unless your policy explicitly accounts for their additional risk." },
    { question: "Does this calculator handle borrowed capital?", answer: "No. It sizes units from entry-to-stop risk and fees. It does not calculate maintenance margin or liquidation, which vary by venue and contract." },
  ],
  sources: [
    { title: "FINRA stop-order risk guidance", href: "https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets", note: "Explains in the securities context that a stop price is not a guaranteed execution price. Crypto venue rules still need a separate check." },
    { title: "CFTC virtual currency risk advisory", href: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html", note: "Covers volatility, market oversight, platform, fraud, and borrowing risks that position-size arithmetic does not remove." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
