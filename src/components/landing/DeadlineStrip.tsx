interface Deadline {
  readonly protocol: string;
  readonly event: string;
  readonly end_date: string | null;
  readonly estimated_end: string | null;
  readonly urgency: string;
  readonly status: string;
}

interface DeadlineStripProps {
  readonly deadlines: readonly Deadline[];
}

/** Map urgency level to Tailwind border + text color classes. */
function urgencyColors(urgency: string): { readonly dot: string; readonly border: string } {
  switch (urgency) {
    case "CRITICAL":
      return { dot: "bg-score-low", border: "border-l-score-low" };
    case "HIGH":
      return { dot: "bg-score-mid", border: "border-l-score-mid" };
    case "WATCH":
      return { dot: "bg-data-blue", border: "border-l-data-blue" };
    default:
      return { dot: "bg-text-tertiary", border: "border-l-text-tertiary" };
  }
}

/** Map status to pill styling classes. */
function statusBadgeClasses(status: string): string {
  switch (status) {
    case "LIVE":
      return "bg-score-high/10 text-score-high border border-score-high/20";
    case "UPCOMING":
      return "bg-data-blue/10 text-data-blue";
    case "SPECULATED":
      return "bg-white/5 text-text-tertiary";
    default:
      return "bg-white/5 text-text-tertiary";
  }
}

/** Resolve display date from end_date or estimated_end. */
function displayDate(deadline: Deadline): string {
  if (deadline.end_date) return deadline.end_date;
  if (deadline.estimated_end) return `~${deadline.estimated_end}`;
  return "TBD";
}

/** Single deadline card with urgency accent and status pill. */
function DeadlineCard({ deadline }: { readonly deadline: Deadline }) {
  const colors = urgencyColors(deadline.urgency);
  const badgeClass = statusBadgeClasses(deadline.status);

  return (
    <div
      className={`bg-bg-card rounded-xl border border-border border-l-4 ${colors.border} p-5 flex flex-col gap-2`}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${colors.dot}`} />
        <span className="font-semibold text-text-primary text-sm">
          {deadline.protocol}
        </span>
      </div>
      <p className="text-sm text-text-secondary leading-snug">
        {deadline.event}
      </p>
      <div className="flex items-center justify-between mt-auto pt-2">
        <span className="font-mono text-xs text-text-secondary">
          {displayDate(deadline)}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
          {deadline.status}
        </span>
      </div>
    </div>
  );
}

/** Horizontal strip showing the 3 most urgent deadlines. */
export default function DeadlineStrip({ deadlines }: DeadlineStripProps) {
  const urgent = deadlines
    .filter((d) => d.urgency === "CRITICAL" || d.urgency === "HIGH")
    .slice(0, 3);

  if (urgent.length === 0) return null;

  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
        Nearest Deadlines
      </h2>
      <p className="text-text-secondary mt-2">
        Don&apos;t miss the window
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {urgent.map((d) => (
          <DeadlineCard key={`${d.protocol}-${d.event}`} deadline={d} />
        ))}
      </div>
      <a
        href="/deadlines/"
        className="text-text-secondary hover:text-text-primary text-sm transition mt-6 inline-block"
      >
        Track all 23 deadlines &rarr;
      </a>
    </section>
  );
}
