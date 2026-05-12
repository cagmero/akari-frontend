# PLAN.md — Akari Task Checklist
**Version 3.0 — All 7 Enhancements, No Dates**

> Tasks are ordered by dependency. Complete each phase fully before starting the next. Priority order if time is constrained: smart contracts → oracle relay → compliance story → frontend → bonus polish.

---

## Phase 0 — Environment Setup

- [x] `anchor init akari` — initialize Anchor workspace
- [x] `anchor new transfer_hook` — add hook program to workspace
- [x] `npx create-next-app@latest app --typescript --tailwind --app`
- [x] `mkdir oracle-relay merkle-tools` — initialize both with `npm init -y`
- [x] `solana config set --url devnet`
- [x] Generate primary oracle keypair: `solana-keygen new -o oracle-keypair.json`
- [x] Generate standby oracle keypair: `solana-keygen new -o standby-keypair.json`
- [x] Airdrop SOL to dev wallet, oracle wallet, standby wallet
- [x] Add to `programs/akari/Cargo.toml`: `anchor-lang`, `anchor-spl`, `spl-token-2022`, `pyth-sdk-solana`, `klend`, and `jupiter-cpi = { git = "https://github.com/jup-ag/jupiter-cpi" }`
- [x] Add to `programs/transfer_hook/Cargo.toml`: `anchor-lang`, `anchor-spl`, `spl-token-2022`
- [x] Verify SIX mTLS: test one API call with Account Certificate — fail fast if cert format wrong
- [x] Confirm Pyth Devnet EUR/USD feed address from https://pyth.network/developers/price-feed-ids
- [x] Confirm Devnet USDC mint address — check Circle docs
- [x] Create public GitHub repo, push initial commit
- [x] `anchor build` — confirm both programs compile clean before writing any logic

---

## Phase 1 — Account Structs (Both Programs)

### `akari` program state files
- [x] `state/pool.rs` — `PoolVault` (no epoch fields; include version: u8, bump: u8)
- [x] `state/subsidiary.rs` — `SubsidiaryAccount` (version: u8, bump: u8)
- [x] `state/epoch_state.rs` — `EpochState` (currency_pair, epoch fields, vault_nav_snapshot, version, bump)
- [x] `state/six_price_feed.rs` — `SixPriceFeed` (bid, ask, mid, spread_bps, version, bump)
- [x] `state/oracle_relay_lock.rs` — `OracleRelayLock` (holder, acquired_at, ttl, renewal_count, version, bump)
- [x] `state/travel_rule.rs` — `TravelRuleRecord`
- [x] `state/yield_position.rs` — `YieldPosition` (currency, venue, deposited_amount, shares_held, version, bump)
- [x] `errors.rs` — all `AkariError` variants (see ARCHITECTURE.md complete list)
- [x] `events.rs` — all event structs (TransferEvent, FxSwapEvent, TravelRuleEvent, OracleUpdateEvent, RelayLockEvent, YieldDeployedEvent, YieldHarvestedEvent)

### `transfer_hook` program state files
- [x] `state/kyc_merkle_root.rs` — `KycMerkleRoot` (root: [u8;32], leaf_count: u64, authority, version, bump)
- [x] `state/extra_account_meta.rs` — `ExtraAccountMetaList`
- [x] `anchor build` — both programs compile clean after all structs added

---

## Phase 2 — Transfer Hook Program

### `initialize_extra_account_meta_list`
- [x] Creates PDA (seed: `["extra-account-metas", mint_pubkey]`)
- [x] Stores reference to `KycMerkleRoot` PDA as the extra account
- [x] Authority-only

### `update_kyc_root`
- [x] Authority-only
- [x] Updates `kyc_merkle_root.root`, `leaf_count`, `updated_at`
- [ ] Test: non-authority rejected
- [ ] Test: root updates correctly

### `execute` — Merkle Proof Verification
- [x] Receives proof as instruction data: `Vec<[u8; 32]>`
- [x] Loads `KycMerkleRoot` from extra accounts
- [x] Computes leaf: `sha256(destination_pubkey)` (simplified for MVP)
- [x] Iterates proof nodes with canonical ordering (sort before hash)
- [x] Final hash must equal root — else `UnauthorizedRecipient`
- [x] Test: valid proof for registered wallet — transfer succeeds
- [x] Test: invalid proof — transfer reverts with `UnauthorizedRecipient`
- [x] Test: tampered proof (one node changed) — reverts
- [x] Test: wrong wallet (proof for different wallet) — reverts

