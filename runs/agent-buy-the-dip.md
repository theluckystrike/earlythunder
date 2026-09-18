# Agent: Crypto buy the dip calculator

STATUS: complete

## Deliverable
Cloned the "Crypto buy the dip calculator" page in EarlyThunder, matching the
DCA calculator pattern. Source files + passing tests. No deploy, no git push.

## Files created
- src/lib/dip-calc.ts            pure math + copy generators, PriceDataset type
- test/dip-calc.test.ts          18 tests
- src/components/BuyTheDipCalculator.tsx   interactive client widget
- src/app/crypto-buy-the-dip-calculator/page.tsx   standalone page (clones DCA structure)

## Design
- Core pure fn runDipPlan(rows, options): walks the real dataset, tracks the
  running high, deploys one tranche each time drawdown >= threshold, deploys
  leftover at the final price. No Date.now(), deterministic.
- buildSyntheticPath(start, end, days, dipDepth, dipEvery) builds a deterministic
  sawtooth dip scenario for the interactive calculator.
- lumpSumBaseline + compareStrategies provide the lump-sum comparison.
- Copy generators (dipIntroText, dipWorkedExample, dipDisclosureText,
  dipBacktestSummary, methodFormulaText) in dca-backtest humanized style.

## Page structure (matches DCA page exactly)
- metadata title "Crypto buy the dip calculator with backtest", description ~150 chars with real Bitcoin prices
- breadcrumb, eyebrow "DIP BUYING MODEL", H1 "Crypto buy the dip calculator with backtest"
- interactive calculator, worked example card, 4-question FAQ (details/summary, NO JSON-LD FAQPage)
- method/formulas block, 2 primary references (Investor.gov + SEC, reused from DCA page)
- related calculators links, risk disclosure, "Built and checked by Michael Lip"
- real-data backtest section ("Backtest of ..." heading + stat cards + disclosure list)

## Gates
1. npx tsx --test test/dip-calc.test.ts -> 18 pass
2. npm run test -> 65 pass (18 mine + 47 existing)
3. nasa lint on new files -> 0 errors
4. next build skipped (parent builds centrally)
5. humanize --strict on page.tsx -> PASS clean

## Test output tail
# tests 18
# pass 18
# fail 0
