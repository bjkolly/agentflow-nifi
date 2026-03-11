'use client';

import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export default function SolutionsHero() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-planner/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-router/5 rounded-full blur-[100px]" />
      </div>

      <Container className="relative z-10 text-center">
        <FadeUp>
          <p className="text-xs uppercase tracking-[3px] font-semibold text-planner mb-4">
            Solutions
          </p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-extrabold text-text-primary leading-tight">
            Solutions for Every{' '}
            <GradientText>Enterprise</GradientText>
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-xl text-text-muted mt-6 max-w-3xl mx-auto leading-relaxed">
            Pre-built agent orchestration patterns for research, support, compliance, and
            code generation. Proven across financial services, healthcare, defense, and
            enterprise verticals.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button variant="primary" href="/contact">
              Talk to Sales
            </Button>
            <Button variant="ghost" href="#use-cases">
              Explore Use Cases
            </Button>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
