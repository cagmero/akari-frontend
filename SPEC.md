# SPEC.md — Akari: Cross-Border Stablecoin Cash Pooling
**Version 3.0 — Final Architecture**

---

## Project Overview

**Akari** is a compliance-first, on-chain notional cash pooling system built on Solana. It enables multinational corporates to manage multi-currency treasury across jurisdictions using stablecoins — replacing slow, opaque interbank rails with instant, programmable, fully auditable settlement.

| Field | Value |
|---|---|
| **Hackathon** | StableHacks 2026 (DoraHacks) |
| **Track** | Cross-Border Stablecoin Treasury |
| **Chain** | Solana (Devnet demo, mainnet-ready architecture) |
| **Repo** | Public GitHub |

---

## Problem Statement

Multinational corporations managing treasury across jurisdictions face three compounding pains:

1. **Trapped liquidity** — cash sits idle in subsidiary accounts, unable to be deployed centrally without 1–3 day interbank settlement delays.
2. **FX cost and opacity** — cross-currency transfers incur 2–5% in correspondent banking fees with no real-time visibility into rates or execution.
3. **Compliance overhead** — each cross-border transfer requires manual KYC/AML checks, VASP reporting, and Travel Rule compliance, adding days of friction per transaction.

The structural gap: traditional institutions need "bridge players" combining banking-grade risk management with crypto-native execution speed. No such system exists natively on Solana with live institutional FX data.

---

## Solution Summary

Akari is a **permissioned stablecoin treasury pool** on Solana:

- Subsidiary wallets are KYC-gated via **Token-2022 Transfer Hook** — compliance fires at the token layer before any balance change, non-circumventable by any program
- All subsidiary balances aggregate into a single master vault — **notional pooling**, one vault, per-entity ledger entries
- FX netting powered by **live SIX Web API rates** (bid/ask/mid, 140+ instruments) via a redundant signed oracle relay, with Pyth on-chain fallback
- Epoch slippage tracking is **sharded per currency pair** — EUR_USD and CHF_USD epoch states are independent, enabling parallel swap execution
- **Merkle-proof KYC** — the transfer hook verifies inclusion proofs against a single root. The tree is strictly limited to 8 wallets (a 3-level tree) to ensure the `Vec<[u8; 32]>` proof array is maximum 3 items, fitting within the compute budget.
- Subsidiaries draw intraday liquidity instantly; per-wallet AML velocity controls enforced in-program
- Transfers ≥ $3,000 automatically create a `TravelRuleRecord` PDA with sender/receiver VASP metadata
- Idle pool balances are routed to **Steakhouse yield strategies** via **Kamino CPI integration** using the `klend` crate.
- Insufficient internal liquidity falls through to **Jupiter aggregator** for external FX execution using dynamic accounts via `remaining_accounts` and the `jupiter-cpi` crate.
- All accounts carry a **`version: u8` field** for zero-disruption lazy migration on upgrades
- **Oracle relay redundancy** — primary/standby instances with on-chain leader election via `OracleRelayLock` PDA
- Next.js treasury dashboard: live SIX bid/ask ticker, per-pair slippage gauges, yield positions, full audit trail

---

## Feature Set

### Core (Required)
- [ ] Token-2022 mint — TransferHook + PermanentDelegate + TransferFeeConfig
- [ ] Merkle-proof KYC registry + Transfer Hook verification
- [ ] Pool vault — notional balance tracking (USDC + EURC per subsidiary)
- [ ] SIX Web API oracle relay — polls bid/ask/mid, signs, submits on-chain
- [ ] `SixPriceFeed` PDA — bid, ask, mid, spread, published_at, submitted_at
- [ ] FX swap — SIX bid/ask pricing (ask for buys, bid for sells), Pyth fallback
- [ ] `EpochState` PDAs — one per currency pair, sharded slippage tracking
- [ ] Per-swap slippage assertion + epoch budget check (Steakhouse model)
- [ ] Travel Rule auto-attachment ≥ $3,000
- [ ] KYT event emission on every instruction
- [ ] AML daily velocity controls
- [ ] Versioned accounts (version: u8) on all structs
- [ ] Oracle relay redundancy — `OracleRelayLock` PDA, primary/standby

