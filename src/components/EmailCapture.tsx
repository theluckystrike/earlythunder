"use client";

import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WORKER_ENDPOINT = "https://api.earlythunder.com/subscribe";

/** Inline email capture form. Rounded pill style. */
export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!EMAIL_REGEX.test(email)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(WORKER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("You are on the list. Watch your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    } catch {
      setStatus("success");
      setMessage("Newsletter launching soon. You will be first to know.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={handleSubmit} className="inline-flex w-full">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="Enter your email"
          required
          className="bg-bg-card border border-border rounded-full px-6 py-3 text-text-primary placeholder:text-text-tertiary text-sm flex-1 focus:border-border-hover focus:outline-none"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-text-primary text-black text-sm font-medium px-6 py-3 rounded-full ml-3 hover:opacity-90 transition whitespace-nowrap disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </form>
      <StatusMessage status={status} message={message} />
    </div>
  );
}

function StatusMessage({
  status,
  message,
}: {
  readonly status: string;
  readonly message: string;
}) {
  if (status === "idle" || message.length === 0) return null;

  const colorClass = status === "success" ? "text-score-high" : "text-score-low";

  return (
    <p className={`mt-2 text-center text-sm ${colorClass}`}>
      {message}
    </p>
  );
}
