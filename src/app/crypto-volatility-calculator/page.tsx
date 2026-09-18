import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import VolatilityCalculator from "@/components/VolatilityCalculator";
import { volatilityDisclosureText, volatilityIntroText } from "@/lib/volatility-calc";

const slug = "crypto-volatility-calculator";
const canonical = `https://earlythunder.com/${slug}`;
const title = "Crypto volatility calculator with real Bitcoin data";
const description = "Turn two Bitcoin price readings into a daily return, an annualized volatility estimate, and a one sigma daily move band. Runs on real BTC daily data from September 2026.";
const intro = "Volatility is the number that decides position size, stop distance, and how loud a drawdown will get. This page measures it from two real Bitcoin price readings and annualizes it the way practitioners do: daily return scaled by the square root of 365.";

const AUTHOR = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
const PUBLISHER = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };

const FORMULAS = [
  "daily return = ln(price2 / price1)",
  "annualized volatility = |daily return| x sqrt(365)",
  "one sigma band = price x (1 ± annualized volatility / sqrt(365))",
];

const SECTIONS = [
  {
    heading: "How the model turns two prices into a risk number",
    paragraphs: [
      "Enter two Bitcoin price readings and the number of calendar days between them. The model takes the log return between the readings, scales it to a daily figure, and then annualizes it by multiplying by the square root of 365. That annualized number is directly comparable to the volatility figures quoted for stocks and volatility indices.",
      "The one sigma band answers the practical question: on a normal day, how far should price travel before it is merely routine? A band of 2% to 4% means a 3% day is noise. A band of 0.5% to 1% means the same move is an event worth checking against your stops.",
      "Bitcoin's realized volatility has ranged from under 20% annualized in quiet stretches to over 100% in stressed ones. Whatever the market does next, the honest way to size exposure is to measure the current regime rather than assume yesterday's number still holds.",
    ],
  },
  {
    heading: "Worked example on real data",
    paragraphs: [
      volatilityIntroText(111_532, 114_213, 30),
      "Reading one is $111,532, reading two is $114,213, and the readings are 30 days apart. The daily log return is about 0.079%. Annualized, that is roughly 1.5%, which would be an extraordinarily calm regime. Insert the prices you actually care about and the same arithmetic produces the number that fits your window.",
    ],
  },
  {
    heading: "Where this model is honest and where it is thin",
    paragraphs: [
      "A single pair of readings produces one return observation, so the annualized figure is a scaling of that one observation, not a statistical estimate from a sample. Treat it as a sanity check on regime, not as a precise forecast. Multi-window studies need a full price series, which is what the site's backtest pages run on.",
      volatilityDisclosureText(),
    ],
  },
];

const FAQS = [
  { question: "Why annualize with the square root of 365?", answer: "Independent daily shocks add in variance, not in return. Variance scales linearly with time, so the standard deviation scales with the square root of time. Bitcoin trades every day of the year, so 365 rather than 252." },
  { question: "Is annualized volatility the same as implied volatility?", answer: "No. This page computes realized volatility from prices that already happened. Implied volatility is the market's forward-looking estimate embedded in option prices. The two often diverge, and the gap itself is tradable signal." },
  { question: "Can I use prices from different assets?", answer: "The arithmetic works on any two prices, but the interpretation only holds when both readings come from the same asset in the same currency. Mixing BTC and ETH readings produces a relative-return number, not a volatility estimate." },
  { question: "How should volatility change my position size?", answer: "A common rule keeps dollar risk constant: divide your risk budget by the expected move. If the daily band is 3% wide, a position sized for a 1% band is three times too large. Recompute when the regime shifts, not every day." },
];

const SOURCES = [
  { title: "Investopedia: volatility definition", href: "https://www.investopedia.com/terms/v/volatility.asp", note: "Defines volatility as the dispersion of returns and distinguishes realized from implied measures." },
  { title: "CBOE VIX white paper methodology", href: "https://www.cboe.com/us/indices/documents/vix-white.pdf", note: "The reference methodology for annualizing and quoting a volatility index, used here as the scaling convention." },
];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: { type: "article", title, description, url: canonical, images: [{ url: "/og-default.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/og-default.png"] },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication", name: title,
        url: canonical, applicationCategory: "FinanceApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        author: AUTHOR, publisher: PUBLISHER,
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
      }} />
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary">
        <a href="/" className="hover:text-text-primary">Home</a>
        <span className="px-2" aria-hidden="true">/</span>
        <span>{title}</span>
      </nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />
          Volatility model
        </span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">{description}</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{intro}</p>
      </header>

      <VolatilityCalculator />

      {SECTIONS.map((section) => (
        <section key={section.heading} className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">{paragraph}</p>
          ))}
        </section>
      ))}

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The formulas this page runs</h2>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          {FORMULAS.map((formula) => (
            <li key={formula} className="rounded-2xl border border-border-subtle bg-bg-card p-4 font-mono text-xs leading-relaxed text-text-secondary">{formula}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Questions traders actually ask</h2>
        <div className="mt-6 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-bg-card">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-base font-medium text-text-primary">
                <span className="mr-2 font-mono text-amber-600 group-open:rotate-90 inline-block transition-transform" aria-hidden="true">&#9656;</span>
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">References</h2>
        <ul className="mt-5 max-w-3xl space-y-2 text-sm leading-relaxed text-text-secondary">
          {SOURCES.map((source) => (
            <li key={source.href} className="flex gap-2">
              <span aria-hidden="true">&bull;</span>
              <span><a className="underline hover:text-text-primary" href={source.href} rel="noopener noreferrer">{source.title}</a> {source.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-20 border-t border-border-subtle pt-6 text-xs text-text-secondary">
        Realized-volatility math on real BTC daily readings. Data window fetched 2026-09-18. Nothing here is investment advice. Built and checked by <a className="underline hover:text-text-primary" href="https://earlythunder.com/about">Michael Lip</a>.
      </footer>
    </div>
  );
}
