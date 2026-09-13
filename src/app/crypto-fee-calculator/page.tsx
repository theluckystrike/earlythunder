import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto Fee Calculator for Round-Trip Costs";
const description = "Estimate crypto buy fees, sell fees, spread, network costs, total round-trip cost, and the approximate price gain needed to break even.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-fee-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-fee-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "fees", slug: "crypto-fee-calculator", eyebrow: "Execution cost model", title, description,
  intro: "Quoted trading fees are only one part of execution cost. This model keeps buy fees, sell fees, spread, and fixed network or withdrawal costs visible as separate inputs.",
  formulas: ["Buy fee = trade notional × buy fee rate", "Sell fee = trade notional × sell fee rate", "Spread cost = trade notional × estimated spread", "Total cost = buy fee + sell fee + spread cost + fixed costs"],
  sections: [
    { heading: "The difference between a fee and a spread", paragraphs: ["A fee is an explicit charge shown by the venue. A spread is the gap between available buying and selling prices. Crossing that gap can create an execution cost even when a platform advertises zero commission.", "The calculator expresses spread as a percentage of the entered notional. Actual spread depends on the asset, venue, order size, order type, liquidity, and moment of execution. Large market orders can also incur slippage beyond the displayed spread."] },
    { heading: "Why round-trip cost matters", paragraphs: ["A trade must overcome costs on entry and exit before it is profitable. Looking only at the entry commission understates that hurdle. Fixed withdrawal or network charges can dominate small transfers even when the percentage trading fee is low.", "The minimum price gain shown here is an approximation based on the entered notional. Exact break-even changes when the exit notional differs from the entry, because a percentage sell fee applies to the future sale value."] },
    { heading: "Inputs to verify before trading", paragraphs: ["Check the venue's current maker and taker schedule, your account tier, the quoted bid and ask, withdrawal fees, blockchain conditions, and the settlement currency. Promotional rates and volume tiers can expire or change.", "Funding payments, borrowing interest, gas variability, price impact, foreign exchange costs, and taxes are not modeled. For leveraged positions, use a liquidation model alongside this cost estimate."] },
  ],
  example: { heading: "A $10,000 round trip", body: "At a 0.4% buy fee and a 0.4% sell fee, explicit trading charges total $80 on a $10,000 reference notional. A 0.15% spread adds $15 and an $8 network charge brings the estimate to $103. That is a 1.03% cost hurdle before slippage, tax, or a different exit value." },
  faqs: [
    { question: "Does a zero-fee crypto trade really cost nothing?", answer: "Not necessarily. A venue can earn through spread, price markup, withdrawal charges, or other costs even when the explicit commission is zero." },
    { question: "What is a maker versus taker fee?", answer: "A maker order adds resting liquidity to the order book, while a taker order executes against existing liquidity. Many venues charge different rates for them." },
    { question: "Is the break-even gain exact?", answer: "It is an approximation using the entered notional as the base for both sides. Exact break-even depends on the eventual exit value and actual execution." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
