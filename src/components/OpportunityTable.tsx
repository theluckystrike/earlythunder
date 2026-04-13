"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Opportunity } from "@/lib/types";
import { getAssetClassLabel, formatPrice, formatMarketCap, formatVolume } from "@/lib/format";
import TierBadge from "./TierBadge";
import ScoreBar from "./ScoreBar";
import FilterBar, { type FilterState } from "./FilterBar";

interface OpportunityTableProps {
  readonly opportunities: readonly Opportunity[];
}

const DEFAULT_FILTERS: FilterState = {
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
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <TableHead showMarketData={hasMarketData} />
          <tbody className="divide-y divide-border">
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

    if (filters.assetClass !== "all") {
      result = result.filter(
        (opp) => opp.asset_class === filters.assetClass,
      );
    }

    if (filters.tier !== "all") {
      result = result.filter((opp) => opp.tier === filters.tier);
    }

    result.sort((a, b) => {
      const dir = filters.sortOrder === "asc" ? 1 : -1;
      if (filters.sortBy === "name") {
        return dir * a.name.localeCompare(b.name);
      }
      if (filters.sortBy === "tier") {
        return dir * (a.tier - b.tier);
      }
      return dir * (a.composite_score - b.composite_score);
    });

    return result.slice(0, MAX_DISPLAY);
  }, [opportunities, filters]);
}

function ResultCount({
  count,
  total,
}: {
  readonly count: number;
  readonly total: number;
}) {
  return (
    <p className="text-xs text-text-secondary">
      Showing {count} of {total} opportunities
    </p>
  );
}

function TableHead({ showMarketData }: { readonly showMarketData: boolean }) {
  return (
    <thead>
      <tr className="border-b border-border bg-surface/50 text-xs uppercase tracking-wider text-text-secondary">
        <th className="px-4 py-3 font-medium">Name</th>
        <th className="px-4 py-3 font-medium">Category</th>
        <th className="px-4 py-3 font-medium">Class</th>
        <th className="px-4 py-3 font-medium">Tier</th>
        <th className="min-w-[180px] px-4 py-3 font-medium">Score</th>
        {showMarketData && (
          <>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">Mkt Cap</th>
            <th className="px-4 py-3 font-medium text-right">Vol 24h</th>
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
    <tr className="bg-card transition-colors hover:bg-surface">
      <td className="px-4 py-3">
        <Link
          href={`/opportunities/${opportunity.slug}`}
          className="font-medium text-text-primary hover:text-amber"
        >
          {opportunity.name}
          {opportunity.ticker && (
            <span className="ml-2 font-mono text-xs text-text-secondary">
              {opportunity.ticker}
            </span>
          )}
        </Link>
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {opportunity.category}
      </td>
      <td className="px-4 py-3 text-text-secondary">
        {getAssetClassLabel(opportunity.asset_class)}
      </td>
      <td className="px-4 py-3">
        <TierBadge tier={opportunity.tier} />
      </td>
      <td className="px-4 py-3">
        <ScoreBar score={opportunity.composite_score} />
      </td>
      {showMarketData && (
        <>
          <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
            {formatPrice(opportunity.current_price_usd)}
          </td>
          <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
            {formatMarketCap(opportunity.market_cap_usd)}
          </td>
          <td className="px-4 py-3 text-right font-mono text-xs text-text-secondary">
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
        No opportunities match your filters. Try adjusting your criteria.
      </p>
    </div>
  );
}
