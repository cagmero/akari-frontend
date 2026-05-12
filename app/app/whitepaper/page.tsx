"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/animations";
import { ChevronRight, BookOpen, Code, Shield, Layers, ExternalLink } from "lucide-react";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "kyc-compliance", label: "KYC & Compliance", icon: Shield },
  { id: "fx-swap", label: "FX Swap Engine", icon: Layers },
  { id: "oracle-relay", label: "Oracle & Relay", icon: Code },
  { id: "yield-router", label: "Yield Router", icon: Layers },
  { id: "technical-constraints", label: "Technical Constraints", icon: Code },
  { id: "deployment", label: "Deployment Order", icon: Code },
];

const CODE_BLOCKS = {
  merkle: `// transfer_hook::execute — Merkle Proof Verification
pub fn execute(ctx: Context<Execute>, amount: u64, proof: Vec<[u8; 32]>) -> Result<()> {
    let root = ctx.accounts.kyc_merkle_root.root;
    let destination = ctx.accounts.destination_account.owner;

    // Simplified leaf for MVP
    let leaf = solana_program::hash::hash(destination.as_ref()).to_bytes();

    // Canonical sort-before-hash
    let mut current = leaf;
    for proof_node in proof.iter() {
        let (left, right) = if current <= *proof_node {
            (current, *proof_node)
        } else {
            (*proof_node, current)
        };
        let mut combined = [0u8; 64];
        combined[..32].copy_from_slice(&left);
        combined[32..].copy_from_slice(&right);
        current = solana_program::hash::hash(&combined).to_bytes();
    }

    require!(current == root, TransferHookError::UnauthorizedRecipient);
    Ok(())
}`,
  fxSwap: `// Directional pricing in fx_swap
let oracle_price = if from_currency == CURRENCY_USDC {
    six_price_feed.ask  // Buying EURC, pay ask
} else {
    six_price_feed.bid  // Selling EURC, receive bid
};

// Per-swap slippage check
require!(
    received >= expected * (10_000 - max_slippage_bps) / 10_000,
    AkariError::SlippageExceeded
);

// Epoch budget check (sharded per pair)
let epoch_budget = (epoch_state.max_epoch_slippage_bps as u128)
    * (epoch_state.vault_nav_snapshot_usdc as u128)
    / 10_000u128;
require!(
    (epoch_state.epoch_accumulated_slippage as u128) + (this_slippage as u128)
        <= epoch_budget,
    AkariError::EpochSlippageBudgetExhausted
);`,
  oracleLock: `// OracleRelayLock — leader election
pub fn acquire_relay_lock(ctx: Context<AcquireRelayLock>) -> Result<()> {
    let lock = &mut ctx.accounts.oracle_relay_lock;
    let clock = Clock::get()?;
    let caller = ctx.accounts.caller.key();

    let lock_expired = clock.unix_timestamp - lock.acquired_at >= lock.ttl;
    let caller_holds = lock.holder == caller;

    require!(lock_expired || caller_holds, AkariError::RelayLockHeldByAnother);

    lock.holder = caller;
    lock.acquired_at = clock.unix_timestamp;
    lock.renewal_count += 1;
    Ok(())
}`,
  yieldDeploy: `// deploy_yield — Kamino CPI integration
pub fn deploy_yield(ctx: Context<DeployYield>, currency: u8, venue: [u8; 16], amount: u64) -> Result<()> {
    let idle = compute_idle_balance(&ctx.accounts.pool_vault, currency)?;
    require!(amount <= idle, AkariError::InsufficientIdleBalance);

    // Kamino CPI: PoolVault PDA acts as signer
    let cpi_accounts = kamino::cpi::accounts::Deposit {
        market: ctx.accounts.kamino_market.to_account_info(),
        reserve: ctx.accounts.kamino_reserve.to_account_info(),
        lending_market_authority: ctx.accounts.lending_market_authority.to_account_info(),
        lending_pool: ctx.accounts.lending_pool.to_account_info(),
        lending_pool_token_account: ctx.accounts.lending_pool_token_account.to_account_info(),
        owner: ctx.accounts.pool_vault.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.kamino_program.to_account_info(), cpi_accounts);
    kamino::cpi::deposit(cpi_ctx, amount)?;

    emit!(YieldDeployedEvent { currency, venue, amount, timestamp: Clock::get()?.unix_timestamp });
    Ok(())
}`,
};

