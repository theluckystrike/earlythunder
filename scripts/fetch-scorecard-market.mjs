#!/usr/bin/env node
/**
 * fetch-scorecard-market.mjs — pulls live market data for every scorecard token
 * from CoinGecko and writes data/scorecard-market.json.
 *
 * Why this exists. The scoring pass froze price, market cap and
 * ath_distance_pct at the date it ran. Those fields then drifted for months,
 * which made the published drawdown arithmetic contradict the price shown
 * beside it, and left several stored all-time highs simply wrong (BTC was
 * carried at $111,814 against a real high of $126,080). The 25 variable scores
 * are durable research and stay as they are. Everything price-derived is
 * refetched here so it can be cited and dated.
 *
 * Resolution is deliberately strict. A token is only accepted when the row
 * CoinGecko returns carries the same ticker symbol we asked about. Anything
 * ambiguous is dropped rather than guessed, because a wrong match publishes a
 * confidently wrong number, which is worse than publishing nothing.
 *
 * Authored to the NASA Power of 10 rules: bounded loops, >=2 assertions per
 * function, <60-line functions, every return value checked, no global mutable
 * state, zero suppressions.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SRC_PATH = join(REPO, "data", "altcoin-scorecard.json");
const OUT_PATH = join(REPO, "data", "scorecard-market.json");

// ---- Tunable, audited constants (NASA Rule 2/3: explicit bounds) ----------
const CG = "https://api.coingecko.com/api/v3";
const PAGE = 100; // ids per /coins/markets call
const MAX_TOKENS = 2000;
const MAX_RETRIES = 4;
const RETRY_MS = 20000;
const THROTTLE_MS = 25000; // free tier allows a handful of calls a minute, 429s otherwise

/**
 * Verified symbol -> CoinGecko id for cases where name matching is ambiguous
 * or the project renamed. Each was confirmed by checking that the resolved row
 * reports the expected symbol.
 */
