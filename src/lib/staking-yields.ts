import "server-only";

import { request } from "node:https";

export interface YieldRow {
  readonly pool: string;
  readonly chain: string;
  readonly project: string;
  readonly symbol: string;
  readonly tvlUsd: number;
  readonly apy: number;
  readonly apyBase: number | null;
  readonly apyReward: number | null;
  readonly apyMean30d: number | null;
  readonly stablecoin: boolean;
  readonly exposure: string;
  readonly ilRisk: string;
}

export interface YieldSnapshot {
  readonly fetchedAt: string;
  readonly totalPools: number;
  readonly keptPools: number;
  readonly rows: readonly YieldRow[];
}

export const YIELD_ENDPOINT = "https://yields.llama.fi/pools";

const REQUEST_TIMEOUT_MS = 45_000;
const MAX_RESPONSE_BYTES = 48_000_000;
const MAX_ATTEMPTS = 3;
const MAX_APY = 1_000;
const MIN_TVL_USD = 2_000_000;
const MAX_KEPT = 4_000;

function optionalFinite(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) return null;
  return number;
}

function shortText(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= limit ? value : null;
}

function requestOnce(url: string): Promise<unknown> {
  if (!url.startsWith("https://")) return Promise.reject(new Error("Yield endpoint must use HTTPS."));
  return new Promise((resolve, reject) => {
    const req = request(url, { headers: { accept: "application/json", "user-agent": "EarlyThunderBuild/1.0" } }, (res) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      const status = res.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        res.resume();
        reject(new Error(`Yield endpoint returned HTTP ${status}.`));
        return;
      }
      res.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) res.destroy(new Error("Yield response exceeded byte limit."));
        else chunks.push(chunk);
      });
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        if (body.length === 0) { reject(new Error("Empty yield response.")); return; }
        try { resolve(JSON.parse(body) as unknown); }
        catch (error) { reject(new Error(`Invalid yield JSON: ${error instanceof Error ? error.message : "unknown"}`)); }
      });
      res.on("error", reject);
    });
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error("Yield request timed out.")));
    req.on("error", reject);
    req.end();
  });
}

async function requestJson(url: string): Promise<unknown> {
  let lastError = new Error("Yield request failed.");
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try { return await requestOnce(url); }
    catch (error) {
      lastError = error instanceof Error ? error : lastError;
      if (attempt + 1 < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
    }
  }
  throw lastError;
}

function toRow(raw: unknown): YieldRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const pool = shortText(row.pool, 80);
  const chain = shortText(row.chain, 60);
  const project = shortText(row.project, 80);
  const symbol = shortText(row.symbol, 80);
  const tvl = optionalFinite(row.tvlUsd);
  const apy = optionalFinite(row.apy);
  if (!pool || !chain || !project || !symbol) return null;
  if (tvl === null || apy === null) return null;
  if (tvl < MIN_TVL_USD || apy < 0 || apy > MAX_APY) return null;
  const exposure = shortText(row.exposure, 20) ?? "unknown";
  const ilRisk = shortText(row.ilRisk, 20) ?? "unknown";
  return {
    pool, chain, project, symbol,
    tvlUsd: tvl,
    apy,
    apyBase: optionalFinite(row.apyBase),
    apyReward: optionalFinite(row.apyReward),
    apyMean30d: optionalFinite(row.apyMean30d),
    stablecoin: row.stablecoin === true,
    exposure, ilRisk,
  };
}

let inFlight: Promise<YieldSnapshot> | null = null;

/** One 11 MB pool fetch per build process, shared by every page that reads it. */
export async function getYieldSnapshot(): Promise<YieldSnapshot> {
  if (inFlight === null) {
    inFlight = fetchYieldSnapshot();
    inFlight.catch(() => { inFlight = null; });
  }
  return inFlight;
}

async function fetchYieldSnapshot(): Promise<YieldSnapshot> {
  const fetchedAt = new Date();
  const raw = await requestJson(YIELD_ENDPOINT);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("Yield response must be an object.");
  const data = (raw as Record<string, unknown>).data;
  if (!Array.isArray(data)) throw new TypeError("Yield response is missing its data array.");
  if (data.length < 1_000) throw new RangeError("Yield response returned an implausible pool count.");
  const rows: YieldRow[] = [];
  for (const entry of data) {
    if (rows.length >= MAX_KEPT) break;
    const row = toRow(entry);
    if (row !== null) rows.push(row);
  }
  if (rows.length < 50) throw new Error("Too few yield pools survived validation.");
  rows.sort((left, right) => right.tvlUsd - left.tvlUsd);
  return { fetchedAt: fetchedAt.toISOString(), totalPools: data.length, keptPools: rows.length, rows };
}
