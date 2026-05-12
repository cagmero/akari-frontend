"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Menu, X as XIcon } from "lucide-react";

const NAV_LINKS = [
  { label: "Whitepaper", href: "/whitepaper" },
  { label: "About", href: "/about" },
];

// =============================================
// Floating Glass Navbar
// =============================================
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background:
            scrolled
              ? "rgba(246, 244, 240, 0.7)"
              : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
        }}
      >
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/akari_icon_logo_cropped.png"
                alt="Akari"
                className="w-7 h-7"
              />
              <img
                src="/akari_english_logo_cropped.png"
                alt="Akari"
                className="h-7 w-auto"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                  style={{ color: "var(--text-primary)" }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/waitlist"
                className="ml-4 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: "var(--brand-base)",
                  color: "#ffffff",
                }}
              >
                Join Waitlist
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(13, 17, 23, 0.95)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-3xl font-display font-medium"
                    style={{ color: "var(--text-inverse)" }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  href="/waitlist"
                  onClick={() => setMobileOpen(false)}
                  className="mt-4 px-8 py-3 rounded-xl text-lg font-medium"
                  style={{ backgroundColor: "var(--brand-base)", color: "#ffffff" }}
                >
                  Join Waitlist
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
