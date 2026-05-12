"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeInUp } from "./animations";

// =============================================
// Minimal Footer
// =============================================
export default function Footer() {
  return (
    <footer className="relative w-full border-t border-white/10 py-16 sm:py-20">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand Column */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <img
              src="/akari_icon_logo_cropped.png"
              alt="Akari"
              className="w-6 h-6"
            />
            <img
              src="/akari_english_logo_cropped.png"
              alt="Akari"
              className="h-6 w-auto"
            />
          </motion.div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link href="/whitepaper" className="text-sm transition-colors duration-300 hover:text-brand-light" style={{ color: "var(--text-secondary)"}}>
              Whitepaper
            </Link>
            <Link href="/about" className="text-sm transition-colors duration-300 hover:text-brand-light" style={{ color: "var(--text-secondary)"}}>
              About
            </Link>
            <Link href="/waitlist" className="text-sm transition-colors duration-300 hover:text-brand-light" style={{ color: "var(--text-secondary)"}}>
              Waitlist
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-white/10">
          <p className="text-xs" style={{ color: "var(--text-muted)"}}
          >
            &copy; {new Date().getFullYear()} Akari Treasury. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/whitepaper" className="text-xs transition-colors duration-300 hover:text-brand-light" style={{ color: "var(--text-muted)"}}>
              Read the Whitepaper
            </Link>
            <Link href="/waitlist" className="text-xs transition-colors duration-300 hover:text-brand-light" style={{ color: "var(--text-muted)"}}>
              Join the Waitlist
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
