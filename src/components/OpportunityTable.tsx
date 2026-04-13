"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { getAssetClassLabel, formatPrice, formatMarketCap, formatVolume } from "@/lib/format";
import TierBadge from "./TierBadge";
import FilterBar, { type FilterState } from "./FilterBar";

interface OpportunityTableProps {
  readonly opportunities: readonly Opportunity[];
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  assetClass: "all",
  tier: "all",
  sortBy: "composite_score",
  sortOrder: "desc",
};

const MAX_DISPLAY = 200;

/** Filterable, sortable table of all opportunities. */
export default function OpportunityTable({
  opportunities,
}: OpportunityTableProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];
  const filtered = useFilteredOpportunities(safeOpportunities, filters);

  const hasMarketData = useMemo(
    () => safeOpportunities.some((opp) => opp.current_price_usd !== null),
    [safeOpportunities],
  );

  if (safeOpportunities.length === 0) return null;

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} onFilterChange={setFilters} />
      <ResultCount count={filtered.length} total={safeOpportunities.length} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <TableHead showMarketData={hasMarketData} />
          <tbody>
            {filtered.map((opp) => (
              <TableRow key={opp.slug} opportunity={opp} showMarketData={hasMarketData} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}

function useFilteredOpportunities(
  opportunities: readonly Opportunity[],
  filters: FilterState,
): readonly Opportunity[] {
  return useMemo(() => {
    let result = [...opportunities];

    if (filters.search.length > 0) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (opp) =>
          opp.name.toLowerCase().includes(q) ||
          (opp.ticker?.toLowerCase().includes(q) ?? false),
      );
    }

    if (filters.assetClass !== "all") {
      result = result.filter((opp) => opp.asset_class === filters.assetClass);
    }

    if (filters.tier !== "all") {
      result = result.filter((opp) => opp.tier === filters.tier);
    }

    result.sort((a, b) => {
      const dir = filters.sortOrder === "asc" ? 1 : -1;
      if (filters.sortBy === "name") return dir * a.name.localeCompare(b.name);
      if (filters.sortBy === "tier") return dir * (a.tier - b.tier);
      return dir * (a.composite_score - b.composite_score);
    });

    return result.slice(0, MAX_DISPLAY);
  }, [opportunities, filters]);
}

function ResultCount({ count, total }: { readonly count: number; readonly total: number }) {
  return (
    <p className="text-xs text-text-tertiary">
      Showing {count} of {total}
    </p>
  );
}

function TableHead({ showMarketData }: { readonly showMarketData: boolean }) {
  return (
    <thead>
      <tr className="border-b border-border">
        <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-left">Name</th>
        <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-left">Category</th>
        <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-left">Tier</th>
        <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-left cursor-pointer hover:text-text-secondary">Score</th>
        {showMarketData && (
          <>
            <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-right">Price</th>
            <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-right">Mkt Cap</th>
            <th className="text-xs text-text-tertiary font-normal uppercase tracking-widest py-3 text-right">Vol 24h</th>
          </>
        )}
      </tr>
    </thead>
  );
}

function TableRow({
  opportunity,
  showMarketData,
}: {
  readonly opportunity: Opportunity;
  readonly showMarketData: boolean;
}) {
  if (!opportunity || typeof opportunity.slug !== "string") return null;

  return (
    <tr className="border-b border-bg-card hover:bg-bg-subtle transition-colors cursor-pointer">
      <td className="py-3 pr-4">
        <Link href={`/opportunities/${opportunity.slug}`} className="text-text-primary font-medium hover:opacity-80">
          {opportunity.name}
          {opportunity.ticker && (
            <span className="ml-2 font-mono text-text-tertiary text-xs">
              {opportunity.ticker}
            </span>
          )}
        </Link>
      </td>
      <td className="py-3 pr-4 text-text-secondary">{opportunity.category}</td>
      <td className="py-3 pr-4">
        <TierBadge tier={opportunity.tier} />
      </td>
      <td className="py-3 pr-4">
        <span className={`font-mono font-semibold ${getScoreColor(opportunity.composite_score)}`}>
          {Math.round(opportunity.composite_score)}
        </span>
      </td>
      {showMarketData && (
        <>
          <td className="py-3 pl-4 text-right font-mono text-xs text-text-secondary">
            {formatPrice(opportunity.current_price_usd)}
          </td>
          <td className="py-3 pl-4 text-right font-mono text-xs text-text-secondary">
            {formatMarketCap(opportunity.market_cap_usd)}
          </td>
          <td className="py-3 pl-4 text-right font-mono text-xs text-text-secondary">
            {formatVolume(opportunity.volume_24h_usd)}
          </td>
        </>
      )}
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-text-secondary">
        No opportunities match your filters.
      </p>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-score-high";
  if (score >= 55) return "text-score-mid";
  return "text-score-low";
}
