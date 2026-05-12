import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Akari — Compliance-First Treasury on Solana",
  description:
    "Akari replaces slow interbank FX rails with instant, on-chain stablecoin settlement. Built for multinational CFOs and institutional treasuries.",
  keywords: [
    "treasury",
    "stablecoin",
    "Solana",
    "FX",
    "compliance",
    "notional pooling",
    "corporate treasury",
  ],
  authors: [{ name: "Akari Treasury" }],
  openGraph: {
    title: "Akari — Borderless Treasury. Institutional Speed.",
    description:
      "Akari replaces slow interbank FX rails with instant, on-chain stablecoin settlement. Built for multinational CFOs and institutional treasuries.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="min-h-screen antialiased" style={{ fontFamily: "var(--font-inter)" }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
