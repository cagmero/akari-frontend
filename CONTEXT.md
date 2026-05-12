# CONTEXT.md — Akari Memory Checkpoint
**Version 3.0 — Final Architecture, All 7 Enhancements**

> **Purpose:** Single source of truth for any developer or LLM agent picking up this project. Read completely before writing a single line of code. Every decision is settled. Do not re-debate, re-architect, or second-guess without strong new information.

---

## Current Status

**No code written. All planning complete.**

The architecture is finalized at v3.0 with all 7 enhancements fully integrated. The four planning documents are the only deliverables so far:
- `SPEC.md` — goals, compliance requirements, partner alignment, full feature set
- `ARCHITECTURE.md` — complete folder structure, all account structs with Rust code, all instructions, all data flows, all 7 enhancements with implementation detail
- `PLAN.md` — task checklist across 14 phases, no dates, ordered by dependency
- `CONTEXT.md` — this file

**Start with Phase 0 of PLAN.md.**

---

## The Idea in One Paragraph

Akari is a **notional stablecoin cash pooling system** on Solana for multinational corporate treasury. Subsidiaries deposit USDC/EURC into a single master vault. Their balance is tracked as a ledger entry — no per-subsidiary vaults. They swap currencies using live **SIX Web API bid/ask rates** (directional pricing — ask for buys, bid for sells). KYC compliance is enforced at the token layer via **Token-2022 Transfer Hook with Merkle proof** — no transfer can settle unless a valid Merkle inclusion proof for the destination wallet is provided, verified against a single on-chain root hash. Epoch slippage is tracked **per currency pair** in sharded `EpochState` PDAs — EUR_USD and CHF_USD swaps run in parallel with no contention. When internal pool liquidity is insufficient, the swap falls through to **Jupiter aggregator** via CPI. Idle balances route to **Steakhouse yield strategies**. The oracle relay runs in **primary/standby redundancy** using an on-chain `OracleRelayLock` PDA with 60-second TTL. All accounts carry `version: u8` for zero-disruption lazy migration.

---

## All Settled Decisions — Do Not Revisit

### Project Identity
- **Name:** Akari
- **Track:** Cross-Border Stablecoin Treasury
- **Chain:** Solana Devnet for demo; mainnet-ready architecture
- **Framework:** Anchor (Rust) — nothing else

### Two Programs, Always
There are exactly two Anchor programs:
1. **`akari`** — main pool program. All business logic.
2. **`transfer_hook`** — Token-2022 hook. KYC enforcement only. Two instructions: `initialize_extra_account_meta_list` and `execute`.

They share no CPI calls. They communicate only through shared PDA addresses — specifically the `KycMerkleRoot` PDA which `akari` writes (via `update_kyc_root`) and `transfer_hook` reads (during `execute`).

### Notional Pooling — Intentional Architecture
One `PoolVault` PDA. One USDC ATA. One EURC ATA. Subsidiaries have `SubsidiaryAccount` PDAs with `usdc_balance: u64` and `eurc_balance: u64` ledger fields. No per-subsidiary vaults. Do not refactor.

### Enhancement 1: Sharded Epoch Slippage (EpochState)
- `epoch_accumulated_slippage`, `epoch_start`, `epoch_duration`, `max_epoch_slippage_bps` are **NOT on PoolVault**
- They live on `EpochState` PDAs, one per currency pair (seed: `["epoch_state", currency_pair_bytes]`)
- `initialize_epoch_state` called once each for EUR_USD and CHF_USD during setup
- `fx_swap` receives the relevant `EpochState` as a mutable account
- EUR_USD and CHF_USD swaps can execute in parallel — no account contention

### Enhancement 2: Merkle-Proof KYC (No Per-Wallet PDAs)
- There are **NO** `KycEntry` PDAs. The old per-wallet PDA model is replaced entirely.
- One `KycMerkleRoot` account (seed: `["kyc_merkle_root"]`) stores the current root
- Each token transfer passes a Merkle proof in instruction data
- `transfer_hook::execute` verifies the proof with canonical sort-before-hash
- Leaf = `sha256(wallet_pubkey_bytes)` for MVP (can bind kyc_hash + vasp_id in production)
- Off-chain tooling in `merkle-tools/` manages the tree and proof generation. Tree is STRICTLY limited to 8 wallets (maximum 3 levels) to keep compute units in check.
- Adding a wallet = rebuild tree + call `update_kyc_root` + no on-chain account created

### Enhancement 3: Bid/Ask Spread (Directional Pricing)
- `SixPriceFeed` stores `bid`, `ask`, `mid`, `spread_bps` — not just `price`
- USDC → EURC uses **ask** (buying EUR is more expensive)
- EURC → USDC uses **bid** (selling EUR gets less)
- Oracle relay fetches `bid` and `ask` from SIX API (not just `last`)
- `update_fx_rate` instruction takes `bid` and `ask` as parameters; computes mid and spread internally
- `FxSwapEvent` includes `spread_bps` so the cost is visible on-chain

