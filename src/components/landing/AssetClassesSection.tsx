import { getAllOpportunities } from "@/lib/data";

interface AssetClassCard {
  readonly count: number;
  readonly label: string;
  readonly description: string;
}

/** Compute real asset class counts. */
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
    },
    {
      count: equities,
      label: "Public Equities",
      description: "Publicly traded companies with asymmetric upside potential.",
    },
    {
      count: priv,
      label: "Private Markets",
      description: "Pre-IPO, venture, and alternative market opportunities.",
    },
  ] as const;
}

/** Asset classes grid with real counts. */
export default function AssetClassesSection() {
  const classes = computeAssetClasses();

  return (
    <section className="py-20 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.map((ac) => (
          <div
            key={ac.label}
            className="bg-bg-card rounded-2xl p-8 border border-border"
          >
            <div className="text-5xl font-semibold text-text-primary tracking-tight">
              {ac.count}
            </div>
            <div className="text-sm text-text-tertiary uppercase tracking-widest mt-2">
              {ac.label}
            </div>
            <p className="text-sm text-text-secondary mt-4">{ac.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
