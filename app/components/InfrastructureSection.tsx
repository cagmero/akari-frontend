"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeInUp, staggerContainer } from "./animations";

const INFRASTRUCTURE = [
  { name: "Solana Foundation", role: "Token-2022 showcase, high-throughput treasury" },
  { name: "AMINA Bank", role: "KYC-embedded DeFi, regulatory alignment, PermanentDelegate" },
  { name: "SIX BFI", role: "Live bid/ask oracle feed, institutional pricing data" },
  { name: "Steakhouse Financial", role: "Dual-layer slippage, yield router integration" },
  { name: "Solstice Labs", role: "Yield router custody, institutional lending thesis" },
  { name: "Fireblocks", role: "Typed MPC custody interface, Gasless design pattern" },
  { name: "Softstack", role: "Contract design review, jurisdictional alignment" },
];

// =============================================
// INFRASTRUCTURE SECTION
// =============================================
export default function InfrastructureSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="relative w-full py-24 sm:py-32" style={{ background: "var(--background)" }}>
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8" ref={ref}>
        {/* Section Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-h1 font-display mb-4" style={{ color: "var(--text-primary)" }}>
            Built On
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Leveraging infrastructure and tools from institutions that understand the intersection of
            regulatory clarity and cryptographic verifiability.
          </p>
        </motion.div>

        {/* Infrastructure Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {INFRASTRUCTURE.map((item, index) => (
            <motion.div
              key={item.name}
              variants={fadeInUp}
              whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col rounded-2xl p-6 transition-all duration-300 border group cursor-default"
              style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
            >
              <div className="mb-4">
                <h4 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</h4>
              </div>
              <p className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{item.role}</p>
              <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--border-light)" }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--brand-base)" }}>
                  Technology
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
