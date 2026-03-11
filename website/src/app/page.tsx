import HeroSection from '@/components/sections/home/HeroSection';
import ProblemSection from '@/components/sections/home/ProblemSection';
import DataFoundationSection from '@/components/sections/home/DataFoundationSection';
import GovernanceSection from '@/components/sections/home/GovernanceSection';
import ComparisonSection from '@/components/sections/home/ComparisonSection';
import CTASection from '@/components/sections/home/CTASection';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg">
      <HeroSection />
      <ProblemSection />
      <DataFoundationSection />
      <GovernanceSection />
      <ComparisonSection />
      <CTASection />
    </main>
  );
}