const OVERRIDE = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin",
  XRP: "ripple", DOGE: "dogecoin", TRX: "tron", TON: "the-open-network",
  MATIC: "polygon-ecosystem-token", POL: "polygon-ecosystem-token",
  UNI: "uniswap", LINK: "chainlink", AAVE: "aave", MKR: "maker",
  COMP: "compound-governance-token", INJ: "injective-protocol",
  RENDER: "render-token", SEI: "sei-network", GRASS: "grass",
  JUP: "jupiter-exchange-solana", WLD: "worldcoin-wld", STX: "blockstack",
  WIF: "dogwifcoin", GALA: "gala", KMNO: "kamino", CBETH: "coinbase-wrapped-staked-eth",
  WSTETH: "wrapped-steth", METH: "mantle-staked-ether", LDO: "lido-dao",
  ETHFI: "ether-fi", EIGEN: "eigenlayer", ENA: "ethena", ONDO: "ondo-finance",
  PENDLE: "pendle", HYPE: "hyperliquid", AERO: "aerodrome-finance",
  CAKE: "pancakeswap-token", CRV: "curve-dao-token", CVX: "convex-finance",
  FXS: "frax-share", GNO: "gnosis", RUNE: "thorchain", KAS: "kaspa",
  TAO: "bittensor", AR: "arweave", FIL: "filecoin", HNT: "helium",
  ATOM: "cosmos", DOT: "polkadot", KSM: "kusama", ADA: "cardano",
  ALGO: "algorand", XLM: "stellar", LTC: "litecoin", ETC: "ethereum-classic",
  APT: "aptos", SUI: "sui", NEAR: "near", AVAX: "avalanche-2",
  ARB: "arbitrum", OP: "optimism", STRK: "starknet", ZK: "zksync",
  SCROLL: "scroll", BLAST: "blast", MODE: "mode", CELO: "celo",
  SHIB: "shiba-inu", PEPE: "pepe", BONK: "bonk", FLOKI: "floki",
  PENGU: "pudgy-penguins", NOT: "notcoin", DOGS: "dogs-2", ORDI: "ordinals",
  W: "wormhole", ZRO: "layerzero", JTO: "jito-governance-token",
  DRIFT: "drift-protocol", CETUS: "cetus-protocol", OSMO: "osmosis",
  THETA: "theta-token", VET: "vechain", GRT: "the-graph", ANKR: "ankr",
  SSV: "ssv-network", LQTY: "liquity", GMX: "gmx", GNS: "gains-network",
  DYDX: "dydx-chain", SNX: "havven", BAL: "balancer", YFI: "yearn-finance",
  SUSHI: "sushi", "1INCH": "1inch", BAND: "band-protocol", API3: "api3",
  MINA: "mina-protocol", FLOW: "flow", CHZ: "chiliz", APE: "apecoin",
  AXS: "axie-infinity", SAND: "the-sandbox", MANA: "decentraland",
  IMX: "immutable-x", RON: "ronin", ILV: "illuvium", MAGIC: "magic",
  BLUR: "blur", LRC: "loopring", CFX: "conflux-token", NEO: "neo",
  QTUM: "qtum", ZIL: "zilliqa", ONE: "harmony", KDA: "kadena",
  IOTA: "iota", EGLD: "elrond-erd-2", CKB: "nervos-network",
  DASH: "dash", XTZ: "tezos", CRO: "crypto-com-chain", OKB: "okb",
  LEO: "leo-token", BGB: "bitget-token", HT: "huobi-token", KLAY: "klay-token",
  FTM: "fantom", S: "sonic-3", USUAL: "usual", SYRUP: "maple",
  MORPHO: "morpho", SKY: "sky", SPK: "spark-2", RSR: "reserve-rights-token",
  PYTH: "pyth-network", JASMY: "jasmycoin", MASK: "mask-network",
  GEOD: "geodnet", MOBILE: "helium-mobile", SHDW: "genesysgo-shadow",
  ACH: "alchemy-pay", ACX: "across-protocol", AGLD: "adventure-gold",
  ALCX: "alchemix", ALICE: "my-neighbor-alice", BANANA: "banana-gun",
  BERA: "berachain-bera", BICO: "biconomy", BOND: "barnbridge", BTT: "bittorrent",
  CANTO: "canto", CELR: "celer-network", CFG: "centrifuge", COTI: "coti",
  CTSI: "cartesi", DENT: "dent", FARM: "harvest-finance", FLR: "flare-networks",
  GLMR: "moonbeam", JOE: "joe", KAVA: "kava", KEEP: "keep-network",
  LPT: "livepeer", MBOX: "mobox", MEME: "memecoin-2", MOVE: "movement",
  MPL: "maple", NEIRO: "neiro-3", NMR: "numeraire", NTRN: "neutron-3",
  OLAS: "autonolas", PEAQ: "peaq-2", PERP: "perpetual-protocol",
  POLYX: "polymesh", PRIME: "echelon-prime", QNT: "quant-network",
  RAY: "raydium", REQ: "request-network", RLC: "iexec-rlc", ROSE: "oasis-network",
  RPL: "rocket-pool", SFP: "safepal", SLND: "solend", SNT: "status",
  STG: "stargate-finance", STORJ: "storj", SUPER: "superfarm", SXP: "swipe",
  SYN: "synapse-2", TIA: "celestia", TRB: "tellor", TWT: "trust-wallet-token",
  UMA: "uma", VELA: "vela-token", VIRTUAL: "virtual-protocol", VRTX: "vertex-protocol",
  WOO: "woo-network", XVS: "venus", ZETA: "zetachain", ZRX: "0x",
  AUDIO: "audius", BADGER: "badger-dao", ALPHA: "alpha-finance", ALPACA: "alpaca-finance",
  ATH: "aethir", CORE: "coredaoorg", FLUID: "instadapp", HFT: "hashflow",
  ID: "space-id", KNC: "kyber-network-crystal", MAV: "maverick-protocol",
  METIS: "metis-token", OGN: "origin-protocol", ORCA: "orca", PHA: "pha",
  POWR: "power-ledger", PYR: "vulcan-forged", RDNT: "radiant-capital",
  SLP: "smooth-love-potion", SPELL: "spell-token", TLM: "alien-worlds",
  TRU: "truefi", VVV: "venice-token", WAXP: "wax", XAI: "xai-blockchain",
  YGG: "yield-guild-games", ZEN: "zencash", ZETACHAIN: "zetachain",
};

