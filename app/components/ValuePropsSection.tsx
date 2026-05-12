"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "./animations";
import { Droplets, TrendingUp, Shield, ArrowRight } from "lucide-react";

const VALUE_PROPS = [
  {
    title: "Unlock Idle Liquidity",
    description: "End 1-3 day settlement delays. Notionally pool USDC and EURC across subsidiaries in a single vault, with per-entity ledger accuracy.",
    icon: Droplets,
    metric: "<400ms",
    metricLabel: "Cross-Border Settlement",
    color: "#3A506B",
  },
  {
    title: "Transparent FX Pricing",
    description: "Live SIX Web API bid/ask rates, not synthetic mid-prices. Directional pricing (ask for buys, bid for sells) eliminates free arbitrage.",
    icon: TrendingUp,
    metric: "Live",
    metricLabel: "Bid/Ask Oracle Feed",
    color: "#5988A3",
  },
  {
    title: "Embedded Compliance",
    description: "Merkle-proof KYC enforced at the token layer via SPL Token-2022 Transfer Hook. Non-circumventable by design.",
    icon: Shield,
    metric: "Token-2022",
    metricLabel: "Transfer Hook KYC",
    color: "#8CABBF",
  },
];

// =============================================
// VALUE PROPS (Bento Grid)
// =============================================
export default function ValuePropsSection() {
  return (
    <section className="relative w-full py-24 sm:py-32" style={{ background: "var(--background)" }}>
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-h1 font-display mb-4" style={{ color: "var(--text-primary)" }}>
            Why Akari
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Institutional-grade infrastructure for the new era of programmable finance.
            Every line of code written with regulatory clarity in mind.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {VALUE_PROPS.map((prop, index) => (
            <motion.div
              key={prop.title}
              variants={fadeInUp}
              className="group relative overflow-hidden rounded-3xl p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-light)",
              }}
            >
              {/* Subtle brand glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{ background: `radial-gradient(circle at 50% 0%, ${prop.color}10, transparent 60%)` }}
              />

              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-2xl" style={{ backgroundColor: `${prop.color}15` }}>
                <prop.icon className="w-6 h-6" style={{ color: prop.color }} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                {prop.title}
              </h3>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
                {prop.description}
              </p>

              {/* Metric */}
              <div className="flex items-end justify-between pt-6 border-t" style={{ borderColor: "var(--border-light)" }}>
                <div>
                  <div className="text-2xl font-semibold font-display" style={{ color: prop.color }}>
                    {prop.metric}
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {prop.metricLabel}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
