import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AnswerBlock from "@/components/AnswerBlock";
import { PageHeader, Section, SectionLabel, Prose, EyebrowLabel } from "@/components/PageChrome";
import { CONTENT_CHECKED, SITE_URL } from "@/lib/constants";
import { getWebPageSchema, getBreadcrumbListSchema } from "@/lib/structured-data";
import opportunities from "../../../data/opportunities.json";
import scorecard from "../../../data/altcoin-scorecard.json";

export const metadata: Metadata = {
  title: "Two Early Thunder Scores: Scorecard out of 250 and Pattern Match out of 100",
  description:
    "Why the same token shows two numbers: a 25-variable scorecard score out of 250 that ranks tokens against each other, and an 8-signal pattern match out of 100 that measures how mature an opportunity is.",
  alternates: { canonical: `${SITE_URL}/scorecard-vs-opportunity-score` },
  openGraph: {
    title: "Two Early Thunder scores, two scales | Early Thunder",
    description:
      "A scorecard score out of 250 ranks tokens against each other. A pattern match out of 100 measures maturity. Here is how to read both.",
    url: `${SITE_URL}/scorecard-vs-opportunity-score`,
  },
};

const BREADCRUMBS = [
  { name: "Home", path: "/" },
  { name: "Scores explained", path: "/scorecard-vs-opportunity-score" },
] as const;

interface Example {
  readonly name: string;
  readonly opportunityScore: number;
  readonly scorecardScore: number;
}

/** Picks one token that exists in both data sets, so the example is real data. */
function pickExample(): Example | null {
  const cards = new Map(scorecard.tokens.map((t) => [t.symbol, t]));
  for (const opp of opportunities) {
    const symbol = (opp.ticker ?? "").replace("$", "");
    const card = cards.get(symbol);
    if (card) {
      return {
        name: opp.name,
        opportunityScore: opp.composite_score,
        scorecardScore: card.score,
      };
    }
  }
  return null;
}

export default function ScoresExplainedPage() {
  const example = pickExample();

  const answer = example
    ? `Early Thunder publishes two scores for a token. The scorecard rates 25 fundamental variables 1 to 10 each, out of 250: ` +
      `${example.name} holds ${example.scorecardScore}. The opportunity page weights 8 signals into a pattern match out of 100: ` +
      `${example.name} holds ${example.opportunityScore}. The scorecard ranks tokens against each other; the pattern score measures how mature an opportunity is.`
    : "Early Thunder publishes two scores for a token. The scorecard rates 25 fundamental variables 1 to 10 each, out of 250, and ranks tokens against each other. The opportunity page weights 8 signals into a pattern match out of 100, which measures how mature an opportunity is.";

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <JsonLd
        data={getWebPageSchema({
          name: "Two Early Thunder Scores: Scorecard out of 250 and Pattern Match out of 100",
          description:
            "Why the same token shows two numbers, and which one answers which question.",
          path: "/scorecard-vs-opportunity-score",
          dateModified: CONTENT_CHECKED,
        })}
      />
      <JsonLd data={getBreadcrumbListSchema(BREADCRUMBS)} />
      <AnswerBlock answer={answer} updated={CONTENT_CHECKED} />

      <PageHeader
        title="Two scores, two scales"
        lead="The same token carries a number out of 250 on the scorecard and a different number out of 100 on its opportunity page."
        sub="Both are produced by Early Thunder from the same research pass. They are not two versions of one score, and comparing one to the other is the most common misreading of this site."
      />

      <Section>
        <SectionLabel number="01" title="What each number answers" />
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-text-tertiary">
                <th className="py-3 pr-4 font-mono font-normal">&nbsp;</th>
                <th className="py-3 pr-4 font-mono font-normal">scorecard score</th>
                <th className="py-3 font-mono font-normal">opportunity pattern match</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border/60 align-top">
                <td className="py-4 pr-4 text-text-tertiary">Question</td>
                <td className="py-4 pr-4">Is this token fundamentally strong next to the other 250?</td>
                <td className="py-4">Is this the kind of setup the pattern filter exists to find?</td>
              </tr>
              <tr className="border-b border-border/60 align-top">
                <td className="py-4 pr-4 text-text-tertiary">Inputs</td>
                <td className="py-4 pr-4">25 variables, each rated 1 to 10</td>
                <td className="py-4">8 signals, each scored 0 to 100 and weighted</td>
              </tr>
              <tr className="border-b border-border/60 align-top">
                <td className="py-4 pr-4 text-text-tertiary">Scale</td>
                <td className="py-4 pr-4">25 to 250</td>
                <td className="py-4">0 to 100</td>
              </tr>
              <tr className="border-b border-border/60 align-top">
                <td className="py-4 pr-4 text-text-tertiary">Reads as</td>
                <td className="py-4 pr-4">A ranking against the rest of the rated universe</td>
                <td className="py-4">A pattern match, with a tier attached</td>
              </tr>
              <tr className="align-top">
                <td className="py-4 pr-4 text-text-tertiary">Shown on</td>
                <td className="py-4 pr-4">
                  <Link className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/scorecard">
                    /scorecard
                  </Link>{" "}
                  and every token page under it
                </td>
                <td className="py-4 pr-4">
                  <Link className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/opportunities">
                    /opportunities
                  </Link>{" "}
                  and every opportunity page
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section divider>
        <SectionLabel number="02" title="The same token, both numbers" />
        {example ? (
          <>
            <Prose>
              {example.name} scores {example.scorecardScore} out of 250 on its scorecard
              page and {example.opportunityScore} out of 100 on its opportunity page.
              Neither number is wrong. The scorecard number says {example.name} ranks
              well against the other rated tokens on 25 measured fundamentals. The
              pattern number says how closely the setup matches the eight-signal
              template, and that is a different question with a different ceiling.
            </Prose>
            <Prose>
              A token can rank near the top of the scorecard and still lose pattern
              points on obscurity, because a large, well-covered asset is not obscure.
              Obscurity is one of the two asymmetry signals, and the methodology gives
              the highest obscurity scores to opportunities that experienced investors
              dismiss or have never heard of.
            </Prose>
          </>
        ) : (
          <Prose>
            The two data sets did not share a token in this build, so no worked example
            is shown. The scales above still apply.
          </Prose>
        )}
      </Section>

      <Section divider>
        <SectionLabel number="03" title="Which one to quote" />
        <EyebrowLabel>Use the scorecard score when</EyebrowLabel>
        <Prose>
          The question is comparative. It is the only one of the two that ranks a token
          against a fixed universe, and it moves in whole points across 25 variables, so
          a one-point difference means one variable shifted by one rating.
        </Prose>
        <EyebrowLabel>Use the pattern match when</EyebrowLabel>
        <Prose>
          The question is timing and maturity. The eight signals include the two
          asymmetry signals, so the score falls as an opportunity becomes well known,
          even when the fundamentals improve.
        </Prose>
        <Prose>
          Both pages state the same thing in different words: neither number is
          investment advice, and a high score is not a recommendation to buy. Read the
          bear case on the page before you read the number, and see{" "}
          <Link className="text-amber underline decoration-amber/40 hover:decoration-amber" href="/methodology">
            the methodology
          </Link>{" "}
          for how each variable and signal is scored.
        </Prose>
      </Section>
    </div>
  );
}
