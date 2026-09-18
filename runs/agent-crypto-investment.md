# Agent Task: Crypto Investment Calculator Page Clone

**Task**: Build "Crypto Investment Calculator" page clone in EarlyThunder repo.
**Deliverable**: source files + passing tests. No git push, no npm installs.

**STATUS**: in progress

## Files created
- `src/app/crypto-investment-calculator/page.tsx` (12.3k) — server component, metadata, copy, layout cloned from `CryptoCalculatorPage` shell. Title "Crypto investment calculator with recurring buys", eyebrow "INVESTMENT GROWTH MODEL", breadcrumb, H1, description (~150 chars mentioning a real Bitcoin backtest), intro, calculator, worked example, 4-question FAQ (details/summary, no JSON-LD FAQPage), 7 formulas, 2 primary references (Investor.gov + SEC, real URLs), related calculators links, risk disclosure, "Built and checked by Michael Lip".
- `src/components/InvestmentCalculator.tsx` (7.2k) — client interactive calculator mirroring `CryptoPlanningCalculator`'s `Field`/`Metric`/`CalculatorShell` UI, using `calculateInvestment`.
- `src/lib/investment-calc.ts` (5.8k) — pure math: `calculateInvestment`, `formatUsd`, `formatHumanDate`, `formatPercent`, `formatUnits`, copy generators `investmentTitle`, `investmentIntro`, `investmentExample`, `investmentDisclosure`.
- `test/investment-calc.test.ts` (6k) — 19 tests: math edge cases, zero fee, zero recurring, formatHumanDate usage, copy generator invariants, scenario table, CAGR, fee drag, bad-input degradation.

## Gates
1. `npx tsx --test test/investment-calc.test.ts` → PASS, 19/19.
2. `npm run test` (full) → PASS, 65/65.
3. `npx eslint --no-config-lookup --config qa/eslint-nasa.mjs src/app/crypto-investment-calculator/page.tsx src/components/InvestmentCalculator.tsx src/lib/investment-calc.ts` → exit 0.
4. `npm run build` (next build) → running in background (G4 is optional; parent builds centrally).
5. `python3 /Users/mike/Desktop/humanize/scan.py --strict src/app/crypto-investment-calculator/page.tsx` → PASS: "RESULT: PASS - no AI-formatting tells detected. Deploy-clean."

## Design decisions
- `PlanningCalculatorKind` union (dca | average-price | fees | apy | position-size) has no investment kind. Per the contract "standalone page.tsx otherwise", the page is a standalone server component cloning the `CryptoCalculatorPage` layout, rendering a dedicated client `InvestmentCalculator` component instead of `CryptoPlanningCalculator`. No shared component modified.
- Recurring buys priced along a straight glide path from start price to end price, matching the DCA repo convention (`price = start + (end - start) * j / periods`). First purchase is the lump sum at start price.
- CAGR returned only when a holding window in years is supplied; null otherwise.
- Fee drag = ending value at zero fee minus ending value at entered fee.
- Scenario table recomputes the full plan (units included) at each swing end price, so ending value uses scenario-specific units.

## Notes
- Fixed an infinite-recursion bug: scenario generation recursively re-ran the full model. Extracted a `withScenarios` flag so scenario runs never regenerate scenarios. 15 tests were failing before the fix, 0 after.
- One test originally asserted `scenario.endingValue === baseUnits * swingPrice`; that is wrong because scenario units differ. Rewrote to assert scenario matches a fresh run at the same end price.

## Test output tail
```
# tests 65
# suites 0
# pass 65
# fail 0
```