---

## Phase 3 — Core Pool Instructions

### `initialize_pool`
- [x] Creates `PoolVault` PDA (seed: `["pool_vault"]`)
- [x] Sets authority, oracle_authority, travel_rule_threshold, daily_limit_usdc, max_slippage_bps
- [x] Sets version = 1
- [x] Test: second call fails (account already exists)

### `initialize_epoch_state`
- [x] Creates `EpochState` PDA (seed: `["epoch_state", currency_pair_bytes]`)
- [x] Sets epoch_start = now, epoch_duration, max_epoch_slippage_bps, vault_nav_snapshot = pool.total_usdc
- [x] Sets version = 1
- [x] Test: creates EUR_USD epoch state
- [x] Test: creates CHF_USD epoch state independently

### `initialize_oracle_relay_lock`
- [x] Creates `OracleRelayLock` PDA (seed: `["oracle_relay_lock"]`)
- [x] Sets ttl = 60, holder = authority (placeholder), acquired_at = 0
- [x] Test: lock created with correct fields

### `register_subsidiary`
- [x] Authority-only
- [x] Creates `SubsidiaryAccount` PDA (seed: `["subsidiary", owner_pubkey]`)
- [x] Stores kyc_hash, vasp_id, source_of_funds_hash
- [x] Sets version = 1
- [x] Does NOT create KycEntry PDAs (replaced by Merkle root — this is just the business logic account)
- [x] Test: non-authority rejected
- [x] Test: subsidiary created with correct fields

### `deposit`
- [x] Checks: pool not paused, wallet not flagged, daily limit OK
- [x] Lazy migrate: `maybe_migrate_subsidiary()`
- [x] SPL Token-2022 transfer to pool vault ATA (Transfer Hook fires automatically)
- [x] Updates `subsidiary_account.usdc_balance` / `eurc_balance`
- [x] Updates `pool_vault.total_usdc` / `total_eurc`
- [x] Emits `TransferEvent`
- [x] Test: deposit succeeds, balance updated correctly
- [x] Test: pool paused — rejected
- [x] Test: flagged wallet — rejected
- [x] Test: daily limit exceeded — rejected
- [x] Test: Transfer Hook fires (Merkle check) — wallet not in tree reverts

### `withdraw`
- [x] Checks: pool not paused, flagged, balance, daily limit
- [x] Lazy migrate accounts
- [x] Travel Rule: if amount >= threshold AND travel_rule_data not provided → `TravelRuleRequired`
- [x] If threshold crossed: create `TravelRuleRecord` PDA, emit `TravelRuleEvent`
- [x] SPL Token-2022 transfer from pool ATA to recipient (Transfer Hook fires on recipient)
- [x] Updates balances, daily_transfer_total, last_transfer_day
- [x] Emits `TransferEvent`
- [x] Test: withdraw $1k — no Travel Rule record
- [x] Test: withdraw $15k — TravelRuleRecord PDA created
- [x] Test: withdraw $15k without travel_rule_data — `TravelRuleRequired`
- [x] Test: insufficient balance — rejected
- [x] Test: daily limit reset at day boundary

### `flag_wallet` / `unflag_wallet`
- [x] Authority-only, sets `flagged` bool
- [x] Test: flagged wallet blocked on deposit/withdraw/swap

### `pause_pool` / `unpause_pool`
- [x] Authority-only, sets `paused` bool
- [x] Test: paused pool blocks everything

---

## Phase 4 — Oracle Relay Lock Instructions

### `acquire_relay_lock`
- [x] Allows acquisition if: lock expired (now - acquired_at >= ttl) OR caller already holds it
- [x] Sets holder = caller, acquired_at = now, increments renewal_count
- [x] Emits `RelayLockEvent` (action = 0 = acquired)
- [x] Test: first acquisition succeeds
- [x] Test: second relay cannot acquire while first holds valid lock
- [x] Test: second relay acquires after TTL expires