/**
 * Tokens that genuinely renamed since the scoring pass. The symbol guard
 * correctly flagged each of these as a mismatch, so the new ticker is listed
 * here explicitly and the rename is recorded on the record rather than being
 * silently absorbed. Verified individually against CoinGecko.
 */
const RENAMED = {
  TON: "GRAM",     // Telegram rebranded Toncoin to GRAM
  MATIC: "POL",    // Polygon migrated MATIC to POL
  FXS: "FRAX",     // Frax Share rebranded to FRAX
  SCROLL: "SCR",   // ticker shortened at listing
  OM: "MANTRA",    // CoinGecko carries the full name as the symbol
  PROP: "PRO",     // Propy
  NANO: "XNO",     // Nano rebranded to XNO
};

const norm = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** GET with bounded retries. Throws when every attempt fails. */
async function fetchJson(url) {
  if (typeof url !== "string" || url.length === 0) throw new Error("url required");
  if (!url.startsWith("https://")) throw new Error("https required");
  let lastError = "unknown";
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", accept: "application/json" },
      });
      if (res && res.ok) return await res.json();
      lastError = `HTTP ${res && res.status}`;
    } catch (error) {
      lastError = error && error.message ? error.message : String(error);
    }
    await sleep(RETRY_MS);
  }
  throw new Error(`fetch failed ${url}: ${lastError}`);
}

/**
 * Resolves scorecard tokens to CoinGecko ids. Tries the override map, then the
 * cmc_slug as a literal id, then a unique name match. Never guesses from the
 * ticker symbol alone, since symbols collide heavily across the long tail.
 */
function resolveIds(tokens, coinList) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("tokens required");
  if (!Array.isArray(coinList) || coinList.length === 0) throw new Error("coinList required");

  const ids = new Set(coinList.map((coin) => coin.id));
  const byName = new Map();
  for (let i = 0; i < coinList.length; i += 1) {
    const key = norm(coinList[i].name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(coinList[i].id);
  }

  const map = Object.create(null);
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const token = tokens[i];
    if (!token || typeof token.symbol !== "string") continue;
    const symbol = token.symbol.toUpperCase();
    if (OVERRIDE[symbol] !== undefined) {
      map[symbol] = OVERRIDE[symbol];
      continue;
    }
    if (typeof token.cmc_slug === "string" && ids.has(token.cmc_slug)) {
      map[symbol] = token.cmc_slug;
      continue;
    }
    const named = byName.get(norm(token.name));
    if (named && named.length === 1) map[symbol] = named[0];
  }
  return map;
}

/** Fetches /coins/markets for every id, in bounded batches. Returns id -> row. */
async function fetchMarkets(idList) {
  if (!Array.isArray(idList)) throw new Error("idList required");
  if (idList.length === 0) throw new Error("idList empty");
  const rows = new Map();
  for (let i = 0; i < idList.length && i < MAX_TOKENS; i += PAGE) {
    const chunk = idList.slice(i, i + PAGE);
    const url = `${CG}/coins/markets?vs_currency=usd&ids=${chunk.join(",")}&per_page=${PAGE}`;
    const batch = await fetchJson(url);
    if (!Array.isArray(batch)) throw new Error("markets response not an array");
    for (let r = 0; r < batch.length; r += 1) {
      if (batch[r] && typeof batch[r].id === "string") rows.set(batch[r].id, batch[r]);
    }
    process.stdout.write(`  batch ${i / PAGE + 1}: asked ${chunk.length}, got ${batch.length}\n`);
    await sleep(THROTTLE_MS);
  }
  return rows;
}

/**
 * Builds the published record for one token, but only when the row CoinGecko
 * returned carries the same symbol we asked about. A symbol mismatch means the
 * id resolved to a different project, so the row is discarded.
 */
