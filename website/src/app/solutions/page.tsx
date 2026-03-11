import SolutionsHero from '@/components/sections/solutions/SolutionsHero';
import UseCasesSection from '@/components/sections/solutions/UseCasesSection';
import IndustriesSection from '@/components/sections/solutions/IndustriesSection';
import DeploymentSection from '@/components/sections/solutions/DeploymentSection';
import SolutionsCTA from '@/components/sections/solutions/SolutionsCTA';

export const metadata = {
  title: 'Solutions',
  description:
    'AgentFlow solutions for financial services, healthcare, defense, and enterprise. Pre-built patterns for research, support, compliance, and code generation.',
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