### `renew_relay_lock`
- [x] Only current holder can renew
- [x] Resets acquired_at = now (extends TTL)
- [x] Emits `RelayLockEvent` (action = 1 = renewed)
- [x] Test: holder can renew
- [x] Test: non-holder cannot renew

---

## Phase 5 — Oracle and FX Swap

### `update_fx_rate`
- [x] Validates signer == pool_vault.oracle_authority
- [x] Validates caller holds OracleRelayLock and lock is not expired
- [x] Creates or updates `SixPriceFeed` PDA (seed: `["six_price_feed", currency_pair]`)
- [x] Stores bid, ask, mid = (bid+ask)/2, spread_bps, published_at, submitted_at
- [x] Emits `OracleUpdateEvent` with bid/ask/mid/spread
- [x] Test: non-oracle-authority rejected
- [x] Test: caller without lock rejected
- [x] Test: bid/ask stored correctly, mid computed correctly
- [x] Test: spread_bps computed correctly

### `fx_swap` — Full Implementation
- [x] Load `EpochState` PDA for the relevant currency pair
- [x] Lazy migrate: `maybe_migrate_epoch_state()`
- [x] Epoch reset: if expired, reset accumulated_slippage, snapshot vault_nav
- [x] Load `SixPriceFeed` PDA
  - [x] Fresh (< 90s): use directional price — ASK for buying base, BID for selling base; oracle_source = 0
  - [x] Stale: load Pyth from remaining_accounts, validate freshness + confidence; oracle_source = 1
  - [x] Both stale: `OracleStale`
- [x] Calculate expected output using u128 intermediate (prevent overflow)
- [x] Per-swap slippage check: `received >= expected * (10_000 - bps) / 10_000` → `SlippageExceeded`
- [x] Epoch budget check against `EpochState` → `EpochSlippageBudgetExhausted`
- [x] Liquidity check: `pool_vault.total_{to_currency} >= expected_output`?
  - [x] YES → internal notional swap; liquidity_source = 0
  - [x] NO → Jupiter CPI via remaining_accounts; liquidity_source = 1
- [x] Update `EpochState.epoch_accumulated_slippage`, `total_swaps_this_epoch`
- [x] Debit / credit subsidiary notional balances
- [x] Emit `FxSwapEvent` with oracle_source, spread_bps, liquidity_source, epoch_slippage_remaining
- [x] Test: SIX fresh — uses ASK for USDC→EURC, BID for EURC→USDC
- [x] Test: SIX stale, Pyth fresh — uses Pyth, oracle_source = 1
- [x] Test: both stale — OracleStale
- [x] Test: per-swap slippage violated — SlippageExceeded
- [x] Test: EUR_USD epoch budget exhausted — EpochSlippageBudgetExhausted
- [x] Test: CHF_USD epoch state unaffected by EUR_USD budget exhaustion (sharding)
- [x] Test: epoch auto-resets after epoch_duration
- [x] Test: internal liquidity sufficient — notional swap, no real tokens
- [x] Test: internal liquidity insufficient — Jupiter CPI path invoked
- [x] Test: u128 overflow safety with large amounts (near max u64)

---

## Phase 6 — Yield Router Stub

### `deploy_yield`
- [x] Authority-only
- [x] Compute idle balance: conservative estimate = 10% of pool total
- [x] Require amount <= idle balance
- [x] Create `YieldPosition` PDA (seed: `["yield_position", currency, venue]`)
- [x] Real CPI: Use standard Cross-Program Invocation to call Kamino's deposit function using `klend` crate. Version = 1.
- [x] Emit `YieldDeployedEvent`
- [x] Test: admin deploys 10% of USDC to "kamino" — YieldPosition created and CPI succeeds
- [x] Test: deploy amount > idle balance — `InsufficientIdleBalance`

### `harvest_yield`
- [x] Authority-only
- [x] Compute stub yield: 5% APY approximation based on elapsed time
- [x] Add yield to pool_vault.total_usdc / total_eurc
- [x] Update position: total_yield_harvested, last_harvest_at
- [x] Emit `YieldHarvestedEvent`
- [x] Test: harvest after time passes — pool total increases

---

