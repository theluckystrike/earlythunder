import type { Metadata } from "next";
import CryptoCalculatorPage, { type CalculatorPageSpec } from "@/components/CryptoCalculatorPage";

const title = "Crypto APY calculator with token inflation";
const description = "Convert crypto APR to effective APY, project compounded token rewards, and compare nominal balance growth with a token-supply-adjusted result.";
export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-apy-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-apy-calculator" }, twitter: { card: "summary_large_image", title, description } };

const spec: CalculatorPageSpec = {
  kind: "apy", slug: "crypto-apy-calculator", eyebrow: "Yield conversion model", title, description,
  intro: "The calculator separates quoted APR, compounding frequency, holding time, and token supply inflation. Every balance is denominated in tokens. The adjustment measures relative supply share, not purchasing power or future dollar price.",
  formulas: ["APY = (1 + APR ÷ compounds) ^ compounds − 1", "Ending balance = principal × (1 + APR ÷ compounds) ^ total compounds", "Real balance = nominal ending balance ÷ (1 + inflation) ^ years", "Real gain = inflation-adjusted balance − principal"],
  sections: [
    { heading: "APR and APY are not interchangeable", paragraphs: ["APR states a simple annual rate before intra-year compounding. APY includes the effect of reinvesting rewards. At the same APR, more frequent compounding raises APY, but the incremental benefit becomes smaller as frequency increases.", "A protocol may label rates differently or show a variable trailing estimate. Confirm whether the displayed rate already includes compounding before converting it again. Compounding an advertised APY would overstate the result."] },
    { heading: "Why token inflation belongs in the model", paragraphs: ["A token balance can grow while each unit represents a smaller share of total supply. The supply-adjusted result discounts nominal token growth by the annual token inflation assumption, revealing whether rewards outpace dilution in this simplified model.", "Supply inflation is not consumer price inflation and the adjusted balance is not a dollar valuation. Demand, protocol revenue, unlocks, burns, liquidity, and market conditions can overwhelm the mechanical supply effect."] },
    { heading: "Reward risks the formula cannot capture", paragraphs: ["Quoted yield can change, compounding may require claims or gas, lockups can prevent exit, validators can be slashed, and smart contracts or bridges can fail. Liquid staking tokens can also trade away from their redemption value.", "Model a conservative rate and compare it with the protocol's actual payout history. Treat very high nominal yield as a prompt to inspect reward funding and token emissions, not as evidence of a high expected return."] },
  ],
  example: { heading: "10,000 tokens at 12% APR", body: "With daily compounding, 12% APR converts to about 12.75% APY. Over two years, 10,000 tokens grow to roughly 12,712 tokens before fees or rate changes. At 4% annual token inflation, the supply-adjusted token-equivalent balance is lower because part of the nominal reward offsets dilution. This does not estimate the tokens' dollar price." },
  faqs: [
    { question: "Is APY guaranteed in crypto staking?", answer: "No. Rates, reward tokens, asset prices, validator performance, protocol rules, and access to funds can all change." },
    { question: "How often should I set compounding?", answer: "Use the frequency at which rewards are actually reinvested after considering claim rules and costs. Daily is not accurate if rewards are only compounded monthly." },
    { question: "Does token inflation predict price loss?", answer: "No. It measures supply dilution under a simplified assumption. Market price depends on supply and demand together." },
  ],
  sources: [
    { title: "CFPB Regulation DD APY appendix", href: "https://www.consumerfinance.gov/rules-policy/regulations/1030/a/", note: "Provides the compounding formula used as a mathematical reference. Regulation DD covers deposit accounts, not crypto products." },
    { title: "SEC bulletin on crypto interest accounts", href: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/investor-bulletin-crypto-asset-interest-bearing-accounts", note: "Lists custody, liquidity, failure, fraud, and technical risks that a compound-interest formula cannot measure." },
  ],
};

export default function Page() { return <CryptoCalculatorPage spec={spec} />; }
