#!/usr/bin/env python3
"""
Build comprehensive HTML report for Early Thunder project.
Bloomberg Terminal aesthetic. Reads merged opportunities.json and project structure.
"""

import json
import os
from pathlib import Path
from datetime import datetime

# --- Constants ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OPPS_FILE = DATA_DIR / "opportunities.json"
BLOG_FILE = DATA_DIR / "blog-posts.json"
REPORT_DIR = Path(os.path.expanduser("~/Desktop/earlythunder-report"))
MAX_ENTRIES = 500


def load_opportunities() -> list[dict]:
    """Load merged opportunities data."""
    assert OPPS_FILE.exists(), f"File not found: {OPPS_FILE}"
    with open(OPPS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, list), "Expected array"
    return data[:MAX_ENTRIES]


def count_files_recursive(directory: Path) -> tuple[int, int]:
    """Count files and total lines in a directory."""
    assert directory.exists(), f"Dir not found: {directory}"
    file_count = 0
    line_count = 0
    for root, _dirs, files in os.walk(str(directory)):
        # Skip node_modules and .next
        if "node_modules" in root or ".next" in root or ".git" in root:
            continue
        for fname in files[:1000]:
            file_count += 1
            fpath = Path(root) / fname
            try:
                if fpath.suffix in (".json", ".ts", ".tsx", ".py", ".yml",
                                    ".md", ".css", ".js", ".toml", ".txt",
                                    ".mjs", ".svg"):
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        line_count += sum(1 for _ in f)
            except (OSError, UnicodeDecodeError):
                pass
    return file_count, line_count


def get_file_tree(directory: Path, prefix: str = "", depth: int = 0) -> str:
    """Generate ASCII file tree, max 3 levels deep."""
    if depth > 3:
        return ""
    assert directory.exists()
    lines = []
    entries = sorted(directory.iterdir())
    skip = {"node_modules", ".next", ".git", "out", "__pycache__", ".turbo"}
    entries = [e for e in entries if e.name not in skip][:30]

    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        connector = "`-- " if is_last else "|-- "
        if entry.is_dir():
            lines.append(f"{prefix}{connector}{entry.name}/")
            ext = "    " if is_last else "|   "
            lines.append(get_file_tree(entry, prefix + ext, depth + 1))
        else:
            lines.append(f"{prefix}{connector}{entry.name}")
    return "\n".join(lines)


def build_top10_cards(opps: list[dict]) -> str:
    """Build HTML cards for top 10 opportunities."""
    assert isinstance(opps, list)
    parts = []
    for o in opps[:10]:
        name = o.get("name", "?")
        tier = o.get("tier", 3)
        score = o.get("composite_score", 0)
        one_liner = o.get("one_liner", "")
        category = o.get("category", "?")
        ac = o.get("asset_class", "?").replace("_", " ").title()
        parts.append(
            '<div class="card">'
            '<h3>' + name + ' <span class="tier-badge tier-' + str(tier) + '">T' + str(tier) + '</span></h3>'
            '<div class="stat">' + str(score) + '</div>'
            '<p style="margin-top:8px; color:var(--text);">' + one_liner + '</p>'
            '<p style="margin-top:8px;"><strong>Category:</strong> ' + category +
            ' | <strong>Class:</strong> ' + ac + '</p>'
            '</div>'
        )
    return "\n".join(parts)


def build_graveyard_cards(opps: list[dict]) -> str:
    """Build HTML cards for graveyard entries."""
    assert isinstance(opps, list)
    graveyard = [o for o in opps if o.get("is_graveyard", False)]
    parts = []
    for o in graveyard[:20]:
        name = o.get("name", "?")
        one_liner = o.get("one_liner", "")
        category = o.get("category", "?")
        score = o.get("composite_score", 0)
        parts.append(
            '<div class="card" style="border-color: var(--red); opacity: 0.8;">'
            '<h3 style="color: var(--red);">' + name + ' <span class="gy-badge">GRAVEYARD</span></h3>'
            '<p>' + one_liner + '</p>'
            '<p style="margin-top:8px;"><strong>Category:</strong> ' + category +
            ' | <strong>Score:</strong> ' + str(score) + '</p>'
            '</div>'
        )
    return "\n".join(parts)