// =============================================
// WHITEPAPER PAGE
// =============================================
export default function WhitepaperPage() {
  const [activeSection, setActiveSection] = useState("overview");

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
      const sections = SECTIONS.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: "var(--background)" }}>
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sticky Sidebar TOC */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-28">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Contents
              </h3>
              <nav className="space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                        activeSection === section.id
                          ? "font-medium"
                          : "hover:bg-white/50"
                      }`}
                      style={{
                        color: activeSection === section.id ? "var(--brand-base)" : "var(--text-secondary)",
                        background: activeSection === section.id ? "var(--surface-subtle)" : "transparent",
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: activeSection === section.id ? "var(--brand-base)" : "var(--text-muted)" }} />
                      {section.label}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Title */}
              <div className="mb-12 pb-8 border-b" style={{ borderColor: "var(--border-light)" }}>
                <h1 className="text-display-1 font-display mb-4" style={{ color: "var(--text-primary)" }}>
                  Akari Technical Whitepaper
                </h1>
                <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                  Compliance-first notional cash pooling on Solana.
                  Version 3.0 — Final Architecture.
                </p>
              </div>

              {/* Overview */}
              <Section id="overview" title="Overview">
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-primary)" }}>
                  Akari is a notional stablecoin cash pooling system built on Solana for multinational
                  corporate treasury. It replaces slow, opaque interbank FX rails with instant, programmable,
                  fully auditable on-chain settlement using USDC and EURC.
                </p>
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  Three architectural principles guide every design decision:
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Regulatory alignment over regulatory bypass — compliance is embedded, not bolted on",
                    "Deterministic settlement over optimistic execution — every outcome is verifiable on-chain",
                    "Institutional UX over crypto-native complexity — CFOs, not degens, are the target user",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "var(--brand-base)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <InfoCard title="System Overview" type="info">
                  Two Anchor programs govern the system: <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>akari</code> (business logic) and
                  <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}> transfer_hook</code> (KYC enforcement). They communicate through shared PDA addresses,
                  not CPI calls — this keeps the hook non-circumventable.
                </InfoCard>
              </Section>

              {/* KYC & Compliance */}
              <Section id="kyc-compliance" title="KYC & Compliance Architecture">
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  Legacy DeFi compliance gates at the application layer. A user can always bypass the UI and
                  interact with the program directly. Akari moves compliance to the token layer via SPL Token-2022
                  Transfer Hook, making circumvention mathematically impossible.
                </p>

                <h4 className="text-h4 font-display mb-3" style={{ color: "var(--text-primary)" }}>Merkle-Proof KYC</h4>
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  A single <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>KycMerkleRoot</code> account stores the current root hash of up to 8 verified wallets (a
                  maximum 3-level Merkle tree). This limit ensures the proof array passed to the transfer hook
                  fits within Solana compute budget constraints.
                </p>
                <CodeBlock code={CODE_BLOCKS.merkle} language="rust" />

                <h4 className="text-h4 font-display mb-3 mt-8" style={{ color: "var(--text-primary)" }}>AML & Travel Rule</h4>
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  Each <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>SubsidiaryAccount</code> tracks daily_transfer_total and last_transfer_day. Transfers above
                  the configured threshold automatically create a <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>TravelRuleRecord</code> PDA with full
                  sender and receiver VASP metadata.
                </p>
              </Section>

              {/* FX Swap */}
              <Section id="fx-swap" title="FX Swap Engine">
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  The FX swap engine is the core differentiator. Instead of using a synthetic mid-price,
                  Akari uses directional bid/ask from SIX — ask when buying EURC, bid when selling. This
                  mirrors real FX desk convention and eliminates the structural arbitrage of mid-only pricing.
                </p>
                <CodeBlock code={CODE_BLOCKS.fxSwap} language="rust" />
                <h4 className="text-h4 font-display mb-3 mt-8" style={{ color: "var(--text-primary)" }}>Sharded Epoch Slippage</h4>
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  Previously, all FX swaps wrote to a single <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>PoolVault.epoch_accumulated_slippage</code>,
                  serializing concurrent swaps. Now each currency pair has its own <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>EpochState</code> PDA.
                  EUR_USD and CHF_USD swaps execute in parallel with zero contention.
                </p>
                <InfoCard title="Performance" type="success">
                  Sharded state enables true parallel execution across currency pairs. A single swap processes
                  in approximately 400ms on Solana Devnet, with finality in under 1 second.
                </InfoCard>
              </Section>

              {/* Oracle & Relay */}
              <Section id="oracle-relay" title="Oracle & Relay Lock">
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  The SIX Web API is the primary oracle for EUR/USD and CHF/USD spot rates. A redundant
                  relay architecture with on-chain leader election via <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}>OracleRelayLock</code> ensures zero
                  downtime during relay failover.
                </p>
                <CodeBlock code={CODE_BLOCKS.oracleLock} language="rust" />
                <h4 className="text-h4 font-display mb-3 mt-8" style={{ color: "var(--text-primary)" }}>Redundancy Model</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: "Primary Relay", value: "Polls every 30s, acquires/renews lock" },
                    { label: "Standby Relay", value: "Checks lock every 15s, takes over if expired" },
                    { label: "TTL", value: "60 seconds — dead relay loses lock automatically" },
                    { label: "Fallback", value: "Pyth on-chain price feed if SIX is stale" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--brand-base)" }}>
                        {item.label}
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Yield Router */}
              <Section id="yield-router" title="Yield Router Integration">
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  Idle balances in the pool vault earn zero. The Yield Router deploys conservative portions
                  to compliant lending venues via the Steakhouse model. Kamino CPI integration allows
                  direct deposit from the PoolVault PDA, with market accounts fetched dynamically via the
                  <code className="font-mono text-sm" style={{ color: "var(--brand-base)" }}> @kamino-finance/klend-sdk</code>.
                </p>
                <CodeBlock code={CODE_BLOCKS.yieldDeploy} language="rust" />
                <InfoCard title="Conservative Deployment" type="warning">
                  Yield deployment is capped at 10% of total pool notional to ensure sufficient liquidity
                  remains for settlement and FX swaps. The 5% APY is a stub for hackathon demo; real
                  yields vary by market condition and venue.
                </InfoCard>
              </Section>

              {/* Technical Constraints */}
              <Section id="technical-constraints" title="Technical Constraints">
                <div className="space-y-4">
                  {[
                    { label: "Max Wallets in Merkle Tree", value: "8 wallets (3-level tree, ~3 proof nodes)" },
                    { label: "Max SIX Feed Staleness", value: "90 seconds before fallback to Pyth" },
                    { label: "Oracle Relay Lock TTL", value: "60 seconds" },
                    { label: "Per-Swap Max Slippage", value: "50 bps (0.5%)" },
                    { label: "Per-Epoch Max Slippage", value: "100 bps (1%) per currency pair" },
                    { label: "Travel Rule Threshold", value: "$3,000 USD equivalent" },
                    { label: "Daily Transfer Limit", value: "Configurable per subsidiary (default: $50,000)" },
                    { label: "Protocol Transfer Fee", value: "0.05% via Token-2022 TransferFeeConfig" },
                    { label: "Yield Deployment Cap", value: "10% of pool total notional" },
                    { label: "Account Version", value: "version: u8 on all structs, lazy migration enabled" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 px-4 rounded-lg"
                      style={{ background: "var(--surface)" }}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</span>
                      <span className="text-sm font-mono" style={{ color: "var(--brand-base)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Deployment */}
              <Section id="deployment" title="Deployment Order">
                <p className="text-body leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                  The following order must be followed for a clean deployment on Solana Devnet:
                </p>
                <ol className="space-y-3 list-decimal list-inside">
                  {[
                    "anchor build — ensure clean compilation of both programs",
                    "anchor deploy --program-name transfer_hook — record Program ID",
                    "anchor deploy --program-name akari — record Program ID",
                    "anchor idl init for both programs",
                    "ts-node scripts/setup-devnet.ts — initialize_pool, initialize_oracle_relay_lock, initialize_epoch_state ×2",
                    "ts-node merkle-tools/build-tree.ts — build initial Merkle tree",
                    "ts-node merkle-tools/update-root.ts — submit root to on-chain KycMerkleRoot",
                    "ts-node scripts/seed-subsidiaries.ts — register initial subsidiaries",
                    "Start primary oracle relay and standby instance",
                    "cd app && npm run dev — start Next.js dashboard",
                  ].map((step, i) => (
                    <li key={i} className="text-sm pl-4" style={{ color: "var(--text-secondary)" }}>
                      <span className="font-mono text-xs mr-2" style={{ color: "var(--brand-base)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Section>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id="{id}" className="mb-16 scroll-mt-28">
      <h2 className="text-h2 font-display mb-6 pb-4 border-b" style={{ color: "var(--text-primary)", borderColor: "var(--border-light)" }}>
        {title}
      </h2>
      <div className="prose prose-slate max-w-none">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="my-6 rounded-xl overflow-hidden border" style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}>
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ background: "var(--surface-elevated)", borderColor: "var(--border-light)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <span className="text-xs font-mono ml-2" style={{ color: "var(--text-muted)" }}>{language}</span>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InfoCard({ title, children, type = "info" }: { title: string; children: React.ReactNode; type?: "info" | "success" | "warning" | "error" }) {
  const borderColors: Record<string, string> = {
    info: "var(--brand-base)",
    success: "var(--state-success)",
    warning: "var(--state-warning)",
    error: "var(--state-error)",
  };
  return (
    <div className="my-6 p-5 rounded-xl border-l-4" style={{ background: "var(--surface-elevated)", borderLeftColor: borderColors[type] || borderColors.info }}>
      <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h4>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{children}</div>
    </div>
  );
}
