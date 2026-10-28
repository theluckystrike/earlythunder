import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AnswerBlock from "@/components/AnswerBlock";
import { PageHeader, Section, SectionLabel, Prose, EyebrowLabel } from "@/components/PageChrome";
import { CONTENT_CHECKED, SITE_URL } from "@/lib/constants";
import { getWebPageSchema, getBreadcrumbListSchema } from "@/lib/structured-data";
import { getPaidEndpoints, formatUsdPrice } from "@/lib/api-catalog";

export const metadata: Metadata = {
  title: "API Pricing: What Each Call Costs",
  description:
    "Every Early Thunder research API endpoint and its price per call: ranked scores $0.01, cited thesis $0.25, catalyst calendar $0.03, scorecard $0.05, earnings yields $0.01. Paid in USDC over x402, no key and no subscription.",
  alternates: { canonical: `${SITE_URL}/api-pricing` },
  openGraph: {
    title: "API Pricing: What Each Call Costs | Early Thunder",
    description:
      "Per-call prices for the Early Thunder research API, read from the published OpenAPI document.",
    url: `${SITE_URL}/api-pricing`,
  },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "API Pricing", path: "/api-pricing" },
] as const;

export default function ApiPricingPage() {
  const endpoints = getPaidEndpoints();
  const cheapest = endpoints.reduce((a, b) => (b.priceUsd < a.priceUsd ? b : a));
  const dearest = endpoints.reduce((a, b) => (b.priceUsd > a.priceUsd ? b : a));
  // Built from the same catalog the table renders, so the prose cannot quote a
  // price the endpoint list does not show.
  const priceOf = (path: string) =>
    endpoints.find((e) => e.path === path)?.price ?? "a price posted at call time";
  const answer =
    `The Early Thunder research API charges per call in USDC. There is no key, no subscription and no minimum. ` +
    `Ranked scores cost ${priceOf("/api/x402/v1/scores")}, a full cited thesis ${priceOf("/api/x402/v1/thesis")}, ` +
    `the catalyst calendar ${priceOf("/api/x402/v1/catalysts")}, the 251-token scorecard ` +
    `${priceOf("/api/x402/v1/scorecard")} and earnings yields ${priceOf("/api/x402/v1/earnings")}. ` +
    `The catalog endpoint is free.`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd
        data={getWebPageSchema({
          name: "API Pricing: What Each Call Costs",
          description:
            "Every Early Thunder research API endpoint and its price per call, paid in USDC over x402.",
          path: "/api-pricing",
          dateModified: CONTENT_CHECKED,
        })}
      />
      <JsonLd data={getBreadcrumbListSchema(BREADCRUMBS)} />
      <AnswerBlock answer={answer} updated={CONTENT_CHECKED} />

      <PageHeader
        title="API pricing"
        lead="Pay per call, in USDC, with no account to open first."
        sub="Every price below is read from the OpenAPI document this site publishes. The live HTTP 402 challenge is the authoritative price for any single request, because a payment challenge cannot go stale the way a page can."
        meta={`Prices read ${CONTENT_CHECKED}`}
      />

      <Section>
        <SectionLabel number="01" title="The five paid calls" />
        <Prose>
          The API has one free endpoint and five that cost money. A call answers with
          JSON. The scores and earnings calls are the cheap spread; the thesis call is
          the one that carries a full written argument with citations.
        </Prose>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-tertiary">
                <th className="py-3 pr-4 font-mono font-normal">endpoint</th>
                <th className="py-3 pr-4 font-mono font-normal">price</th>
                <th className="py-3 font-mono font-normal">what it returns</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((e) => (
                <tr key={e.path} className="border-b border-border/60 align-top">
                  <td className="py-4 pr-4 font-mono text-xs text-text-primary">{e.path}</td>
                  <td className="py-4 pr-4 font-mono text-text-primary">{e.price}</td>
                  <td className="py-4 text-text-secondary">{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>
          Call <code className="font-mono text-text-primary">GET /api/x402/v1/index</code>{" "}
          first. It is free, and it returns the same list with the prices that are live
          at that moment.
        </Prose>
      </Section>

      <Section divider>
        <SectionLabel number="02" title="How the payment works" />
        <Prose>
          An unpaid request to a paid endpoint does not fail with an error page. It
          answers HTTP 402 with a{" "}
          <code className="font-mono text-text-primary">PAYMENT-REQUIRED</code> header
          that carries the x402 payment terms as base64 JSON. An x402-aware client reads
          that header, pays, and retries with{" "}
          <code className="font-mono text-text-primary">PAYMENT-SIGNATURE</code>.
        </Prose>
        <Prose>
          Payment is USDC on Base (CAIP-2 <code className="font-mono">eip155:8453</code>)
          or on Solana. The site takes no card, keeps no balance and holds no API key for
          you, which is why there is nothing to cancel.
        </Prose>
        <Prose>
          Test the whole flow for one cent. One scores call costs {formatUsdPrice(cheapest.priceUsd)},
          so a single dollar buys {Math.floor(1 / cheapest.priceUsd)} of them, against{" "}
          {Math.floor(1 / dearest.priceUsd)} thesis calls at {formatUsdPrice(dearest.priceUsd)} each.
        </Prose>
      </Section>

      <Section divider>
        <SectionLabel number="03" title="Documents an agent can read first" />
        <EyebrowLabel>Free, no payment</EyebrowLabel>
        <ul className="max-w-3xl space-y-3 text-[1.0625rem] leading-relaxed text-text-secondary">
          <li>
            <a className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/openapi.json">
              /openapi.json
            </a>{" "}
            — the full OpenAPI document, including the advisory price on every offer.
          </li>
          <li>
            <a className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/SKILL.md">
              /SKILL.md
            </a>{" "}
            — the skill file written for an agent that is about to call the API.
          </li>
          <li>
            <a className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/api/x402/v1/index">
              /api/x402/v1/index
            </a>{" "}
            — the live catalog, fetched for free.
          </li>
        </ul>
        <Prose>
          The research behind the paid data is described on the{" "}
          <Link className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/methodology">
            methodology
          </Link>{" "}
          page, and the free/paid split for human readers is on{" "}
          <Link className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/pricing">
            pricing
          </Link>
          .
        </Prose>
      </Section>
    </div>
  );
}