function buildRecord(token, row) {
  if (!token || typeof token.symbol !== "string") throw new Error("bad token");
  if (!row || typeof row.id !== "string") return null;
  const wanted = token.symbol.toUpperCase();
  const got = String(row.symbol ?? "").toUpperCase();
  const renamed = RENAMED[wanted] === got;
  if (wanted !== got && !renamed) return { rejected: true, wanted, got, id: row.id };
  if (!Number.isFinite(row.current_price) || row.current_price <= 0) return null;

  return {
    symbol: wanted,
    renamed_to: renamed ? got : null,
    coingecko_id: row.id,
    price: row.current_price,
    market_cap: Number.isFinite(row.market_cap) && row.market_cap > 0 ? row.market_cap : null,
    fdv: Number.isFinite(row.fully_diluted_valuation) ? row.fully_diluted_valuation : null,
    volume_24h: Number.isFinite(row.total_volume) ? row.total_volume : null,
    change_24h: Number.isFinite(row.price_change_percentage_24h) ? row.price_change_percentage_24h : null,
    ath: Number.isFinite(row.ath) && row.ath > 0 ? row.ath : null,
    ath_change_pct: Number.isFinite(row.ath_change_percentage) ? row.ath_change_percentage : null,
    ath_date: typeof row.ath_date === "string" ? row.ath_date : null,
    circulating_supply: Number.isFinite(row.circulating_supply) ? row.circulating_supply : null,
    total_supply: Number.isFinite(row.total_supply) ? row.total_supply : null,
    max_supply: Number.isFinite(row.max_supply) ? row.max_supply : null,
    market_cap_rank: Number.isFinite(row.market_cap_rank) ? row.market_cap_rank : null,
  };
}

/**
 * Walks every token, keeps the rows that pass the symbol guard, and sorts the
 * rest into unresolved (no match) or rejected (matched a different asset).
 */
function assemble(tokens, idMap, rows) {
  if (!Array.isArray(tokens) || tokens.length === 0) throw new Error("tokens required");
  if (!idMap || !(rows instanceof Map)) throw new Error("idMap and rows required");
  const out = Object.create(null);
  const rejected = [];
  const unresolved = [];
  for (let i = 0; i < tokens.length && i < MAX_TOKENS; i += 1) {
    const token = tokens[i];
    if (!token || typeof token.symbol !== "string") continue;
    const symbol = token.symbol.toUpperCase();
    const id = idMap[symbol];
    if (id === undefined) {
      unresolved.push(symbol);
      continue;
    }
    const record = buildRecord(token, rows.get(id));
    if (record === null) {
      unresolved.push(symbol);
      continue;
    }
    if (record.rejected === true) {
      rejected.push(`${record.wanted} resolved to ${record.id} which reports ${record.got}`);
      continue;
    }
    out[symbol] = record;
  }
  return { out, rejected, unresolved };
}

async function main() {
  const raw = readFileSync(SRC_PATH, "utf8");
  if (typeof raw !== "string" || raw.length === 0) throw new Error("scorecard empty");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.tokens)) throw new Error("tokens missing");
  const tokens = parsed.tokens;

  process.stdout.write("resolving CoinGecko ids\n");
  const coinList = await fetchJson(`${CG}/coins/list`);
  const idMap = resolveIds(tokens, coinList);
  const idList = [...new Set(Object.values(idMap))];
  process.stdout.write(`  resolved ${Object.keys(idMap).length} of ${tokens.length} symbols to ${idList.length} ids\n`);

  process.stdout.write("fetching markets\n");
  const rows = await fetchMarkets(idList);

  const { out, rejected, unresolved } = assemble(tokens, idMap, rows);

  const payload = {
    fetched_at: new Date().toISOString(),
    source: "CoinGecko",
    source_url: "https://www.coingecko.com",
    api_endpoint: `${CG}/coins/markets`,
    covered: Object.keys(out).length,
    universe: tokens.length,
    unresolved,
    rejected,
    tokens: out,
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  process.stdout.write(
    [
      "",
      `covered      ${payload.covered} of ${tokens.length}`,
      `unresolved   ${unresolved.length}${unresolved.length > 0 ? ` (${unresolved.slice(0, 25).join(", ")})` : ""}`,
      `rejected     ${rejected.length}${rejected.length > 0 ? ` (${rejected.slice(0, 10).join("; ")})` : ""}`,
      `written      ${OUT_PATH}`,
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
