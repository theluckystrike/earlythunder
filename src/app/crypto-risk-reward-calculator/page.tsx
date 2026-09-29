import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto risk reward calculator with fees";
const description = "Calculate a fee-aware crypto reward-to-risk ratio and break-even win rate from entry price, stop price, target price, units, and round-trip trading fees.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-risk-reward-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-risk-reward-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "risk-reward", slug: "crypto-risk-reward-calculator", eyebrow: "Trade expectation model", title, description,
  intro: "A reward-to-risk ratio compares what a trade plans to make against what it plans to lose. This model computes both sides with fees included: the gain from entry to target minus entry and exit fees, and the loss from entry to stop plus those fees. It also reports the win rate needed for the trade to break even in expectation.",
  formulas: ["Planned gain = target value − position value − entry fee − exit fee at target", "Planned loss = position value − stop value + entry fee + exit fee at stop", "Reward-to-risk ratio = planned gain ÷ planned loss", "Break-even win rate = planned loss ÷ (planned loss + planned gain)"],
  sections: [
    { heading: "Why fees belong in the ratio", paragraphs: ["A raw ratio computed from prices alone overstates the trade. Fees are paid on both legs whether the trade wins or loses, so they shrink the gain and enlarge the loss. For tight targets and tight stops, fees can move the ratio materially. This model charges the entry fee on the full position value, the exit fee on the value at the target for the gain side, and the value at the stop for the loss side.", "Spread, slippage, funding, and taxes are outside the formula. In fast markets, both the stop and the target can fill away from their trigger prices, changing the realized ratio."] },
    { heading: "The break-even win rate", paragraphs: ["The ratio alone does not say whether a strategy is profitable, because it depends on how often trades win. The break-even win rate is the share of winning trades at which expected profit is exactly zero: losing more often than that loses money on average, and winning more often makes money, holding the ratio constant. A 2:1 ratio needs to win about a third of the time; a 1:1 ratio needs about half.", "Real strategies rarely hit the exact target or the exact stop on every trade. Partial exits, trailing stops, and time-based exits all move the realized distribution away from this two-outcome model, so the break-even rate is a planning anchor rather than a performance guarantee."] },
    { heading: "Limits of the two-outcome model", paragraphs: ["This calculator models exactly two outcomes: a fill at the target or a fill at the stop. Positions closed early, gaps that jump the stop, and markets that move sideways to expiry are all outside the model. A high ratio paired with a low win rate can still be a losing strategy after costs if the assumptions do not hold.", "Risk of ruin, correlated positions, and capital constraints are portfolio-level concerns that a single-trade ratio cannot capture. Aggregate exposure still needs separate limits."] },
  ],
  example: { heading: "Ten units, $100 entry, $92 stop, $120 target", body: "With 10 units bought at $100, the position is worth $1,000. Selling at the $120 target yields $1,200 minus a $2.40 exit fee and the $2 entry fee, a planned gain of $195.60. Exiting at the $92 stop loses $80 plus $3.84 in combined fees, a planned loss of $83.84. The ratio is about 2.33:1 and the break-even win rate is about 30.1%." },
  faqs: [
    { question: "What ratio should I target?", answer: "There is no universal number. Higher ratios usually come from wider targets or tighter stops, and tighter stops are more likely to be hit by noise. The ratio only matters together with a realistic win rate." },
    { question: "Why is my realized ratio different from the calculation?", answer: "Fills, slippage, and partial exits move results away from the two-outcome plan. Fees also vary by venue and volume tier." },
    { question: "Does the break-even win rate include fees?", answer: "Yes. Both the planned gain and the planned loss in the formula are net of entry and exit fees." },
  ],
  sources: [
    { title: "CFTC virtual currency risk advisory", href: "https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/understand_risks_of_virtual_currency.html", note: "Covers volatility, platform, and fraud risks that trade planning arithmetic does not remove." },
    { title: "FINRA stop-order risk guidance", href: "https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets", note: "Explains in the securities context that stop and limit outcomes are not guaranteed executions." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
