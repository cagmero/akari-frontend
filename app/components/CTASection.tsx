"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeInUp } from "./animations";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// =============================================
// CTA SECTION (Before Footer)
// =============================================
export default function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section className="relative w-full py-24 sm:py-32 overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand-light), transparent 60%)" }}
        />
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="max-w-narrow mx-auto px-4 sm:px-6 text-center"
      >
        <h2 className="text-h1 font-display mb-6" style={{ color: "var(--text-primary)" }}>
          Treasury infrastructure, rearchitected.
        </h2>
        <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
          Be the first to pilot Akari with your treasury team.
          Pilot seats are limited and structured for institutional onboarding.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/waitlist"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 group"
            style={{ backgroundColor: "var(--brand-base)", color: "var(--brand-foreground)" }}
          >
            <span>Reserve a Pilot Seat</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
