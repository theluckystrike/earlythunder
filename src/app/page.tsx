import { getActiveOpportunities } from "@/lib/data";
import HeroSection from "@/components/landing/HeroSection";
import NumbersStrip from "@/components/landing/NumbersStrip";
import TopOpportunities from "@/components/landing/TopOpportunities";
import SignalsSection from "@/components/landing/SignalsSection";
import AssetClassesSection from "@/components/landing/AssetClassesSection";
import NewsletterCTA from "@/components/landing/NewsletterCTA";

const TOP_COUNT = 6;

export default function HomePage() {
  const opportunities = getActiveOpportunities();
  const topOpportunities = opportunities.slice(0, TOP_COUNT);

  return (
    <>
      <HeroSection />
      <NumbersStrip />
      <TopOpportunities opportunities={topOpportunities} />
      <SignalsSection />
      <AssetClassesSection />
      <NewsletterCTA />
    </>
  );
}
