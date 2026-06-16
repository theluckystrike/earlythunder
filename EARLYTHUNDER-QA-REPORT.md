# EarlyThunder — QA & Debug Pass Report

**Date:** 2026-06-16
**Branch/Deploy:** committed to `main` (`04fba22`), pushed → Cloudflare Pages auto-deploy
**Method:** real-browser QA via headless Chrome (`puppeteer-core` over DevTools protocol) — clicked through 10 pages, captured console errors / page errors / failed requests / horizontal-overflow at multiple widths, screenshot-reviewed every page, then fixed and re-verified.

---

## Headline outcome
`/earnings/` — the page you flagged as "still terrible, not even close to our main page" — was **fully rebuilt to the homepage's design system** and its **empty-table bug fixed**. Every page now shares one premium look (Geist + JetBrains Mono, `.section` rhythm, `.data-table` with avatars + sparklines, amber-accent discipline). About is now a **$99-lifetime monetization gateway**. All nav-crowding and mobile-overflow bugs are fixed.

---

## ⚠️ THE root cause (found by testing production, not just local)

### 0. Production CSP blocked Google Fonts + ALL inline scripts  ✅ FIXED
This is why `/earnings/` looked "terrible / wrong fonts / empty table" even after the first rebuild — and it only reproduced **on the live site**, because Cloudflare applies `_headers` but local dev servers don't. The global CSP in `_headers` was:
`script-src 'self' https://plausible.io; style-src 'self' 'unsafe-inline'; font-src 'self'`
- **No `'unsafe-inline'` in script-src** → every inline `<script>` was refused, so the JS-rendered earnings table never populated (`renderTable()` blocked) — **and** mobile menus, countdowns, and Next.js hydration broke site-wide (home threw **34 CSP errors**).
- **`style-src`/`font-src` didn't allow `fonts.googleapis.com` / `fonts.gstatic.com`** → Geist + JetBrains Mono were blocked, so the whole site fell back to system **serif** — exactly the "fonts not even close to the main page" complaint.

**Fix:** CSP now allows `'unsafe-inline'` scripts (site is fully static, no reflected input), the Google Fonts CDNs, and the Cloudflare analytics beacon.
**Verified on production (real browser):** `/earnings/` renders **53 rows in Geist, 0 errors, 0 empty tables**; home dropped from **34 errors → 0**.

### 1. `/earnings/` — terrible design + empty table  ✅ FIXED
- **Root cause of "empty":** the table is 100% client-JS-rendered (`tbody#table-body` empty in HTML, filled by `renderTable()`); the old render could silently abort. The screenshot you sent was the **old production page** (old "EARLYTHUNDER YIELD SCANNER" header).
- **Rebuilt** to match the homepage exactly: loaded Geist + JetBrains Mono (same weights), ported `.section`/`.section__head`/`.section__eyebrow`/`.section__title`, `.table-filters`/`.chip`, `.table-wrap--striped`/`.data-table` with colored `.sym-cell` avatars, 7-day SVG sparklines, color-coded yields, mono tabular numerics. Eyebrow "EARNINGS // YIELD SCANNER", LIVE pill, stat cards.
- **Render hardened:** single `renderTable()` called at top level, every `getElementById` null-guarded — verified rendering **53 rows** (50 protocols + 3 member-teaser) with **0 console errors**; filter chip (53→27) and sort verified working.

### 2. Monetization gateways  ✅ ADDED
- **/about:** prominent "I share my top findings only with **$99 lifetime members**" framing, a "what you get" list, and repeated amber **"Get lifetime access — $99 at zovo.one →"** CTAs (external link to https://zovo.one).
- **/earnings:** a tasteful gateway card below the table — 3 **blurred "MEMBERS ONLY" teaser rows** + "The highest-conviction calls go to members" + zovo.one CTA.

### 3. Nav crowding (your earlier concern)  ✅ FIXED
- 7 nav links + 2 CTAs **overflowed between 721–960px**, but the hamburger only engaged at ≤720px (React) / ≤860px (static) — a broken nav band on tablets.
- Raised **both** header systems to collapse at **≤1080px**. Verified: links→hamburger cleanly at 1080/1000/900, no overflow.

### 4. Mobile horizontal overflow  ✅ FIXED
- **earnings:** `.table-wrap` had `min-width:920px` → forced the whole page ≥920px wide. Moved min-width onto the `<table>` and made the wrap `overflow-x:auto` so the table scrolls *inside its card*.
- **home:** CoverageMap's fixed 280px detail panel overflowed below ~792px. Added a `≤860px` rule to stack it.
- Verified **zero page overflow at 390 / 768 / 900px** across home + earnings.

### 5. Trailing-slash routing  ✅ FIXED
- Static-page headers/footers linked app routes **with** trailing slashes (`/opportunities/`, `/scorecard/`, `/about/`), which Cloudflare answers with a **308 redirect** to the no-slash asset — an extra hop on every nav click + active-state mismatch.
- Rewrote those links no-slash across **19 static files** to match the exported assets and the React header. (Directory tools `/intelligence/` etc. correctly keep the slash.)

### 6. Console cleanup  ✅ FIXED
- Disabled `prefetch` on Header/Footer nav `<Link>`s and converted a hero `<Link href="/intelligence/">` (a *static* route) to `<a>`. The homepage is now **JS-error-free** (was 1 error); failed-request noise dropped ~70%. Remaining items are local-server trailing-slash prefetch artifacts that resolve 200 on Cloudflare.

---

## Verified working (real browser)
- Earnings: filter chips, column sort, search, results-count, mobile hamburger — all functional, 0 errors.
- All 10 audited pages render Geist + populated content; deadlines/scorecard/opportunities/earnings visually reviewed — consistent and on-brand.
- `next build` passes — 375 routes, static export to `out/`.

## Known content (not design) follow-ups
- Deadlines/earnings data is dated **May 9, 2026**; several deadlines now show **ENDED** and many opportunity prices are `-`. Worth a fresh data pull.
- Scorecard/opportunities tables are very wide — they scroll horizontally now, but a future pass could prioritize columns on mobile.

## Files changed this round
`public/earnings/index.html` (rebuild), `src/app/about/page.tsx` (gateway), `src/app/globals.css` (nav ≤1080, table-wrap scroll, coverage responsive), `src/components/Header.tsx` + `Footer.tsx` (prefetch off), `src/components/landing/HeroSection.tsx` (Link→a), + 19 static HTML files (trailing-slash + nav breakpoint).