## Phase 7 — Off-Chain: Merkle Tools

- [x] `merkle-tools/package.json` — install `@noble/hashes` for SHA-256, `@solana/web3.js`
- [x] `build-tree.ts`:
  - [x] Read `wallet-list.json` and ENFORCE strict maximum 8 wallets limit
  - [x] Compute leaves: `sha256(wallet_pubkey_bytes)` for each entry
  - [x] Build up to 3-level tree with canonical sort-before-hash at each level
  - [x] Output root + full node tree to `tree-output.json`
- [x] `generate-proof.ts`:
  - [x] Takes wallet pubkey as argument
  - [x] Looks up index in wallet-list.json
  - [x] Generates sibling nodes for each level
  - [x] Outputs proof as array of hex strings
- [x] `update-root.ts`:
  - [x] Loads tree-output.json, reads root
  - [x] Sends `update_kyc_root(root, leaf_count)` to Solana
- [x] Test: build tree with 3 wallets, generate proof for each, verify all proofs valid
- [x] Test: proof for wallet NOT in tree — verification fails

---

## Phase 8 — Off-Chain: Oracle Relay Service

### SIX API Client (`six-client.ts`)
- [x] Configure mTLS with Account Certificate
- [x] `fetchFxRates(instrumentCode)` → returns `{ bid, ask, mid, timestamp }`
- [x] `fetchGoldPrice()` → fetches `USDLBXAUAM`, returns price for display
- [x] Handle API errors: log + retry next interval; do not crash
- [x] Verify instrument codes against Excel file before hardcoding

### Leader Election (`leader-election.ts`)
- [x] `acquireOrRenewLock(program, keypair)` — returns boolean (true = we hold lock)
- [x] Handles both acquire and renew in one function based on current lock state
- [x] Handles Solana RPC errors gracefully (network blip should not crash relay)

### Submitter (`submitter.ts`)
- [x] `submitPriceOnChain(program, keypair, currencyPair, bid, ask, publishedAt)` — sends `update_fx_rate`
- [x] Logs tx signature on success

### Primary Relay (`index.ts`)
- [x] Poll loop every 30s:
  - [x] Acquire/renew lock → if fails, log standby mode, skip
  - [x] Fetch EUR/USD bid/ask from SIX
  - [x] Fetch CHF/USD bid/ask from SIX
  - [x] Fetch Gold price (store in config, not on-chain — dashboard reads config)
  - [x] Submit update_fx_rate for EUR_USD
  - [x] Submit update_fx_rate for CHF_USD
- [x] Graceful shutdown on SIGINT

### Standby Relay (`standby.ts`)
- [x] Check-lock loop every 15s:
  - [x] Read OracleRelayLock PDA
  - [x] If expired: call `acquire_relay_lock` → become primary
  - [x] If not expired and we hold it: renew
  - [x] If not expired and another holds it: log standby
  - [x] After acquiring lock: begin same poll loop as primary

### Tests
- [x] Relay fetches real SIX EUR/USD bid/ask — confirm non-zero values
- [x] Relay submits to local test-validator — SixPriceFeed PDA created
- [x] Standby relay acquires lock after TTL expires in simulated primary failure

---

## Phase 9 — Devnet Deployment + Scripts

- [x] `anchor build` — clean build
- [x] `anchor deploy --program-name transfer_hook` — record Program ID
- [x] `anchor deploy --program-name akari` — record Program ID
- [x] `anchor idl init` for both programs
- [x] Copy IDLs to `app/src/idl/`
- [x] Start primary oracle relay — confirm SixPriceFeed PDA updating on Explorer
- [x] Start standby relay — confirm standby mode logged
- [x] Kill primary — confirm standby acquires lock within 60s

---

## Phase 10 — Frontend

### Foundation
- [x] Install all dependencies (see ARCHITECTURE.md)
- [x] `lib/anchor.ts` — providers for both programs
- [x] `lib/constants.ts` — all PDA derivation helpers from `devnet-addresses.json`
- [x] `lib/merkle.ts` — client-side proof generation (reads `tree-output.json` or generates on-the-fly)
- [x] `lib/jupiter.ts` — Jupiter quote API client (`@jup-ag/api`) to fetch actual routing accounts
- [x] `lib/kamino.ts` — `@kamino-finance/klend-sdk` to fetch market accounts for yield router
- [x] `lib/fireblocks.ts` — `FireblocksClient` interface + `MockFireblocksClient`
- [x] Wallet connect + KYC gate (check wallet in Merkle tree before allowing dashboard access)

