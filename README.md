# Akari

**Compliance-first notional stablecoin cash pooling on Solana.**

Akari is an on-chain treasury system for multinational corporates. Subsidiaries deposit USDC and EURC into a single master vault, swap currencies at live SIX institutional FX rates, and settle in under 400ms — with KYC enforced at the token layer, not the application layer.

> Built for **StableHacks 2026** (DoraHacks) — Cross-Border Stablecoin Treasury track.

---

## Problem

Multinational treasury teams face three compounding pains:

1. **Trapped liquidity** — cash sits idle in subsidiary accounts, unable to move centrally without 1–3 day interbank settlement.
2. **FX cost and opacity** — cross-currency transfers incur 2–5% in correspondent banking fees with no real-time rate visibility.
3. **Compliance overhead** — each cross-border transfer requires manual KYC/AML checks, VASP reporting, and Travel Rule compliance, adding days of friction.

No system on Solana combines institutional-grade FX data with non-circumventable on-chain compliance.

---

## Solution

Akari is a **permissioned stablecoin treasury pool**:

- **Notional pooling** — one vault, per-entity ledger entries. No per-subsidiary vaults.
- **Live SIX FX rates** — bid/ask pricing from the SIX Web API (the same data layer powering Swiss capital markets). Ask for buys, bid for sells — mirrors real FX desk convention and eliminates mid-price arbitrage.
- **Merkle-proof KYC at the token layer** — SPL Token-2022 Transfer Hook verifies inclusion proofs before any transfer settles. Non-circumventable by any program.
- **Sharded epoch slippage** — per-currency-pair `EpochState` PDAs enable parallel swap execution without write contention.
- **Jupiter CPI fallback** — when internal pool liquidity is insufficient, swaps route to Jupiter aggregator automatically.
- **Steakhouse yield router** — idle balances deploy to compliant lending venues via Kamino CPI.
- **Oracle relay redundancy** — primary/standby architecture with on-chain leader election via `OracleRelayLock` PDA (60s TTL).
- **Versioned accounts** — every account struct carries `version: u8` for zero-disruption lazy migration.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ COMPLIANCE LAYER                                                        │
│ Token-2022 Transfer Hook · Merkle-Proof KYC · Travel Rule PDAs         │
│ KYT Event Logs · AML Velocity Controls · PermanentDelegate             │
├──────────────────────────────────────────────────────────────────────────┤
│ CORE LOGIC LAYER                                                        │
│ Pool Vault · FX Swap Engine · Sharded EpochState · SixPriceFeed        │
│ (bid/ask) · Jupiter CPI Fallback · Steakhouse Yield Router             │
│ Versioned Accounts                                                     │
├──────────────────────────────────────────────────────────────────────────┤
│ INFRASTRUCTURE LAYER                                                    │
│ Solana Devnet · SIX Oracle Relay (Redundant) · OracleRelayLock         │
│ Pyth Fallback · Fireblocks Stub · Next.js Frontend                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
akari/
├── programs/
│   ├── akari/                  # Main pool program (Anchor, Rust)
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── state/          # PoolVault, SubsidiaryAccount, EpochState,
│   │       │                   # SixPriceFeed, OracleRelayLock, TravelRuleRecord,
│   │       │                   # YieldPosition
│   │       ├── instructions/   # 15 instructions (see table below)
│   │       ├── errors.rs
│   │       └── events.rs
│   └── transfer_hook/          # Token-2022 Transfer Hook program
│       └── src/
│           ├── lib.rs
│           ├── execute.rs      # Merkle proof verification
│           └── state/          # KycMerkleRoot, ExtraAccountMetaList
│
├── oracle-relay/               # Off-chain SIX oracle service (Node.js)
│   └── src/
│       ├── index.ts            # Primary relay loop (30s poll)
│       ├── standby.ts          # Standby relay (15s lock check)
│       ├── six-client.ts       # SIX Web API client (mTLS, bid/ask)
│       ├── leader-election.ts  # OracleRelayLock acquire/renew
│       ├── submitter.ts
│       └── config.ts
│
├── merkle-tools/               # Off-chain Merkle tree management (Node.js)
│   └── src/
│       ├── build-tree.ts       # Build tree from wallet-list.json (max 8 wallets)
│       ├── generate-proof.ts   # Generate inclusion proof for a wallet
│       ├── update-root.ts      # Submit update_kyc_root to Solana
│       └── wallet-list.json
│
├── app/                        # Next.js 14 treasury dashboard
│   ├── app/
│   │   ├── page.tsx            # Landing + wallet connect
│   │   ├── dashboard/          # Pool, FX, Yield, Audit pages
│   │   └── admin/              # KYC root, register, flag, pause
│   ├── components/             # UI components (see below)
│   ├── hooks/                  # usePool, useSixPrice, useEpochState, etc.
│   └── lib/                    # anchor.ts, merkle.ts, jupiter.ts, constants.ts
│
├── tests/                      # Integration tests (Anchor)
├── scripts/                    # setup-devnet, seed-subsidiaries, simulate-transfers
├── Anchor.toml
└── Cargo.toml
```

---

## Two Anchor Programs

The system has exactly two on-chain programs. They share **no CPI calls** — they communicate through shared PDA addresses.

| Program | Purpose | Instructions |
|---|---|---|
| `akari` | All business logic: pool management, FX swaps, yield, oracle | 15 instructions |
| `transfer_hook` | KYC enforcement only | 3 instructions |

**Cross-program communication:**
```
akari::update_kyc_root  →  writes KycMerkleRoot PDA
transfer_hook::execute  →  reads KycMerkleRoot PDA (verifies Merkle proof)
```

The `transfer_hook` has no knowledge of the `akari` program — it just reads the PDA. This keeps compliance non-circumventable.

---

## On-Chain Accounts

### `PoolVault`
Seed: `["pool_vault"]` — single global vault

| Field | Type | Description |
|---|---|---|
| `authority` | `Pubkey` | Admin |
| `oracle_authority` | `Pubkey` | Oracle relay signer |
| `pool_usdc_ata` | `Pubkey` | Vault USDC token account |
| `pool_eurc_ata` | `Pubkey` | Vault EURC token account |
| `total_usdc` | `u64` | Aggregate USDC notional |
| `total_eurc` | `u64` | Aggregate EURC notional |
| `subsidiary_count` | `u32` | Registered subsidiaries |
| `travel_rule_threshold` | `u64` | Default: $3,000 (6 decimals) |
| `daily_limit_usdc` | `u64` | Per-subsidiary daily cap |
| `max_slippage_bps` | `u16` | Per-swap default: 50 bps |
| `paused` | `bool` | Emergency pause |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

### `SubsidiaryAccount`
Seed: `["subsidiary", owner_pubkey]`

| Field | Type | Description |
|---|---|---|
| `owner` | `Pubkey` | Wallet authority |
| `kyc_hash` | `[u8; 32]` | KYC document hash |
| `source_of_funds_hash` | `[u8; 32]` | Source of funds attestation |
| `vasp_id` | `[u8; 32]` | VASP identifier |
| `usdc_balance` | `u64` | Notional USDC ledger |
| `eurc_balance` | `u64` | Notional EURC ledger |
| `daily_transfer_total` | `u64` | AML velocity tracking |
| `last_transfer_day` | `i64` | Day-boundary for reset |
| `flagged` | `bool` | AML flag |
| `registered_at` | `i64` | Timestamp |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

### `EpochState`
Seed: `["epoch_state", currency_pair_bytes]` — **one per currency pair** (sharded)

| Field | Type | Description |
|---|---|---|
| `currency_pair` | `[u8; 8]` | e.g. `b"EUR_USD\0"` |
| `epoch_start` | `i64` | Current epoch start timestamp |
| `epoch_duration` | `i64` | Default: 86,400 (1 day) |
| `epoch_accumulated_slippage` | `u64` | Slippage accrued this epoch |
| `max_epoch_slippage_bps` | `u16` | Default: 100 bps (1%) |
| `vault_nav_snapshot_usdc` | `u64` | NAV at epoch start |
| `total_swaps_this_epoch` | `u32` | Informational |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

### `SixPriceFeed`
Seed: `["six_price_feed", currency_pair_bytes]`

| Field | Type | Description |
|---|---|---|
| `currency_pair` | `[u8; 8]` | e.g. `b"EUR_USD\0"` |
| `bid` | `i64` | Bid price × 10⁶ |
| `ask` | `i64` | Ask price × 10⁶ |
| `mid` | `i64` | (bid + ask) / 2 × 10⁶ |
| `spread_bps` | `u16` | (ask − bid) / mid × 10,000 |
| `published_at` | `i64` | SIX data timestamp |
| `submitted_at` | `i64` | On-chain submission timestamp |
| `oracle_authority` | `Pubkey` | Submitter |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

### `OracleRelayLock`
Seed: `["oracle_relay_lock"]` — one global lock

| Field | Type | Description |
|---|---|---|
| `holder` | `Pubkey` | Current lock holder (relay keypair) |
| `acquired_at` | `i64` | Unix timestamp of acquisition |
| `ttl` | `i64` | Default: 60 seconds |
| `renewal_count` | `u64` | Informational |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

### `KycMerkleRoot` (in `transfer_hook` program)
Seed: `["kyc_merkle_root"]` — one per deployment

| Field | Type | Description |
|---|---|---|
| `root` | `[u8; 32]` | Current Merkle root |
| `leaf_count` | `u64` | Number of wallets in tree (max 8) |
| `updated_at` | `i64` | Last update timestamp |
| `authority` | `Pubkey` | Admin who can update |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

### `YieldPosition`
Seed: `["yield_position", currency, venue]`

| Field | Type | Description |
|---|---|---|
| `currency` | `u8` | 0 = USDC, 1 = EURC |
| `venue` | `[u8; 16]` | e.g. `b"kamino\0..."` |
| `deposited_amount` | `u64` | Amount deployed |
| `shares_held` | `u64` | Venue share tokens |
| `last_harvest_at` | `i64` | Timestamp |
| `total_yield_harvested` | `u64` | Cumulative yield |
| `version` | `u8` | Current: 1 |
| `bump` | `u8` | PDA bump |

---

## Instruction Reference

### `akari` program

| Instruction | Signer | Description |
|---|---|---|
| `initialize_pool` | authority | Create PoolVault PDA |
| `initialize_epoch_state` | authority | Create EpochState PDA per pair (EUR_USD, CHF_USD) |
| `initialize_oracle_relay_lock` | authority | Create OracleRelayLock PDA (TTL=60s) |
| `register_subsidiary` | authority | Create SubsidiaryAccount PDA with KYC/vasp hashes |
| `deposit` | subsidiary | Deposit USDC/EURC into pool (Transfer Hook fires) |
| `withdraw` | subsidiary | Withdraw with Travel Rule auto-attach ≥ $3,000 |
| `fx_swap` | subsidiary | Swap USDC↔EURC at SIX bid/ask, sharded epoch check, Jupiter fallback |
| `update_fx_rate` | oracle_authority | Submit SIX bid/ask (requires relay lock held) |
| `acquire_relay_lock` | relay_keypair | Acquire oracle lock if expired or already held |
| `renew_relay_lock` | relay_keypair | Renew lock (only current holder) |
| `deploy_yield` | authority | Deploy idle balance to Kamino via CPI |
| `harvest_yield` | authority | Collect accrued yield, add to pool totals |
| `flag_wallet` / `unflag_wallet` | authority | AML flag toggle |
| `pause_pool` / `unpause_pool` | authority | Emergency pause toggle |

### `transfer_hook` program

| Instruction | Signer | Description |
|---|---|---|
| `initialize_extra_account_meta_list` | authority | Register KycMerkleRoot PDA as extra account for Token-2022 |
| `update_kyc_root` | authority | Update the Merkle root (called when wallets added/removed) |
| `execute` | token_program | Verify Merkle proof for destination wallet — reject if invalid |

---

## 7 Architecture Enhancements

### 1. Sharded Epoch Slippage

**Problem:** Epoch slippage on `PoolVault` creates a write hotspot — all swaps serialize.

**Solution:** Separate `EpochState` PDAs per currency pair. EUR_USD and CHF_USD swaps execute in parallel with zero contention. Each pair has its own slippage budget (default: 100 bps/epoch).

### 2. Merkle-Proof KYC

**Problem:** Per-wallet `KycEntry` PDAs proliferate. Instruction-level KYC is bypassable via direct SPL transfer.

**Solution:** Single `KycMerkleRoot` account. Each token transfer passes a Merkle inclusion proof to `transfer_hook::execute`, which verifies against the on-chain root. Identity data stays off-chain (GDPR-safe). Tree limited to 8 wallets (3-level tree, max 3 proof nodes) to guarantee compute budget fit.

### 3. Directional Bid/Ask Pricing

**Problem:** Mid-only pricing creates free arbitrage.

**Solution:** `SixPriceFeed` stores bid, ask, mid, and spread_bps. USDC→EURC uses the ask (buying EUR costs more). EURC→USDC uses the bid (selling EUR gets less). This mirrors institutional FX desk convention and eliminates structural arbitrage.

### 4. Versioned Accounts

**Problem:** Account struct changes require forced migration scripts.

**Solution:** Every account has `version: u8` (current: 1). Mutable instructions call `maybe_migrate_*()` before business logic. Accounts upgrade lazily on first access.

### 5. Oracle Relay Redundancy

**Problem:** Single oracle relay is a SPOF.

**Solution:** `OracleRelayLock` PDA with 60s TTL. Primary relay acquires + renews every 30s. Standby checks every 15s and takes over if the lock expires. `update_fx_rate` requires the signer holds a valid lock.

### 6. Jupiter CPI Fallback

**Problem:** Internal pool may lack sufficient counterparty notional for large swaps.

**Solution:** When `pool_vault.total_{to_currency} < expected_output`, `fx_swap` routes through Jupiter aggregator via CPI. Jupiter accounts passed as `remaining_accounts`, fetched dynamically by the frontend via `@jup-ag/api`. `FxSwapEvent.liquidity_source` records whether internal (0) or Jupiter (1).

### 7. Steakhouse Yield Router

**Problem:** Idle balances earn zero.

**Solution:** `deploy_yield` sends idle balance (capped at 10% of pool total) to Kamino via CPI using the `klend` crate. `harvest_yield` collects accrued yield and adds it to pool totals. Frontend fetches Kamino market accounts via `@kamino-finance/klend-sdk`.

---

## Compliance Architecture

### KYC — Merkle-Proof at Token Layer
- Single `KycMerkleRoot` on-chain. Identity data off-chain.
- `transfer_hook::execute` verifies `merkle_verify(proof, leaf, root)` — rejects with `UnauthorizedRecipient` if invalid.
- Adding a wallet: rebuild tree off-chain → `update_kyc_root` → no on-chain account created.
- Non-circumventable: Token-2022 fires the hook on every transfer, regardless of calling program.

### KYT — Structured Event Logs
- Every instruction emits Anchor `#[event]` logs.
- `FxSwapEvent` includes oracle_source (0=SIX, 1=Pyth), spread_bps, liquidity_source, epoch_slippage_remaining.
- Dashboard subscribes to events for real-time audit trail.

