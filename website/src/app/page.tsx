import type { Metadata } from 'next';
import HeroSection from '@/components/sections/home/HeroSection';
import ThreePillarsSection from '@/components/sections/home/ThreePillarsSection';
import ProblemSection from '@/components/sections/home/ProblemSection';
import DataFoundationSection from '@/components/sections/home/DataFoundationSection';
import GovernanceSection from '@/components/sections/home/GovernanceSection';
import ComparisonSection from '@/components/sections/home/ComparisonSection';
import CTASection from '@/components/sections/home/CTASection';

export const metadata: Metadata = {
  title: 'Foundatation | Enterprise AI Orchestration & Governance on Apache NiFi',
  description:
    'Foundatation provides AgentFlow, the only enterprise AI agent orchestration platform built on Apache NiFi. Scale production-grade AI with built-in governance, data provenance, and human-in-the-loop controls.',
  openGraph: {
    title: 'Foundatation | Enterprise AI Orchestration & Governance on Apache NiFi',
    description:
      'The only enterprise AI agent orchestration platform built on Apache NiFi. Built-in governance, data provenance, and human-in-the-loop controls.',
    url: 'https://www.foundatation.com',
    siteName: 'Foundatation',
    images: [{ url: 'https://www.foundatation.com/og-image.png', width: 1200, height: 630, alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI' }],
  },
  alternates: {
    canonical: 'https://www.foundatation.com',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-bg">
      <HeroSection />
      <ThreePillarsSection />
      <ProblemSection />
      <DataFoundationSection />
      <GovernanceSection />
      <ComparisonSection />
      <CTASection />
    </div>
  );
}