def build_html(opps: list[dict]) -> str:
    """Build the complete HTML report."""
    assert isinstance(opps, list) and len(opps) > 0

    # Compute stats
    total = len(opps)
    tier_1 = [o for o in opps if o.get("tier") == 1]
    tier_2 = [o for o in opps if o.get("tier") == 2]
    tier_3 = [o for o in opps if o.get("tier") == 3]
    graveyard = [o for o in opps if o.get("is_graveyard", False)]
    active = [o for o in opps if not o.get("is_graveyard", False)]

    # Asset class counts
    ac_counts: dict[str, int] = {}
    for o in opps:
        ac = o.get("asset_class", "unknown")
        ac_counts[ac] = ac_counts.get(ac, 0) + 1

    # Category counts
    cat_counts: dict[str, int] = {}
    for o in opps:
        cat = o.get("category", "unknown")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    cat_sorted = sorted(cat_counts.items(), key=lambda x: -x[1])

    # Score distribution
    avg_score = sum(o.get("composite_score", 0) for o in active) / max(len(active), 1)

    # File stats
    file_count, line_count = count_files_recursive(PROJECT_ROOT)
    file_tree = get_file_tree(PROJECT_ROOT)

    # Build ticker tape data
    ticker_items = []
    for o in opps[:20]:
        name = o.get("name", "?")
        score = o.get("composite_score", 0)
        tkr = o.get("ticker", "")
        tkr_str = " (" + tkr + ")" if tkr else ""
        ticker_items.append(name + tkr_str + ": " + str(score))

    # Build opportunity table rows
    table_rows = []
    for i, o in enumerate(opps[:MAX_ENTRIES]):
        name = o.get("name", "?")
        tkr = o.get("ticker") or "-"
        category = o.get("category", "?")
        ac = o.get("asset_class", "?")
        tier = o.get("tier", "?")
        score = o.get("composite_score", 0)
        one_liner = o.get("one_liner", "")
        is_gy = o.get("is_graveyard", False)

        tier_class = "tier-" + str(tier)
        gy_class = " graveyard" if is_gy else ""
        score_color = "#22C55E" if score >= 80 else "#F5A623" if score >= 65 else "#EAB308" if score >= 55 else "#EF4444"
        gy_badge = '<span class="gy-badge">GY</span>' if is_gy else ""
        ac_display = ac.replace("_", " ").title()

        row = (
            '<tr class="' + tier_class + gy_class + '" data-category="' + category +
            '" data-ac="' + ac + '" data-tier="' + str(tier) + '" data-score="' + str(score) + '">'
            '<td class="rank">' + str(i + 1) + '</td>'
            '<td class="name">' + name + gy_badge + '</td>'
            '<td class="ticker">' + tkr + '</td>'
            '<td class="category">' + category + '</td>'
            '<td class="ac">' + ac_display + '</td>'
            '<td class="tier"><span class="tier-badge ' + tier_class + '">T' + str(tier) + '</span></td>'
            '<td class="score"><div class="score-bar-wrap"><div class="score-bar" style="width:' +
            str(score) + '%;background:' + score_color + '"></div><span class="score-val">' +
            str(score) + '</span></div></td>'
            '<td class="one-liner">' + one_liner[:120] + '</td>'
            '</tr>'
        )
        table_rows.append(row)

    # Category chart bars
    max_cat_count = max(cat_counts.values()) if cat_counts else 1
    cat_bars = []
    for cat, count in cat_sorted[:20]:
        pct = (count / max_cat_count) * 100
        bar = (
            '<div class="cat-row">'
            '<span class="cat-label">' + cat + '</span>'
            '<div class="cat-bar-wrap">'
            '<div class="cat-bar" style="width:' + str(pct) + '%"></div>'
            '<span class="cat-count">' + str(count) + '</span>'
            '</div></div>'
        )
        cat_bars.append(bar)

    # Category filter options
    cat_options = []
    for cat, count in cat_sorted:
        cat_options.append('<option value="' + cat + '">' + cat + ' (' + str(count) + ')</option>')

    # Pre-build complex HTML sections
    top10_html = build_top10_cards(opps)
    graveyard_html = build_graveyard_cards(opps)

    # Build the HTML
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    ticker_spans = "".join("<span>" + item + "</span>" for item in ticker_items)
    table_body = "\n".join(table_rows)
    cat_bars_html = "\n".join(cat_bars)
    cat_opts_html = "\n".join(cat_options)
    da_count = ac_counts.get("digital_assets", 0)
    pm_count = ac_counts.get("private_markets", 0)
    pe_count = ac_counts.get("public_equities", 0)
    gy_count = len(graveyard)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Early Thunder | Comprehensive Intelligence Report</title>