### AML — Velocity Controls
- `SubsidiaryAccount.daily_transfer_total` + `last_transfer_day`.
- Each transfer: `daily_transfer_total + amount <= daily_limit` — rejects with `DailyLimitExceeded`.
- Resets at Unix timestamp day boundary.

### Travel Rule
- Transfers ≥ $3,000 require a `TravelRuleRecord` PDA with sender/receiver VASP metadata.
- `TravelRuleEvent` emitted for off-chain VASP relay.
- Withdrawals above threshold without travel rule data rejected with `TravelRuleRequired`.

### Token-2022 Extensions

| Extension | Purpose |
|---|---|
| `TransferHook` | Merkle-proof KYC at token layer — non-circumventable |
| `PermanentDelegate` | FINMA-aligned regulatory seizure capability |
| `TransferFeeConfig` | 0.05% protocol fee for treasury sustainability |

---

## FX Swap Flow

```
Subsidiary calls fx_swap(from=USDC, to=EURC, amount, max_slippage_bps)
│
├── Check: pool not paused, wallet not flagged, balance sufficient
├── Lazy migrate: maybe_migrate_subsidiary(), maybe_migrate_epoch_state()
│
▼
Load EpochState PDA for EUR_USD (sharded)
├── Epoch expired? → reset epoch, snapshot vault_nav
│
▼
Load SixPriceFeed PDA for EUR_USD
├── Fresh (< 90s) → use ASK price (buying EUR), oracle_source = 0
└── Stale → load Pyth from remaining_accounts
    ├── Pyth fresh → use Pyth mid, oracle_source = 1
    └── Both stale → OracleStale error
│
▼
Calculate expected_eurc = usdc_amount × oracle_price / 10⁶
├── Per-swap check: slippage ≤ max_slippage_bps → else SlippageExceeded
├── Epoch check: accumulated + this_slippage ≤ budget → else EpochSlippageBudgetExhausted
│
▼
Internal liquidity check: pool_vault.total_eurc >= expected_eurc?
├── YES → internal notional swap (no real token movement), liquidity_source = 0
└── NO → Jupiter CPI (real token swap), liquidity_source = 1
│
▼
Update EpochState: accumulated_slippage, total_swaps_this_epoch
Emit FxSwapEvent
```

