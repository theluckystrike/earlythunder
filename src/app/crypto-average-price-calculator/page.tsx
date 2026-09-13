import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto Average Price Calculator";
const description = "Calculate the fee-aware weighted average price, total units, and combined cost basis for two crypto purchases with different sizes and prices.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-average-price-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-average-price-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "average-price", slug: "crypto-average-price-calculator", eyebrow: "Cost basis model", title, description,
  intro: "Enter the unit count and execution price for two buys. The result weights each price by the units actually purchased and adds the entered buy fees to the combined cost basis.",
  formulas: ["Gross cost = units one × price one + units two × price two", "Purchase fees = gross cost × fee rate", "Total cost basis = gross cost + purchase fees", "Weighted average = total cost basis ÷ total units"],
  sections: [
    { heading: "Why a simple average is wrong", paragraphs: ["Adding two prices and dividing by two is only correct when both purchases contain exactly the same number of units. If one buy is larger, its execution price must carry more weight. Cost basis therefore comes from total spend divided by total units.", "This distinction matters when averaging down or adding after a rally. A small second order barely moves a large existing position, even if its price is far from the original entry."] },
    { heading: "How the fee-aware basis works", paragraphs: ["The selected fee rate is applied to the gross value of both purchases. Those fees increase the cash committed without increasing the token count, so the break-even price before an eventual selling fee rises.", "If your platform deducts fees in tokens, applies different tiers to each fill, or rebates maker orders, calculate from the actual statement instead. The model assumes the same percentage fee for both entered purchases."] },
    { heading: "Using the result with trade records", paragraphs: ["For a quick scenario, two purchase legs are enough. For tax or accounting records, every fill, disposal, transfer, fee asset, and jurisdiction-specific basis rule may matter. Exchange exports or a verified ledger remain the source of record.", "You can consolidate several earlier fills into the first leg by using their existing total units and weighted average price, then enter a proposed new order as the second leg. That preserves the weighted calculation while making the tool useful for planning the next buy."] },
  ],
  example: { heading: "Combining 1.25 and 0.75 units", body: "A purchase of 1.25 units at $42,000 costs $52,500 before fees. Another 0.75 units at $58,000 costs $43,500. Together they produce 2 units and $96,000 of gross cost. With a 0.2% fee on both buys, the fee-aware basis becomes $96,192 and the weighted average becomes $48,096 per unit." },
  faqs: [
    { question: "Is weighted average price the same as cost basis?", answer: "The weighted average is the combined cost basis per unit. This calculator includes the entered purchase fee in cost basis, but it does not apply tax-lot rules." },
    { question: "Can I use this to average down?", answer: "Yes. Put the existing position in the first leg and the proposed purchase in the second. The output shows the new combined average price." },
    { question: "Does the calculator include a future selling fee?", answer: "No. It includes purchase fees only. A future selling fee depends on the exit price and venue, so use the profit calculator for full round-trip math." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