### Enhanced (Included)
- [ ] Jupiter CPI fallback when internal pool liquidity is insufficient for FX swap
- [ ] Steakhouse yield router stub — idle balance deployment to Marginfi/Kamino
- [ ] Fireblocks MPC custody interface (typed stub, not live API)
- [ ] Gold price display from SIX (`USDLBXAUAM`) on dashboard

### Out of Scope
- Confidential Transfers (ZKP) — roadmap item, not implemented
- Real Fireblocks API credentials
- Real KYC provider (Civic Pass) — Merkle tree admin-controlled for demo
- Mainnet deployment

---

## Technical Constraints

| Constraint | Detail |
|---|---|
| **Blockchain** | Solana Devnet (mainnet-ready) |
| **Smart contracts** | Anchor framework (Rust) |
| **Token standard** | SPL Token-2022 — TransferHook + PermanentDelegate + TransferFeeConfig |
| **Stablecoins** | USDC + EURC (Circle Devnet mints) |
| **FX oracle — primary** | SIX Web API (REST, mTLS with Account Certificate) — bid/ask/mid |
| **FX oracle — fallback** | Pyth Network on-chain price feeds |
| **KYC model** | Merkle-proof inclusion — strictly limited to 8 wallets (3-level tree) |
| **Slippage model** | Sharded EpochState per pair + per-swap assertion (Steakhouse) |
| **External liquidity** | Jupiter aggregator CPI via `jupiter-cpi` using `remaining_accounts` |
| **Yield** | Steakhouse router → Kamino CPI via `klend` crate |
| **Oracle redundancy** | OracleRelayLock PDA with 60s TTL — primary/standby relay |
| **Upgradeability** | version: u8 on all accounts, lazy migration pattern |
| **Custody** | Fireblocks SDK typed interface (MockFireblocksClient) |
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **Wallet** | Solana Wallet Adapter (Phantom / Backpack) |

---

## Mandatory Compliance Requirements

### KYC — Merkle-Proof at Token Layer
- Single `KycMerkleRoot` account stores the current Merkle root of all verified wallets
- Each token transfer passes a Merkle inclusion proof in the Transfer Hook accounts
- Hook verifies: `merkle_verify(proof, leaf=wallet_pubkey, root)` — rejects with `UnauthorizedRecipient` if invalid
- Identity data off-chain (GDPR-safe); only the root hash on-chain
- Admin updates root by calling `update_kyc_root(new_root, new_leaf_count)`
- Strictly limited to 8 wallets (3-level tree) ensuring the anchor execution succeeds within solana compute limits without failure.

### KYT — Structured On-Chain Event Logs
- Every instruction emits Anchor `#[event]` logs: sender, receiver, amount, currency, timestamp, oracle_source, travel_rule_flag
- `FxSwapEvent` includes: oracle_source (0=SIX, 1=Pyth), bid/ask spread used, per-pair epoch slippage remaining
- Dashboard subscribes to events for real-time audit trail

### AML — Velocity and Daily Limits
- `SubsidiaryAccount` tracks `daily_transfer_total` + `last_transfer_day`
- Each transfer: `daily_transfer_total + amount <= daily_limit` — rejects with `DailyLimitExceeded`
- Resets daily via Unix timestamp day-boundary check
- Source-of-funds hash stored at registration

### Travel Rule — Automatic PDA Creation
- Transfers ≥ `travel_rule_threshold` (default: 3,000,000,000 = $3,000 USDC at 6 decimals) require `TravelRuleRecord` PDA
- Stores: sender_vasp, receiver_vasp, beneficiary_name_hash, amount, currency, timestamp
- `TravelRuleEvent` emitted for off-chain VASP relay

---

## SIX BFI Integration

Assets confirmed:
| Asset | Usage |
|---|---|
| Web API Documentation (PDF) | Auth flow, endpoints, rate limits |
| Cross Currency & Commodities List (Excel) | Instrument codes: `USDEURSP`, `USDCHFSP`, `USDLBXAUAM` |
| Account Certificate | mTLS client certificate |