---

## Slippage Controls (Steakhouse Model)

**Per-swap check:**
```
received >= expected × (10_000 − max_slippage_bps) / 10_000
→ Default: 50 bps (0.5%)
→ Rejects: SlippageExceeded
```

**Epoch budget check (per EpochState, per pair):**
```
epoch_accumulated_slippage + this_slippage
≤ max_epoch_slippage_bps × vault_nav_usdc / 10_000
→ Default: 100 bps (1%) per pair per epoch
→ Rejects: EpochSlippageBudgetExhausted
→ Auto-resets: when clock − epoch_start ≥ epoch_duration
```

---

## Oracle Relay Architecture

```
PRIMARY RELAY (every 30s)
├── acquire_relay_lock / renew_relay_lock
├── fetch EUR/USD bid/ask from SIX Web API (mTLS)
├── fetch CHF/USD bid/ask from SIX Web API
├── fetch LBMA Gold price (USDLBXAUAM — display only)
├── submit update_fx_rate for EUR_USD
└── submit update_fx_rate for CHF_USD

STANDBY RELAY (every 15s)
├── Read OracleRelayLock PDA
├── Lock expired (now − acquired_at ≥ 60s)?
│   └── YES → acquire_relay_lock → take over as primary
└── Otherwise → log "standby"
```

