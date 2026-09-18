# EarlyThunder — Design Systematization Report

**Date:** 2026-06-16
**Branch:** `design/unify-header-systematize-colors-about` (pushed to `origin`)
**Commit:** `5cc8026`
**Run:** 10-agent deep workflow (1 spec + 9 redesign, disjoint file ownership) + build-verification gate
**Build:** ✅ `next build` static export passes — **375 routes**, 392 HTML files emitted, 0 errors

Open a PR: https://github.com/theluckystrike/earlythunder/pull/new/design/unify-header-systematize-colors-about
*(GitHub CLI wasn't authenticated this session, so the PR wasn't auto-created — use the link above, or run `gh auth login` and `gh pr create`.)*

---

## The problem you flagged

> "CTA is different when we switch tabs — this is critical … /deadlines/ no menu at all and messy page"

**Root cause:** the site had **three divergent header systems**, so the nav + call-to-action visibly changed when moving between tabs.

| Header | Used by | Nav / CTA |
|---|---|---|
| React `Header.tsx` | all Next.js routes | full nav + "Sign in" + "Open Terminal →" |
| static `et-nav` | intelligence, research | matched React ✓ |
| **old `header`** | **deadlines, earnings** | `Home·Research·Intelligence·Earnings·Deadlines` — **no Opportunities/Scorecard, no CTA button, no mobile menu** |

The old header on `/deadlines/` and `/earnings/` is exactly why those pages felt menu-less and inconsistent.

---

## What was fixed

### 1. One canonical header/CTA — site-wide (the critical fix)
A single self-contained header (HTML + CSS + working mobile hamburger) is now dropped into **every** static page: intelligence, research (+13 articles), earnings, deadlines, dashboard, command. The React `Header.tsx` mirrors it.

**Verified:** header blocks are **byte-identical across pages except the active-tab marker** (`data-active="deadlines"` vs `"earnings"`, etc.). Nav order is identical everywhere:
`Intelligence · Opportunities · Research · Earnings · Deadlines · Scorecard · About` + `Sign in` + amber `Open Terminal →`.

One intentional correction: the static `et-nav` primary button was white; it's now **amber** everywhere to match the brand accent and the React `primary-btn`.

### 2. Systematized colors
Every static page's `:root` now equals the canonical `globals.css` palette (legacy var names kept as aliases so nothing breaks). Amber accent discipline applied: amber reserved for primary accent / active state / CTA only. **All `var()` references resolve — 0 undefined tokens across all 6 static pages.**

### 3. `/deadlines/` rebuilt
Canonical header + working mobile menu; stats bar → responsive grid, sort controls → pill buttons, deadline cards normalized (consistent radius/padding/hover), actions in a 3-col grid, "Explore More" converted to reusable card components. **All 24 deadline entries, countdown timers, and `sortDeadlines()` preserved.**

### 4. New `/about` page → **zovo.one**
Created `src/app/about/page.tsx`, modeled on the DeepValue Radar story but rewritten for EarlyThunder (8-signal scoring, 247 protocols, adversarial bull-vs-short, run in public, AUTOM8 LLC, builder Michael Lip / Warsaw). All 8 sections present (hero, story, mission, milestones 2014→now, builder bio + stat tiles, guiding principles, "find me / work with me", disclaimer).
**Primary CTA: "Get lifetime access at zovo.one →"** linking to https://zovo.one, plus github.com/theluckystrike + michaelip.dev.
"About" added to both `Header.tsx` nav and `Footer.tsx`.

### 5. Taste/consistency pass
Homepage + 10 landing components (fixed a stale score-tier color fallback where the elite tier rendered blue instead of amber), 14 research articles, and 12 Next content pages (scorecard column alignment, pricing, methodology, opportunities, etc.). Content, data, JSON-LD, and metadata all preserved.

---

## Files changed (45)
- **6** static tool pages: `public/{deadlines,earnings,intelligence}/index.html`, `public/{dashboard,command}.html`
- **14** research pages: `public/research/index.html` + 13 article subpages
- **3** shared shell: `src/app/globals.css`, `src/components/{Header,Footer}.tsx`
- **10** landing components: `src/components/landing/*.tsx`
- **12** Next content pages: `src/app/{scorecard,pricing,methodology,opportunities,how-it-works,guides,guides/[slug],blog,blog/[slug],discoveries,graveyard,performance}/page.tsx`
- **1** new page: `src/app/about/page.tsx`

`+7,626 / −2,271` lines. `out/` is gitignored (built on deploy) and was not committed.

---

## Verification performed
- ✅ `npm run build` (Next.js 16 static export) — 375 routes, 0 errors
- ✅ Header link order byte-identical across deadlines/earnings/intelligence/research
- ✅ Header markup differs only by active-tab marker (confirmed via direct diff)
- ✅ 0 undefined CSS `var()` references across all 6 static pages
- ✅ `/deadlines/` served HTML carries canonical header + mobile toggle + 24 entries + countdown/sort JS + canonical footer
- ✅ `/about` compiles and links to zovo.one; milestones + builder facts present

---

## Deploy notes
- Cloudflare Pages builds from `out/` (`pages_build_output_dir = "out"`) via `npm run build` — no manual `out/` commit needed.
- This is on a feature branch, **not merged to `main`**. Merge the PR (or fast-forward `main`) to deploy.
- Not committed (pre-existing, unrelated): `src/app/welcome/`, `data/*.json`, `worker/src/*`, price reference files.

## Suggested follow-ups
- Authenticate `gh` and open the PR (link above).
- Optional: the `Header.tsx` desktop nav is now 7 items + 2 CTAs — sanity-check it doesn't crowd at ~900–1024px widths.
- Pre-existing lint nits (out of scope this run): an `<a>`-vs-`<Link>` in `guides`, an unused `changeColor` in `scorecard`.
