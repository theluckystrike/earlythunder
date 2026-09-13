import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto average price calculator";
const description = "Calculate the fee-aware weighted average price, total units, and combined modeled cost for two crypto purchases with different sizes and prices.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-average-price-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-average-price-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "average-price", slug: "crypto-average-price-calculator", eyebrow: "Cost basis model", title, description,
  intro: "Enter an existing position and one new purchase. The result weights each cost by its units and adds the entered fee only to the proposed purchase, so a fee already included in the existing basis is not counted twice.",
  formulas: ["Gross cost = existing units × existing basis + new units × new price", "New purchase fee = new units × new price × fee rate", "Total modeled cost = gross combined cost + new purchase fee", "Weighted average = total modeled cost ÷ total units"],
  sections: [
    { heading: "Why a simple average is wrong", paragraphs: ["Adding two prices and dividing by two is only correct when both purchases contain exactly the same number of units. If one buy is larger, its execution price must carry more weight. Cost basis therefore comes from total spend divided by total units.", "This distinction matters when averaging down or adding after a rally. A small second order barely moves a large existing position, even if its price is far from the original entry."] },
    { heading: "How the fee-aware basis works", paragraphs: ["The existing average cost is treated as a carried-forward basis that already includes any historical fees. The selected fee rate applies only to the new purchase. It increases cash committed without increasing the entered token count, so the combined break-even price rises.", "If your platform deducts fees in tokens, changes the received unit count, or rebates maker orders, calculate from the actual statement instead. The model assumes the entered new units are the units received."] },
    { heading: "Using the result with trade records", paragraphs: ["For a quick scenario, two purchase legs are enough. This output is not a tax basis calculation. Tax records may need every fill, disposal, transfer, fee asset, wallet, and identification choice. Keep the exchange export or verified ledger as the source of record.", "You can consolidate several earlier fills into the first leg by using their existing total units and weighted average price, then enter a proposed new order as the second leg. That preserves the weighted calculation while making the tool useful for planning the next buy."] },
  ],
  example: { heading: "Adding 0.75 units to an existing position", body: "An existing 1.25 units at a $42,000 fee-inclusive basis carries $52,500 of cost. Another 0.75 units at $58,000 costs $43,500 before its new fee. A 0.2% fee adds $87, producing 2 total units, a $96,087 combined basis, and a $48,043.50 weighted average per unit." },
  faqs: [
    { question: "Is weighted average price the same as tax basis?", answer: "No. This calculator produces a planning average from the values entered. Tax basis can depend on transaction-cost and unit-identification rules that this tool does not apply." },
    { question: "Can I use this to average down?", answer: "Yes. Put the existing position in the first leg and the proposed purchase in the second. The output shows the new combined average price." },
    { question: "Does the calculator include a future selling fee?", answer: "No. It includes the fee on the new purchase only. A future selling fee depends on the exit price and venue, so use the profit calculator for full round-trip math." },
  ],
  sources: [
    { title: "IRS digital asset transaction FAQs", href: "https://www.irs.gov/individuals/international-taxpayers/frequently-asked-questions-on-digital-asset-transactions", note: "Explains current U.S. rules for transaction costs, basis, and identifying digital asset units. Those rules are outside this planning model." },
    { title: "IRS digital assets guidance hub", href: "https://www.irs.gov/filing/digital-assets", note: "Collects current reporting guidance and separates rules for transactions before and after January 1, 2025." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
