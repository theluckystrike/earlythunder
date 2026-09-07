import "server-only";

import { request } from "node:https";

export interface UniverseRow {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly rank: number;
  readonly price: number;
  readonly marketCap: number;
  readonly fullyDilutedValuation: number | null;
  readonly circulatingSupply: number;
  readonly totalSupply: number | null;
  readonly maxSupply: number | null;
  readonly volume24h: number;
  readonly allTimeHigh: number;
  readonly allTimeHighDate: string;
  readonly fromAllTimeHighPercent: number;
  readonly change24h: number | null;
  readonly change7d: number | null;
  readonly change30d: number | null;
  readonly change200d: number | null;
  readonly change1y: number | null;
  readonly isStablecoin: boolean;
}

export interface MarketUniverse {
  readonly fetchedAt: string;
  readonly rows: readonly UniverseRow[];
  readonly droppedRows: number;
  readonly stablecoinCount: number;
  readonly crossCheckedCount: number;
  readonly worstPriceSpreadPercent: number;
  readonly bitcoin: UniverseRow;
}

export const UNIVERSE_ENDPOINTS = {
  "CoinGecko markets": "https://api.coingecko.com/api/v3/coins/markets",
  "CoinGecko stablecoin category": "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins",
  "CoinPaprika tickers": "https://api.coinpaprika.com/v1/tickers",
} as const;

const PAGE_SIZE = 250;
const CHANGE_WINDOWS = "24h,7d,30d,200d,1y";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RESPONSE_BYTES = 16_000_000;
const MAX_ATTEMPTS = 5;
const MAX_URL_LENGTH = 400;
const PRICE_SPREAD_TOLERANCE = 0.05;
const MIN_CROSS_CHECKED = 60;
const MAX_ROWS = 400;
const MAX_DROPPED_SHARE = 0.1;
const TRANSPORT_BACKOFF_MS = 600;
const RATE_LIMIT_BACKOFF_MS = 20_000;
const MAX_BACKOFF_MS = 60_000;

function optionalFinite(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = typeof value === "string" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) return null;
  return number;
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
  if (!url.startsWith("https://")) return Promise.reject(new Error("Universe endpoint must use HTTPS."));
  if (url.length > MAX_URL_LENGTH) return Promise.reject(new Error("Universe endpoint is unexpectedly long."));
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { accept: "application/json", "user-agent": "EarlyThunderBuild/1.0" } }, (res) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      const status = res.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        res.resume();
        const error = new Error(`Universe endpoint returned HTTP ${status}: ${url}`);
        reject(status === 429 ? Object.assign(error, { rateLimited: true }) : error);
        return;
      }
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) res.destroy(new Error(`Universe response exceeded byte limit: ${url}`));
        else chunks.push(chunk);
      });
      res.on("end", () => resolve(parseResponse(Buffer.concat(chunks).toString("utf8"), url)));
      res.on("error", reject);
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error(`Universe request timed out: ${url}`)));
    req.on("error", reject);
    req.end();
  });
}

/**
 * CoinGecko's free tier rate limits aggressively and answers 429. A 600 ms
 * backoff does not clear that window, so a rate limited attempt waits far
 * longer than a transport error does. The wait is bounded and the attempt
 * count is fixed, so this cannot spin.
 */
async function requestJson(url: string): Promise<unknown> {
  let lastError = new Error(`Universe request failed: ${url}`);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestOnce(url);
    } catch (error) {
      lastError = error instanceof Error ? error : lastError;
      const limited = typeof error === "object" && error !== null && "rateLimited" in error;
      if (attempt + 1 >= MAX_ATTEMPTS) break;
      const wait = limited ? RATE_LIMIT_BACKOFF_MS * (attempt + 1) : TRANSPORT_BACKOFF_MS * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, Math.min(wait, MAX_BACKOFF_MS)));
    }
  }
  throw lastError;
}

