import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto APY Calculator with Token Inflation";
const description = "Convert crypto APR to effective APY, project compounded rewards, and compare nominal balance growth with an inflation-adjusted result.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-apy-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-apy-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "apy", slug: "crypto-apy-calculator", eyebrow: "Yield conversion model", title, description,
  intro: "The calculator separates quoted APR, compounding frequency, holding time, and token supply inflation. The inflation adjustment measures purchasing power in token terms, not future dollar price.",
  formulas: ["APY = (1 + APR ÷ compounds) ^ compounds − 1", "Ending balance = principal × (1 + APR ÷ compounds) ^ total compounds", "Real balance = nominal ending balance ÷ (1 + inflation) ^ years", "Real gain = inflation-adjusted balance − principal"],
  sections: [
    { heading: "APR and APY are not interchangeable", paragraphs: ["APR states a simple annual rate before intra-year compounding. APY includes the effect of reinvesting rewards. At the same APR, more frequent compounding raises APY, but the incremental benefit becomes smaller as frequency increases.", "A protocol may label rates differently or show a variable trailing estimate. Confirm whether the displayed rate already includes compounding before converting it again. Compounding an advertised APY would overstate the result."] },
    { heading: "Why token inflation belongs in the model", paragraphs: ["A token balance can grow while each unit represents a smaller share of total supply. The inflation-adjusted result discounts nominal balance growth by the annual token inflation assumption, revealing whether rewards outpace dilution in this simplified model.", "Supply inflation is not the same as consumer price inflation, and neither determines the token's market price. Demand, protocol revenue, unlocks, burns, liquidity, and market conditions can overwhelm the mechanical supply effect."] },
    { heading: "Reward risks the formula cannot capture", paragraphs: ["Quoted yield can change, compounding may require claims or gas, lockups can prevent exit, validators can be slashed, and smart contracts or bridges can fail. Liquid staking tokens can also trade away from their redemption value.", "Model a conservative rate and compare it with the protocol's actual payout history. Treat very high nominal yield as a prompt to inspect reward funding and token emissions, not as evidence of a high expected return."] },
  ],
  example: { heading: "$10,000 at 12% APR", body: "With daily compounding, 12% APR converts to about 12.75% APY. Over two years, $10,000 grows to roughly $12,710 before price changes, taxes, fees, or rate changes. At 4% annual token inflation, the inflation-adjusted balance is lower because part of the nominal reward offsets dilution." },
  faqs: [
    { question: "Is APY guaranteed in crypto staking?", answer: "No. Rates, reward tokens, asset prices, validator performance, protocol rules, and access to funds can all change." },
    { question: "How often should I set compounding?", answer: "Use the frequency at which rewards are actually reinvested after considering claim rules and costs. Daily is not accurate if rewards are only compounded monthly." },
    { question: "Does token inflation predict price loss?", answer: "No. It measures supply dilution under a simplified assumption. Market price depends on supply and demand together." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