### Enhancement 4: Versioned Accounts
- Every account struct has `pub version: u8` as second-to-last field (before bump)
- Current version for all structs: **1**
- Version 0 is the legacy/uninitialized sentinel
- Every mutable instruction calls `maybe_migrate_*()` at the top before business logic
- Migration is lazy — accounts upgrade on first interaction, not via batch script

### Enhancement 5: Oracle Relay Redundancy (OracleRelayLock)
- `OracleRelayLock` PDA (seed: `["oracle_relay_lock"]`) — one global lock
- Fields: `holder: Pubkey`, `acquired_at: i64`, `ttl: i64` (default 60s), `renewal_count: u64`
- `acquire_relay_lock` — allows acquisition if expired or caller already holds it
- `renew_relay_lock` — only current holder; resets `acquired_at`
- `update_fx_rate` validates: signer == oracle_authority AND signer == lock.holder AND lock not expired
- Primary relay: acquire + renew every 30s (same interval as price polling)
- Standby relay: check lock every 15s; acquire if expired; run poll loop after acquiring
- Two separate keypairs: `oracle-keypair.json` (primary), `standby-keypair.json` (standby)

### Enhancement 6: Jupiter CPI Fallback
- Triggered inside `fx_swap` when `pool_vault.total_{to_currency} < expected_output`
- Jupiter program ID: `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`
- Jupiter accounts passed as `remaining_accounts` in `fx_swap`
- Dynamic external fallback: Uses `jupiter-cpi` crate via `shared_accounts_route`. Route provided dynamically by Next.js client fetching `@jup-ag/api`.
- `FxSwapEvent.liquidity_source: u8` — 0 = internal, 1 = Jupiter

### Enhancement 7: Steakhouse Yield Router
- `YieldPosition` PDA (seed: `["yield_position", currency, venue]`)
- `deploy_yield` instruction — authority only. Real Kamino CPI usage. The `klend` crate is deployed and PoolVault acts as signer. Frontend dynamically fetches required Kamino market accounts via SDK.
- `harvest_yield` instruction — computes 5% APY stub; adds yield to pool vault totals
- Frontend `YieldPositionCard.tsx` shows the positions and allows harvest — demonstrates the architecture to Solstice Labs judges

---

## Three Programs Are NOT Programs

Clarification to prevent confusion:
- **`oracle-relay/`** — Node.js process, NOT an Anchor program. Runs off-chain.
- **`merkle-tools/`** — Node.js scripts, NOT an Anchor program. Runs off-chain (CLI tools).
- **`app/`** — Next.js frontend, NOT an Anchor program.

Only `programs/akari/` and `programs/transfer_hook/` are Anchor programs.

---

## Critical Assumptions — Verify Before Using

| Assumption | How to verify |
|---|---|
| SIX instrument codes: `USDEURSP`, `USDCHFSP`, `USDLBXAUAM` | Open the Excel file — verify exact codes match API response |
| SIX API returns separate bid/ask fields | Read Web API docs PDF — confirm response schema includes bid, ask |
| SIX authentication is mTLS with Account Certificate | Read docs PDF — verify auth method and base URL before writing any relay code |
| Devnet USDC mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | Verify against Circle's current Devnet docs |
| Pyth Devnet EUR/USD feed account address | Fetch from https://pyth.network/developers/price-feed-ids |
| EURC available on Devnet | Check Circle Devnet docs; if not, deploy a mock Token-2022 mint with identical config |
| Solana transaction size fits Merkle proof | A 20-level tree = 20 × 32 = 640 bytes proof. Solana tx limit 1232 bytes — fits with room |
| `spl-token-2022` crate version compatible with `anchor-lang` version | Check Anchor changelog; pin versions in Cargo.lock on Phase 0 |
| Jupiter v6 CPI interface | Check https://station.jup.ag/docs/apis/swap-api — confirm current program ID and ix format |

---

## What Was Considered and Rejected

| Option | Why rejected |
|---|---|
| Per-wallet `KycEntry` PDAs | Account proliferation at scale; replaced by Merkle root (one account, millions of wallets) |
| Epoch slippage on PoolVault | Write hotspot — all swaps serialized; replaced by sharded EpochState per pair |
| Mid-price-only oracle | Free arbitrage opportunity; replaced by directional bid/ask pricing |
| Single oracle relay process | SPOF; replaced by primary/standby with OracleRelayLock |
| Instruction-level KYC only | Bypassable via direct SPL transfer; replaced by non-bypassable Transfer Hook |
| Per-subsidiary vault PDAs | Defeats notional pooling; unnecessary rent; rejected from the start |
| Confidential Transfers (ZKP) | 4–6 week engineering project; documented as roadmap, not implemented |
| Single Anchor program (no hook program) | Token-2022 spec requires separate program for hook |
| Ethereum/EVM | Hackathon hard requirement is Solana |
| Centralized backend for compliance | Compliance must be on-chain; no backend-gated logic |
| Real Fireblocks API | Business account + sandbox provisioning takes too long; typed stub is sufficient |