SIX instrument codes: `USDEURSP` (EUR/USD), `USDCHFSP` (CHF/USD), `USDLBXAUAM` (LBMA Gold AM fix).

---

## KYC Merkle Update Flow

```
Admin adds new subsidiary off-chain
│
▼
merkle-tools/build-tree.ts
├── Read wallet-list.json (add new wallet entry)
├── Rebuild Merkle tree (max 8 wallets, 3 levels)
└── Output new root + tree to tree-output.json
│
▼
merkle-tools/update-root.ts
└── Submit update_kyc_root(new_root, leaf_count) to Solana
│
▼
transfer_hook::KycMerkleRoot updated on-chain

On next token transfer:
├── Client generates Merkle proof via generate-proof.ts
├── Proof passed as instruction data to transfer_hook::execute
└── Hook verifies proof against root → Ok(())
```

---

## Error Codes

| Code | Message |
|---|---|
| `UnauthorizedRecipient` | Wallet not in KYC Merkle tree |
| `InvalidMerkleProof` | Invalid Merkle proof |
| `PoolPaused` | Pool is paused |
| `WalletFlagged` | Wallet is AML flagged |
| `DailyLimitExceeded` | Daily transfer limit exceeded |
| `InsufficientBalance` | Insufficient notional balance |
| `InsufficientIdleBalance` | Insufficient idle balance for yield deployment |
| `OracleStale` | Both SIX and Pyth feeds are stale |
| `InvalidOracleAuthority` | Oracle authority mismatch |
| `RelayLockNotHeld` | Relay lock not held by caller |
| `RelayLockHeldByAnother` | Relay lock held by another relay — standby mode |
| `SlippageExceeded` | Per-swap slippage limit exceeded |
| `EpochSlippageBudgetExhausted` | Epoch slippage budget exhausted for this currency pair |
| `TravelRuleRequired` | Travel rule data required for this transfer amount |
| `Unauthorized` | Unauthorized — admin only |
| `UnknownAccountVersion` | Unknown account version — cannot migrate |

