import Link from "next/link";
import { formatUsd } from "@/lib/scorecard-insight";
import type { ScreenRow } from "@/lib/scorecard-screens";

/**
 * The ranked member table shared by the screen pages and the mispricing page.
 * Columns are the ones a reader uses to reject a row quickly: score, verdict,
 * size, dilution and the one-line thesis.
 */

const MAX_ROWS = 400;

/** Colour for a verdict badge, keyed off the verdict_color in the dataset. */
function verdictTone(color: string): string {
  const map: Record<string, string> = {
    green: "border-positive/30 bg-positive-bg text-positive",
    blue: "border-info/30 bg-[rgba(59,130,246,0.10)] text-info",
    yellow: "border-warning/30 bg-warning-bg text-warning",
    orange: "border-warning/40 bg-warning-bg text-warning",
    red: "border-negative/30 bg-negative-bg text-negative",
  };
  return map[color] ?? map.yellow;
}

interface Props<T extends ScreenRow> {
  readonly rows: readonly T[];
  readonly caption: string;
  /** Extra leading column, used by the mispricing tables for the rank gap. */
  readonly gapOf?: (row: T) => string;
  readonly gapLabel?: string;
  readonly gapTone?: string;
}

export default function ScreenTable<T extends ScreenRow>({
  rows,
  caption,
  gapOf,
  gapLabel,
  gapTone,
}: Props<T>) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const shown = rows.length > MAX_ROWS ? rows.slice(0, MAX_ROWS) : rows;

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full font-mono text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-bg-card text-left">
            <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
              #
            </th>
            <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
              Token
            </th>
            {gapOf && (
              <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
                {gapLabel}
              </th>
            )}
            <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
              Score
            </th>
            <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary">
              Verdict
            </th>
            <th scope="col" className="px-3 py-3 text-right text-xs uppercase tracking-wider text-text-tertiary">
              Market cap
            </th>
            <th scope="col" className="hidden px-3 py-3 text-xs uppercase tracking-wider text-text-tertiary lg:table-cell">
              Thesis
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((row, index) => (
            <tr key={row.slug} className="border-b border-border/40 hover:bg-bg-card/50">
              <td className="px-3 py-2.5 text-xs text-text-tertiary">{index + 1}</td>
              <td className="px-3 py-2.5">
                <Link href={`/scorecard/${row.slug}`} className="font-semibold text-text-primary hover:text-info">
                  {row.symbol}
                </Link>
                <span className="ml-2 text-xs text-text-tertiary">{row.name}</span>
                {row.impaired && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-warning">impaired</span>
                )}
              </td>
              {gapOf && (
                <td className={`px-3 py-2.5 text-right font-semibold ${gapTone ?? "text-text-primary"}`}>
                  {gapOf(row)}
                </td>
              )}
              <td className="px-3 py-2.5 text-right font-semibold text-text-primary">{row.score}</td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold ${verdictTone(row.verdict_color)}`}
                >
                  {row.verdict}
                </span>
              </td>
              <td className="px-3 py-2.5 text-right text-text-secondary">
                {row.market_cap === null ? "-" : formatUsd(row.market_cap)}
              </td>
              <td className="hidden max-w-md px-3 py-2.5 align-top lg:table-cell">
                <span className="line-clamp-2 font-sans text-xs leading-relaxed text-text-secondary">
                  {row.one_liner}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
