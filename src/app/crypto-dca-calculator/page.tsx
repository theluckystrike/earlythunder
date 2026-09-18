import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";
import { runDcaPlan, runLumpSumPlan, buildFeeDragTable, datasetDisclosure, comparisonSummary, formatUsd, formatUnits, formatPercent, type PriceDataset } from "@/lib/dca-backtest";
import dataset from "../../../data/btc-daily-365.json";

const title = "Crypto DCA calculator with fees";
const description = "Model recurring crypto purchases with trading fees, average cost, and a 364-day real Bitcoin price backtest cross-checked across two exchanges.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-dca-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-dca-calculator" }, twitter: { card: "summary_large_image", title, description } };

const rows = (dataset as PriceDataset).rows;
const CONTRIBUTION = 100;
const FEE_PERCENT = 0.25;
const FEE_LEVELS = [0, 0.1, 0.25, 0.5, 1] as const;
const dca = runDcaPlan(rows, { contribution: CONTRIBUTION, frequencyDays: 7, feePercent: FEE_PERCENT });
const lump = runLumpSumPlan(rows, { cash: dca.cash, feePercent: FEE_PERCENT });
const feeRows = buildFeeDragTable(rows, { contribution: CONTRIBUTION, frequencyDays: 7, feePercents: FEE_LEVELS });
const disclosure = datasetDisclosure(dataset as PriceDataset);
const comparison = comparisonSummary(dca, lump);

const spec: CalculatorPageSpec = {
  kind: "dca", slug: "crypto-dca-calculator", eyebrow: "Recurring purchase model", title, description,
  intro: "The calculator uses a transparent linear price path between your starting and ending prices. It is a scenario tool, not a forecast, so you can isolate how purchase timing and fees change the result. Below the calculator, a backtest section replays the same math against 364 dated daily Bitcoin prices.",
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
    { question: "Where does the backtest data come from?", answer: "The backtest section below uses 364 published daily Bitcoin prices from CoinGecko, cross-checked against Kraken at a 1% tolerance, fetched on the date stated in the data disclosure. It is a historical record, not a forecast." },
  ],
  sources: [
    { title: "Investor.gov dollar-cost averaging glossary", href: "https://www.investor.gov/introduction-investing/investing-basics/glossary/dollar-cost-averaging", note: "Defines equal purchases at regular intervals and explains why a fixed amount buys more units at lower prices." },
    { title: "SEC bulletin on investment fees", href: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated", note: "Explains that transaction fees reduce the money left in an investment and should be checked against account records." },
  ],
};

function BacktestSection() {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Backtest: $100 every 7 days against real Bitcoin prices</h2>
      <p className="mt-4 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">The scenario calculator above is a straight path between two prices. To show how the same formulas behave on a real market path, the table below replays a $100 weekly purchase, at a {FEE_PERCENT}% fee, against {rows.length} published daily Bitcoin prices.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Cash invested</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dca.cash)}</p><p className="mt-1 text-sm text-text-secondary">{dca.contributions} weekly purchases, {dca.firstDate} to {dca.lastDate}</p></div>
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Average cost</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dca.averageCost)}</p><p className="mt-1 text-sm text-text-secondary">against a final price of {formatUsd(dca.finalPrice)}</p></div>
        <div className="rounded-2xl border border-border-subtle bg-bg-secondary p-6"><p className="font-mono text-xs uppercase tracking-wider text-text-secondary">Ending value</p><p className="mt-2 text-2xl font-semibold text-text-primary">{formatUsd(dca.finalValue)}</p><p className="mt-1 text-sm text-text-secondary">{formatUnits(dca.units)} units, {formatPercent(dca.roiPercent)} ROI</p></div>
      </div>
      <h3 className="mt-10 text-xl font-semibold text-text-primary">Fee drag on the same schedule</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-border-subtle font-mono text-xs uppercase tracking-wider text-text-secondary"><th className="py-2 pr-4">Fee</th><th className="py-2 pr-4">Units</th><th className="py-2 pr-4">Ending value</th><th className="py-2 pr-4">Cost of fees</th><th className="py-2">ROI</th></tr></thead>
          <tbody>
            {feeRows.map((row) => (
              <tr key={row.feePercent} className="border-b border-border-subtle/50 text-text-primary">
                <td className="py-2 pr-4">{row.feePercent}%</td>
                <td className="py-2 pr-4">{formatUnits(row.units)}</td>
                <td className="py-2 pr-4">{formatUsd(row.finalValue)}</td>
                <td className="py-2 pr-4">{row.feePercent === 0 ? "baseline" : formatUsd(row.feeCostDollars)}</td>
                <td className="py-2">{formatPercent(row.roiPercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mt-10 text-xl font-semibold text-text-primary">DCA versus lump sum on the same cash</h3>
      <p className="mt-4 max-w-3xl text-[1.0625rem] leading-[1.75] text-text-secondary">{comparison}</p>
      <h3 className="mt-10 text-xl font-semibold text-text-primary">Data disclosure</h3>
      <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-text-secondary">
        {disclosure.map((line) => <li key={line} className="flex gap-2"><span aria-hidden="true">&bull;</span><span>{line}</span></li>)}
      </ul>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <CryptoCalculatorPage spec={spec} />
      <div className="mx-auto max-w-5xl px-6"><BacktestSection /></div>
    </>
  );
}
