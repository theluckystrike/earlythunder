/* TickerStrip — Bloomberg-style scrolling ticker tape. Server Component. */

export interface TickerItem {
  readonly tag: string;
  readonly k: string;
  readonly v: string;
  readonly c: "elite" | "high" | "pos" | "neg" | "warn" | "default";
}

export interface TickerStripProps {
  readonly items: readonly TickerItem[];
}

/** Map color variant to Tailwind text-color class. */
function colorClass(c: TickerItem["c"]): string {
  switch (c) {
    case "elite":
      return "text-score-high";
    case "high":
    case "pos":
      return "text-score-high";
    case "neg":
      return "text-score-low";
    case "warn":
      return "text-score-mid";
    default:
      return "text-text-primary";
  }
}

/** Render a single ticker item cell. */
function TickerCell({ item }: { readonly item: TickerItem }) {
  return (
    <span className="ticker-item">
      <span className="ticker-item__tag">{item.tag}</span>
      <span className="ticker-item__k">{item.k}</span>
      <span className={`ticker-item__v ${colorClass(item.c)}`}>{item.v}</span>
      <span className="ticker-item__sep">·</span>
    </span>
  );
}

/** Full-width Bloomberg-style scrolling ticker strip. */
export default function TickerStrip({ items }: TickerStripProps) {
  /* Duplicate items array for seamless infinite scroll loop */
  const rail = [...items, ...items];

  return (
    <section className="ticker-strip">
      <div className="ticker-strip__inner">
        <div className="ticker-strip__label">
          <span className="ticker-strip__dot" />
          <span>PIPELINE · LIVE</span>
        </div>
        <div className="ticker-strip__track">
          <div className="ticker-strip__rail">
            {rail.map((item, i) => (
              <TickerCell key={`${item.tag}-${item.k}-${i}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
