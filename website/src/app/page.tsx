import HeroSection from '@/components/sections/home/HeroSection';
import ProblemSection from '@/components/sections/home/ProblemSection';
import WhyNifiSection from '@/components/sections/home/WhyNifiSection';
import ArchitectureOverview from '@/components/sections/home/ArchitectureOverview';
import ProcessorShowcase from '@/components/sections/home/ProcessorShowcase';
import GovernanceSection from '@/components/sections/home/GovernanceSection';
import ComparisonSection from '@/components/sections/home/ComparisonSection';
import DeploymentSection from '@/components/sections/home/DeploymentSection';
import CTASection from '@/components/sections/home/CTASection';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <HeroSection />
      <ProblemSection />
      <WhyNifiSection />
      <ArchitectureOverview />
      <ProcessorShowcase />
      <GovernanceSection />
      <ComparisonSection />
      <DeploymentSection />
      <CTASection />
    </main>
  );
}
