import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto DCA Calculator with Fees";
const description = "Model recurring crypto purchases across a rising or falling price path, including trading fees, average cost, units accumulated, and ending value.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-dca-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-dca-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "dca", slug: "crypto-dca-calculator", eyebrow: "Recurring purchase model", title, description,
  intro: "The calculator uses a transparent linear price path between your starting and ending prices. It is a scenario tool, not a forecast, so you can isolate how purchase timing and fees change the result.",
  formulas: ["Units each period = contribution × (1 − fee rate) ÷ period price", "Average cost = total cash invested ÷ total units", "Ending value = accumulated units × ending price", "Gain or loss = ending value − total cash invested"],
  sections: [
    { heading: "What dollar cost averaging changes", paragraphs: ["Dollar cost averaging divides one allocation into repeated purchases. When prices fall, a fixed contribution buys more units. When prices rise, it buys fewer. The result is a weighted average cost determined by the complete path, not simply the midpoint between the first and last price.", "This model spaces prices evenly along the path you enter. Real markets do not move in a straight line, so two histories with the same endpoints can produce different accumulated units. Use several scenarios rather than treating one output as a prediction."] },
    { heading: "How fees compound across purchases", paragraphs: ["A percentage fee reduces the amount converted into the asset on every purchase. Small fees can become visible across dozens of contributions because each charge also removes units that would otherwise participate in later price changes.", "The total invested figure includes the full cash contribution. Units are calculated from the contribution after the entered fee. Spread, slippage, network charges, taxes, and subscription costs are outside this model."] },
    { heading: "When to compare a lump sum", paragraphs: ["A lump sum gets the full allocation exposed immediately. A recurring plan delays part of that exposure. In a steadily rising scenario, the earlier lump sum generally accumulates more units. In a falling scenario, later recurring purchases generally lower the average cost.", "That comparison is about timing risk, not a universal winner. Match the scenario to cash availability, the maximum loss you can tolerate, and whether the plan can be followed during a drawdown."] },
  ],
  example: { heading: "$250 invested 24 times", body: "With 24 contributions of $250, the cash invested is $6,000. If the modeled price rises from $50,000 to $80,000 and each purchase costs 0.25%, the calculator adds the units bought at all 24 prices, then values that combined balance at $80,000. Change the ending price below the starting price to test how buying more units later affects average cost." },
  faqs: [
    { question: "Does this DCA calculator predict future crypto prices?", answer: "No. The entered start and end prices define a straight scenario path. They are assumptions supplied by you, not a forecast from Early Thunder." },
    { question: "Are fees included in the average cost?", answer: "Yes. Total cash contributions are divided by the units received after the entered purchase fee, so the average cost reflects that fee." },
    { question: "Why can two DCA plans with the same start and end price differ?", answer: "The prices between the endpoints determine how many units each contribution buys. This model uses evenly spaced prices, while a real price history can follow a different path." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
