import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How Early Thunder identifies and scores pre-mainstream asymmetric opportunities.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <PageHeader />
      <PipelineSection />
      <AssetClassSection />
      <DisclaimerSection />
      <CtaSection />
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tighter text-text-primary md:text-5xl">
        How it works
      </h1>
      <p className="mt-4 max-w-2xl text-xl text-text-secondary">
        From signal detection to scored opportunity in your dashboard.
      </p>
    </div>
  );
}

function PipelineSection() {
  return (
    <section className="mt-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PipelineStep
          number="01"
          title="Scout"
          description="Every week, the automated pipeline scans 50+ sources including on-chain data, GitHub trending repos, arXiv preprints, SEC filings, VC funding rounds, Reddit, and crypto-native platforms. Looks for signals matching patterns historically seen before major breakouts."
        />
        <PipelineStep
          number="02"
          title="Score"
          description="Each opportunity is evaluated against the 8-Signal Pattern Filter. The same eight characteristics shared by Bitcoin at $0.001, Ethereum at $0.30, and DeFi protocols before Summer 2020. Every signal is scored 0-100 and weighted to produce a composite pattern match score."
          linkHref="/methodology"
          linkLabel="Read the methodology"
        />
        <PipelineStep
          number="03"
          title="Track"
          description="Opportunities enter the database with an initial score and tier classification. Scores update weekly as new data emerges. When catalysts fire or fundamentals deteriorate, scores change. When projects fail, they move to the Graveyard with a post-mortem."
        />
      </div>
    </section>
  );
}

function PipelineStep({
  number,
  title,
  description,
  linkHref,
  linkLabel,
}: {
  readonly number: string;
  readonly title: string;
  readonly description: string;
  readonly linkHref?: string;
  readonly linkLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-8">
      <span className="font-mono text-sm text-text-tertiary">{number}</span>
      <h2 className="mt-3 text-xl font-semibold text-text-primary">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="mt-4 inline-block text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          {linkLabel} &rarr;
        </Link>
      )}
    </div>
  );
}

function AssetClassSection() {
  return (
    <section className="mt-20">
      <h2 className="text-2xl font-semibold tracking-tighter text-text-primary">
        What Early Thunder tracks
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <AssetClassCard
          title="Digital Assets"
          description="Tokens, DeFi protocols, AI agents, DePIN networks, DeSci DAOs, restaking protocols, and emerging on-chain primitives."
        />
        <AssetClassCard
          title="Public Equities"
          description="Listed stocks across fusion energy, quantum computing, uranium mining, critical minerals, and frontier defense technology."
        />
        <AssetClassCard
          title="Private Markets"
          description="Pre-IPO companies, equity crowdfunding, venture-backed startups in deep tech, biotech, and frontier AI infrastructure."
        />
      </div>
    </section>
  );
}

function AssetClassCard({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-8">
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    </div>
  );
}

const DISCLAIMER_STATEMENTS = [
  "Early Thunder is not a financial advisor.",
  "The platform does not recommend buying or selling any asset.",
  "Every opportunity includes the bear case.",
  "When projects fail, post-mortems get published.",
] as const;

function DisclaimerSection() {
  return (
    <section className="mt-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tighter text-text-primary">
          What Early Thunder is not
        </h2>
        <div className="mt-8 space-y-0">
          {DISCLAIMER_STATEMENTS.map((statement, index) => (
            <DisclaimerLine
              key={statement}
              statement={statement}
              isLast={index === DISCLAIMER_STATEMENTS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DisclaimerLine({
  statement,
  isLast,
}: {
  readonly statement: string;
  readonly isLast: boolean;
}) {
  return (
    <>
      <p className="py-4 text-lg font-medium text-text-primary">{statement}</p>
      {!isLast && <div className="mx-auto w-16 border-t border-border" />}
    </>
  );
}

function CtaSection() {
  return (
    <section className="mt-20 text-center">
      <h2 className="text-2xl font-semibold tracking-tighter text-text-primary">
        Ready to explore?
      </h2>
      <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/opportunities"
          className="rounded-full bg-text-primary px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          View opportunities &rarr;
        </Link>
        <Link
          href="/methodology"
          className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          Read methodology
        </Link>
      </div>
    </section>
  );
}
