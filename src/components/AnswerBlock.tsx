/**
 * Dated short answer shown at the top of a page.
 *
 * Answers the page's main question in 40-60 words, in the first screenful, and
 * states the date the facts were last checked. The answer text must be unique to
 * the page it sits on and must only restate facts that appear further down that
 * same page.
 */

interface AnswerBlockProps {
  /** One-sentence direct answer to the page's main question (40-60 words). */
  readonly answer: string;
  /** ISO date (YYYY-MM-DD) the facts on the page were last checked. */
  readonly updated: string;
}

export default function AnswerBlock({ answer, updated }: AnswerBlockProps) {
  if (typeof answer !== "string" || answer.length === 0) return null;

  return (
    <section
      aria-label="Short answer"
      className="mb-10 border-l-2 border-accent-primary bg-bg-secondary px-5 py-4"
    >
      <p lang="en" className="max-w-3xl text-lg leading-relaxed text-text-primary">
        {answer}
      </p>
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-text-secondary">
        Updated <time dateTime={updated}>{updated}</time>
      </p>
    </section>
  );
}
