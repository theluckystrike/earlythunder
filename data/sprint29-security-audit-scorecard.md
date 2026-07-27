# EarlyThunder Sprint 29 - Agent A28: Smart Contract Security Audit Scorecard
## Date: 2026-06-01

---

## CRITICAL ALERT: FLUID KEY COMPROMISE (May 27-31, 2026)

### What Happened
On May 27, 2026, Fluid Protocol suffered a **key compromise** on its off-chain Merkle rewards distribution infrastructure. The incident was publicly disclosed on May 31 after being surfaced by on-chain researcher YAM.

### Exact Details
- **What was compromised:** Off-chain Merkle reward distribution keys (proposer + approver roles)
- **How much was lost:** 125,000 FLUID + 51,900 GHO (~$180K-250K estimated)
- **Attack vector:** Fraudulent empty-proof Merkle claims using compromised keys — NOT a smart contract vulnerability
- **Fund routing:** Stolen assets swapped, bridged from Base/Arbitrum, deposited into Tornado Cash
- **Resolution:** Admin batched transaction rotated out old proposer/approver roles. Merkle claiming paused for up to 1 week. Rewards accumulate retroactively.
- **Core protocol status:** Unaffected. All smart contracts safe.
- **User funds at risk:** NO — the impacted contract was solely for rewards distribution with minimal balance.

### Assessment for Portfolio
This is an **operational security failure**, not a smart contract vulnerability. The core lending/borrowing protocol remains uncompromised. While concerning (it reveals weak key management practices), it does NOT disqualify FLUID as a portfolio holding. The dollar amount was relatively small and no user deposits were at risk. **Downgrade from B to C rating** due to demonstrated opsec weakness.

---

## SECURITY SCORECARD

### Rating Scale
- **A (Fortress):** 10+ audits, $1M+ bug bounty, zero exploits, formal verification
- **B (Well-Audited):** 5+ audits, active bug bounty, minor/no exploits
- **C (Adequate):** 3+ audits, bug bounty exists, some incidents but managed
- **D (Concerning):** Limited audits, no/small bug bounty, significant exploits
- **F (Avoid):** Unaudited, major unresolved exploits, user funds lost

---

## 1. BTC (Bitcoin)
| Category | Details |
|---|---|
| **Audit History** | Bitcoin Core undergoes continuous peer review by thousands of developers globally. No formal "audit" in the traditional sense — the codebase IS the most reviewed software in crypto history. |
| **Number of Audits** | N/A — continuous open-source peer review since 2009 |
| **Last Audit Date** | Ongoing (every commit reviewed) |
| **Known Vulnerabilities** | Lightning Network: replacement cycling attacks (CVE-2023-40231 through 40234), channel jamming (theoretical). All patched. Base layer: no known unpatched vulnerabilities. |
| **Bug Bounty** | No formal centralized bounty. HackerOne programs for specific implementations. |
| **Exploit History** | Base layer: zero exploits in 17 years. Lightning: theoretical vulnerabilities identified, none exploited in production. |
| **Security Rating** | **A (Fortress)** |

---

## 2. ETH (Ethereum)
| Category | Details |
|---|---|
| **Audit History** | Ethereum Foundation runs continuous audits. Major upgrades (Merge, Shanghai, Dencun) each undergo multi-firm review. Ethereum Protocol Attackathon on Immunefi. |
| **Number of Audits** | 20+ formal audits across protocol upgrades |
| **Last Audit Date** | Ongoing — Pectra upgrade audits 2025-2026 |
| **Known Vulnerabilities** | None unpatched at protocol level |
| **Bug Bounty** | Ethereum Foundation: up to $250K. Immunefi Attackathon: $1.5M+ pool |
| **Exploit History** | The DAO hack (2016, $60M, led to ETH/ETC fork). No protocol-level exploits since. |
| **Security Rating** | **A (Fortress)** |

---