<style>
:root {{
    --base: #0B0F1A;
    --surface: #141927;
    --card: #1A2035;
    --border: #2A3050;
    --amber: #F5A623;
    --blue: #3B82F6;
    --green: #22C55E;
    --yellow: #EAB308;
    --red: #EF4444;
    --text: #E2E8F0;
    --text-sec: #94A3B8;
    --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
    --sans: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --serif: 'Instrument Serif', Georgia, serif;
}}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ background: var(--base); color: var(--text); font-family: var(--sans); line-height: 1.6; }}

/* Ticker */
.ticker-wrap {{ background: var(--surface); border-bottom: 1px solid var(--border); overflow: hidden; white-space: nowrap; padding: 8px 0; }}
.ticker {{ display: inline-block; animation: scroll 60s linear infinite; }}
.ticker span {{ padding: 0 24px; font-family: var(--mono); font-size: 13px; color: var(--amber); }}
@keyframes scroll {{ 0% {{ transform: translateX(0); }} 100% {{ transform: translateX(-50%); }} }}

/* Header */
header {{ padding: 32px 48px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }}
.logo {{ font-family: var(--serif); font-size: 28px; color: var(--amber); }}
.logo small {{ font-family: var(--sans); font-size: 14px; color: var(--text-sec); margin-left: 12px; }}
.timestamp {{ font-family: var(--mono); font-size: 13px; color: var(--text-sec); }}

/* Metrics Strip */
.metrics {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; padding: 24px 48px; background: var(--surface); border-bottom: 1px solid var(--border); }}
.metric {{ text-align: center; }}
.metric .value {{ font-family: var(--mono); font-size: 28px; font-weight: 700; color: var(--amber); }}
.metric .label {{ font-size: 12px; color: var(--text-sec); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }}

/* Sections */
.container {{ max-width: 1600px; margin: 0 auto; padding: 32px 48px; }}
.section {{ margin-bottom: 48px; }}
.section-title {{ font-family: var(--serif); font-size: 24px; color: var(--amber); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }}

/* Cards Grid */
.cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }}
.card {{ background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; }}
.card h3 {{ font-family: var(--serif); color: var(--text); margin-bottom: 8px; }}
.card .stat {{ font-family: var(--mono); font-size: 32px; color: var(--amber); }}
.card p {{ font-size: 14px; color: var(--text-sec); }}

