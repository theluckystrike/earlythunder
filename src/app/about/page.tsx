import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbListSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About",
  description:
    "One developer hunting the next 1000x, in public. Early Thunder is an autonomous, institution-grade research engine for pre-mainstream opportunities, built by Michael Lip and operated by AUTOM8 LLC.",
  alternates: { canonical: "https://earlythunder.com/about" },
  openGraph: {
    type: "website",
    title: "About | Early Thunder",
    description:
      "One developer hunting the next 1000x, in public. The story, the mission, and the builder behind Early Thunder.",
    url: "https://earlythunder.com/about",
  },
};

const ABOUT_BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
] as const;

/* ─── Data ─────────────────────────────────────────────────── */

const MILESTONES = [
  {
    year: "2014",
    title: "First lines of code",
    text: "Started writing software professionally. The habit that never broke: build the tool you wish existed, then ship it.",
  },
  {
    year: "2021",
    title: "Tab Suspender Pro",
    text: "First Chrome extension at scale. Proved that a single developer could ship, support, and grow a real product used by thousands.",
  },
  {
    year: "2023",
    title: "Zovo studio + BeLikeNative",
    text: "Founded the Zovo studio. BeLikeNative crossed 13,200+ users at a 4.63 rating. Twenty extensions, 50,000+ users, all solo.",
  },
  {
    year: "2025",
    title: "The 1000x question",
    text: "Spent nights drowning in obscure protocols, airdrop threads, and SEC filings looking for asymmetric bets. The signal was buried under noise. So I started building a pipeline to dig it out.",
  },
  {
    year: "Now",
    title: "Early Thunder, in public",
    text: "That private pipeline became four live terminals scoring 247+ protocols across 8 signal dimensions. The whole thing runs in public — sourced, timestamped, and adversarially stress-tested.",
  },
] as const;

const STAT_TILES = [
  { value: "20", label: "Extensions shipped" },
  { value: "50,000+", label: "Users served" },
  { value: "140+", label: "Upstream PRs merged" },
  { value: "247+", label: "Protocols scanned" },
] as const;

const PRINCIPLES = [
  {
    title: "Master the craft",
    text: "Tools, scrapers, scorers, dashboards — all built by hand, end to end. No agency, no contractor. The person who designed the methodology is the person reading the data.",
  },
  {
    title: "Fall in love with the problem",
    text: "Not the asset, not the thesis. The problem is finding real signal before the crowd does. Everything else is downstream of caring about that one thing relentlessly.",
  },
  {
    title: "Zero trust on numbers",
    text: "Every figure is sourced, timestamped, and methodology-linked. If a claim can't be traced to its origin, it doesn't ship. No vibes, no screenshots without receipts.",
  },
  {
    title: "Dig deep to find the gem",
    text: "The best opportunities live in the Toy Phase — ignored, underbuilt, mislabeled as a joke. Real edge requires reading the commits, not the headlines.",
  },
  {
    title: "Be adversarial",
    text: "Every bull thesis is stress-tested against a dedicated short-seller pass. The failures get published too — the Graveyard exists because 88% of airdrops lose value within 90 days.",
  },
  {
    title: "Ship in public",
    text: "No black box. The pipeline runs where you can see it. Show your work, or it didn't happen.",
  },
] as const;

/* ─── Page ─────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
      <JsonLd data={getBreadcrumbListSchema(ABOUT_BREADCRUMBS)} />
      <Hero />
      <Story />
      <Mission />
      <Milestones />
      <Builder />
      <Principles />
      <FindMe />
      <DisclaimerLine />
    </div>
  );
}

/* ─── 1. Hero ──────────────────────────────────────────────── */

function Hero() {
  return (
    <header>
      <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-positive shadow-[0_0_8px_var(--color-positive)]"
        />
        Independent &middot; solo-built &middot; in public
      </span>
      <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter text-text-primary md:text-6xl">
        One developer hunting the next 1000&times;, in public.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
        Early Thunder is an autonomous, institution-grade research engine for
        pre-mainstream opportunities across DeFi, public equities, and private
        markets. No team, no fund, no black box — just an engineer who built the
        tool he wished existed and left the doors open. Hear the storm before
        anyone else.
      </p>
    </header>
  );
}

/* ─── 2. Our story ─────────────────────────────────────────── */

function Story() {
  return (
    <Section eyebrow="Our story" title="It started as frustration.">
      <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-text-secondary">
        <p>
          The opportunities that matter most are buried where almost nobody is
          looking — a protocol in its Toy Phase, an under-followed equity before
          earnings, a deadline that fires a catalyst three weeks from now. The
          information exists. It is just scattered across on-chain data, GitHub
          activity, filings, funding rounds, and a hundred Discord threads.
        </p>
        <p>
          So I built a private pipeline to pull it all into one place and score
          it the same way every time — no mood, no narrative, no fear of missing
          out. It scanned, it ranked, it flagged the rare convergence where
          multiple signals lined up at once.
        </p>
        <p>
          The pipeline got good. Good enough that hiding it felt wrong. So I
          opened it up. Early Thunder is that engine, running in public, with
          every score sourced and every failure published.
        </p>
      </div>
    </Section>
  );
}

/* ─── 3. The mission ───────────────────────────────────────── */

