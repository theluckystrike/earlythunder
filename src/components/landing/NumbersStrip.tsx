/* NumbersStrip (StatsStrip), Full-width stats bar. Server Component. */

export interface StatsStripProps {
  readonly stats: readonly {
    readonly value: string;
    readonly suffix?: string;
    readonly label: string;
    readonly sub?: string;
  }[];
}

/** Single stat block: value + optional suffix, label, optional sub. */
function Stat({
  stat,
}: {
  readonly stat: StatsStripProps["stats"][number];
}) {
  return (
    <div className="stat">
      <div className="stat__value">
        {stat.value}
        {stat.suffix && <span className="stat__suffix">{stat.suffix}</span>}
      </div>
      <div className="stat__label">{stat.label}</div>
      {stat.sub && <div className="stat__sub">{stat.sub}</div>}
    </div>
  );
}

/** Vertical 1px divider between stat blocks. */
function Separator() {
  return <div className="stats__sep" />;
}

/** Full-width stats strip with 4 stat blocks separated by dividers. */
export default function NumbersStrip({ stats }: StatsStripProps) {
  return (
    <section className="stats">
      <div className="stats__inner">
        {stats.map((stat, i) => (
          <span key={stat.label} className="contents">
            {i > 0 && <Separator />}
            <Stat stat={stat} />
          </span>
        ))}
      </div>
    </section>
  );
}