---

## Events

| Event | Key Fields |
|---|---|
| `TransferEvent` | sender, receiver, amount, currency, travel_rule_attached |
| `FxSwapEvent` | from/to currency, amounts, oracle_price, oracle_source (0=SIX, 1=Pyth), spread_bps, slippage_bps, epoch_slippage_remaining_bps, liquidity_source (0=internal, 1=Jupiter) |
| `TravelRuleEvent` | tx_reference, sender_vasp, receiver_vasp, amount, currency |
| `OracleUpdateEvent` | currency_pair, bid, ask, mid, spread_bps, oracle_source, published_at, submitted_at |
| `RelayLockEvent` | holder, action (0=acquired, 1=renewed, 2=expired) |
| `YieldDeployedEvent` | currency, venue, amount |
| `YieldHarvestedEvent` | currency, venue, yield_amount |

---

## Frontend

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Solana Wallet Adapter

### Pages

| Route | Purpose |
|---|---|
| `/` | Landing page, wallet connect, KYC gate |
| `/dashboard` | Pool totals, subsidiary list, SIX ticker strip, recent events |
| `/dashboard/pool` | Subsidiary cards, deposit/withdraw forms, daily limit bars, Travel Rule modal |
| `/dashboard/fx` | SixRateTicker (bid/ask/spread/gold), per-pair SlippageGauges, FxSwapPanel, OracleStatusBadge |
| `/dashboard/yield` | YieldPositionCard per venue, deploy form, harvest button |
| `/dashboard/audit` | Full event table, Travel Rule accordion, Explorer links, filters |
| `/admin` | KYC root display, register subsidiary, flag/unflag, pause/unpause, relay lock status |

