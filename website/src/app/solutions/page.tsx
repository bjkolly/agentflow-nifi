import type { Metadata } from 'next';
import SolutionsHero from '@/components/sections/solutions/SolutionsHero';
import UseCasesSection from '@/components/sections/solutions/UseCasesSection';
import IndustriesSection from '@/components/sections/solutions/IndustriesSection';
import DeploymentSection from '@/components/sections/solutions/DeploymentSection';
import SolutionsCTA from '@/components/sections/solutions/SolutionsCTA';

export const metadata: Metadata = {
  title: 'Solutions \u2014 AI Agents for Finance, Healthcare & Defense',
  description:
    'AgentFlow solutions for financial services, healthcare, defense, and enterprise. Pre-built patterns for automated research, customer support, compliance review, and code generation.',
  openGraph: {
    title: 'Solutions \u2014 AI Agents for Finance, Healthcare & Defense',
    description:
      'Purpose-built AI agent patterns for regulated industries. FedRAMP-ready, HIPAA-compliant, with full audit trails and human-in-the-loop controls.',
    url: 'https://www.foundatation.com/solutions/',
    siteName: 'Foundatation',
    images: [{ url: 'https://www.foundatation.com/og-image.png', width: 1200, height: 630, alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI' }],
  },
  alternates: {
    canonical: 'https://www.foundatation.com/solutions/',
  },
};

export default function SolutionsPage() {
  return (
    <>
      <SolutionsHero />
      <UseCasesSection />
      <IndustriesSection />
      <DeploymentSection />
      <SolutionsCTA />
    </>
  );
}
