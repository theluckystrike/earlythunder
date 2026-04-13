"use client";

import type { AssetClass, Tier } from "@/lib/types";

export interface FilterState {
  readonly search: string;
  readonly assetClass: AssetClass | "all";
  readonly tier: Tier | "all";
  readonly sortBy: "composite_score" | "name" | "tier";
  readonly sortOrder: "asc" | "desc";
}

interface FilterBarProps {
  readonly filters: FilterState;
  readonly onFilterChange: (filters: FilterState) => void;
}

const ASSET_CLASS_OPTIONS: readonly {
  value: AssetClass | "all";
  label: string;
}[] = [
  { value: "all", label: "All Classes" },
  { value: "digital_assets", label: "Digital Assets" },
  { value: "public_equities", label: "Public Equities" },
  { value: "private_markets", label: "Private Markets" },
];

const SORT_OPTIONS: readonly {
  value: "composite_score" | "name" | "tier";
  label: string;
}[] = [
  { value: "composite_score", label: "Score" },
  { value: "name", label: "Name" },
  { value: "tier", label: "Tier" },
];

const TIERS: readonly Tier[] = [1, 2, 3];

/** Filter and sort controls for opportunity explorer. */
export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  if (!filters || typeof onFilterChange !== "function") return null;

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.assetClass !== "all" ||
    filters.tier !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput filters={filters} onFilterChange={onFilterChange} />
      <CategorySelect filters={filters} onFilterChange={onFilterChange} />
      <TierToggle filters={filters} onFilterChange={onFilterChange} />
      <SortSelect filters={filters} onFilterChange={onFilterChange} />
      {hasActiveFilters && (
        <ClearButton filters={filters} onFilterChange={onFilterChange} />
      )}
    </div>
  );
}

function SearchInput({
  filters,
  onFilterChange,
}: FilterBarProps) {
  return (
    <input
      type="text"
      value={filters.search}
      onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
      placeholder="Search..."
      className="bg-bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-hover focus:outline-none w-64"
    />
  );
}

function CategorySelect({ filters, onFilterChange }: FilterBarProps) {
  return (
    <select
      value={String(filters.assetClass)}
      onChange={(e) =>
        onFilterChange({
          ...filters,
          assetClass: e.target.value as AssetClass | "all",
        })
      }
      className="bg-bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-border-hover focus:outline-none"
    >
      {ASSET_CLASS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TierToggle({ filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1">
      {TIERS.map((t) => {
        const isActive = filters.tier === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                tier: isActive ? "all" : t,
              })
            }
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
              isActive
                ? "bg-text-primary text-black"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            T{t}
          </button>
        );
      })}
    </div>
  );
}

function SortSelect({ filters, onFilterChange }: FilterBarProps) {
  return (
    <select
      value={filters.sortBy}
      onChange={(e) =>
        onFilterChange({
          ...filters,
          sortBy: e.target.value as "composite_score" | "name" | "tier",
        })
      }
      className="bg-bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-border-hover focus:outline-none"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ClearButton({ filters, onFilterChange }: FilterBarProps) {
  return (
    <button
      type="button"
      onClick={() =>
        onFilterChange({
          ...filters,
          search: "",
          assetClass: "all",
          tier: "all",
        })
      }
      className="text-text-tertiary hover:text-text-primary text-xs transition-colors"
    >
      Clear
    </button>
  );
}