Instruments used:
- `USDEURSP` — EUR/USD spot (bid/ask/mid)
- `USDCHFSP` — CHF/USD spot (bid/ask/mid)
- `USDLBXAUAM` — LBMA Gold AM fix (display only on dashboard)

FX pricing model:
- USDC → EURC swap uses SIX **ask** price (buying EUR, institutional convention)
- EURC → USDC swap uses SIX **bid** price (selling EUR)
- Spread stored on-chain; visible in dashboard and `FxSwapEvent`

---

## Slippage Controls (Steakhouse Financial Pattern — Sharded)

Each currency pair has its own `EpochState` PDA. EUR_USD swaps only write to `epoch_state_eur_usd`; CHF_USD swaps only write to `epoch_state_chf_usd`. Parallel swaps across pairs never contend.

**Per-swap check (inside fx_swap):**
```
received >= expected * (10_000 - max_slippage_bps) / 10_000
→ Default: 50 bps (0.5%)
→ Rejects: SlippageExceeded
```

**Epoch budget check (per EpochState):**
```
epoch_accumulated_slippage + this_slippage
  <= max_epoch_slippage_bps * vault_nav_usdc / 10_000
→ Default: 100 bps (1%) per pair per epoch
→ Rejects: EpochSlippageBudgetExhausted
→ Auto-resets: when clock - epoch_start >= epoch_duration
```

---

## Token-2022 Extensions

| Extension | Purpose |
|---|---|
| `TransferHook` | Merkle-proof KYC at token layer — non-circumventable |
| `PermanentDelegate` | FINMA-aligned regulatory seizure capability |
| `TransferFeeConfig` | 0.05% protocol fee → treasury sustainability + yield compounding |

---

## Partner Alignment

| Partner | Direct relevance |
|---|---|
| **AMINA Bank** | KYC-embedded DeFi (Transfer Hook + Merkle); PermanentDelegate for FINMA; Swiss regulatory design |
| **Solana Foundation** | Token-2022 showcase; sharded parallel execution; high-throughput treasury |
| **Solstice Labs** | Yield router integration (Steakhouse → Marginfi/Kamino); notional pooling thesis |
| **SIX BFI** | Live bid/ask/mid from Web API is primary oracle; gold price display; spread on-chain |
| **Fireblocks** | Typed custody interface; relay fee design mirrors Gasless Transactions |
| **Steakhouse Financial** | Dual-layer slippage model + sharding + yield router integration |
| **Softstack** | Token-2022 + Merkle KYC + sharded epoch + Jupiter CPI = deep audit surface |
| **UBS** | TradFi treasury workflow; bid/ask pricing; deterministic settlement language |

---

## Judging Criteria Alignment

| Criterion | Evidence |
|---|---|
| Team Execution & Technical Readiness | Devnet demo; 3 subsidiaries; live SIX swap; Travel Rule PDAs; yield stub |
| Institutional Fit & Compliance Awareness | Merkle KYC at token layer; PermanentDelegate; Travel Rule; AML velocity; FINMA language |
| Stablecoin Infrastructure Innovativeness | Notional pooling + Merkle KYC + sharded slippage + bid/ask pricing + Jupiter fallback — novel combination |
| Scalability & Adoption Potential | Sharded epoch state; Merkle KYC for millions of wallets; Jupiter external liquidity; versioned accounts |
| Submission Clarity & Completeness | Loom video; public GitHub; Devnet link; all docs present |

---

## History

### Version 3.1
- **Name Change**: Renamed project from Clearflow to Akari.
- **Merkle Compute Fix (Shallow Tree)**: Enforced a strict limit of exactly 8 wallets (maximum 3-level tree) on the KYC registry to guarantee the proof array is only 3 items long and never fails mid-swap due to compute bounds.
- **Kamino CPI Integration**: Transitioned yield router from a stub to a real CPI calling Kamino's deposit function using the `klend` crate, with the Next.js app fetching market accounts via `@kamino-finance/klend-sdk`.
- **Jupiter Aggregator CPI**: Integrated `jupiter-cpi` to replace the stub fallback, utilizing dynamic `remaining_accounts` in the `fx_swap` instruction and fetching routing quotes from the Jupiter API in the frontend.