### Key Components

- **`SixRateTicker`** — bid, ask, mid, spread per pair + LBMA Gold row
- **`SlippageGauge`** — per-pair gauges with color transitions (green → amber → red) and epoch reset timer
- **`OracleStatusBadge`** — SIX Live / Pyth Fallback / Oracle Stale with relay lock info
- **`FxSwapPanel`** — directional price label ("Buying EUR — SIX Ask: 1.0842"), spread cost, liquidity source indicator
- **`YieldPositionCard`** — venue, deposited amount, APY, accrued yield, harvest button
- **`TravelRuleModal`** — auto-triggers above $3,000 threshold

### Hooks

- `usePool` — fetch PoolVault, auto-refresh
- `useSixPrice` — fetch SixPriceFeed PDAs every 10s, expose bid/ask/mid/spread
- `useEpochState` — fetch both EpochState PDAs, expose accumulated/budget/remaining/resets_in
- `useOracleRelayStatus` — fetch OracleRelayLock, expose holder/is_fresh/time_until_expiry
- `useYieldPositions` — fetch all YieldPosition PDAs
- `useKycStatus` — check if connected wallet is in Merkle tree

---

## Technical Constraints

| Constraint | Detail |
|---|---|
| Chain | Solana Devnet (mainnet-ready architecture) |
| Smart contracts | Anchor framework (Rust) |
| Token standard | SPL Token-2022 — TransferHook + PermanentDelegate + TransferFeeConfig |
| Stablecoins | USDC + EURC (Circle Devnet mints) |
| FX oracle — primary | SIX Web API (REST, mTLS with Account Certificate) — bid/ask/mid |
| FX oracle — fallback | Pyth Network on-chain price feeds |
| KYC model | Merkle-proof inclusion — max 8 wallets (3-level tree) |
| Slippage model | Sharded EpochState per pair + per-swap assertion |
| External liquidity | Jupiter aggregator CPI via `jupiter-cpi` using `remaining_accounts` |
| Yield | Steakhouse router → Kamino CPI via `klend` crate |
| Oracle redundancy | OracleRelayLock PDA with 60s TTL |
| Upgradeability | `version: u8` on all accounts, lazy migration |
| Custody | Fireblocks SDK typed interface (MockFireblocksClient) |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Wallet | Solana Wallet Adapter (Phantom / Backpack) |

