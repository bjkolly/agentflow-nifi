'use client';

import dynamic from 'next/dynamic';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import GradientText from '@/components/ui/GradientText';
import TrustBadge from '@/components/ui/TrustBadge';
import FadeUp from '@/components/animations/FadeUp';
import { TRUST_BADGES } from '@/lib/constants';

const Hero3DScene = dynamic(() => import('@/components/three/Hero3DScene'), {
  ssr: false,
});

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* 3D Background */}
      <div
        className="absolute inset-0 z-0"
        aria-label="3D visualization of enterprise AI agent orchestration and data flow pipelines"
        role="img"
      >
        <Hero3DScene />
      </div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-bg/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full pt-32 pb-24">
        <Container>
          <div className="max-w-4xl">
            <FadeUp>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
                Enterprise AI Orchestration:{' '}
                Data is the <GradientText>Foundatation</GradientText> to AI
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="text-xl sm:text-2xl text-text-muted max-w-2xl mb-10 leading-relaxed">
                Enterprise Scale Product Enabled Services — from data preparation to production AI agents. Built on Apache NiFi.
              </p>
            </FadeUp>

            <FadeUp delay={0.2}>
              <div className="flex flex-wrap gap-4 mb-12">
                <Button variant="primary" href="/product">
                  Explore the Platform
                </Button>
                <Button variant="ghost" href="/contact">
                  Request Demo
                </Button>
              </div>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="flex flex-wrap gap-3">
                {TRUST_BADGES.map((badge) => (
                  <TrustBadge key={badge} label={badge} />
                ))}
              </div>
            </FadeUp>
          </div>
        </Container>
      </div>
    </section>
  );
}
