import type { Metadata } from "next";
import { FAQ_ITEMS } from "@/lib/pricing-data";
import EmailCapture from "@/components/EmailCapture";
import FAQAccordion from "./FAQAccordion";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Early Thunder membership. One tier, every signal, no fluff. $199/month.",
};

const DISCORD_URL = "https://discord.gg/QeHxTFbqmC";

const FEATURES = [
  "All opportunities, fully ranked",
  "Complete 8-signal breakdowns & source citations",
  "Live scoring updates",
  "Weekly deep-dive research briefs",
  "Full graveyard archive with post-mortems",
  "Community Discord access",
  "Email alerts on new T1 calls",
  "Cancel anytime, one click",
] as const;

const GUARANTEES = [
  { label: "Pipeline cost", detail: "$15K / mo in tooling" },
  { label: "No trial", detail: "Instant full access" },
  { label: "Cancel anytime", detail: "One click, no lock-in" },
  { label: "Zero conflicts", detail: "We never take positions" },
] as const;

/** Pricing page: single-tier editorial design. */
export default function PricingPage() {
  console.assert(FEATURES.length === 8, "PricingPage: expected 8 features");
  console.assert(FAQ_ITEMS.length > 0, "PricingPage: FAQ_ITEMS required");

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <PageHeader />
      <PricingCard />
      <GuaranteeStrip />
      <FAQSection />
    </div>
  );
}

/** Section label, title, and lede paragraph. */
function PageHeader() {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="section-label">
        <span className="num">11</span> Membership
      </p>
      <h1
        className="mt-5 font-serif font-normal text-4xl md:text-5xl tracking-tight text-text-primary leading-[1.1]"
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        One tier. Every signal.{" "}
        <em className="not-italic text-bolt">No fluff.</em>
      </h1>
      <p className="mt-6 text-base leading-relaxed text-text-secondary max-w-lg mx-auto">
        We spend over $15,000 per month on data pipelines, AI scoring
        infrastructure, and proprietary research tooling so you don&apos;t have
        to. One membership unlocks everything.
      </p>
    </div>
  );
}

/** Two-column pricing card: price + CTA left, features right. */
function PricingCard() {
  console.assert(typeof DISCORD_URL === "string", "PricingCard: DISCORD_URL required");
  console.assert(FEATURES.length > 0, "PricingCard: FEATURES must not be empty");

  return (
    <div className="mt-14 border border-line-2 rounded-2xl bg-bg-card p-8 md:p-10 grid md:grid-cols-2 gap-10">
      <PricingLeft />
      <PricingRight />
    </div>
  );
}

/** Left half: badge, price, CTA, guarantee note. */
function PricingLeft() {
  return (
    <div className="flex flex-col justify-between">
      <div>
        <span className="inline-block font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary border border-line-2 rounded-full px-3 py-1">
          Monthly &middot; no lock-in
        </span>
        <div className="mt-5 flex items-baseline gap-2">
          <span
            className="font-serif font-normal text-[72px] leading-none tracking-[-0.04em] text-text-primary"
            style={{ fontVariationSettings: "'opsz' 144" }}
          >
            $199
          </span>
          <span className="font-mono text-sm text-text-secondary">/month</span>
        </div>
      </div>
      <div className="mt-8">
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bolt inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium w-full justify-center"
        >
          Join Discord &rarr;
        </a>
        <p className="mt-3 font-mono text-[10px] text-text-tertiary text-center uppercase tracking-wider">
          Access granted in Discord after payment
        </p>
      </div>
    </div>
  );
}

/** Right half: feature checklist. */
function PricingRight() {
  return (
    <div>
      <h2 className="font-mono text-[11px] font-medium text-text-secondary uppercase tracking-wider">
        What&apos;s included
      </h2>
      <ul className="mt-5 space-y-3.5">
        {FEATURES.map((feature) => (
          <FeatureRow key={feature} text={feature} />
        ))}
      </ul>
    </div>
  );
}

/** Single feature row with checkmark. */
function FeatureRow({ text }: { readonly text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-text-primary/85 leading-snug">
      <span className="text-bolt mt-0.5 flex-shrink-0" aria-hidden="true">
        &#10003;
      </span>
      <span>{text}</span>
    </li>
  );
}

/** 4-column guarantee strip below the pricing card. */
function GuaranteeStrip() {
  console.assert(GUARANTEES.length === 4, "GuaranteeStrip: expected 4 guarantees");
  console.assert(GUARANTEES.every((g) => g.label.length > 0), "GuaranteeStrip: all must have labels");

  return (
    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 border border-line-2 rounded-xl bg-bg-elevated/50 p-6">
      {GUARANTEES.map((item) => (
        <div key={item.label} className="text-center">
          <div className="font-mono text-[11px] font-semibold text-text-primary uppercase tracking-wider">
            {item.label}
          </div>
          <div className="mt-1 font-mono text-[10px] text-text-tertiary">
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

/** FAQ section with accordion items. */
function FAQSection() {
  return (
    <section className="mt-20">
      <h2
        className="font-serif font-normal text-2xl tracking-tight text-text-primary text-center"
        style={{ fontVariationSettings: "'opsz' 72" }}
      >
        Questions
      </h2>
      <div className="mt-8 max-w-2xl mx-auto">
        <FAQAccordion items={FAQ_ITEMS} />
      </div>
      <div className="mt-12">
        <EmailCapture />
      </div>
    </section>
  );
}
