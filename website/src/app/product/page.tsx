import ProductHero from '@/components/sections/product/ProductHero';
import ProcessorsSection from '@/components/sections/product/ProcessorsSection';
import ArchitectureSection from '@/components/sections/product/ArchitectureSection';
import ComparisonSection from '@/components/sections/product/ComparisonSection';
import ProductCTA from '@/components/sections/product/ProductCTA';

export const metadata = {
  title: 'Platform',
  description:
    'AgentFlow — Enterprise AI agent orchestration built on Apache NiFi. 7 custom processors, native clustering, complete data provenance.',
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
