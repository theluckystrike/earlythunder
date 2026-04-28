import { getAllOpportunities } from "@/lib/data";

interface AssetClassCard {
  readonly count: number;
  readonly label: string;
  readonly description: string;
}

/** Compute real asset class counts from live data. */
function computeAssetClasses(): readonly AssetClassCard[] {
  const all = getAllOpportunities();
  console.assert(Array.isArray(all), "computeAssetClasses: getAllOpportunities must return array");

  const active = all.filter((o) => !o.is_graveyard);

  const digital = active.filter((o) => o.asset_class === "digital_assets").length;
  const equities = active.filter((o) => o.asset_class === "public_equities").length;
  const priv = active.filter((o) => o.asset_class === "private_markets").length;

  const classes = [
    {
      count: digital,
      label: "Digital Assets",
      description: "Tokens, protocols, and on-chain opportunities across the crypto ecosystem.",
    },
    {
      count: equities,
      label: "Public Equities",
      description: "Publicly traded companies with asymmetric upside before consensus repricing.",
    },
    {
      count: priv,
      label: "Private Markets",
      description: "Pre-IPO, venture, and alternative market opportunities before liquidity events.",
    },
  ] as const;

  console.assert(classes.length === 3, "computeAssetClasses: expected exactly 3 classes");
  return classes;
}

/** Large number grid — asset class coverage with editorial typography. */
export default function AssetClassesSection() {
  const classes = computeAssetClasses();
  console.assert(classes.length > 0, "AssetClassesSection: classes must not be empty");
  console.assert(classes.every((c) => c.label && c.description), "AssetClassesSection: all classes need label+description");

  return (
    <section className="py-24 mx-auto max-w-[1280px] px-6 lg:px-12">
      {/* Section label */}
      <div className="section-label">
        <span className="num">— 03</span>
        <span>Coverage · three asset classes</span>
      </div>

      {/* Title */}
      <h2 className="font-serif text-[clamp(32px,5vw,56px)] leading-[1.05] tracking-[-0.03em] max-w-[800px]">
        Wherever asymmetry{" "}
        <em className="italic text-bolt">is hiding,</em> we look.
      </h2>

      {/* 3-column grid */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 border-t border-b border-line-2">
        {classes.map((ac, idx) => (
          <AssetCell
            key={ac.label}
            count={ac.count}
            label={ac.label}
            description={ac.description}
            isLast={idx === classes.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function AssetCell({
  count,
  label,
  description,
  isLast,
}: AssetClassCard & { readonly isLast: boolean }) {
  console.assert(typeof count === "number" && count >= 0, "AssetCell: count must be non-negative number");
  console.assert(typeof label === "string" && label.length > 0, "AssetCell: label must be non-empty");

  const borderRight = isLast ? "" : "md:border-r md:border-line-2";

  return (
    <div className={`py-10 px-6 lg:px-10 ${borderRight}`}>
      <div className="font-serif text-[clamp(64px,8vw,120px)] leading-none tracking-tight text-bolt">
        {count}
      </div>
      <h3 className="font-serif text-[clamp(24px,3vw,30px)] leading-tight tracking-tight mt-4">
        {label}
      </h3>
      <p className="text-[14px] leading-relaxed text-text-secondary mt-3 max-w-[340px]">
        {description}
      </p>
    </div>
  );
}