## 3. HYPE (Hyperliquid)
| Category | Details |
|---|---|
| **Audit History** | Bridge contracts audited by Zellic (2-day audit). Core L1 and DEX software: NO comprehensive audit. |
| **Number of Audits** | 1 (bridge only, limited scope) |
| **Last Audit Date** | 2024 (Zellic bridge audit) |
| **Known Vulnerabilities** | Market manipulation via self-liquidation, limited decentralization (validators consensus in 2 minutes for emergency delisting) |
| **Bug Bounty** | Self-hosted: up to $1M USDC (critical). HyperEVM: up to $1M. Not on Immunefi directly. |
| **Exploit History** | **March 2025:** JELLY attack — $12M unrealized loss, attacker withdrew $6.26M. Resolved by emergency delisting at arbitrary price. **November 2025:** POPCAT manipulation — $4.9M bad debt absorbed by HLP vault. **2024:** $4M loss from leverage exploit. **Total: ~$15M+ in incidents.** |
| **Security Rating** | **D (Concerning)** — Multiple exploits, limited audit coverage, centralization risks exposed |

---

## 4. ETHFI (EtherFi)
| Category | Details |
|---|---|
| **Audit History** | Audited by Certik, Certora, Nethermind. Formal verification by Certora. |
| **Number of Audits** | 3+ |
| **Last Audit Date** | 2024-2025 |
| **Known Vulnerabilities** | None publicly disclosed |
| **Bug Bounty** | Immunefi: active, Immunefi Standard Badge achieved. Max payout not publicly specified in search results. |
| **Exploit History** | **Zero smart contract exploits.** Domain takeover attempt (Sep 2024) — successfully thwarted, no funds lost. Discord hack attempt — contained. |
| **Security Rating** | **B (Well-Audited)** |

---

