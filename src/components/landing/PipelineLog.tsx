/* ─── Types ─── */

interface LogEntry {
  readonly t: string;
  readonly lvl: "OK" | "Δ" | "WARN";
  readonly msg: string;
  readonly det: string;
}

/* ─── Data ─── */

const LOG_ENTRIES: readonly LogEntry[] = [
  { t: "21:14:02Z", lvl: "OK", msg: "scan complete", det: "172 protocols · 154 sources · 12 new citations" },
  { t: "21:13:48Z", lvl: "Δ", msg: "score updated", det: "HYPE 86 → 88 (smart_money +5, narrative +3)" },
  { t: "21:13:42Z", lvl: "OK", msg: "earnings refreshed", det: "BABY annualized rev → $174M · yield 2,077.22%" },
  { t: "21:11:09Z", lvl: "OK", msg: "deadline ingested", det: "Limitless S3 · 2026-05-25 · CRITICAL" },
  { t: "21:08:50Z", lvl: "Δ", msg: "convergence detected", det: "CELO: working_code ∩ catalyst ∩ smart_money" },
  { t: "21:05:33Z", lvl: "WARN", msg: "regime shift", det: "BTC.D 61.8 → 62.4 · risk-off persists 14d" },
  { t: "21:01:00Z", lvl: "OK", msg: "research published", det: "Hyperliquid: The Vertical Stack · 8.2k words" },
  { t: "20:55:21Z", lvl: "OK", msg: "graveyard updated", det: "11 airdrops added · 90d median decay −88%" },
] as const;

/* ─── Helpers ─── */

function levelColor(lvl: LogEntry["lvl"]): string {
  if (lvl === "OK") return "var(--color-score-high, #34C759)";
  if (lvl === "Δ") return "var(--color-accent, #3B82F6)";
  return "var(--color-score-mid, #FF9F0A)";
}

/* ─── LogLine ─── */

function LogLine({ entry }: { readonly entry: LogEntry }) {
  return (
    <div className="log-line">
      <span className="log-line__t">{entry.t}</span>
      <span className="log-line__lvl" style={{ color: levelColor(entry.lvl) }}>
        {entry.lvl}
      </span>
      <span className="log-line__msg">{entry.msg}</span>
      <span className="log-line__det">, {entry.det}</span>
    </div>
  );
}

/* ─── TerminalHead ─── */

function TerminalHead() {
  return (
    <div className="terminal__head">
      <div className="terminal__dots">
        <span className="terminal__dot terminal__dot--red" />
        <span className="terminal__dot terminal__dot--yellow" />
        <span className="terminal__dot terminal__dot--green" />
      </div>
      <span className="terminal__title">earlythunder.pipeline, sess_2026.05.10</span>
      <span className="terminal__status">&#9679; RUNNING</span>
    </div>
  );
}

/* ─── TerminalBody ─── */

function TerminalBody() {
  return (
    <div className="terminal__body">
      {LOG_ENTRIES.slice(0, 8).map((entry) => (
        <LogLine key={`${entry.t}-${entry.msg}`} entry={entry} />
      ))}
      <div className="log-line log-line--cursor">
        <span className="cursor" />
        <span className="log-line__msg">awaiting next scan tick</span>
      </div>
    </div>
  );
}

/* ─── TerminalFoot ─── */

function TerminalFoot() {
  return (
    <div className="terminal__foot">
      <span>154 protocols &middot; 12 sources active &middot; 0 errors / 24h</span>
      <span>uptime 99.94%</span>
    </div>
  );
}

/* ─── PipelineLog (main export) ─── */

export default function PipelineLog() {
  return (
    <section className="bento-section">
      <div className="section__head">
        <div>
          <div className="section__eyebrow mono">06, SHOW YOUR WORK</div>
          <h2 className="section__title">The pipeline runs in public</h2>
          <p className="section__sub">
            Every score change, source addition, and convergence event is logged.
            No black box. No vibes.
          </p>
        </div>
        <a className="ghost-btn" href="/intelligence/">View 30-day history <span className="arr">&rarr;</span></a>
      </div>
      <div className="terminal">
        <TerminalHead />
        <TerminalBody />
        <TerminalFoot />
      </div>
    </section>
  );
}
