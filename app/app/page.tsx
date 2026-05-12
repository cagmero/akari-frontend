"use client";

import HeroSection from "@/components/HeroSection";
import ValuePropsSection from "@/components/ValuePropsSection";
import VisualArchitecture from "@/components/VisualArchitecture";
import InfrastructureSection from "@/components/InfrastructureSection";
import CTASection from "@/components/CTASection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValuePropsSection />
      <VisualArchitecture />
      <InfrastructureSection />
      <CTASection />
    </>
  );
}
