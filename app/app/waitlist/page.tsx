"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/components/animations";
import { ArrowRight, Check } from "lucide-react";

// =============================================
// WAITLIST PAGE
// =============================================
export default function WaitlistPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    entity: "",
    location: "",
    volume: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!form.entity.trim()) newErrors.entity = "Entity name is required";
    if (!form.location.trim()) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Simulate API call
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-display-1 font-display mb-4" style={{ color: "var(--text-primary)" }}>
            Reserve Your Seat
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Akari pilot program is accepting a limited number of institutional treasuries.
            Apply for early access below.
          </p>
        </motion.div>

        {!submitted ? (
          <motion.form
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Name */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                placeholder=""
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-glass"
              />
              {errors.name && <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>{errors.name}</p>}
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Corporate Email
              </label>
              <input
                type="email"
                value={form.email}
                placeholder=""
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-glass"
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>{errors.email}</p>}
            </motion.div>

            {/* Entity */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Entity Name
              </label>
              <input
                type="text"
                value={form.entity}
                placeholder=""
                onChange={(e) => setForm({ ...form, entity: e.target.value })}
                className="input-glass"
              />
              {errors.entity && <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>{errors.entity}</p>}
            </motion.div>

            {/* Location */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Entity Location
              </label>
              <input
                type="text"
                value={form.location}
                placeholder=""
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="input-glass"
              />
              {errors.location && <p className="text-xs mt-1" style={{ color: "var(--state-error)" }}>{errors.location}</p>}
            </motion.div>

            {/* Volume */}
            <motion.div variants={fadeInUp}>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Estimated Monthly Volume (USD)
              </label>
              <select
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                className="input-glass appearance-none"
              >
                <option value="">Select range</option>
                <option value="<50K">Under $50K</option>
                <option value="50K-250K">$50K — $250K</option>
                <option value="250K-1M">$250K — $1M</option>
                <option value="1M-5M">$1M — $5M</option>
                <option value="5M+">$5M+</option>
              </select>
            </motion.div>

            <motion.button
              variants={fadeInUp}
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 group"
              style={{ backgroundColor: "var(--brand-base)", color: "var(--brand-foreground)" }}
            >
              <span>Submit Application</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>

            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Your data is kept confidential and used solely for pilot program coordination.
            </p>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 px-6 rounded-3xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border-light)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--state-success)" }}>
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-h2 font-display mb-4" style={{ color: "var(--text-primary)" }}>
              Application Received
            </h2>
            <p className="text-lg mb-6" style={{ color: "var(--text-secondary)" }}>
              Thank you for your interest. We will review your application and reach out
              within 2-3 business days.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: "var(--brand-base)" }}
            >
              <ArrowRight className="w-4 h-4" />
              Return to Home
            </a>
          </motion.div>
        )}
      </div>
    </div>
  );
}
