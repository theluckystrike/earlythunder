import Link from "next/link";
import { getAllOpportunities } from "@/lib/data";

interface AssetClassCard {
  readonly count: number;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly scannerHref?: string;
}

/** Compute real asset class counts with links. */
function computeAssetClasses(): readonly AssetClassCard[] {
  const all = getAllOpportunities();
  const active = all.filter((o) => !o.is_graveyard);

  const digital = active.filter((o) => o.asset_class === "digital_assets").length;
  const equities = active.filter((o) => o.asset_class === "public_equities").length;
  const priv = active.filter((o) => o.asset_class === "private_markets").length;

  return [
    {
      count: digital,
      label: "Digital Assets",
      description: "Tokens, protocols, and on-chain opportunities in the crypto ecosystem.",
      href: "/opportunities",
      scannerHref: "/earnings/",
    },
    {
      count: equities,
      label: "Public Equities",
      description: "Publicly traded companies with asymmetric upside potential.",
      href: "/opportunities",
    },
    {
      count: priv,
      label: "Private Markets",
      description: "Pre-IPO, venture, and alternative market opportunities.",
      href: "/opportunities",
    },
  ] as const;
}

/** Single asset class card with link. */
function AssetClassCardItem({ ac }: { readonly ac: AssetClassCard }) {
  return (
    <div className="bg-bg-card rounded-2xl p-8 border border-border hover:border-text-tertiary transition-colors">
      <Link href={ac.href} className="block">
        <div className="text-5xl font-semibold text-text-primary tracking-tight">
          {ac.count}
        </div>
        <div className="text-sm text-text-tertiary uppercase tracking-widest mt-2">
          {ac.label}
        </div>
        <p className="text-sm text-text-secondary mt-4">{ac.description}</p>
      </Link>
      {ac.scannerHref && (
        <Link
          href={ac.scannerHref}
          className="inline-block text-xs text-accent mt-3 hover:underline"
        >
          View in scanner &rarr;
        </Link>
      )}
    </div>
  );
}

/** Asset classes grid with real counts. */
export default function AssetClassesSection() {
  const classes = computeAssetClasses();

  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.map((ac) => (
          <AssetClassCardItem key={ac.label} ac={ac} />
        ))}
      </div>
    </section>
  );
}