---

## Security Considerations

| Risk | Mitigation |
|---|---|
| KYC bypass | Merkle proof in Transfer Hook — non-circumventable at token level |
| Invalid Merkle proof | Canonical hash ordering prevents proof reordering attacks |
| Rogue oracle submission | Oracle authority keypair + relay lock must be held |
| Relay lock squatting | 60s TTL — dead relay loses lock; standby acquires within one TTL window |
| FX arbitrage | Directional bid/ask pricing eliminates mid-price arbitrage |
| Epoch slippage drain | Sharded per-pair — one pair's exhaustion doesn't affect the other |
| Jupiter CPI malicious route | Slippage tolerance enforced; output checked post-CPI |
| Yield venue insolvency | Admin-controlled deployment; venue whitelist in program |
| Account schema changes | Versioned accounts + lazy migration |

---

## Environment Variables

### Frontend (`app/.env.local`)

```bash
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<akari_program_id>
NEXT_PUBLIC_HOOK_PROGRAM_ID=<transfer_hook_program_id>
NEXT_PUBLIC_POOL_VAULT=<pool_vault_pda>
NEXT_PUBLIC_RELAY_LOCK=<oracle_relay_lock_pda>
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
NEXT_PUBLIC_EURC_MINT=<devnet_eurc_mint>
NEXT_PUBLIC_JUPITER_PROGRAM=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
```

### Oracle Relay — Primary (`oracle-relay/.env`)

```bash
SOLANA_RPC=https://api.devnet.solana.com
ORACLE_KEYPAIR_PATH=./oracle-keypair.json
POOL_VAULT_ADDRESS=<pool_vault_pda>
PROGRAM_ID=<akari_program_id>
SIX_CERT_PATH=./certs/client.crt
SIX_KEY_PATH=./certs/client.key
SIX_POLL_INTERVAL_MS=30000
EUR_USD_INSTRUMENT=USDEURSP
CHF_USD_INSTRUMENT=USDCHFSP
GOLD_INSTRUMENT=USDLBXAUAM
RELAY_LOCK_TTL_SECONDS=60
IS_PRIMARY=true
```

### Oracle Relay — Standby (`oracle-relay/.env.standby`)

Same as primary except:

```bash
ORACLE_KEYPAIR_PATH=./standby-keypair.json
IS_PRIMARY=false
LOCK_CHECK_INTERVAL_MS=15000
```