### Hooks
- [x] `usePool.ts` — fetch PoolVault, auto-refresh
- [x] `useSixPrice.ts` — fetch SixPriceFeed PDAs (EUR_USD, CHF_USD) every 10s; expose bid/ask/mid/spread
- [x] `useEpochState.ts` — fetch both EpochState PDAs; expose accumulated/budget/remaining/resets_in
- [x] `useOracleRelayStatus.ts` — fetch OracleRelayLock; expose holder, is_fresh, time_until_expiry
- [x] `useYieldPositions.ts` — fetch all YieldPosition PDAs
- [x] `useKycStatus.ts` — check if connected wallet is in Merkle tree

### Pages
- [x] `/` — landing, connect wallet, KYC check
- [x] `/dashboard` — pool totals, subsidiary list, SIX ticker strip, recent events
- [x] `/dashboard/pool` — subsidiary cards with USDC/EURC balances, deposit/withdraw forms, daily limit bars, Travel Rule modal
- [x] `/dashboard/fx` — SixRateTicker (bid/ask/spread/gold), per-pair SlippageGauges, FxSwapPanel (directional pricing label, Jupiter fallback indicator), OracleStatusBadge
- [x] `/dashboard/yield` — YieldPositionCard per venue (Marginfi stub, Kamino stub), deploy form, harvest button
- [x] `/dashboard/audit` — full event table, Travel Rule accordion rows, Solana Explorer links, filters
- [x] `/admin` — KYC root display, register subsidiary form (triggers Merkle rebuild), flag/unflag, pause/unpause, relay lock status

### Components
- [x] `SixRateTicker.tsx` — bid, ask, mid, spread per pair + LBMA Gold row
- [x] `SlippageGauge.tsx` — per-pair, color transitions, epoch reset timer
- [x] `OracleStatusBadge.tsx` — SIX Live/Pyth Fallback/Stale with relay lock info
- [x] `FxSwapPanel.tsx` — directional price label, spread cost, Jupiter indicator
- [x] `YieldPositionCard.tsx` — venue, deployed, APY, accrued, harvest button
- [x] `TravelRuleModal.tsx` — auto-triggers above threshold
- [x] `AuditTable.tsx` — all event types, expandable Travel Rule rows, Explorer links
- [x] `FireblocksStatus.tsx` — stub badge + architecture side panel

---

## Phase 11 — End-to-End Demo Scenario

`scripts/simulate-transfers.ts` — complete demo flow:

- [ ] Step 1: Register Corp Germany GmbH, Corp Singapore Pte, Corp USA LLC with VASP IDs
- [ ] Step 2: Rebuild Merkle tree with all 3 subsidiaries, submit new root
- [ ] Step 3: Corp Germany deposits 50,000 USDC
- [ ] Step 4: Corp Singapore deposits 30,000 EURC
- [ ] Step 5: Confirm OracleUpdateEvent on Explorer — shows SIX bid/ask
- [ ] Step 6: Corp Germany swaps 10,000 USDC → EURC at SIX ASK price (confirm oracle_source = 0, liquidity_source = 0)
- [ ] Step 7: Corp Singapore withdraws 2,000 EURC (< threshold — no Travel Rule)
- [ ] Step 8: Corp Germany withdraws 15,000 USDC (> threshold — TravelRuleRecord PDA created)
- [ ] Step 9: Unregistered wallet attempts to receive — Transfer Hook rejects (proof fails)
- [ ] Step 10: Kill primary relay — standby acquires lock within 60s — confirm on Explorer
- [ ] Step 11: Corp USA deploys 5,000 USDC idle balance to "marginfi" stub — YieldPosition PDA created
- [ ] Step 12: Admin flags Corp USA — deposit attempt rejected
- [ ] All 12 steps print Explorer links; all events visible in dashboard audit trail

---

## Phase 12 — Test Suite Completeness