function Mission() {
  return (
    <Section eyebrow="The mission" title="Turn chaos into a short list.">
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-text-secondary">
        Thousands of obscure, pre-mainstream opportunities surface every month.
        Almost all of them are noise. The mission is to compress that chaos into
        a short list of validated, adversarially-tested ideas — every one scored
        across 8 equally-weighted dimensions, sourced, timestamped, and stress-
        tested against a dedicated short-seller pass before it ever reaches you.
        And to keep the public site free, because edge that only the funded can
        afford is not edge worth talking about.
      </p>
      <div className="mt-6">
        <Link
          href="/methodology"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent-primary transition-colors hover:text-accent-hover"
        >
          Read the methodology
          <span className="transition-transform duration-150 group-hover:translate-x-[3px]">
            &rarr;
          </span>
        </Link>
      </div>
    </Section>
  );
}

/* ─── 4. Key milestones ────────────────────────────────────── */

function Milestones() {
  return (
    <Section eyebrow="Key milestones" title="How it got here.">
      <ol className="mt-8 space-y-0">
        {MILESTONES.map((m) => (
          <li
            key={m.year}
            className="grid grid-cols-[64px_1fr] gap-6 border-l border-dashed border-border-subtle pb-8 pl-6 last:pb-0 md:grid-cols-[120px_1fr] md:gap-8"
          >
            <div className="font-mono text-sm font-medium text-accent-primary">
              {m.year}
              <span className="ml-[-25px] mt-1 block h-1.5 w-1.5 rounded-full bg-accent-primary md:ml-[-31px]" />
            </div>
            <div className="-mt-1">
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">
                {m.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                {m.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ─── 5. The builder ───────────────────────────────────────── */

function Builder() {
  return (
    <Section eyebrow="The builder" title="Michael Lip.">
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="max-w-2xl space-y-4 text-base leading-relaxed text-text-secondary">
          <p>
            Solo developer and founder of Zovo, based in Warsaw, Poland. A
            CTO-turned-solo-dev who ships Chrome extensions and AI tools at scale
            — Tab Suspender Pro, BeLikeNative (13,200+ users, rated 4.63), Focus
            Mode Pro, Session Manager Pro — twenty extensions and 50,000+ users
            under the Zovo brand.
          </p>
          <p>
            Active in open source, with 140+ upstream PRs merged into projects
            including Google Chrome, axios, and NiceHash. Early Thunder applies
            that same engineer&rsquo;s discipline to opportunity intelligence:
            the person who wrote the scrapers is the person reading the data.
          </p>
          <p className="font-mono text-sm text-text-tertiary">
            github.com/theluckystrike &middot; michaelip.dev
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 self-start">
          {STAT_TILES.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border-subtle bg-bg-secondary p-5"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-mono text-2xl font-semibold tracking-tight text-text-primary">
                {s.value}
              </dd>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
                {s.label}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

/* ─── 6. What guides the work ──────────────────────────────── */

function Principles() {
  return (
    <Section eyebrow="What guides the work" title="The principles.">
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <article
            key={p.title}
            className="group rounded-2xl border border-border-subtle bg-bg-secondary p-6 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-active"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-tertiary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-text-primary">
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              {p.text}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ─── 7. Find me / work with me ────────────────────────────── */

function FindMe() {
  return (
    <Section eyebrow="Find me &middot; work with me" title="Lifetime, one payment.">
      <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-secondary p-8 md:p-10">
        <p className="max-w-2xl text-base leading-relaxed text-text-secondary">
          Everything on the public site is free, forever. Deeper data, specific
          research requests, and priority access are shared with lifetime members
          through Zovo — one payment, no subscription, no upsell treadmill. If
          you want the engine pointed at something specific, that is where it
          happens.
        </p>
        <a
          href="https://zovo.one"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-accent-primary px-5 py-3 text-sm font-semibold text-bg-primary transition-[background-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_4px_14px_rgba(245,166,35,0.28)]"
        >
          Get lifetime access at zovo.one
          <span className="transition-transform duration-150 group-hover:translate-x-[3px]">
            &rarr;
          </span>
        </a>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-border-subtle pt-6">
          <FindMeLink href="https://github.com/theluckystrike" label="github.com/theluckystrike" />
          <FindMeLink href="https://michaelip.dev" label="michaelip.dev" />
          <FindMeLink href="https://zovo.one" label="Discord (via Zovo)" />
        </div>
      </div>
    </Section>
  );
}

function FindMeLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 font-mono text-[13px] text-text-secondary transition-colors hover:text-text-primary"
    >
      {label}
      <span className="text-text-tertiary transition-transform duration-150 group-hover:translate-x-[3px]">
        &rarr;
      </span>
    </a>
  );
}

/* ─── 8. Disclaimer line ───────────────────────────────────── */

function DisclaimerLine() {
  return (
    <p className="mt-16 border-t border-border-subtle pt-8 text-sm leading-relaxed text-text-tertiary">
      Early Thunder is independent research for informational purposes only.
      Nothing here is financial advice, and pre-mainstream opportunities are
      high-risk and frequently lose all value.{" "}
      <Link
        href="/disclaimer"
        className="text-accent-primary transition-colors hover:text-accent-hover"
      >
        Read the full disclaimer &rarr;
      </Link>
    </p>
  );
}

/* ─── Shared section wrapper ───────────────────────────────── */

function Section({
  eyebrow,
  title,
  children,
}: {
  readonly eyebrow: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="mt-20 border-t border-border-subtle pt-12 md:mt-24">
      <span
        className="font-mono text-[11px] uppercase tracking-[0.08em] text-text-tertiary"
        dangerouslySetInnerHTML={{ __html: eyebrow }}
      />
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary md:text-[32px]">
        {title}
      </h2>
      {children}
    </section>
  );
}
