import type { Metadata } from "next";
import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";
import {
  FREE_FEATURES,
  PREMIUM_ONLY_FEATURES,
  MATRIX_ROWS,
  FAQ_ITEMS,
} from "@/lib/pricing-data";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Early Thunder pricing plans. Free tier to explore, Premium for full intelligence access.",
};

export default function PricingPage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageHeader />
        <PricingCards />
        <FeatureMatrix />
        <FAQSection />
        <CTASection />
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl sm:text-4xl">
        Choose Your Signal Level
      </h1>
      <p className="mt-4 text-lg text-text-secondary">
        Start free. Upgrade when you want the full intelligence layer.
      </p>
    </div>
  );
}

function PricingCards() {
  return (
    <div className="mt-12 grid gap-8 md:grid-cols-2">
      <FreePlan />
      <PremiumPlan />
    </div>
  );
}

function FreePlan() {
  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <h2 className="font-display text-2xl">Free</h2>
      <div className="mt-4 font-mono text-4xl font-bold text-text-primary">$0</div>
      <p className="mt-1 text-sm text-text-secondary">Forever</p>
      <ul className="mt-8 space-y-3">
        {FREE_FEATURES.map((f) => (
          <FeatureItem key={f} text={f} included />
        ))}
        {PREMIUM_ONLY_FEATURES.map((f) => (
          <FeatureItem key={f} text={f} included={false} />
        ))}
      </ul>
      <Link href="/" className="mt-8 block rounded-lg border border-border bg-surface py-3 text-center text-sm font-semibold text-text-primary transition-colors hover:bg-card">
        Get Started
      </Link>
    </div>
  );
}

function PremiumPlan() {
  return (
    <div className="relative rounded-xl border-2 border-amber bg-card p-8">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="rounded-full bg-amber px-3 py-1 text-xs font-bold text-base">MOST POPULAR</span>
      </div>
      <h2 className="font-display text-2xl">Premium</h2>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-4xl font-bold text-amber">$49</span>
        <span className="text-sm text-text-secondary">/month</span>
      </div>
      <p className="mt-1 text-sm text-text-secondary">or $399/year (save $189)</p>
      <ul className="mt-8 space-y-3">
        {FREE_FEATURES.map((f) => (
          <FeatureItem key={f} text={f} included />
        ))}
        {PREMIUM_ONLY_FEATURES.map((f) => (
          <FeatureItem key={f} text={f} included />
        ))}
      </ul>
      <Link href="#cta" className="mt-8 block rounded-lg bg-amber py-3 text-center text-sm font-semibold text-base transition-colors hover:bg-amber-hover">
        Start 7-Day Free Trial
      </Link>
    </div>
  );
}

function FeatureItem({ text, included }: { readonly text: string; readonly included: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {included ? <CheckIcon /> : <XIcon />}
      <span className={included ? "text-text-primary" : "text-text-secondary/50 line-through"}>{text}</span>
    </li>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-success" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-text-secondary/30" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
    </svg>
  );
}

function FeatureMatrix() {
  return (
    <section className="mt-16">
      <h2 className="text-center font-display text-2xl">Feature Comparison</h2>
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface/50 text-xs uppercase tracking-wider text-text-secondary">
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 text-center font-medium">Free</th>
              <th className="px-4 py-3 text-center font-medium">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MATRIX_ROWS.map((row) => (
              <tr key={row.feature} className="bg-card">
                <td className="px-4 py-3 text-text-primary">{row.feature}</td>
                <td className="px-4 py-3 text-center">{row.free ? <GreenDot /> : <GrayDot />}</td>
                <td className="px-4 py-3 text-center"><GreenDot /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GreenDot() {
  return <span className="text-success">&#10003;</span>;
}

function GrayDot() {
  return <span className="text-text-secondary/30">&#10005;</span>;
}

function FAQSection() {
  return (
    <section className="mt-16">
      <h2 className="text-center font-display text-2xl">Frequently Asked Questions</h2>
      <div className="mt-8 space-y-4">
        {FAQ_ITEMS.map((item) => (
          <div key={item.q} className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-semibold text-text-primary">{item.q}</h3>
            <p className="mt-2 text-sm text-text-secondary">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="cta" className="mt-16 border-t border-border pt-12">
      <div className="text-center">
        <h2 className="font-display text-2xl">
          Ready to hear the <span className="text-amber">thunder</span>?
        </h2>
        <p className="mt-4 text-text-secondary">
          Join the waitlist for Early Thunder Premium. Be first to get access.
        </p>
        <div className="mt-8">
          <EmailCapture />
        </div>
      </div>
    </section>
  );
}
