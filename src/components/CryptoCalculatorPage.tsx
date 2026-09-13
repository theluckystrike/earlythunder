import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import CryptoPlanningCalculator, { type PlanningCalculatorKind } from "@/components/CryptoPlanningCalculator";

export interface CalculatorPageSpec {
  readonly kind: PlanningCalculatorKind;
  readonly slug: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly intro: string;
  readonly formulas: readonly string[];
  readonly sections: readonly { readonly heading: string; readonly paragraphs: readonly string[] }[];
  readonly example: { readonly heading: string; readonly body: string };
  readonly faqs: readonly { readonly question: string; readonly answer: string }[];
  readonly sources: readonly {
    readonly title: string;
    readonly href: string;
    readonly note: string;
  }[];
}

const AUTHOR = { "@type": "Person", name: "Michael Lip", url: "https://earlythunder.com/about", sameAs: ["https://github.com/theluckystrike"] };
const PUBLISHER = { "@type": "Organization", name: "AUTOM8 LLC", url: "https://earlythunder.com" };

function schemas(spec: CalculatorPageSpec): readonly Record<string, unknown>[] {
  const url = `https://earlythunder.com/${spec.slug}`;
  return [
    {
      "@context": "https://schema.org", "@type": "WebApplication", name: spec.title,
      url, description: spec.description, applicationCategory: "FinanceApplication",
      operatingSystem: "Web", isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, author: AUTHOR, publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org", "@type": "Article", headline: spec.title,
      description: spec.description, url, mainEntityOfPage: url,
      datePublished: "2026-09-13", dateModified: "2026-09-13", author: AUTHOR, publisher: PUBLISHER,
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: spec.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://earlythunder.com/" },
        { "@type": "ListItem", position: 2, name: spec.title, item: url },
      ],
    },
  ];
}

const RELATED = [
  { href: "/crypto-dca-calculator", label: "DCA calculator" },
  { href: "/crypto-average-price-calculator", label: "Average price calculator" },
  { href: "/crypto-fee-calculator", label: "Fee calculator" },
  { href: "/crypto-apy-calculator", label: "APY calculator" },
  { href: "/crypto-position-size-calculator", label: "Position size calculator" },
  { href: "/crypto-profit-calculator", label: "Profit calculator" },
] as const;

export default function CryptoCalculatorPage({ spec }: { readonly spec: CalculatorPageSpec }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      {schemas(spec).map((schema, index) => <JsonLd key={index} data={schema} />)}
      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs text-text-secondary"><Link href="/" className="hover:text-text-primary">Home</Link><span className="px-2" aria-hidden="true">/</span><span>{spec.title}</span></nav>
      <header>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-secondary"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-positive" />{spec.eyebrow}</span>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">{spec.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">{spec.description}</p>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{spec.intro}</p>
        <p className="mt-5 inline-flex max-w-3xl rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">No market feed is used. Every price, rate, fee, and balance comes from the values you enter.</p>
      </header>
      <CryptoPlanningCalculator kind={spec.kind} />
      <section className="mt-20 border-t border-border-subtle pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">The calculation</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{spec.formulas.map((formula) => <div key={formula} className="rounded-2xl border border-border-subtle bg-bg-secondary p-6 font-mono text-sm leading-relaxed text-text-primary">{formula}</div>)}</div>
      </section>
      {spec.sections.map((section) => <section key={section.heading} className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">{section.heading}</h2><div className="mt-6 max-w-3xl space-y-4 text-[1.0625rem] leading-[1.75] text-text-secondary">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}
      <section className="mt-20 rounded-2xl border border-amber/30 bg-bg-secondary p-6 md:p-8"><span className="font-mono text-xs uppercase tracking-wider text-amber">Worked example</span><h2 className="mt-3 text-2xl font-semibold text-text-primary">{spec.example.heading}</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">{spec.example.body}</p></section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Questions and answers</h2><div className="mt-8 grid gap-4">{spec.faqs.map((faq) => <details key={faq.question} className="rounded-xl border border-border-subtle bg-bg-card p-5"><summary className="cursor-pointer font-semibold text-text-primary">{faq.question}</summary><p className="mt-3 max-w-3xl leading-relaxed text-text-secondary">{faq.answer}</p></details>)}</div></section>
      <section className="mt-20 border-t border-border-subtle pt-12">
        <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Primary references</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Method and sources</h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">The formulas run only on your inputs. These references support the definitions and risk notes on this page. They do not supply prices or predict a result.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {spec.sources.map((source) => <li key={source.href} className="rounded-xl border border-border-subtle bg-bg-card p-5"><a className="font-medium text-amber hover:text-accent-hover" href={source.href}>{source.title}<span aria-hidden="true"> ↗</span></a><p className="mt-2 text-sm leading-relaxed text-text-secondary">{source.note}</p></li>)}
        </ol>
      </section>
      <section className="mt-20 border-t border-border-subtle pt-12"><h2 className="text-2xl font-semibold tracking-tight text-text-primary md:text-[2rem]">Related calculators</h2><div className="mt-6 flex flex-wrap gap-3">{RELATED.filter((item) => item.href !== `/${spec.slug}`).map((item) => <Link key={item.href} href={item.href} className="ghost-btn">{item.label}<span className="arr">&rarr;</span></Link>)}</div></section>
      <section className="mt-20 rounded-2xl border border-border-subtle bg-bg-secondary p-6"><h2 className="text-xl font-semibold text-text-primary">Research and risk disclosure</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary">This calculator is an educational planning model, not investment, tax, or trading advice. It does not predict returns or execution. Crypto assets can lose their entire value. Confirm actual fills, fee schedules, funding, taxes, and account balances with the relevant provider before acting.</p><p className="mt-4 text-sm text-text-secondary">Built and checked by <Link className="text-amber hover:text-accent-hover" href="/about">Michael Lip</Link>. Method assumptions are stated on this page so the result can be reproduced independently.</p></section>
    </div>
  );
}