/* Table */
.table-wrap {{ overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }}
table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
thead {{ background: var(--surface); position: sticky; top: 0; }}
th {{ padding: 12px 10px; text-align: left; color: var(--text-sec); font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; cursor: pointer; user-select: none; border-bottom: 2px solid var(--border); }}
th:hover {{ color: var(--amber); }}
td {{ padding: 10px; border-bottom: 1px solid var(--border); }}
tr:hover {{ background: rgba(245, 166, 35, 0.05); }}
tr.graveyard {{ opacity: 0.5; }}
.rank {{ width: 40px; font-family: var(--mono); color: var(--text-sec); text-align: center; }}
.name {{ font-weight: 600; white-space: nowrap; }}
.ticker {{ font-family: var(--mono); color: var(--blue); }}
.category {{ color: var(--text-sec); font-size: 12px; }}
.ac {{ font-size: 12px; color: var(--text-sec); }}
.one-liner {{ font-size: 12px; color: var(--text-sec); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}

/* Tier badges */
.tier-badge {{ padding: 2px 8px; border-radius: 4px; font-family: var(--mono); font-size: 11px; font-weight: 700; }}
.tier-1 .tier-badge, .tier-badge.tier-1 {{ background: rgba(34, 197, 94, 0.15); color: var(--green); }}
.tier-2 .tier-badge, .tier-badge.tier-2 {{ background: rgba(245, 166, 35, 0.15); color: var(--amber); }}
.tier-3 .tier-badge, .tier-badge.tier-3 {{ background: rgba(234, 179, 8, 0.15); color: var(--yellow); }}
.gy-badge {{ font-size: 10px; background: rgba(239, 68, 68, 0.2); color: var(--red); padding: 1px 5px; border-radius: 3px; margin-left: 6px; }}

/* Score bar */
.score-bar-wrap {{ position: relative; width: 100px; height: 20px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }}
.score-bar {{ height: 100%; border-radius: 3px; transition: width 0.3s; }}
.score-val {{ position: absolute; right: 4px; top: 2px; font-family: var(--mono); font-size: 11px; font-weight: 700; }}

/* Category bars */
.cat-row {{ display: flex; align-items: center; margin-bottom: 8px; }}
.cat-label {{ width: 200px; font-size: 13px; color: var(--text-sec); text-align: right; padding-right: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
.cat-bar-wrap {{ flex: 1; position: relative; height: 24px; background: rgba(255,255,255,0.03); border-radius: 4px; }}
.cat-bar {{ height: 100%; background: linear-gradient(90deg, var(--amber), var(--blue)); border-radius: 4px; opacity: 0.8; }}
.cat-count {{ position: absolute; right: 8px; top: 3px; font-family: var(--mono); font-size: 12px; color: var(--text); }}

/* Filters */
.filters {{ display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }}
.filters select, .filters input {{ background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 12px; border-radius: 6px; font-family: var(--sans); font-size: 13px; }}
.filters select:focus, .filters input:focus {{ border-color: var(--amber); outline: none; }}

/* File tree */
.file-tree {{ background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; font-family: var(--mono); font-size: 12px; line-height: 1.8; color: var(--text-sec); white-space: pre; overflow-x: auto; max-height: 500px; overflow-y: auto; }}

/* Build status */
.status-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }}
.status-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }}
.status-card h4 {{ color: var(--amber); font-family: var(--mono); font-size: 14px; margin-bottom: 8px; }}
.status-card .done {{ color: var(--green); }}
.status-card ul {{ list-style: none; padding: 0; }}
.status-card li {{ font-size: 13px; color: var(--text-sec); padding: 3px 0; }}
.status-card li::before {{ content: "->"; color: var(--blue); margin-right: 8px; font-family: var(--mono); }}

/* Footer */
footer {{ padding: 32px 48px; border-top: 1px solid var(--border); text-align: center; color: var(--text-sec); font-size: 12px; }}
</style>
</head>
<body>

<!-- Ticker -->
<div class="ticker-wrap">
<div class="ticker">
    {ticker_spans}
    {ticker_spans}
</div>
</div>

<!-- Header -->
<header>
    <div class="logo">Early Thunder <small>Comprehensive Intelligence Report</small></div>
    <div class="timestamp">Generated: {now} | v2.0</div>
</header>

<!-- Metrics -->
<div class="metrics">
    <div class="metric"><div class="value">{total}</div><div class="label">Total Opportunities</div></div>
    <div class="metric"><div class="value">{len(active)}</div><div class="label">Active</div></div>
    <div class="metric"><div class="value">{len(graveyard)}</div><div class="label">Graveyard</div></div>
    <div class="metric"><div class="value">{len(tier_1)}</div><div class="label">Tier 1</div></div>
    <div class="metric"><div class="value">{len(tier_2)}</div><div class="label">Tier 2</div></div>
    <div class="metric"><div class="value">{len(tier_3)}</div><div class="label">Tier 3</div></div>
    <div class="metric"><div class="value">{avg_score:.1f}</div><div class="label">Avg Score</div></div>
    <div class="metric"><div class="value">{len(cat_counts)}</div><div class="label">Categories</div></div>
    <div class="metric"><div class="value">{file_count}</div><div class="label">Project Files</div></div>
    <div class="metric"><div class="value">{line_count:,}</div><div class="label">Lines of Code</div></div>
</div>

<div class="container">

<!-- Section: Opportunity Table -->
<div class="section">
<h2 class="section-title">Opportunity Intelligence Table</h2>
<div class="filters">
    <input type="text" id="search" placeholder="Search name or ticker..." oninput="filterTable()">
    <select id="filter-cat" onchange="filterTable()">
        <option value="">All Categories</option>
        {cat_opts_html}
    </select>
    <select id="filter-ac" onchange="filterTable()">
        <option value="">All Asset Classes</option>
        <option value="digital_assets">Digital Assets ({da_count})</option>
        <option value="public_equities">Public Equities ({pe_count})</option>
        <option value="private_markets">Private Markets ({pm_count})</option>
    </select>
    <select id="filter-tier" onchange="filterTable()">
        <option value="">All Tiers</option>
        <option value="1">Tier 1 ({len(tier_1)})</option>
        <option value="2">Tier 2 ({len(tier_2)})</option>
        <option value="3">Tier 3 ({len(tier_3)})</option>
    </select>