## 5. KMNO (Kamino Finance)
| Category | Details |
|---|---|
| **Audit History** | Trail of Bits, Kudelski Security, Certora, OtterSec (Osec). Formal verification completed. |
| **Number of Audits** | 18+ |
| **Last Audit Date** | 2025 (ongoing with V2 development) |
| **Known Vulnerabilities** | None publicly disclosed |
| **Bug Bounty** | Immunefi: up to $1.5M (Solana's largest). Critical: $150K-$1.5M. High: $100K. |
| **Exploit History** | **Zero exploits or bad debt since 2022 launch.** |
| **Security Rating** | **A (Fortress)** — 18 audits, zero incidents, massive bug bounty |

---

## 6. FLUID (Instadapp Fluid)
| Category | Details |
|---|---|
| **Audit History** | MixBytes, StateMind, Cantina (competition). Multiple components audited separately. |
| **Number of Audits** | 5+ (MixBytes x2+, StateMind x3+, Cantina competition) |
| **Last Audit Date** | March 2026 (MixBytes Money Market Oracle + StateMind PR validation) |
| **Known Vulnerabilities** | Off-chain key management weakness demonstrated by May 2026 incident. Core smart contracts: no critical/high findings in Cantina competition. |
| **Bug Bounty** | Immunefi IOP (Invite-Only Program): $80K pool. Instadapp legacy bounty also on Immunefi. Relatively small compared to peers. |
| **Exploit History** | **May 27, 2026: Key compromise — 125K FLUID + 51.9K GHO stolen (~$180-250K). Off-chain infrastructure, NOT smart contract.** Funds routed to Tornado Cash. |
| **Security Rating** | **C (Adequate)** — Recent opsec failure, small bug bounty relative to TVL, but core contracts sound |

---

## 7. LINK (Chainlink)
| Category | Details |
|---|---|
| **Audit History** | Multiple Code4rena competitions ($700K+ total prizes, 500+ researchers). Audited by leading firms. |
| **Number of Audits** | 5+ crowdsourced audits + multiple private audits |
| **Last Audit Date** | 2024-2025 (CCIP audits ongoing) |
| **Known Vulnerabilities** | VRF v2 reroll vulnerability (2022) — patched, $300K bounty paid |
| **Bug Bounty** | HackerOne + Immunefi: up to $3M for critical bugs. $500K+ paid across 75+ reports. |
| **Exploit History** | **Zero protocol exploits.** One VRF vulnerability found by white hats, responsibly disclosed. Chainlink oracles used in attacks on OTHER protocols but Chainlink itself uncompromised. |
| **Security Rating** | **A (Fortress)** |

---

## 8. SYRUP (Maple Finance)
| Category | Details |
|---|---|
| **Audit History** | Spearbit/Cantina, Three Sigma, 0xMacro, Sherlock. Code4rena competition (2021). |
| **Number of Audits** | 7+ across V1, V2, and Syrup components |
| **Last Audit Date** | November 2025 (Spearbit + Sherlock for Withdrawal Manager upgrade) |
| **Known Vulnerabilities** | Credit/default risk (operational, not smart contract) |
| **Bug Bounty** | Immunefi: up to $500K (critical). Minimum $50K for critical. KYC required. |
| **Exploit History** | **Zero smart contract exploits.** $36M Orthogonal Trading default (2022) — borrower default, not a hack. Led to V2 protocol improvements. |
| **Security Rating** | **B (Well-Audited)** — Strong audit coverage, but credit risk model is the real vulnerability vector |

---

## 9. AAVE (Aave)
| Category | Details |
|---|---|
| **Audit History** | ChainSecurity, Trail of Bits, Blackthorn, Certora (formal verification), Pashov Audit Group, OxOR, Enigma Dark. Sherlock contest (900+ participants). |
| **Number of Audits** | 15+ across V1, V2, V3, V4 |
| **Last Audit Date** | 2025-2026 (V4 — 345 cumulative days of review, $1.5M budget) |
| **Known Vulnerabilities** | Cross-chain bridge integration weaknesses (exposed Feb 2026) |
| **Bug Bounty** | Immunefi: up to $1M. Critical: $50K-$1M. |
| **Exploit History** | **February 2026: $290M exploit via flash loan + bridge + governance manipulation.** April 2023: $10M flash loan exploit. Also impacted by KelpDAO $292M exploit (Apr 2026, up to $230M exposure). |
| **Security Rating** | **B (Well-Audited)** — Industry-leading audit program, but Feb 2026 exploit is a significant mark despite fortress-level review |

---

## 10. UNI (Uniswap)
| Category | Details |
|---|---|
| **Audit History** | OpenZeppelin, Spearbit, Certora, Trail of Bits, ABDK, Pashov Audit Group. V4: 9 independent audits. |
| **Number of Audits** | 15+ across V1-V4 |
| **Last Audit Date** | 2024-2025 (V4 launch audits) |
| **Known Vulnerabilities** | V4 hooks introduce new attack surface (third-party risk) |
| **Bug Bounty** | $15.5M for V4 (largest in DeFi history). V3: up to $500K. Cantina ongoing. |
| **Exploit History** | **April 2020:** ERC777 reentrancy on V1 — limited ETH lost from imBTC pool. **V2 and V3: ZERO hacks across $2.75T+ in volume.** Phishing attacks (2022, $8M) were user-side, not protocol exploits. |
| **Security Rating** | **A (Fortress)** — $15.5M bounty, 9 audits on V4, $2.75T processed with zero V2/V3 hacks |

---

## 11. MKR (MakerDAO / Sky)
| Category | Details |
|---|---|
| **Audit History** | Trail of Bits, PeckShield, Runtime Verification, ChainSecurity, OpenZeppelin. Sky rebrand: ChainSecurity audit. |
| **Number of Audits** | 10+ across MCD, DSS modules, Sky migration |
| **Last Audit Date** | 2025 (Sky smart contracts by ChainSecurity) |
| **Known Vulnerabilities** | Historical DSChief governance vulnerability (found by OpenZeppelin, patched). |
| **Bug Bounty** | Immunefi: up to $10M (one of the highest in DeFi). Critical: 10% of funds affected, capped at $10M. |
| **Exploit History** | **Zero exploits.** Critical governance vulnerability found by OpenZeppelin was patched before exploitation. Black Thursday (March 2020) was a market/auction design issue, not a hack. |
| **Security Rating** | **A (Fortress)** — $10M bounty, 10+ audits, zero exploits in 7+ years |

---

## 12. AERO (Aerodrome)
| Category | Details |
|---|---|
| **Audit History** | Spearbit, ChainSecurity, Code4rena. Inherits Velodrome V2 audit coverage. |
| **Number of Audits** | 4+ (including inherited Velodrome audits) |
| **Last Audit Date** | May 2026 (MEV-resistant pool migration audit) |
| **Known Vulnerabilities** | DNS/domain registrar vulnerabilities (Web2 attack surface) |
| **Bug Bounty** | No Immunefi program found. Velodrome legacy bounty may apply. |
| **Exploit History** | **Smart contracts: ZERO exploits.** DNS hijack Nov 2025: $700K-$1M user losses (phishing, not contract exploit). DNS hijack 2023: ~$100-300K user losses. Both were domain registrar compromises (NameSilo/Porkbun), not smart contract failures. |
| **Security Rating** | **B (Well-Audited)** — Immutable contracts are sound, but repeated DNS attacks and no visible bug bounty are concerns |

---

## 13. MORPHO (Morpho)
| Category | Details |
|---|---|
| **Audit History** | Trail of Bits, Spearbit, OpenZeppelin, ChainSecurity, Pessimistic, Omniscia. Formal verification by Certora. |
| **Number of Audits** | 12+ |
| **Last Audit Date** | 2025 (ongoing with Morpho Blue extensions) |
| **Known Vulnerabilities** | Oracle misconfiguration risk (permissionless market creation means anyone can deploy with bad parameters) |
| **Bug Bounty** | Immunefi: up to $2.5M (critical, Morpho Blue). MetaMorpho: up to $1.5M. Minimum $250K for critical. Hats Finance: $100K pre-deployment bounty. |
| **Exploit History** | **Oct 2024:** $230K oracle misconfiguration exploit (PAXG/USDC market). **Apr 2025:** $2.6M vulnerability — intercepted by white hat MEV bot "c0ffeebabe.eth", funds returned. **Indirect:** Bad debt from Resolv Labs USR collapse (Mar 2026) and KelpDAO rsETH exploit (Apr 2026). |
| **Security Rating** | **B+ (Well-Audited)** — 12 audits + formal verification is excellent, but permissionless design introduces oracle/configuration risk |

---

## SUMMARY RANKINGS

| Rank | Token | Rating | Audits | Bug Bounty Max | Exploits | Key Risk |
|------|-------|--------|--------|---------------|----------|----------|
| 1 | BTC | **A** | Continuous | N/A | 0 | Lightning edge cases |
| 2 | UNI | **A** | 15+ | $15.5M | 1 minor (V1, 2020) | V4 hooks surface |
| 3 | MKR | **A** | 10+ | $10M | 0 | Governance complexity |
| 4 | LINK | **A** | 5+ | $3M | 0 | Oracle dependency risk |
| 5 | KMNO | **A** | 18+ | $1.5M | 0 | Solana ecosystem risk |
| 6 | ETH | **A** | 20+ | $250K+ | 1 (DAO, 2016) | Complexity growth |
| 7 | MORPHO | **B+** | 12+ | $2.5M | 1 minor ($230K) | Permissionless oracle risk |
| 8 | AAVE | **B** | 15+ | $1M | 2 ($300M total) | Bridge/cross-chain |
| 9 | SYRUP | **B** | 7+ | $500K | 0 (credit default) | Borrower default risk |
| 10 | ETHFI | **B** | 3+ | Active | 0 | Domain attack surface |
| 11 | AERO | **B** | 4+ | Unknown | 0 (DNS: $1M+) | DNS/Web2 attack surface |
| 12 | FLUID | **C** | 5+ | $80K (IOP) | 1 ($180-250K) | Weak opsec, small bounty |
| 13 | HYPE | **D** | 1 (bridge) | $1M | 3 ($15M+) | Unaudited core, centralization |

---

## KEY FINDINGS

### Red Flags
1. **HYPE (D):** Three exploits totaling $15M+, only bridge audited, core L1/DEX unaudited. Emergency delisting of JELLY revealed centralization. North Korean (Lazarus Group) interest flagged. Most concerning security profile in portfolio.
2. **FLUID (C):** May 27 key compromise confirmed. While only opsec (not smart contract), the $80K bug bounty is woefully small for a protocol with billions in TVL. Needs significant bounty increase.
3. **AAVE (B):** Despite industry-leading 345-day audit program for V4, suffered $290M exploit in Feb 2026 via bridge/governance attack vector. Proves that even fortress-level auditing cannot prevent all exploits.

### Fortresses (A-rated)
- **BTC:** 17 years, zero base-layer exploits
- **UNI:** $2.75T processed, zero V2/V3 hacks, $15.5M bounty
- **MKR:** $10M bounty, zero exploits in 7+ years
- **LINK:** $3M bounty, zero protocol exploits, 500+ researcher competitions
- **KMNO:** 18 audits, zero incidents since 2022, Solana's largest bounty

### FLUID Verdict
**NOT disqualified** as a golden pick. The May 27 incident was:
- Off-chain infrastructure, not smart contract
- $180-250K loss (small relative to TVL)
- Zero user deposit risk
- Keys rotated, rewards system being rebuilt

However, FLUID should be **monitored closely** and would benefit from:
- Increasing bug bounty from $80K to $500K+
- Independent opsec audit of key management
- Moving to multi-sig or MPC for all privileged operations
