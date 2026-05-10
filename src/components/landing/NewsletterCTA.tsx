import EmailCapture from "@/components/EmailCapture";

/** Newsletter signup call-to-action. */
export default function NewsletterCTA() {
  return (
    <section className="py-24 text-center max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        Weekly intelligence brief
      </h2>
      <p className="text-text-secondary text-lg mt-4">
        Top convergence signals + upcoming deadlines. One email. Every Monday.
      </p>
      <div className="mt-8 max-w-md mx-auto">
        <EmailCapture />
      </div>
      <p className="text-xs text-text-tertiary mt-4">
        No spam. Unsubscribe anytime.
      </p>
    </section>
  );
}