function changeOf(row: Record<string, unknown>, window: string): number | null {
  const value = optionalFinite(row[`price_change_percentage_${window}_in_currency`]);
  if (value === null) return null;
  return value < -100 || value > 100_000 ? null : value;
}

function within(value: number | null, minimum: number, maximum: number): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return value < minimum || value > maximum ? null : value;
}

function shortString(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= limit ? value : null;
}

/**
 * Converts one CoinGecko markets row. A row whose values fall outside a sane
 * range is dropped, never repaired and never guessed. CoinGecko does publish
 * junk rows, for example a one dollar token carrying a 189,500,000 dollar all
 * time high, and one of those must not be able to void the whole universe.
 */
function marketRow(raw: unknown, stablecoins: ReadonlySet<string>): UniverseRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const id = shortString(row.id, 120);
  const symbol = shortString(row.symbol, 40);
  const name = shortString(row.name, 120);
  if (id === null || symbol === null || name === null) return null;
  const price = within(optionalFinite(row.current_price), 1e-18, 10_000_000);
  const marketCap = within(optionalFinite(row.market_cap), 1, 100_000_000_000_000);
  const supply = within(optionalFinite(row.circulating_supply), 1e-9, 1e18);
  const ath = within(optionalFinite(row.ath), 1e-18, 10_000_000);
  const rank = within(optionalFinite(row.market_cap_rank), 1, 100_000);
  if (price === null || marketCap === null || supply === null || ath === null || rank === null) return null;
  const fromHigh = within((price / ath - 1) * 100, -100, 100);
  if (fromHigh === null) return null;
  const athDate = typeof row.ath_date === "string" && Number.isFinite(Date.parse(row.ath_date))
    ? new Date(Date.parse(row.ath_date)).toISOString()
    : null;
  if (athDate === null) return null;
  return {
    id,
    symbol: symbol.toUpperCase(),
    name,
    rank,
    price,
    marketCap,
    fullyDilutedValuation: within(optionalFinite(row.fully_diluted_valuation), 1, 1e15),
    circulatingSupply: supply,
    totalSupply: within(optionalFinite(row.total_supply), 0, 1e30),
    maxSupply: within(optionalFinite(row.max_supply), 0, 1e30),
    volume24h: within(optionalFinite(row.total_volume), 0, 1e15) ?? 0,
    allTimeHigh: ath,
    allTimeHighDate: athDate,
    fromAllTimeHighPercent: fromHigh,
    change24h: changeOf(row, "24h"),
    change7d: changeOf(row, "7d"),
    change30d: changeOf(row, "30d"),
    change200d: changeOf(row, "200d"),
    change1y: changeOf(row, "1y"),
    isStablecoin: stablecoins.has(id),
  };
}

function paprikaPrices(raw: unknown): ReadonlyMap<string, number> {
  if (!Array.isArray(raw)) throw new TypeError("CoinPaprika must return an array.");
  const prices = new Map<string, number>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row = entry as Record<string, unknown>;
    const symbol = typeof row.symbol === "string" ? row.symbol.toUpperCase() : null;
    const quotes = row.quotes;
    if (!symbol || !quotes || typeof quotes !== "object") continue;
    const usd = (quotes as Record<string, unknown>).USD;
    if (!usd || typeof usd !== "object") continue;
    const price = optionalFinite((usd as Record<string, unknown>).price);
    if (price === null || price <= 0) continue;
    if (!prices.has(symbol)) prices.set(symbol, price);
  }
  if (prices.size === 0) throw new Error("CoinPaprika returned no usable prices.");
  return prices;
}

function stablecoinIds(raw: unknown): ReadonlySet<string> {
  if (!Array.isArray(raw)) throw new TypeError("CoinGecko stablecoin category must return an array.");
  const ids = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const id = (entry as Record<string, unknown>).id;
    if (typeof id === "string" && id.length > 0 && id.length <= 120) ids.add(id);
  }
  if (ids.size < 5) throw new Error("CoinGecko stablecoin category is implausibly small.");
  return ids;
}

