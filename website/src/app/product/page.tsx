import type { Metadata } from 'next';
import ProductHero from '@/components/sections/product/ProductHero';
import ProcessorsSection from '@/components/sections/product/ProcessorsSection';
import ArchitectureSection from '@/components/sections/product/ArchitectureSection';
import ComparisonSection from '@/components/sections/product/ComparisonSection';
import ProductCTA from '@/components/sections/product/ProductCTA';

export const metadata: Metadata = {
  title: 'AgentFlow Platform \u2014 Enterprise AI Agent Orchestration',
  description:
    'AgentFlow: 7 purpose-built agentic processors, native clustering, complete data provenance, and visual agent design. Enterprise AI orchestration built on Apache NiFi.',
  openGraph: {
    title: 'AgentFlow Platform \u2014 Enterprise AI Agent Orchestration',
    description:
      '7 custom processors for LLM inference, tool execution, memory management, task planning, agent routing, human-in-the-loop, and guardrails enforcement.',
    url: 'https://www.foundatation.com/product/',
    siteName: 'Foundatation',
    images: [{ url: 'https://www.foundatation.com/og-image.png', width: 1200, height: 630, alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI' }],
  },
  alternates: {
    canonical: 'https://www.foundatation.com/product/',
  },
};

export default function ProductPage() {
  return (
    <>
      <ProductHero />
      <ProcessorsSection />
      <ArchitectureSection />
      <ComparisonSection />
      <ProductCTA />
    </>
  );
}
