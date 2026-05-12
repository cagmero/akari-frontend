"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeInUp, staggerContainer } from "./animations";

// =============================================
// VISUAL ARCHITECTURE (Animated Tech Stack)
// =============================================
export default function VisualArchitecture() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="relative w-full py-24 sm:py-32 overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 opacity-50">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(var(--border-light) 1px, transparent 1px), linear-gradient(90deg, var(--border-light) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16 sm:mb-20 max-w-3xl mx-auto"
        >
          <h2 className="text-h1 font-display mb-4" style={{ color: "var(--text-primary)" }}>
            The Architecture of Trust
          </h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Every layer — from the Solana consensus to the Transfer Hook — designed for
            deterministic settlement and regulatory alignment.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* KYC & Compliance Layer */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-overline uppercase tracking-widest font-semibold" style={{ color: "var(--brand-base)" }}>
                  KYC & Compliance Layer
                </span>
              </div>
              <ArchitectureNode
                title="SPL Token-2022"
                subtitle="Transfer Hook"
                description="Merkle-proof KYC enforced at the token layer. Non-circumventable compliance."
                color="#8CABBF"
                icon={<ShieldIcon />}
              />
              <ArchitectureNode
                title="Travel Rule"
                subtitle="≥ $3,000 PDA"
                description="Automatic PDA creation for high-value transfers with full VASP metadata."
                color="#8CABBF"
                icon={<GlobeIcon />}
              />
              <ArchitectureNode
                title="AML Velocity"
                subtitle="Per-Subsidiary"
                description="Daily transfer limits with Unix timestamp day-boundary resets."
                color="#8CABBF"
                icon={<ClockIcon />}
              />
            </motion.div>

            {/* Settlement Engine */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-overline uppercase tracking-widest font-semibold" style={{ color: "var(--brand-base)" }}>
                  Settlement Engine
                </span>
              </div>
              <ArchitectureNode
                title="Notional Pool Vault"
                subtitle="Single Vault / Multi-Currency"
                description="One PoolVault PDA aggregating USDC and EURC. Per-subsidiary ledger entries — no per-entity vaults."
                color="#3A506B"
                icon={<DatabaseIcon />}
              />
              <ArchitectureNode
                title="Sharded Epoch Slippage"
                subtitle="Per-Currency Pair"
                description="EUR_USD and CHF_USD EpochState PDAs enable parallel FX execution without write contention."
                color="#3A506B"
                icon={<LayersIcon />}
              />
              <ArchitectureNode
                title="Jupiter CPI Fallback"
                subtitle="External Liquidity"
                description="When internal pool has insufficient counterparty notional, route to Jupiter via remaining_accounts."
                color="#3A506B"
                icon={<ZapIcon />}
              />
            </motion.div>

            {/* Oracle & Yield Layer */}
            <motion.div variants={fadeInUp} className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-overline uppercase tracking-widest font-semibold" style={{ color: "var(--brand-base)" }}>
                  Oracle & Yield
                </span>
              </div>
              <ArchitectureNode
                title="SIX Web API"
                subtitle="Live Bid / Ask / Mid"
                description="Primary oracle fetching institutional-grade EUR/USD and CHF/USD spot rates with directional pricing."
                color="#5988A3"
                icon={<SignalIcon />}
              />
              <ArchitectureNode
                title="Oracle Relay Lock"
                subtitle="60s TTL / Redundancy"
                description="On-chain leader election between primary and standby relay instances. Guaranteed failover."
                color="#5988A3"
                icon={<LockIcon />}
              />
              <ArchitectureNode
                title="Yield Router"
                subtitle="Steakhouse / Kamino CPI"
                description="Idle balances route to compliant lending venues. 5% APY stub with real CPI deposit via klend crate."
                color="#5988A3"
                icon={<LeafIcon />}
              />
            </motion.div>
          </div>

          {/* Connection Lines (Visual) */}
          <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, var(--brand-light), transparent)", opacity: 0.3 }}
          />
        </motion.div>
      </div>
    </section>
  );
}

function ArchitectureNode({
  title,
  subtitle,
  description,
  color,
  icon,
}: {
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative group rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-light)",
      }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}15, transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>
              {title}
            </h4>
            <p className="text-xs font-medium mb-2" style={{ color }}>
              {subtitle}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Icons ---
function ShieldIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function GlobeIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" /></svg>; }
function ClockIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function DatabaseIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" /></svg>; }
function LayersIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>; }
function ZapIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function SignalIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.07c3.9-3.9 10.24-3.9 14.14 0" /></svg>; }
function LockIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>; }
function LeafIcon() { return <svg className="w-5 h-5" style={{ color: "var(--brand-base)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>; }
