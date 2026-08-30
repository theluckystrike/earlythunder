import "server-only";

import { request } from "node:https";

export interface BitcoinSnapshot {
  readonly fetchedAt: string;
  readonly lastUpdated: string;
  readonly price: number;
  readonly allTimeHigh: number;
  readonly allTimeHighDate: string;
  readonly marketCap: number;
  readonly circulatingSupply: number;
  readonly distanceFromHighPercent: number;
}

interface MarketReading {
  readonly price: number;
  readonly allTimeHigh: number;
  readonly allTimeHighDate: string;
  readonly marketCap: number;
}

interface CoinGeckoReading extends MarketReading {
  readonly circulatingSupply: number;
  readonly lastUpdated: string;
}

interface BlockchairReading {
  readonly price: number;
  readonly marketCap: number;
  readonly circulatingSupply: number;
  readonly bestBlockTime: string;
}

const ENDPOINTS = {
  CoinGecko: "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin&sparkline=false",
  CoinPaprika: "https://api.coinpaprika.com/v1/tickers/btc-bitcoin",
  Coinbase: "https://api.coinbase.com/v2/prices/BTC-USD/spot",
  Blockchair: "https://api.blockchair.com/bitcoin/stats",
} as const;

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_ATTEMPTS = 3;
const MAX_FUTURE_MS = 5 * 60 * 1000;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function finite(value: unknown, label: string): number {
  const number = typeof value === "string" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) {
    throw new TypeError(`${label} must be finite.`);
  }
  return number;
}

function inRange(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
  if (value < minimum || value > maximum) throw new RangeError(`${label} is outside its sane range.`);
  return value;
}

function isoDate(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length < 10) throw new TypeError(`${label} is required.`);
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) throw new TypeError(`${label} must be an ISO date.`);
  return new Date(milliseconds).toISOString();
}

function parseResponse(body: string, url: string): unknown {
  if (body.length === 0) throw new Error(`Empty JSON response from ${url}.`);
  if (body.length > MAX_RESPONSE_BYTES) throw new Error(`Oversized JSON response from ${url}.`);
  try {
    return JSON.parse(body) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown JSON error";
    throw new Error(`Invalid JSON from ${url}: ${message}`);
  }
}

function requestOnce(url: string): Promise<unknown> {
  if (!url.startsWith("https://")) return Promise.reject(new Error("Snapshot endpoint must use HTTPS."));
  if (url.length > 500) return Promise.reject(new Error("Snapshot endpoint is unexpectedly long."));
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { accept: "application/json", "user-agent": "EarlyThunderBuild/1.0" } }, (res) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      const status = res.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        res.resume();
        reject(new Error(`Snapshot endpoint returned HTTP ${status}: ${url}`));
        return;
      }
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) res.destroy(new Error(`Snapshot response exceeded byte limit: ${url}`));
        else chunks.push(chunk);
      });
      res.on("end", () => resolve(parseResponse(Buffer.concat(chunks).toString("utf8"), url)));
      res.on("error", reject);
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error(`Snapshot request timed out: ${url}`)));
    req.on("error", reject);
    req.end();
  });
}

