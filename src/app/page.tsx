import { getActiveOpportunities } from "@/lib/data";
import deadlinesData from "../../data/deadlines.json";
import earningsData from "../../data/earnings-top.json";

import HeroSection from "@/components/landing/HeroSection";
import NumbersStrip from "@/components/landing/NumbersStrip";
import ToolsShowcase from "@/components/landing/ToolsShowcase";
import FeaturedOpportunity from "@/components/landing/FeaturedOpportunity";
import TopYieldsPreview from "@/components/landing/TopYieldsPreview";
import DeadlineStrip from "@/components/landing/DeadlineStrip";
import SignalsSection from "@/components/landing/SignalsSection";
import NewsletterCTA from "@/components/landing/NewsletterCTA";

/** Normalize raw deadline JSON entries to the Deadline shape (null, not undefined). */
function normalizeDeadlines(raw: typeof deadlinesData) {
  return raw.map((d) => ({
    protocol: d.protocol,
    event: d.event,
    end_date: d.end_date ?? null,
    estimated_end: d.estimated_end ?? null,
    urgency: d.urgency,
    status: d.status,
  }));
}

export default function HomePage() {
  const opportunities = getActiveOpportunities();
  const featured = opportunities[0];
  const topYield = earningsData[0];
  const deadlines = normalizeDeadlines(deadlinesData);
  const nearestDeadline = deadlines[0];
  const criticalDeadlines = deadlines.filter(
    (d) => d.urgency === "CRITICAL" || d.urgency === "HIGH",
  );
  const activeDeadlines = deadlines.filter((d) => d.status !== "ENDED");

  return (
    <>
      <HeroSection />
      <NumbersStrip
        totalProtocols={opportunities.length}
        convergenceEvents={58}
        activeDeadlines={activeDeadlines.length}
        criticalDeadlines={criticalDeadlines.length}
      />
      <ToolsShowcase
        topYield={{ name: topYield.name, symbol: topYield.symbol, yield_pct: topYield.earnings_yield_pct }}
        nearestDeadline={{ protocol: nearestDeadline.protocol, end_date: nearestDeadline.end_date ?? null, urgency: nearestDeadline.urgency }}
        topScore={{ name: featured.name, score: Math.round(featured.composite_score) }}
        totalOpportunities={opportunities.length}
      />
      <FeaturedOpportunity opportunity={featured} />
      <TopYieldsPreview protocols={earningsData.slice(0, 5)} />
      <DeadlineStrip deadlines={deadlines} />
      <SignalsSection />
      <NewsletterCTA />
    </>
  );
}
