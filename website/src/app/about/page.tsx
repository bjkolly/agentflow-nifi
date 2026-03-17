import type { Metadata } from 'next';
import AboutHero from '@/components/sections/about/AboutHero';
import WhyWeBuiltThis from '@/components/sections/about/WhyWeBuiltThis';
import StatsSection from '@/components/sections/about/StatsSection';
import PrinciplesSection from '@/components/sections/about/PrinciplesSection';
import AboutCTA from '@/components/sections/about/AboutCTA';

export const metadata: Metadata = {
  title: 'About Foundatation \u2014 Our Mission & Story',
  description:
    'Foundatation makes enterprise AI governable, scalable, and auditable from day one. Built on Apache NiFi with 10+ years of enterprise production heritage.',
  openGraph: {
    title: 'About Foundatation \u2014 Our Mission & Story',
    description:
      'We believe every enterprise can harness AI \u2014 but most aren\u2019t data-ready. Foundatation bridges the gap from scattered data to production AI agents.',
    url: 'https://www.foundatation.com/about/',
    siteName: 'Foundatation',
    images: [{ url: 'https://www.foundatation.com/og-image.png', width: 1200, height: 630, alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI' }],
  },
  alternates: {
    canonical: 'https://www.foundatation.com/about/',
  },
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
