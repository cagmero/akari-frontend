"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, AnimatedSection, Divider } from "@/components/animations";
import { Target, Users, Lightbulb, Globe, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <section className="relative w-full py-20 sm:py-28">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-hero font-display mb-6" style={{ color: "var(--text-primary)" }}>
              The Mission
            </h1>
            <p className="text-xl sm:text-2xl leading-relaxed max-w-3xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Replace opaque interbank rails with instant, programmable, and verifiably compliant
              settlement — without asking CFOs to become crypto experts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="py-20 sm:py-28">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <AnimatedSection className="order-2 lg:order-1">
              <h2 className="text-h1 font-display mb-6" style={{ color: "var(--text-primary)" }}>
                A Treasury OS for the Programmable Era
              </h2>
              <div className="space-y-4 text-body leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <p>
                  Multinational corporations manage billions in idle cash across subsidiary accounts.
                  Each cross-border transfer incurs 2-5% in opaque correspondent banking fees,
                  with settlement taking 1-3 business days.
                </p>
                <p>
                  Akari replaces this with stablecoin-based notional pooling on Solana.
                  A single vault aggregates USDC and EURC. Subsidiary balances are ledger entries,
                  not separate vaults. FX swaps settle in under 400ms.
                </p>
                <p>
                  And most importantly: compliance is not an afterthought.
                  It is built into the token layer itself via SPL Token-2022 Transfer Hook,
                  making KYC/AML enforcement mathematically non-circumventable.
                </p>
              </div>
            </AnimatedSection>
            <AnimatedSection className="order-1 lg:order-2" delay={0.2}>
              <div
                className="rounded-3xl p-8 sm:p-10 relative overflow-hidden"
                style={{ background: "var(--surface)", border: "1px solid var(--border-light)" }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 -z-10 opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-light), transparent)" }} />
                <h3 className="text-h3 font-display mb-8" style={{ color: "var(--text-primary)" }}>Core Principles</h3>
                {[
                  { title: "Deterministic Settlement", desc: "Every outcome verifiable on-chain", icon: Target },
                  { title: "Embedded Compliance", desc: "Regulatory alignment at the token layer", icon: Heart },
                  { title: "CFO-First Design", desc: "No crypto jargon, no wallet complexity", icon: Users },
                  { title: "Auditability by Default", desc: "All state transitions on Solana ledger", icon: Lightbulb },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 mb-6 last:mb-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--surface-subtle)" }}>
                      <item.icon className="w-5 h-5" style={{ color: "var(--brand-base)" }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{item.title}</h4>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Institutional Alignment */}
      <section className="py-20 sm:py-28" style={{ background: "var(--surface-elevated)" }}>
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-h1 font-display mb-4" style={{ color: "var(--text-primary)" }}>Institutional Alignment</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Designed with, not against, the institutions that govern capital.
            </p>
          </AnimatedSection>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "FINMA Regulatory Design",
                description: "PermanentDelegate extension provides court-ordered asset recovery capability, satisfying Swiss regulatory expectations for deterministic enforcement.",
                icon: ShieldIcon,
              },
              {
                title: "TradFi Workflow Integration",
                description: "Bid/ask pricing mirrors FX desk convention. Settlement language uses deterministic and capital efficiency rather than decentralized and yield farming.",
                icon: GlobeIcon,
              },
              {
                title: "Audit-First Architecture",
                description: "All operations emit structured events. The dashboard provides a real-time audit trail. Every transfer, swap, and yield harvest is inspectable on-chain.",
                icon: LightbulbIcon,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 border"
                style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--surface-subtle)" }}>
                  <item.icon className="w-6 h-6" style={{ color: "var(--brand-base)" }} />
                </div>
                <h3 className="text-h4 font-display mb-3" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team / Vision */}
      <section className="py-20 sm:py-28">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <h2 className="text-h1 font-display mb-6" style={{ color: "var(--text-primary)" }}>
                Built for Treasury, Not Trading
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
                The Akari protocol was designed by a team that has spent years building for
                institutional finance. We understand that treasury controllers do not want to think
                about gas fees, private keys, or smart contract risk — they want their capital to
                move securely, reliably, and in compliance with local regulation.
              </p>
              <p className="text-lg leading-relaxed mb-12" style={{ color: "var(--text-secondary)" }}>
                Every protocol decision — from the Merkle-proof KYC to the sharded slippage engine —
                was made with that user in mind. The result is a system that feels like modern banking
                infrastructure, because it is.
              </p>
            </AnimatedSection>

            {/* Partner Mentions */}
            <div className="mt-16 pt-12 border-t" style={{ borderColor: "var(--border-light)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: "var(--text-muted)" }}>
                Aligned With
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                {["Solana Foundation", "AMINA Bank", "SIX BFI", "Steakhouse Financial", "Solstice Labs", "Fireblocks", "Softstack"].map((name) => (
                  <span key={name} className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function GlobeIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LightbulbIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548 5.478A1 1 0 0113.06 18h-2.122a1 1 0 01-1.015-.953L9.494 13.66A5.003 5.003 0 006.5 11h2.364z" />
    </svg>
  );
}