---

## Deployment Order

```bash
# 1. Build and deploy programs
anchor build
anchor deploy --program-name transfer_hook
anchor deploy --program-name akari
anchor idl init                              # for both programs

# 2. Initialize on-chain state
ts-node scripts/setup-devnet.ts              # initialize_pool, relay lock, epoch states

# 3. Set up KYC Merkle tree
ts-node merkle-tools/build-tree.ts           # build tree from wallet-list.json
ts-node merkle-tools/update-root.ts          # submit root to KycMerkleRoot PDA

# 4. Seed data
ts-node scripts/seed-subsidiaries.ts
ts-node scripts/mock-kyc.ts                  # add wallets, rebuild tree, submit new root

# 5. Start oracle relay
cd oracle-relay && IS_PRIMARY=true npm run start           # primary
cd oracle-relay && IS_PRIMARY=false npm run standby        # standby (separate process)

# 6. Start frontend
cd app && npm run dev

# 7. Run demo simulation
ts-node scripts/simulate-transfers.ts
```

---

## Partner Alignment

| Partner | Relevance |
|---|---|
| **AMINA Bank** | Merkle-proof KYC via Transfer Hook; PermanentDelegate for FINMA regulatory seizure |
| **SIX BFI** | Live bid/ask/mid from Web API is primary oracle; gold price display; spread stored on-chain |
| **Steakhouse Financial** | Dual-layer slippage model + sharding + yield router integration |
| **Solana Foundation** | Token-2022 showcase; sharded parallel execution; 400ms finality |
| **Solstice Labs** | Yield router deploys idle balances to compliant lending venues |
| **Fireblocks** | Typed MPC custody interface; relay fee design mirrors Gasless Transactions |
| **Softstack** | Deep audit surface: Transfer Hook, Merkle proof, sharded epoch, Jupiter CPI |

---

## What Was Considered and Rejected

| Option | Why rejected |
|---|---|
| Per-wallet `KycEntry` PDAs | Account proliferation; Merkle root scales to millions with one account |
| Epoch slippage on `PoolVault` | Write hotspot serializing all swaps; sharded per pair |
| Mid-price-only oracle | Free arbitrage; replaced by directional bid/ask pricing |
| Single oracle relay | SPOF; replaced by primary/standby with OracleRelayLock |
| Instruction-level KYC | Bypassable via direct SPL transfer; replaced by non-bypassable Transfer Hook |
| Per-subsidiary vault PDAs | Defeats notional pooling; unnecessary rent |
| Confidential Transfers (ZKP) | 4–6 week engineering effort; roadmap item |
| Centralized compliance backend | Compliance must be on-chain; no backend-gated logic |

---

## Out of Scope

- Confidential Transfers (ZKP) — roadmap item
- Real Fireblocks API credentials — typed stub
- Real KYC provider (Civic Pass) — Merkle tree admin-controlled for demo
- Mainnet deployment

---

## Resources

- [Anchor docs](https://www.anchor-lang.com)
- [Token-2022 Transfer Hook](https://spl.solana.com/token-2022/extensions#transfer-hook)
- [Token-2022 Transfer Hook example](https://github.com/solana-developers/program-examples/tree/main/tokens/token-2022/transfer-hook)
- [SPL Token-2022 crate](https://docs.rs/spl-token-2022)
- [Pyth price feed IDs](https://pyth.network/developers/price-feed-ids)
- [Jupiter v6 swap API](https://station.jup.ag/docs/apis/swap-api)
- [Jupiter CPI examples](https://github.com/jup-ag/jupiter-cpi)
- [Steakhouse Grove Allocator](https://github.com/steakhouse-financial/grove)
- [Kamino docs](https://docs.kamino.finance)
- [Marginfi SDK](https://docs.marginfi.com)
- [Circle Devnet faucet](https://faucet.circle.com)
- [Solana Devnet faucet](https://faucet.solana.com)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
