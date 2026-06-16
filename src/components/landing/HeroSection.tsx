import Link from "next/link";

/* ─── Types ─── */

interface HeroProps {
  readonly totalOpportunities: number;
  readonly topOpportunities: readonly {
    name: string;
    score: number;
    category: string;
  }[];
  readonly nearestDeadline: { protocol: string; daysLeft: number };
  readonly topYield: { name: string; value: string };
}

interface RegimeStripProps {
  readonly totalOpportunities: number;
  readonly nearestDeadline: { protocol: string; daysLeft: number };
  readonly topYield: { name: string; value: string };
}

interface LadderRowProps {
  readonly rank: number;
  readonly name: string;
  readonly score: number;
  readonly category: string;
}

interface ConvictionLadderProps {
  readonly opportunities: readonly {
    name: string;
    score: number;
    category: string;
  }[];
  readonly totalOpportunities: number;
}

/* ─── Helpers ─── */

function getScoreTier(score: number): string {
  if (score >= 85) return "var(--color-score-elite, #F5A623)";
  if (score >= 70) return "var(--color-score-high, #22C55E)";
  if (score >= 50) return "var(--color-score-mid, #3B82F6)";
  return "var(--color-score-low, #6B7280)";
}

function getScoreClass(score: number): string {
  if (score >= 85) return "ladder__seg--elite";
  if (score >= 70) return "ladder__seg--high";
  if (score >= 50) return "ladder__seg--mid";
  return "ladder__seg--low";
}

/* ─── LadderRow ─── */

function LadderRow({ rank, name, score, category }: LadderRowProps) {
  const filledSegments = Math.round(score / 10);
  const tierClass = getScoreClass(score);
  const tierColor = getScoreTier(score);

  return (
    <div className="ladder__row">
      <span className="ladder__rank">
        {String(rank).padStart(2, "0")}
      </span>
      <span className="ladder__name">{name}</span>
      <span className="ladder__cat">{category}</span>
      <span className="ladder__bar">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`ladder__seg ${i < filledSegments ? tierClass : ""}`}
          />
        ))}
      </span>
      <span className="ladder__score" style={{ color: tierColor }}>
        {score}
      </span>
    </div>
  );
}

/* ─── ConvictionLadder ─── */

function ConvictionLadder({
  opportunities,
  totalOpportunities,
}: ConvictionLadderProps) {
  if (!opportunities || opportunities.length === 0) return null;

  const top8 = opportunities.slice(0, 8);
  const remaining = totalOpportunities - top8.length;

  return (
    <div className="ladder">
      <div className="ladder__head">
        <div>
          <div className="ladder__title">CONVICTION INDEX</div>
          <div className="ladder__sub">
            Top 8 &middot; live &middot; sorted by score
          </div>
        </div>
        <span className="ladder__live">LIVE</span>
      </div>
      <div className="ladder__rows">
        {top8.map((opp, idx) => (
          <LadderRow
            key={opp.name}
            rank={idx + 1}
            name={opp.name}
            score={opp.score}
            category={opp.category}
          />
        ))}
      </div>
      <div className="ladder__foot">
        <span>+ {remaining} more &middot; updated daily</span>
        <a href="/intelligence/" className="ladder__cta">
          Open Index &rarr;
        </a>
      </div>
    </div>
  );
}

/* ─── RegimeStrip ─── */

function RegimeStrip({
  totalOpportunities,
  nearestDeadline,
  topYield,
}: RegimeStripProps) {
  return (
    <div className="regime">
      <div className="regime__item">
        <span className="regime__label">MARKET REGIME</span>
        <span className="regime__value regime__value--negative">
          <span className="regime__dot regime__dot--red" />
          RISK_OFF
        </span>
      </div>
      <span className="regime__sep" aria-hidden="true">|</span>
      <div className="regime__item">
        <span className="regime__label">NEXT DEADLINE</span>
        <span className="regime__value">
          {nearestDeadline.protocol} &middot; {nearestDeadline.daysLeft}d
        </span>
      </div>
      <span className="regime__sep" aria-hidden="true">|</span>
      <div className="regime__item">
        <span className="regime__label">TOP YIELD</span>
        <span className="regime__value">
          {topYield.value} &middot; {topYield.name}
        </span>
      </div>
      <span className="regime__sep" aria-hidden="true">|</span>
      <div className="regime__item">
        <span className="regime__label">PIPELINE</span>
        <span className="regime__value">
          <span className="regime__dot regime__dot--green" />
          Live &middot; updated daily
        </span>
      </div>
    </div>
  );
}

/* ─── HeroLeft ─── */

function HeroLeft({
  totalOpportunities,
  nearestDeadline,
  topYield,
}: RegimeStripProps) {
  return (
    <div className="hero__left">
      <div className="hero__eyebrow">
        <span className="eyebrow-dot" />
        ALPHA INTELLIGENCE &middot; v2.4 &middot;{" "}
        {totalOpportunities} OPPORTUNITIES
      </div>

      <h1 className="hero__title">
        <span className="hero__line">Follow the money</span>
        <span className="hero__line hero__line--accent">that cannot lie.</span>
      </h1>

      <p className="hero__sub">
        Four autonomous tools score every pre-mainstream opportunity across
        DeFi, equities, and private markets. Sourced, timestamped,
        methodology-linked. Updated daily.
      </p>

      <div className="hero__ctas">
        <a href="/intelligence/" className="primary-btn primary-btn--lg">
          Open Intelligence Terminal &rarr;
        </a>
        <Link href="/opportunities" className="secondary-btn secondary-btn--lg">
          Scan {totalOpportunities} Opportunities
        </Link>
      </div>

      <RegimeStrip
        totalOpportunities={totalOpportunities}
        nearestDeadline={nearestDeadline}
        topYield={topYield}
      />
    </div>
  );
}

/* ─── HeroSection (main export) ─── */

export default function HeroSection({
  totalOpportunities,
  topOpportunities,
  nearestDeadline,
  topYield,
}: HeroProps) {
  return (
    <section className="hero hero--split">
      <div className="hero__inner">
        <HeroLeft
          totalOpportunities={totalOpportunities}
          nearestDeadline={nearestDeadline}
          topYield={topYield}
        />
        <ConvictionLadder
          opportunities={topOpportunities}
          totalOpportunities={totalOpportunities}
        />
      </div>
    </section>
  );
}
