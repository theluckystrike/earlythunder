"use client";

import { useState } from "react";
import type { Citation, CitationType } from "@/lib/types";

interface CitationSectionProps {
  readonly citations: readonly Citation[];
}

interface TypeGroupConfig {
  readonly type: CitationType;
  readonly label: string;
  readonly icon: string;
}

const TYPE_GROUPS: readonly TypeGroupConfig[] = [
  { type: "official", label: "Official", icon: "\u25CF" },
  { type: "data", label: "Market Data", icon: "\u25C6" },
  { type: "news", label: "News & Analysis", icon: "\u25B8" },
  { type: "research", label: "Research", icon: "\u25C7" },
  { type: "filing", label: "Filings", icon: "\u25A0" },
  { type: "github", label: "Code", icon: "\u2318" },
] as const;

const FALLBACK_TYPE: CitationType = "news";

/** Research & Sources section with citations grouped by type. */
export default function CitationSection({ citations }: CitationSectionProps) {
  if (!Array.isArray(citations) || citations.length === 0) {
    return null;
  }

  const grouped = groupCitations(citations);

  return (
    <section className="mt-12">
      <SectionHeader count={citations.length} />
      <div className="mt-6 space-y-6">
        {TYPE_GROUPS.map((group) => {
          const items = grouped.get(group.type);
          if (!items || items.length === 0) return null;
          return (
            <TypeGroup
              key={group.type}
              config={group}
              citations={items}
            />
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({ count }: { readonly count: number }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary tracking-tight">
        Research & Sources
      </h2>
      <span className="text-xs text-text-tertiary">
        {count} {count === 1 ? "source" : "sources"}
      </span>
    </div>
  );
}

function TypeGroup({
  config,
  citations,
}: {
  readonly config: TypeGroupConfig;
  readonly citations: readonly Citation[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <GroupHeader
        config={config}
        count={citations.length}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
      />
      {expanded && (
        <div className="mt-2 space-y-0.5">
          {citations.map((citation, i) => (
            <CitationRow key={i} citation={citation} icon={config.icon} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupHeader({
  config,
  count,
  expanded,
  onToggle,
}: {
  readonly config: TypeGroupConfig;
  readonly count: number;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-text-tertiary hover:text-text-secondary transition-colors"
    >
      <span className="transition-transform duration-200" style={undefined}>
        {expanded ? "\u25BE" : "\u25B8"}
      </span>
      <span>
        {config.label} ({count})
      </span>
    </button>
  );
}

function CitationRow({
  citation,
  icon,
}: {
  readonly citation: Citation;
  readonly icon: string;
}) {
  const hasUrl = Boolean(citation.url);

  const content = (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="shrink-0 text-xs text-text-tertiary">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-text-secondary">
          {citation.claim}
        </div>
        {citation.source && (
          <div className="truncate text-xs text-text-tertiary">
            {citation.source}
          </div>
        )}
      </div>
      {hasUrl && (
        <span className="shrink-0 text-xs text-text-tertiary">{"\u2197"}</span>
      )}
    </div>
  );

  if (hasUrl) {
    return (
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg hover:bg-bg-subtle transition-colors duration-150 cursor-pointer"
      >
        {content}
      </a>
    );
  }

  return <div className="rounded-lg">{content}</div>;
}

function groupCitations(
  citations: readonly Citation[],
): Map<CitationType, Citation[]> {
  const map = new Map<CitationType, Citation[]>();
  for (const citation of citations) {
    const key = citation.type ?? FALLBACK_TYPE;
    const existing = map.get(key);
    if (existing) {
      existing.push(citation);
    } else {
      map.set(key, [citation]);
    }
  }
  return map;
}
