import Link from "next/link";
import EmailCapture from "@/components/EmailCapture";

const TOOL_LINKS = [
  { label: "Intelligence", href: "/intelligence/" },
  { label: "Earnings", href: "/earnings/" },
  { label: "Deadlines", href: "/deadlines/" },
  { label: "Research", href: "/research/" },
] as const;

/** Newsletter signup call-to-action. */
export default function NewsletterCTA() {
  return (
    <section className="py-24 text-center max-w-6xl mx-auto px-6">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-text-primary">
        Free intelligence. Every week.
      </h2>
      <p className="text-text-secondary text-lg mt-4">
        Convergence signals from 154+ protocols. Earnings yield from 131 DeFi
        platforms. 24 deadline countdowns. Delivered weekly.
      </p>
      <div className="mt-8 max-w-md mx-auto">
        <EmailCapture />
      </div>
      <p className="text-xs text-text-tertiary mt-4">
        No spam. Unsubscribe anytime.
      </p>
      <ToolLinksRow />
    </section>
  );
}

/** Row of tool links below the email form. */
function ToolLinksRow() {
  return (
    <p className="text-sm text-text-tertiary mt-6">
      Or explore now:{" "}
      {TOOL_LINKS.map((tool, i) => (
        <span key={tool.label}>
          <Link
            href={tool.href}
            className="text-text-secondary hover:text-text-primary underline underline-offset-2"
          >
            {tool.label}
          </Link>
          {i < TOOL_LINKS.length - 1 && <span className="mx-1">&middot;</span>}
        </span>
      ))}
    </p>
  );
}
