import type { Metadata } from 'next';
import AboutHero from '@/components/sections/about/AboutHero';
import WhyWeBuiltThis from '@/components/sections/about/WhyWeBuiltThis';
import StatsSection from '@/components/sections/about/StatsSection';
import PrinciplesSection from '@/components/sections/about/PrinciplesSection';
import AboutCTA from '@/components/sections/about/AboutCTA';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Foundatation \u2014 Data is the foundation to AI. We build enterprise-grade AI agent orchestration on Apache NiFi.',
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <WhyWeBuiltThis />
      <StatsSection />
      <PrinciplesSection />
      <AboutCTA />
    </>
  );
}
