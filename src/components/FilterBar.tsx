"use client";

import type { AssetClass, Tier } from "@/lib/types";

export interface FilterState {
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

const TIER_OPTIONS: readonly { value: Tier | "all"; label: string }[] = [
  { value: "all", label: "All Tiers" },
  { value: 1, label: "Tier 1" },
  { value: 2, label: "Tier 2" },
  { value: 3, label: "Tier 3" },
];

const SORT_OPTIONS: readonly {
  value: "composite_score" | "name" | "tier";
  label: string;
}[] = [
  { value: "composite_score", label: "Score" },
  { value: "name", label: "Name" },
  { value: "tier", label: "Tier" },
];

/** Filter and sort controls for opportunity explorer. */
export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  if (!filters || typeof onFilterChange !== "function") return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <SelectFilter
        label="Asset Class"
        value={String(filters.assetClass)}
        options={ASSET_CLASS_OPTIONS.map((o) => ({
          value: String(o.value),
          label: o.label,
        }))}
        onChange={(val) =>
          onFilterChange({ ...filters, assetClass: val as AssetClass | "all" })
        }
      />
      <SelectFilter
        label="Tier"
        value={String(filters.tier)}
        options={TIER_OPTIONS.map((o) => ({
          value: String(o.value),
          label: o.label,
        }))}
        onChange={(val) =>
          onFilterChange({
            ...filters,
            tier: val === "all" ? "all" : (Number(val) as Tier),
          })
        }
      />
      <SelectFilter
        label="Sort By"
        value={filters.sortBy}
        options={SORT_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        onChange={(val) =>
          onFilterChange({
            ...filters,
            sortBy: val as "composite_score" | "name" | "tier",
          })
        }
      />
      <button
        type="button"
        onClick={() =>
          onFilterChange({
            ...filters,
            sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
          })
        }
        className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-secondary transition-colors hover:border-amber hover:text-text-primary"
        aria-label={`Sort ${filters.sortOrder === "asc" ? "descending" : "ascending"}`}
      >
        {filters.sortOrder === "asc" ? "ASC" : "DESC"}
      </button>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly { value: string; label: string }[];
  readonly onChange: (value: string) => void;
}) {
  if (!Array.isArray(options) || options.length === 0) return null;

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-text-secondary">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-amber focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
