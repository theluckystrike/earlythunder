import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto fee calculator for round-trip costs";
const description = "Estimate crypto buy fees, sell fees, spread, network costs, total round-trip cost, and the approximate price gain needed to break even.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-fee-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-fee-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "fees", slug: "crypto-fee-calculator", eyebrow: "Execution cost model", title, description,
  intro: "Quoted trading fees are only one part of execution cost. This model keeps buy fees, sell fees, spread, and fixed network or withdrawal costs visible as separate inputs.",
  formulas: ["Buy fee = trade notional × buy fee rate", "Break-even exit = (notional + buy fee + spread + fixed cost) ÷ (1 − sell fee rate)", "Sell fee = break-even exit × sell fee rate", "Total cost = buy fee + sell fee + spread cost + fixed costs"],
  sections: [
    { heading: "The difference between a fee and a spread", paragraphs: ["A fee is an explicit charge shown by the venue. A spread is the gap between available buying and selling prices. Crossing that gap can create an execution cost even when a platform advertises zero commission.", "The calculator expresses spread as a percentage of the entered notional. Actual spread depends on the asset, venue, order size, order type, liquidity, and moment of execution. Large market orders can also incur slippage beyond the displayed spread."] },
    { heading: "Why round-trip cost matters", paragraphs: ["A trade must overcome costs on entry and exit before it is profitable. Looking only at the entry commission understates that hurdle. Fixed withdrawal or network charges can dominate small transfers even when the percentage trading fee is low.", "The break-even equation applies the sell fee to the higher exit value rather than the original notional. That distinction becomes material at high fee rates. Actual execution can still differ because spread and slippage change with market conditions."] },
    { heading: "Inputs to verify before trading", paragraphs: ["Check the venue's current maker and taker schedule, your account tier, the quoted bid and ask, withdrawal fees, blockchain conditions, and the settlement currency. Promotional rates and volume tiers can expire or change.", "Funding payments, borrowing interest, gas variability, price impact, foreign exchange costs, and taxes are not modeled. For leveraged positions, use a liquidation model alongside this cost estimate."] },
  ],
  example: { heading: "A $10,000 round trip", body: "At a 0.4% buy fee, 0.4% sell fee, 0.15% spread, and $8 fixed cost, the exact modeled break-even exit is about $10,103.41. The sell fee is calculated on that exit value, producing a 1.034% price hurdle before unmodeled slippage or tax." },
  faqs: [
    { question: "Does a zero-fee crypto trade really cost nothing?", answer: "Not necessarily. A venue can earn through spread, price markup, withdrawal charges, or other costs even when the explicit commission is zero." },
    { question: "What is a maker versus taker fee?", answer: "A maker order adds resting liquidity to the order book, while a taker order executes against existing liquidity. Many venues charge different rates for them." },
    { question: "Is the break-even gain exact?", answer: "It exactly solves the entered percentage and fixed costs under this model. Real break-even can differ because the estimated spread, slippage, fee tier, and network cost can change before exit." },
  ],
  sources: [
    { title: "Investor.gov bid and ask glossary", href: "https://www.investor.gov/introduction-investing/investing-basics/glossary/ask-price", note: "Defines the spread as the difference between the highest bid and lowest ask." },
    { title: "SEC bulletin on investment fees", href: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated", note: "Explains transaction charges and recommends checking fee schedules, statements, and trade confirmations." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
