import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          subtle: "var(--surface-subtle)",
          inverse: "var(--surface-inverse)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          inverse: "var(--text-inverse)",
          muted: "var(--text-muted)",
          placeholder: "var(--text-placeholder)",
        },
        border: {
          light: "var(--border-light)",
          medium: "var(--border-medium)",
          brand: "var(--border-brand)",
          strong: "var(--border-strong)",
        },
        brand: {
          DEFAULT: "var(--brand-base)",
          light: "var(--brand-light)",
          lighter: "var(--brand-lighter)",
          dark: "var(--brand-dark)",
          foreground: "var(--brand-foreground)",
        },
        state: {
          success: "var(--state-success)",
          error: "var(--state-error)",
          warning: "var(--state-warning)",
          info: "var(--state-info)",
        },
        syntax: {
          keyword: "var(--syntax-keyword)",
          string: "var(--syntax-string)",
          comment: "var(--syntax-comment)",
          number: "var(--syntax-number)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "serif"],
        mono: ["ui-monospace", "monospace"],
      },
      logo: {
        mark: "var(--logo-mark)",
        text: "var(--logo-text)",
      },
      fontSize: {
        hero: ["5rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-1": ["4rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-2": ["3rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "500" }],
        h1: ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "500" }],
        h2: ["2rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "500" }],
        h3: ["1.5rem", { lineHeight: "1.4", fontWeight: "500" }],
        h4: ["1.25rem", { lineHeight: "1.5", fontWeight: "500" }],
        body: ["1rem", { lineHeight: "1.7" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        caption: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.02em" }],
        overline: ["0.6875rem", { lineHeight: "1.5", letterSpacing: "0.1em", fontWeight: "600" }],
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2.5rem",
        xl: "4rem",
        "2xl": "6rem",
        "3xl": "8rem",
      },
      maxWidth: {
        content: "1200px",
        narrow: "720px",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        glass: "0 4px 30px rgba(0, 0, 0, 0.15)",
        "glass-hover": "0 8px 40px rgba(0, 0, 0, 0.2)",
        glow: "0 0 40px rgba(58, 80, 107, 0.15), 0 0 80px rgba(58, 80, 107, 0.10)",
        "glow-hover": "0 0 50px rgba(58, 80, 107, 0.2), 0 0 100px rgba(58, 80, 107, 0.12)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        "gradient-flow": "gradientFlow 8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        gradientFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
