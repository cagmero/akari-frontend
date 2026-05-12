"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { fadeInUp } from "./animations";
import { ArrowRight, ArrowUpRight } from "lucide-react";

// =============================================
// HERO SECTION
// =============================================
export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-light), transparent 70%)", transform: "scale(1.5)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, var(--brand-lighter), transparent 70%)", transform: "scale(1.2)" }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 200, x: Math.random() * 1000 - 500 }}
            animate={{
              opacity: [0, 0.4, 0],
              y: [-200, -400, -600],
              x: [Math.random() * 500 - 250, Math.random() * 500 - 250, Math.random() * 500 - 250],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-full w-0.5 h-0.5 rounded-full"
            style={{ backgroundColor: "var(--brand-base)" }}
          />
        ))}
      </div>

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">

          {/* Headline */}
          <h1 className="text-hero font-display mb-6 tracking-tight" style={{ color: "var(--text-primary)" }}>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="block"
            >
              Borderless Treasury.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="block mt-2"
            >
              Institutional Speed.
            </motion.span>
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            Akari replaces slow interbank FX rails with instant, on-chain stablecoin settlement.
            Built for multinational CFOs and institutional treasuries — not crypto enthusiasts.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/whitepaper"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 group"
              style={{ backgroundColor: "var(--brand-base)", color: "var(--brand-foreground)" }}
            >
              <span>Read Whitepaper</span>
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/waitlist"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 group border"
              style={{ borderColor: "var(--border-medium)", color: "var(--text-primary)" }}
            >
              <span>Join the Waitlist</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: "<400ms", label: "Settlement Finality" },
              { value: "99.99%", label: "Uptime SLA" },
              { value: "$0.00025", label: "Avg. Transaction Cost" },
              { value: "100%", label: "On-Chain Auditable" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
