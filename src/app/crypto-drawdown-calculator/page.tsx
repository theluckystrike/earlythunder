import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import DrawdownCalculator from "@/components/DrawdownCalculator";
import {
  drawdownDisclosureText,
  drawdownIntroText,
  drawdownWorkedExample,
  formatPercent,
  indexCrashExampleText,
} from "@/lib/drawdown-calc";

const title = "Crypto drawdown calculator for peak-to-trough risk";
const description = "Work out how far a coin has fallen from its peak and the exact gain required to get back to even. The calculator covers drawdowns from 10% to 90% and shows what each one costs a holder.";
const AUTHOR = { "@type": "Organization", name: "Early Thunder" };
const PUBLISHER = { "@type": "Organization", name: "Early Thunder" };

export const metadata: Metadata = { title: { absolute: title }, description, alternates: { canonical: "https://earlythunder.com/crypto-drawdown-calculator" }, robots: { index: true, follow: true }, openGraph: { type: "article", title, description, url: "https://earlythunder.com/crypto-drawdown-calculator", images: [{ url: "/og-default.png", width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", title, description, images: ["/og-default.png"] } };

const schemas = [
  { "@context": "https://schema.org", "@type": "WebApplication", name: title, url: "https://earlythunder.com/crypto-drawdown-calculator", description, applicationCategory: "FinanceApplication", operatingSystem: "Web", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: AUTHOR, publisher: PUBLISHER },
  { "@context": "https://schema.org", "@type": "Article", headline: title, description, url: "https://earlythunder.com/crypto-drawdown-calculator", mainEntityOfPage: "https://earlythunder.com/crypto-drawdown-calculator", datePublished: "2026-09-18", dateModified: "2026-09-18", author: AUTHOR, publisher: PUBLISHER },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" }, { "@type": "ListItem", position: 2, name: title, item: "https://earlythunder.com/crypto-drawdown-calculator" }] },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
    { "@type": "Question", name: "What is a drawdown in crypto?", acceptedAnswer: { "@type": "Answer", text: "A drawdown is the percentage drop from a market's highest price to a later low. Bitcoin falling from 100000 dollars to 50000 dollars is a 50% drawdown. The measure looks backwards at a peak that already happened." } },
    { "@type": "Question", name: "Why does a 50% drop need a 100% gain to recover?", acceptedAnswer: { "@type": "Answer", text: "Recovery is measured from the smaller base. A fall from 100000 to 50000 halves the value, so the 50000 that remains has to double to reach the old peak. A 50% loss and a 100% gain are two views of the same move." } },
    { "@type": "Question", name: "How much gain does an 80% drawdown need?", acceptedAnswer: { "@type": "Answer", text: "An 80% drawdown needs a 400% gain from the low. The value left after the fall is 20% of the peak, so it has to rise fivefold to get back to where it started." } },
    { "@type": "Question", name: "Does a drawdown predict the bottom?", acceptedAnswer: { "@type": "Answer", text: "No. A drawdown describes a fall that has already printed. The current price can keep falling and there is no level at which a further drop becomes impossible." } },
  ] },
];

const SECTIONS = [
  {
    heading: "How to read a drawdown number",
    paragraphs: [
      "A drawdown is a percentage fall from a prior high to a later low. If a coin trades at 70000 dollars after peaking at 100000 dollars, the drawdown is 30%. The peak is the reference point and it never moves once you pick it.",
      "The number is easy to state and hard to feel. A 30% drawdown sounds mild next to a 30% recovery gain, but the two are measured from different places. One is taken off the top of the position and the other is measured up from the smaller remainder.",
      "This page keeps both numbers side by side so the gap between them stays visible. Change the peak or the trough and the recovery requirement updates straight away.",
    ],
  },
  {
    heading: "The arithmetic behind a recovery",
    paragraphs: [
      "Recovery gain is the move needed to climb from the trough back to the peak. The formula is 1 divided by one minus the drawdown, then minus one. Written as a percentage on a 50% drawdown it reads 1 divided by 0.5 minus 1, which is 1, or 100%.",
      "Because the divisor shrinks as the drawdown deepens, the recovery number grows faster than the drawdown itself. A 40% fall needs a 67% gain, a 60% fall needs 150%, and an 80% fall needs 400%.",
      "The asymmetry is a property of percentages, not of any particular coin. The same table applies to an equity index, a commodity, or a currency pair.",
    ],
  },
  {
    heading: "Drawdowns are normal, full recovery is not",
    paragraphs: [
      "Large drawdowns are a regular feature of volatile markets. A 20% fall from a high is a common marker people use for a bear market, and 50% or deeper falls have happened more than once in crypto's short history.",
      "What is not guaranteed is the climb back. The recovery math assumes the price eventually returns to the old peak, and that assumption fails for individual coins that never trade at their former high again. An index of many assets recovers differently from a single token because the index can drop a member that goes to zero.",
      "The practical use of this calculator is sizing rather than prediction. A holder who knows a 70% fall needs a 233% gain can decide in advance how much of a position they are willing to see fall that far.",
    ],
  },
  {
    heading: "Position sizing and the round trip",
    paragraphs: [
      "The panel above values a dollar bought at the peak once the price reaches the trough. A round trip fee is applied on the way in and the way out, which is why a position that is only slightly above water can still be a small loss after costs.",
      "Fees are the quiet part of a deep drawdown. On a position that fell 50%, a 0.25% fee each way barely registers. On a position that fell 90%, the fee is a rounding error next to the loss, and the larger problem is that the breakeven price sits far above any realistic near term level.",
      "Sizing smaller than a drawdown would hurt is the one lever a holder controls. The math here exists to make that number concrete rather than abstract.",
    ],
  },
];

const RELATED = [
  { href: "/crypto-buy-the-dip-calculator", label: "Buy the dip calculator" },
  { href: "/bitcoin-volatility-calculator", label: "Bitcoin volatility calculator" },
  { href: "/crypto-dca-calculator", label: "Crypto DCA calculator" },
];

const WORKED_PEAK = 100000;
const WORKED_TROUGH = 50000;

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-14 md:pt-20">
      {schemas.map((schema, index) => <JsonLd key={index} data={schema} />)}
      <header>
        <span className="font-mono text-xs uppercase tracking-wider text-amber">DRAWDOWN MODEL</span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">{drawdownIntroText()}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">The table below covers drawdowns from {formatPercent(10, 0)} to {formatPercent(90, 0)}. A 90% fall needs a {formatPercent(900, 0)} gain to recover, which is the clearest way to see how quickly the arithmetic turns hostile.</p>
      </header>

      <DrawdownCalculator />

      <section className="mt-20 rounded-2xl border border-amber/30 bg-bg-secondary p-6 md:p-8"><span className="font-mono text-xs uppercase tracking-wider text-amber">Worked example</span><h2 className="mt-3 text-2xl font-semibold text-text-primary">A peak at 100000 and a low at 50000</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{drawdownWorkedExample(WORKED_PEAK, WORKED_TROUGH)}</p></section>

      {SECTIONS.map((section) => <section key={section.heading} className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">{section.heading}</h2><div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Drawdowns in other markets</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">
          <p>{indexCrashExampleText("broad stock index", 4790, 2237)}</p>
          <p>{indexCrashExampleText("technology index", 16057, 4527)}</p>
          <p>Both examples use round historical levels for illustration. The recovery requirement is the same shape in every market because it comes from the percentage arithmetic rather than the asset.</p>
        </div>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">References</h2>
        <ul className="mt-6 max-w-3xl space-y-3 text-[1.0625rem] leading-relaxed text-text-secondary">
          <li><a className="underline decoration-border-subtle underline-offset-4 hover:text-text-primary" href="https://www.investopedia.com/terms/d/drawdown.asp" rel="noopener noreferrer" target="_blank">Investopedia on drawdown</a> for the definition of a peak to trough decline.</li>
          <li><a className="underline decoration-border-subtle underline-offset-4 hover:text-text-primary" href="https://www.morningstar.com/" rel="noopener noreferrer" target="_blank">Morningstar</a> research on recovery math, the reason a 50% loss needs a 100% gain.</li>
        </ul>
      </section>

      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Related calculators</h2>
        <div className="mt-6 flex flex-wrap gap-3">{RELATED.map((item) => <Link key={item.href} href={item.href} className="ghost-btn">{item.label}<span className="arr">&rarr;</span></Link>)}</div>
      </section>

      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6"><h2 className="text-xl font-semibold text-text-primary">Research and risk disclosure</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">{drawdownDisclosureText()} A deep drawdown can get deeper, and a holder who needs the money before the recovery prints has a realised loss rather than a paper one.</p></section>
      <p className="mt-10 border-t border-border-subtle pt-6 text-sm text-text-secondary">Built and checked by Michael Lip</p>
    </main>
  );
}