async function requestJson(url: string): Promise<unknown> {
  let lastError = new Error(`Snapshot request failed: ${url}`);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestOnce(url);
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
      if (attempt + 1 < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function coinGecko(raw: unknown): CoinGeckoReading {
  if (!Array.isArray(raw) || raw.length !== 1) throw new TypeError("CoinGecko must return one row.");
  const row = record(raw[0], "CoinGecko row");
  if (row.id !== "bitcoin" || row.symbol !== "btc") throw new Error("CoinGecko Bitcoin identity failed.");
  return {
    price: inRange(finite(row.current_price, "CoinGecko price"), 1e-7, 500_000, "CoinGecko price"),
    allTimeHigh: inRange(finite(row.ath, "CoinGecko ATH"), 1e-7, 500_000, "CoinGecko ATH"),
    allTimeHighDate: isoDate(row.ath_date, "CoinGecko ATH date"),
    marketCap: inRange(finite(row.market_cap, "CoinGecko market cap"), 100_000, 10_000_000_000_000, "CoinGecko market cap"),
    circulatingSupply: inRange(finite(row.circulating_supply, "CoinGecko supply"), 1, 100_000_000_000_000, "CoinGecko supply"),
    lastUpdated: isoDate(row.last_updated, "CoinGecko last updated"),
  };
}

function coinPaprika(raw: unknown): MarketReading {
  const row = record(raw, "CoinPaprika row");
  if (row.id !== "btc-bitcoin" || row.symbol !== "BTC") throw new Error("CoinPaprika Bitcoin identity failed.");
  const quotes = record(row.quotes, "CoinPaprika quotes");
  const usd = record(quotes.USD, "CoinPaprika USD quote");
  return {
    price: inRange(finite(usd.price, "CoinPaprika price"), 1e-7, 500_000, "CoinPaprika price"),
    allTimeHigh: inRange(finite(usd.ath_price, "CoinPaprika ATH"), 1e-7, 500_000, "CoinPaprika ATH"),
    allTimeHighDate: isoDate(usd.ath_date, "CoinPaprika ATH date"),
    marketCap: inRange(finite(usd.market_cap, "CoinPaprika market cap"), 100_000, 10_000_000_000_000, "CoinPaprika market cap"),
  };
}

function coinbase(raw: unknown): number {
  const root = record(raw, "Coinbase response");
  const data = record(root.data, "Coinbase data");
  if (data.base !== "BTC" || data.currency !== "USD") throw new Error("Coinbase Bitcoin identity failed.");
  return inRange(finite(data.amount, "Coinbase price"), 1e-7, 500_000, "Coinbase price");
}

function blockchair(raw: unknown): BlockchairReading {
  const root = record(raw, "Blockchair response");
  const data = record(root.data, "Blockchair data");
  const blockTime = String(data.best_block_time).replace(" ", "T") + "Z";
  return {
    price: inRange(finite(data.market_price_usd, "Blockchair price"), 1e-7, 500_000, "Blockchair price"),
    marketCap: inRange(finite(data.market_cap_usd, "Blockchair market cap"), 100_000, 10_000_000_000_000, "Blockchair market cap"),
    circulatingSupply: inRange(finite(data.circulation, "Blockchair circulation") / 100_000_000, 1, 100_000_000_000_000, "Blockchair supply"),
    bestBlockTime: isoDate(blockTime, "Blockchair best block time"),
  };
}

function withinPercent(primary: number, comparison: number, tolerance: number, label: string): void {
  if (primary <= 0 || comparison <= 0) throw new RangeError(`${label} values must be positive.`);
  const spread = Math.abs(primary - comparison) / Math.max(primary, comparison);
  if (!Number.isFinite(spread) || spread > tolerance) throw new Error(`${label} provider spread failed.`);
}

function validateFreshness(reading: CoinGeckoReading, block: BlockchairReading, now: number): void {
  const updated = Date.parse(reading.lastUpdated);
  const blockTime = Date.parse(block.bestBlockTime);
  if (updated - now > MAX_FUTURE_MS || now - updated > MAX_AGE_MS) throw new Error("CoinGecko reading is stale or future dated.");
  if (blockTime - now > MAX_FUTURE_MS || blockTime < Date.UTC(2009, 0, 3)) throw new Error("Blockchair time is invalid.");
}

function validateAgreement(cg: CoinGeckoReading, cp: MarketReading, cb: number, bc: BlockchairReading): void {
  withinPercent(cg.price, cp.price, 0.02, "CoinGecko and CoinPaprika price");
  withinPercent(cg.price, cb, 0.02, "CoinGecko and Coinbase price");
  withinPercent(cg.price, bc.price, 0.02, "CoinGecko and Blockchair price");
  withinPercent(cg.allTimeHigh, cp.allTimeHigh, 0.02, "All-time high");
  withinPercent(cg.marketCap, cp.marketCap, 0.02, "CoinGecko and CoinPaprika market cap");
  withinPercent(cg.marketCap, bc.marketCap, 0.02, "CoinGecko and Blockchair market cap");
  withinPercent(cg.circulatingSupply, bc.circulatingSupply, 0.001, "Circulating supply");
  if (cg.allTimeHighDate.slice(0, 10) !== cp.allTimeHighDate.slice(0, 10)) throw new Error("ATH dates disagree.");
}

export async function getBitcoinSnapshot(): Promise<BitcoinSnapshot> {
  if (Object.keys(ENDPOINTS).length !== 4) throw new Error("Four snapshot providers are required.");
  if (MAX_ATTEMPTS < 2 || REQUEST_TIMEOUT_MS <= 0) throw new Error("Snapshot network bounds are invalid.");
  const fetchedAt = new Date();
  const responses = await Promise.all(Object.values(ENDPOINTS).map(requestJson));
  if (responses.length !== 4) throw new Error("All snapshot providers must respond.");
  const cg = coinGecko(responses[0]);
  const cp = coinPaprika(responses[1]);
  const cb = coinbase(responses[2]);
  const bc = blockchair(responses[3]);
  validateFreshness(cg, bc, fetchedAt.getTime());
  validateAgreement(cg, cp, cb, bc);
  const distance = (cg.price / cg.allTimeHigh - 1) * 100;
  const independentDistance = (cp.price / cp.allTimeHigh - 1) * 100;
  inRange(distance, -100, 0, "CoinGecko distance from ATH");
  if (Math.abs(distance - independentDistance) > 2) throw new Error("Independent ATH distance check failed.");
  return {
    fetchedAt: fetchedAt.toISOString(),
    lastUpdated: cg.lastUpdated,
    price: cg.price,
    allTimeHigh: cg.allTimeHigh,
    allTimeHighDate: cg.allTimeHighDate,
    marketCap: cg.marketCap,
    circulatingSupply: cg.circulatingSupply,
    distanceFromHighPercent: distance,
  };
}

export const BITCOIN_SNAPSHOT_ENDPOINTS = ENDPOINTS;