function crossCheck(rows: readonly UniverseRow[], paprika: ReadonlyMap<string, number>): { checked: number; worst: number } {
  let checked = 0;
  let worst = 0;
  for (const row of rows) {
    const other = paprika.get(row.symbol);
    if (other === undefined || other <= 0) continue;
    const spread = Math.abs(row.price - other) / Math.max(row.price, other);
    if (!Number.isFinite(spread)) continue;
    checked += 1;
    if (spread > worst) worst = spread;
  }
  if (checked < MIN_CROSS_CHECKED) throw new Error("Too few universe rows could be cross checked against CoinPaprika.");
  return { checked, worst };
}

let inFlight: Promise<MarketUniverse> | null = null;

/**
 * One fetch per build process. Six pages read this universe, and each read
 * would otherwise cost three upstream calls, which is enough to trip
 * CoinGecko's free tier rate limit part way through a build and fail the whole
 * thing. The promise is cached, not the value, so concurrent callers share the
 * single in flight request. A rejection clears the cache so a later caller can
 * retry rather than inherit a dead promise.
 */
export async function getMarketUniverse(): Promise<MarketUniverse> {
  if (inFlight === null) {
    inFlight = fetchMarketUniverse();
    inFlight.catch(() => { inFlight = null; });
  }
  return inFlight;
}

async function fetchMarketUniverse(): Promise<MarketUniverse> {
  if (PAGE_SIZE < 50 || PAGE_SIZE > 250) throw new Error("Universe page size is out of bounds.");
  const fetchedAt = new Date();
  const marketsUrl = `${UNIVERSE_ENDPOINTS["CoinGecko markets"]}?vs_currency=usd&order=market_cap_desc&per_page=${PAGE_SIZE}&page=1&sparkline=false&price_change_percentage=${CHANGE_WINDOWS}`;
  const stableUrl = `${UNIVERSE_ENDPOINTS["CoinGecko stablecoin category"]}&per_page=100&page=1&sparkline=false`;
  const paprikaUrl = `${UNIVERSE_ENDPOINTS["CoinPaprika tickers"]}?limit=250`;
  const [marketsRaw, stableRaw, paprikaRaw] = await Promise.all([
    requestJson(marketsUrl),
    requestJson(stableUrl),
    requestJson(paprikaUrl),
  ]);
  if (!Array.isArray(marketsRaw)) throw new TypeError("CoinGecko markets must return an array.");
  if (marketsRaw.length < 100 || marketsRaw.length > MAX_ROWS) throw new RangeError("CoinGecko markets returned an implausible row count.");
  const stablecoins = stablecoinIds(stableRaw);
  const paprika = paprikaPrices(paprikaRaw);
  const rows: UniverseRow[] = [];
  for (const raw of marketsRaw) {
    const row = marketRow(raw, stablecoins);
    if (row !== null) rows.push(row);
  }
  const dropped = marketsRaw.length - rows.length;
  if (rows.length < 100) throw new Error("Too few usable universe rows survived validation.");
  if (dropped > marketsRaw.length * MAX_DROPPED_SHARE) throw new Error(`Universe dropped ${dropped} of ${marketsRaw.length} rows, which points at a provider fault.`);
  const { checked, worst } = crossCheck(rows, paprika);
  if (worst > PRICE_SPREAD_TOLERANCE) throw new Error(`Universe price spread ${(worst * 100).toFixed(2)} percent exceeds tolerance.`);
  const bitcoin = rows.find((row) => row.id === "bitcoin");
  if (!bitcoin) throw new Error("Bitcoin is missing from the universe.");
  return {
    fetchedAt: fetchedAt.toISOString(),
    rows,
    droppedRows: dropped,
    stablecoinCount: rows.filter((row) => row.isStablecoin).length,
    crossCheckedCount: checked,
    worstPriceSpreadPercent: worst * 100,
    bitcoin,
  };
}