---

## How the Programs Reference Each Other

```
SHARED PDA ADDRESS (no CPI between programs):

akari::register_subsidiary
    └── builds SubsidiaryAccount PDA (business logic only)

akari::update_kyc_root (via merkle-tools/update-root.ts)
    └── writes KycMerkleRoot PDA
        seed: ["kyc_merkle_root"]
        program: transfer_hook

transfer_hook::execute (called by Token-2022, not by akari)
    └── reads KycMerkleRoot PDA
    └── verifies Merkle proof against root
    └── no knowledge of akari program — just reads the PDA

OracleRelayLock PDA:
    akari::initialize_oracle_relay_lock → creates
    akari::acquire_relay_lock → oracle relay acquires
    akari::renew_relay_lock → oracle relay renews
    akari::update_fx_rate → validates lock is held before accepting price
    (oracle-relay reads PDA off-chain to decide primary vs standby)

EpochState PDAs (one per pair):
    akari::initialize_epoch_state → creates EUR_USD + CHF_USD
    akari::fx_swap → reads + writes only the relevant pair's EpochState
    (no cross-pair dependencies)
```

---

## Partner Pitch Language (Use in Demo and Docs)

Never say: "DeFi", "liquidity mining", "APY", "yield farming", "crypto"
Always say: "deterministic settlement", "capital efficiency", "intraday liquidity provision", "institutional-grade", "regulatory-aligned"

| Partner | What to say |
|---|---|
| **AMINA Bank** | "Merkle-proof KYC via Token-2022 Transfer Hook — mathematically non-circumventable compliance that satisfies FINMA's deterministic enforcement requirement. PermanentDelegate enables court-ordered asset recovery." |
| **SIX BFI** | "FX execution uses SIX Web API bid/ask rates — the same institutional data layer powering Swiss capital markets. Directional pricing (ask for buys, bid for sells) mirrors real FX desk convention. Bid/ask spread is stored on-chain as auditable proof of pricing fairness." |
| **Steakhouse Financial** | "Dual-layer slippage controls — per-swap assertion and sharded epoch budget per currency pair — directly adapted from the Grove Allocator mathematical model. Idle capital routes to Steakhouse's whitelisted yield venues." |
| **Solana Foundation** | "Sharded epoch state enables parallel FX swap execution across currency pairs. Token-2022 extensions demonstrate Solana's enterprise-grade programmable finance. 400ms finality makes intraday treasury rebalancing operationally viable." |
| **Solstice Labs** | "Akari's yield router deploys idle pool balances to compliant lending venues via Steakhouse, making the treasury pool self-sustaining — aligning directly with Solstice's institutional yield thesis." |
| **Fireblocks** | "Architecture includes a typed Fireblocks MPC custody interface. The oracle relay fee abstraction mirrors Gasless Transactions — financial controllers never hold native SOL." |
| **Softstack** | "The smart contract surface includes Token-2022 Transfer Hook, Merkle proof verification, sharded epoch state, Jupiter CPI, and yield router integration — a meaningful audit target." |

---

## Resources

| Resource | URL |
|---|---|
| Anchor docs | https://www.anchor-lang.com |
| Token-2022 Transfer Hook guide | https://spl.solana.com/token-2022/extensions#transfer-hook |
| Token-2022 Transfer Hook example | https://github.com/solana-developers/program-examples/tree/main/tokens/token-2022/transfer-hook |
| SPL Token-2022 crate | https://docs.rs/spl-token-2022 |
| Pyth price feed IDs (Devnet) | https://pyth.network/developers/price-feed-ids |
| Jupiter v6 swap API | https://station.jup.ag/docs/apis/swap-api |
| Jupiter program examples | https://github.com/jup-ag/jupiter-cpi |
| Steakhouse Grove Allocator | https://github.com/steakhouse-financial/grove |
| Marginfi SDK | https://docs.marginfi.com |
| Kamino docs | https://docs.kamino.finance |
| Squads multisig | https://squads.so |
| Circle Devnet faucet | https://faucet.circle.com |
| Solana Devnet faucet | https://faucet.solana.com |
| Solana Explorer (Devnet) | https://explorer.solana.com/?cluster=devnet |
| @noble/hashes (SHA-256 for Merkle) | https://github.com/paulmillr/noble-hashes |
| Solana program examples | https://github.com/solana-developers/program-examples |

---

## History

### Version 3.1
- **Name Change**: Renamed project from Clearflow to Akari.
- **Merkle Compute Fix (Shallow Tree)**: Modified `merkle-tools/build-tree.ts` check to enforce max 8 wallets (3-level tree).
- **Kamino CPI Integration**: Implemented real CPI with `klend` crate and Next.js foundation to use `@kamino-finance/klend-sdk`.
- **Jupiter Aggregator CPI**: Maintained via dynamic `remaining_accounts` utilizing `jupiter-cpi` crate and Jupiter quote SDK.
