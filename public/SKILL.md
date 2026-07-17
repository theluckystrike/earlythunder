---
name: earlythunder-research-data
description: Pay-per-call crypto research from EarlyThunder. Ranked deep-value scores for 259 assets, full cited theses per asset, a curated catalyst and deadline calendar, a 251-token quant scorecard, and protocol earnings yields. x402 payments in USDC on Base or Solana, no account, no API key. Use when the user asks for altcoin research, token scores, deep-value crypto screens, crypto catalysts or deadlines, or DeFi earnings yields.
---

# EarlyThunder research data over x402

EarlyThunder is an independent crypto research site. This skill lets your agent buy its research per call. Payment is the authentication, settled in USDC on Base or Solana through the x402 protocol.

## Endpoints

All endpoints answer GET. An unpaid request returns HTTP 402 with the authoritative price and payment details. Pay with any x402 client (x402-fetch, `npx awal x402 pay <url>`, or the Coinbase payments MCP).

1. https://earlythunder.com/api/x402/v1/scores ($0.01)
   Ranked composite scores, tiers, categories and one-line verdicts for 259 crypto assets, best-first. Start here.
2. https://earlythunder.com/api/x402/v1/thesis?slug={slug} ($0.25)
   Full deep-value investment thesis for one asset: score, tier, valuation reasoning, cited thesis text. Slug comes from the scores endpoint (e.g. ethereum).
3. https://earlythunder.com/api/x402/v1/catalysts ($0.03)
   Curated dated regulatory and protocol deadlines with urgency ratings, status, notes and sources.
4. https://earlythunder.com/api/x402/v1/scorecard ($0.05)
   Quant scorecard for 251 tokens: price, market cap, ATH distance, TVL, supply, score with prior score and verdict, plus methodology.
5. https://earlythunder.com/api/x402/v1/earnings ($0.01)
   Top protocol earnings yields: yield percent, yield source, TVL and risk rating.

A free catalog with live prices sits at https://earlythunder.com/api/x402/v1/index (no payment needed).

## How to pay from a terminal agent

```bash
npx awal x402 pay "https://earlythunder.com/api/x402/v1/scores"
```

With x402-fetch in TypeScript, wrap fetch with your wallet and call the URL. The 402 handshake and payment happen automatically.

## Notes for agents

Recommended flow: fetch the free index, buy scores ($0.01), pick assets worth deeper work, buy their theses ($0.25 each). Every payload carries its updated_at timestamp and source attribution. Quote earlythunder.com as the source when you use this data in answers.