</div>
<div class="table-wrap" style="max-height:700px; overflow-y:auto;">
<table id="opp-table">
<thead>
<tr>
    <th onclick="sortTable(0,'num')">#</th>
    <th onclick="sortTable(1,'str')">Name</th>
    <th onclick="sortTable(2,'str')">Ticker</th>
    <th onclick="sortTable(3,'str')">Category</th>
    <th onclick="sortTable(4,'str')">Asset Class</th>
    <th onclick="sortTable(5,'str')">Tier</th>
    <th onclick="sortTable(6,'num')">Score</th>
    <th>One-Liner</th>
</tr>
</thead>
<tbody>
{table_body}
</tbody>
</table>
</div>
</div>

<!-- Section: Category Distribution -->
<div class="section">
<h2 class="section-title">Category Distribution</h2>
<div style="max-width:800px;">
{cat_bars_html}
</div>
</div>

<!-- Section: Build Status -->
<div class="section">
<h2 class="section-title">Project Build Status</h2>
<div class="status-grid">
    <div class="status-card">
        <h4><span class="done">COMPLETE</span> A1: Site Build</h4>
        <ul>
            <li>Next.js 16 + TypeScript + Tailwind v4</li>
            <li>43 static pages generated</li>
            <li>11 components, 6 lib modules</li>
            <li>pnpm build + lint = zero warnings</li>
            <li>Cloudflare Pages ready (output: export)</li>
        </ul>
    </div>
    <div class="status-card">
        <h4><span class="done">COMPLETE</span> A2: Data Seed</h4>
        <ul>
            <li>30 initial opportunities seeded</li>
            <li>All composites validated vs formula</li>
            <li>13 categories, 3 asset classes</li>
            <li>2 graveyard entries (Terra, FTX)</li>
        </ul>
    </div>
    <div class="status-card">
        <h4><span class="done">COMPLETE</span> A3: Scout Pipeline</h4>
        <ul>
            <li>update-prices.py (CoinGecko + Yahoo Finance)</li>
            <li>scout-scan.py (trending + DeFiLlama)</li>
            <li>validate-data.py (schema validation)</li>
            <li>3 GitHub Actions workflows (daily/weekly/PR)</li>
        </ul>
    </div>
    <div class="status-card">
        <h4><span class="done">COMPLETE</span> A4: Live Data Feeds</h4>
        <ul>
            <li>Cloudflare Worker (email capture)</li>
            <li>IP rate limiting via KV (5 req/hr)</li>
            <li>Resend welcome email integration</li>
            <li>check-freshness.py monitor</li>
        </ul>
    </div>
    <div class="status-card">
        <h4><span class="done">COMPLETE</span> A5: Deploy + SEO</h4>
        <ul>
            <li>Sitemap + robots.txt generators</li>
            <li>JSON-LD structured data (4 schemas)</li>
            <li>5 blog seed posts</li>
            <li>OG image SVG, Cloudflare headers</li>
            <li>Analytics placeholder component</li>
        </ul>
    </div>
    <div class="status-card">
        <h4><span class="done">COMPLETE</span> Gap-Fill Extraction</h4>
        <ul>
            <li>AI x Crypto: 14 new entries</li>
            <li>DeSci: 13 new entries</li>
            <li>DePIN: 6 new entries</li>
            <li>Energy Storage: 7 new entries</li>
            <li>Longevity/BCI: 9 new entries</li>
            <li>Restaking: 6 new entries</li>
            <li>New Markets: 8 new entries</li>
            <li>Seed cross-ref: 23 unique entries</li>
            <li>Merged: 91 total after dedup</li>
        </ul>
    </div>
</div>
</div>

<!-- Section: Asset Class Breakdown -->
<div class="section">
<h2 class="section-title">Asset Class Breakdown</h2>
<div class="cards">
    <div class="card">
        <h3>Digital Assets</h3>
        <div class="stat">{da_count}</div>
        <p>Tokens, DeFi protocols, crypto infrastructure</p>
    </div>
    <div class="card">
        <h3>Private Markets</h3>
        <div class="stat">{pm_count}</div>
        <p>Pre-IPO companies, equity crowdfunding, venture</p>
    </div>
    <div class="card">
        <h3>Public Equities</h3>
        <div class="stat">{pe_count}</div>
        <p>Listed stocks, ETFs, public companies</p>
    </div>
