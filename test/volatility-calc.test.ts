import assert from "node:assert/strict";
import test from "node:test";
import {
  annualizedVol,
  calculateVolatility,
  dailyReturn,
  sigmaRange,
  volatilityDisclosureText,
  volatilityIntroText,
  volatilityTitle,
} from "../src/lib/volatility-calc";

function near(actual: number, expected: number, tolerance = 1e-9): void {
  assert.ok(Number.isFinite(actual), `expected finite, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}

test("dailyReturn is the natural log of price two over price one, in percent", () => {
  near(dailyReturn(100, 200), Math.log(2) * 100);
  near(dailyReturn(200, 100), Math.log(0.5) * 100);
  near(dailyReturn(100, 100), 0);
});

test("dailyReturn is symmetric around the same ratio", () => {
  near(dailyReturn(100, 150), -dailyReturn(150, 100));
});

test("dailyReturn returns zero for zero or negative prices", () => {
  near(dailyReturn(0, 100), 0);
  near(dailyReturn(100, 0), 0);
  near(dailyReturn(-50, 100), 0);
  near(dailyReturn(100, -50), 0);
});

test("annualizedVol scales a daily move by sqrt of 365 over the window", () => {
  // 100 -> 200 over 1 day: log(2) ~ 69.31% daily, scaled by sqrt(365) for 1 day.
  const expected = Math.abs(Math.log(2)) * Math.sqrt(365) * 100;
  near(annualizedVol(100, 200, 1), expected);
});

test("annualizedVol is zero when the two prices are equal", () => {
  near(annualizedVol(50000, 50000, 30), 0);
});

test("annualizedVol is zero when the window is zero", () => {
  near(annualizedVol(100, 200, 0), 0);
});

test("annualizedVol grows as the window shrinks for the same total move", () => {
  const oneDay = annualizedVol(100, 200, 1);
  const tenDays = annualizedVol(100, 200, 10);
  assert.ok(oneDay > tenDays, "same move over fewer days must annualize higher");
  near(oneDay / tenDays, Math.sqrt(10), 1e-6);
});

test("sigmaRange splits the daily move into a symmetric one sigma band", () => {
  const range = sigmaRange(100, 200, 1);
  const sigma = (Math.abs(Math.log(2)) / Math.sqrt(1)) * 100;
  near(range.lowPercent, -sigma);
  near(range.highPercent, sigma);
  near(range.lowPercent, -range.highPercent);
});

test("sigmaRange is zero for equal prices or a zero window", () => {
  const equal = sigmaRange(100, 100, 30);
  near(equal.lowPercent, 0);
  near(equal.highPercent, 0);
  const none = sigmaRange(100, 200, 0);
  near(none.lowPercent, 0);
  near(none.highPercent, 0);
});

test("calculateVolatility ties daily return, annual vol, and sigma band together", () => {
  const result = calculateVolatility({ price1: 60000, price2: 66000, daysBetween: 30 });
  near(result.dailyReturnPercent, dailyReturn(60000, 66000));
  near(result.annualizedVolPercent, annualizedVol(60000, 66000, 30));
  near(result.sigmaDailyLowPercent, sigmaRange(60000, 66000, 30).lowPercent);
  near(result.sigmaDailyHighPercent, sigmaRange(60000, 66000, 30).highPercent);
});

test("calculateVolatility defaults annualize on and honors the off switch", () => {
  const on = calculateVolatility({ price1: 100, price2: 150, daysBetween: 7 });
  const off = calculateVolatility({ price1: 100, price2: 150, daysBetween: 7, annualize: false });
  assert.ok(on.annualizedVolPercent > 0);
  near(off.annualizedVolPercent, 0);
  near(on.dailyReturnPercent, off.dailyReturnPercent);
});

test("an up move and a down move of the same ratio share annual vol", () => {
  const up = annualizedVol(100, 150, 30);
  const down = annualizedVol(150, 100, 30);
  near(up, down);
});

test("annualized vol stays finite for a huge price jump", () => {
  const result = annualizedVol(1, 1_000_000_000_000, 365);
  assert.ok(Number.isFinite(result));
  assert.ok(result > 0);
});

test("bad inputs degrade safely to zero", () => {
  const result = calculateVolatility({ price1: -5, price2: 0, daysBetween: -3 });
  near(result.dailyReturnPercent, 0);
  near(result.annualizedVolPercent, 0);
  near(result.sigmaDailyLowPercent, 0);
  near(result.sigmaDailyHighPercent, 0);
});

test("copy generators return non-empty humanized strings without artifacts", () => {
  const intro = volatilityIntroText(60000, 66000, 30);
  for (const s of [volatilityTitle(), intro, volatilityDisclosureText()]) {
    assert.ok(typeof s === "string" && s.length > 0);
    assert.ok(!s.includes("undefined"), `leaked undefined: ${s}`);
    assert.ok(!s.includes("NaN"));
    assert.ok(!s.includes("—"), `em dash leaked: ${s}`);
    assert.ok(!s.startsWith("This is"), `forbidden opener: ${s}`);
  }
  assert.ok(intro.includes("60,000"));
  assert.ok(volatilityTitle().toLowerCase().includes("volatility"));
});

test("copy generators avoid AI-tell words", () => {
  const banned = ["crucial", "delve", "landscape", "leverage"];
  const text = [volatilityIntroText(60000, 66000, 30), volatilityDisclosureText(), volatilityTitle()].join(" ").toLowerCase();
  for (const word of banned) {
    assert.ok(!text.includes(word), `forbidden AI-tell word present: ${word}`);
  }
});