- [ ] `anchor test` — zero failures
- [ ] All error paths tested (not just happy paths)
- [ ] Slippage math tested with 3 price scenarios: flat, up 1%, down 1%
- [ ] Epoch sharding tested: EUR_USD budget exhausted, CHF_USD swaps still work
- [ ] Merkle proof tests: valid, invalid, tampered, wrong wallet
- [ ] Oracle relay lock: acquire, renew, expiry, standby takeover
- [ ] Versioned account migration: simulate v0 account, confirm v1 migration on first write
- [ ] Jupiter CPI path: invoked when internal liquidity insufficient (mock Jupiter for test)
- [ ] Yield stub: deploy, harvest, pool total increases

---

## Phase 13 — Demo Video

### Script (max 3 minutes)
- **0:00–0:25** Problem: trapped treasury capital, FX fees, manual compliance
- **0:25–0:55** Architecture: compliance layers, SIX oracle, sharded slippage, Jupiter, yield
- **0:55–1:35** Live demo: FX swap showing SIX bid/ask, oracle_source=0 on Explorer, per-pair slippage gauges
- **1:35–2:10** Travel Rule: $15k withdrawal triggers TravelRuleRecord PDA on Explorer
- **2:10–2:35** Compliance proof: audit trail, Transfer Hook rejection, relay lock status
- **2:35–3:00** Partner callouts: AMINA/SIX/Steakhouse/Solana Foundation alignment

### Recording checklist
- [ ] All Devnet state fresh: pool funded, 3 subsidiaries, oracle relay live
- [ ] Explorer tabs pre-opened to pool vault PDA, recent transactions
- [ ] SixRateTicker showing live bid/ask before recording
- [ ] Record at 1080p minimum
- [ ] Audio clear, no background noise
- [ ] Under 3:00 total — record at 2:45 target

---

## Phase 14 — Submission

### GitHub final check
- [ ] Repo is public (verify in incognito)
- [ ] `anchor build` from clean clone — compiles
- [ ] `anchor test` passes
- [ ] Both program IDs in `Anchor.toml` match Devnet deployments
- [ ] No secrets committed: `oracle-keypair.json`, `certs/`, `.env` files are all gitignored
- [ ] `oracle-relay/.env.example` and `merkle-tools/wallet-list.json.example` present
- [ ] All four docs in `docs/` folder

### DoraHacks submission
- [ ] Project name: Akari
- [ ] Team members + countries
- [ ] Loom video link (confirm public/shareable)
- [ ] GitHub repo link
- [ ] Testnet demo link (Vercel or pool vault Explorer link)
- [ ] Hit Submit — not just Save Draft

---

## Risk Flags

| Risk | Mitigation |
|---|---|
| Token-2022 Transfer Hook + Merkle proof complexity | Build hook with stub proof first (always pass), then add Merkle verification |
| Merkle proof in instruction data size limit | Solana tx limit is 1232 bytes; a 20-level tree needs 20×32=640 bytes — fits |
| SIX API mTLS cert format | Test cert call on Phase 0 Day 1 before writing any relay code |
| EURC not on Devnet | Deploy a mock Token-2022 mint with identical extension config |
| Pyth Devnet feed addresses | Fetch from Pyth docs; add to constants.ts immediately |
| Jupiter CPI complexity | Stub Jupiter path for MVP (emit event, don't execute real CPI); implement if time allows |
| FX swap u128 overflow | Test explicitly with amounts near u64::MAX as intermediate values |
| Relay standby coordination | Test simulated primary failure on local validator before Devnet |
| Devnet congestion during demo | Record demo early morning UTC; keep local validator as backup recording env |

---

## History

### Version 3.1
- **Name Change**: Renamed project from Clearflow to Akari.
- **Merkle Compute Fix (Shallow Tree)**: Modified `merkle-tools/build-tree.ts` check to enforce max 8 wallets (3-level tree).
- **Kamino CPI Integration**: Updated phase descriptions to add `klend` crate and Next.js foundation to use `@kamino-finance/klend-sdk`.
- **Jupiter Aggregator CPI**: Updated phase descriptions to add `jupiter-cpi` crate and Next.js foundation to use Jupiter SDK for dynamic accounts.
