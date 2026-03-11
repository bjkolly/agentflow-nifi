'use client';

import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';

export default function AboutHero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-llm/5 via-transparent to-transparent" />

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <p className="text-xs uppercase tracking-[3px] font-semibold text-llm mb-6">
              Our Mission
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.1] mb-8">
              Data is the{' '}
              <GradientText>Foundatation</GradientText>
              {' '}to AI
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-xl text-text-muted max-w-3xl mx-auto mb-8 leading-relaxed">
              We believe every enterprise can harness AI — but most aren&apos;t data-ready.
              Foundatation takes organizations on the complete journey: from scattered,
              messy data to AI-ready pipelines and production agents. That&apos;s our
              Enterprise Scale Product Enabled Services.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="glass inline-block px-8 py-4 max-w-2xl">
              <p className="text-lg text-text-primary font-medium italic">
                &ldquo;To make enterprise AI governable, scalable, and auditable from day one.&rdquo;
              </p>
            </div>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
