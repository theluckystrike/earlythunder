# Agent: Crypto Drawdown Calculator

STATUS: complete

## Deliverables (4 files, all new)
- `src/app/crypto-drawdown-calculator/page.tsx`
- `src/components/DrawdownCalculator.tsx`
- `src/lib/drawdown-calc.ts`
- `test/drawdown-calc.test.ts`

## Test result
Command: `export PATH=/opt/homebrew/opt/node@22/bin:$PATH && npx tsx --test test/drawdown-calc.test.ts`

```
# tests 23
# pass 23
# fail 0
```

Full repo suite: `# tests 124 / # pass 124 / # fail 0`.

## What was built

The page measures how far a crypto has fallen from a prior peak and what it takes to climb back. A visitor enters a peak price, a current or trough price, an optional recovery target percentage, and an optional recovery price. `src/lib/drawdown-calc.ts` holds the pure math: `drawdownPercent` = (peak - trough) / peak, `recoveryGainPercent` = 1 / (1 - dd) - 1, and `recoveryMultiple` = 1 / (1 - dd), plus `recoveryTable` which builds the 10%-to-90% grid and `analyzeDrawdown` which assembles the full result set including the recovery target price and a fee/round-trip note. Copy generators `drawdownIntroText()`, `drawdownDisclosureText()`, `recoveryMathNote()`, `drawdownWorkedExample()` and `indexCrashExampleText()` write plain human sentences with concrete figures and no "This is..." openers. `DrawdownCalculator.tsx` is a `"use client"` component following the Field/Metric pattern from `BuyTheDipCalculator`, rendering the headline drawdown percentage, the gain needed to recover, the recovery multiple, the recovery price at the chosen target, and the full drawdown table with the value still standing next to each row. The page carries metadata title "Crypto drawdown calculator: measure peak-to-trough risk", canonical `https://earlythunder.com/crypto-drawdown-calculator`, the `DRAWDOWN MODEL` eyebrow, `og-default.png` with a `summary_large_image` Twitter card, WebApplication/Article/BreadcrumbList/FAQPage JSON-LD, four prose sections, a worked example, references to Investopedia's drawdown definition and Morningstar's recovery-math research, related-calculator links, the standard risk disclosure, and the footer "Built and checked by Michael Lip".

## Evidence

### Pattern followed
Read once each: `src/app/crypto-buy-the-dip-calculator/page.tsx`, `src/components/BuyTheDipCalculator.tsx`, `src/lib/dip-calc.ts`, `test/dip-calc.test.ts`. Design tokens (`text-text-primary`, `text-text-secondary`, `bg-bg-secondary`, `border-border-subtle`, `text-amber`, `ghost-btn`, `JsonLd`) reused unchanged.

### Real data confirmed
`data/btc-daily-365.json`: `id: btc-daily-365`, `fetched_at: 2026-09-18T00:34:35.518Z`, window 2025-09-19 to 2026-09-18, **364 rows**, each `{date, usd}`, first `2025-09-19 $117,169.12`, last `2026-09-18 $76,325.39`. Shape confirmed as documented; the calculator itself is pure-math and does not require the data file at runtime.

### Typecheck
`npx tsc --noEmit` → no output, clean.

### Build (static export)
`npm run build` → success. Route emitted at `out/crypto-drawdown-calculator.html` (67,619 bytes).

Rendered-HTML assertions, all passing:
- `<title>Crypto drawdown calculator: measure peak-to-trough risk</title>`
- `rel="canonical" href="https://earlythunder.com/crypto-drawdown-calculator"`
- `property="og:image" content="https://earlythunder.com/og-default.png"`
- `name="twitter:card" content="summary_large_image"`
- eyebrow `DRAWDOWN MODEL` present (1)
- footer `Built and checked by Michael Lip` present (1)
- JSON-LD `@type` set: WebApplication, Article, BreadcrumbList, FAQPage, Question, Answer, Organization, Offer, WebSite, SearchAction, ListItem

### Drawdown table as rendered (10%-90%, 9 data rows)
```
Drawdown | Value still standing | Gain to recover | Recovery multiple
-10%     | 90%                  | 11.1%           | 1.11x
-20%     | 80%                  | 25%             | 1.25x
-30%     | 70%                  | 42.9%           | 1.43x
-40%     | 60%                  | 66.7%           | 1.67x
-50%     | 50%                  | 100%            | 2x
-60%     | 40%                  | 150%            | 2.5x
-70%     | 30%                  | 233.3%          | 3.33x
-80%     | 20%                  | 400%            | 5x
-90%     | 10%                  | 900%            | 10x
```

### Worked example sentence as rendered
> Say a coin peaked at $100,000 and printed a low of $50,000. That is a drawdown of 50%, a fall of $50,000 per unit. Getting back to $100,000 takes a gain of 100% on the $50,000 low, which is 2.00x the trough value. A 50% fall from 100000 to 50000 needs a 100% gain, so a fall of roughly half demands a little more than a double.

### Copy hygiene
Scanned `src/lib/drawdown-calc.ts` for AI-tell vocabulary (`This is`, `In conclusion`, `delve`, `Moreover`, `Furthermore`, `It is important to note`, `landscape`, `realm`, `tapestry`, `crucial`, `robust`, `leverage`, `navigate`, `unlock`, `seamless`) → **zero hits**. Rendered HTML contains no `>This is ` opener.

### Bugs found and fixed during the build
1. `bounded(Infinity, max)` returned `0` because the guard used `Number.isFinite(raw) === false`, which is true for `Infinity`. Fixed to `if (Number.isNaN(raw) || raw <= 0) return 0; if (raw === Number.POSITIVE_INFINITY) return max;`.
2. The terminal drawdown clamps to 99.99% (a deliberate guard so a total loss never divides by zero), so `recoveryGainPercent(100)` is `999899.99`, not `Infinity`. My first test asserted `Infinity` and failed. Rewrote the test to assert the clamp behaviour: `drawdownPercent(100, 0) === 99.99`, `recoveryGainPercent(100) === recoveryGainPercent(99.99)`, and that both stay finite. Added a separate test that a 99.99% drawdown needs a gain above 900,000 (true value 999,899.99) and a multiple above 9,000.
3. Three tests asserted `"50.0%"` / `"100.0%"` formatting that `formatPercent` does not produce; it emits `50%` / `100%`. Corrected the assertions to match the real formatter and added a `2.00x` multiple assertion.

## Constraints honoured
- No `git commit` or `git push`.
- No `npm install`.
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH` exported for every npm/npx call.
- No `sleep`, no polling loops.
