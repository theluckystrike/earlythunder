"use client";

import { useState } from "react";

/* --- NewsletterCTA (main export) --- */

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.length === 0) return;
    setSubmitted(true);
  }

  return (
    <section className="section subscribe-section">
      <div className="subscribe">
        <div className="section__eyebrow mono">&mdash; WEEKLY BRIEF</div>
        <h2 className="subscribe__title">Free intelligence. Every Monday.</h2>
        <p className="subscribe__sub">
          Top convergence signals + upcoming deadlines. One email. No spam.
        </p>

        {submitted ? (
          <p className="subscribe__confirm">Confirmed. First brief arrives Monday.</p>
        ) : (
          <form className="subscribe__form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="subscribe__input"
              placeholder="analyst@yourfund.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="primary-btn">
              Subscribe &rarr;
            </button>
          </form>
        )}

        <div className="subscribe__meta mono t-tert">
          14,200+ analysts &middot; Last brief: 2026-05-04
        </div>
      </div>
    </section>
  );
}