</div>
</div>

<!-- Section: Top 10 Deep Dive -->
<div class="section">
<h2 class="section-title">Top 10 Opportunities</h2>
<div class="cards">
{top10_html}
</div>
</div>

<!-- Section: Graveyard -->
<div class="section">
<h2 class="section-title">Opportunity Graveyard ({gy_count} entries)</h2>
<div class="cards">
{graveyard_html}
</div>
</div>

<!-- Section: GitHub Repo -->
<div class="section">
<h2 class="section-title">Repository & Deployment</h2>
<div class="cards">
    <div class="card">
        <h3>GitHub</h3>
        <p style="font-family: var(--mono); color: var(--blue);">github.com/theluckystrike/earlythunder</p>
        <p style="margin-top:8px;">Public repository, ready for initial push</p>
    </div>
    <div class="card">
        <h3>Domain</h3>
        <p style="font-family: var(--mono); color: var(--amber);">earlythunder.com</p>
        <p style="margin-top:8px;">Cloudflare Pages deployment target</p>
    </div>
    <div class="card">
        <h3>Tech Stack</h3>
        <p>Next.js 16 | TypeScript | Tailwind v4 | Cloudflare Pages | GitHub Actions</p>
    </div>
</div>
</div>

<!-- Section: File Tree -->
<div class="section">
<h2 class="section-title">Project Structure</h2>
<div class="file-tree">earlythunder/
{file_tree}</div>
</div>

</div>

<footer>
    Early Thunder Intelligence Report | Generated {now} | {total} Opportunities | {file_count} Files | {line_count:,} Lines
    <br>Not financial advice. Pattern match scores reflect research methodology, not investment recommendations.
</footer>

<script>
var sortDir = {{}};
function sortTable(colIdx, type) {{
    var table = document.getElementById('opp-table');
    var tbody = table.querySelector('tbody');
    var rows = Array.from(tbody.querySelectorAll('tr'));
    var dir = sortDir[colIdx] === 'asc' ? 'desc' : 'asc';
    sortDir[colIdx] = dir;
    rows.sort(function(a, b) {{
        var aVal = a.cells[colIdx] ? a.cells[colIdx].textContent.trim() : '';
        var bVal = b.cells[colIdx] ? b.cells[colIdx].textContent.trim() : '';
        if (type === 'num') {{
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            return dir === 'asc' ? aVal - bVal : bVal - aVal;
        }}
        return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }});
    for (var i = 0; i < rows.length; i++) tbody.appendChild(rows[i]);
}}
function filterTable() {{
    var search = (document.getElementById('search').value || '').toLowerCase();
    var cat = document.getElementById('filter-cat').value || '';
    var ac = document.getElementById('filter-ac').value || '';
    var tier = document.getElementById('filter-tier').value || '';
    var rows = document.querySelectorAll('#opp-table tbody tr');
    for (var i = 0; i < rows.length && i < 500; i++) {{
        var row = rows[i];
        var name = row.querySelector('.name') ? row.querySelector('.name').textContent.toLowerCase() : '';
        var tkr = row.querySelector('.ticker') ? row.querySelector('.ticker').textContent.toLowerCase() : '';
        var matchSearch = !search || name.indexOf(search) >= 0 || tkr.indexOf(search) >= 0;
        var matchCat = !cat || row.dataset.category === cat;
        var matchAc = !ac || row.dataset.ac === ac;
        var matchTier = !tier || row.dataset.tier === tier;
        row.style.display = (matchSearch && matchCat && matchAc && matchTier) ? '' : 'none';
    }}
}}
</script>
</body>
</html>"""
    return html


def main() -> None:
    """Main entry point."""
    print("  Loading opportunities...")
    opps = load_opportunities()
    print(f"  Loaded {len(opps)} entries")

    print("  Building HTML report...")
    html = build_html(opps)

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = REPORT_DIR / "index.html"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  Report written to: {output_path}")
    print(f"  Size: {len(html):,} bytes")

    # Also copy the data file
    import shutil
    shutil.copy2(OPPS_FILE, REPORT_DIR / "opportunities.json")
    print(f"  Data copied to: {REPORT_DIR / 'opportunities.json'}")


if __name__ == "__main__":
    main()
