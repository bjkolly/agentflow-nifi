'use client';

import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export default function ProductHero() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-llm/5 rounded-full blur-[120px]" />
      </div>

      <Container className="relative z-10 text-center">
        <FadeUp>
          <p className="text-xs uppercase tracking-[3px] font-semibold text-llm mb-4">
            Platform
          </p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <h1 className="text-5xl md:text-7xl font-extrabold text-text-primary leading-tight">
            The <GradientText>AgentFlow</GradientText> Platform
          </h1>
        </FadeUp>
        <FadeUp delay={0.2}>
          <p className="text-xl text-text-muted mt-6 max-w-3xl mx-auto leading-relaxed">
            Enterprise AI agent orchestration built on Apache NiFi. Seven purpose-built
            processors, native clustering, complete data provenance, and a visual agent
            designer — everything you need to move AI agents from prototype to production.
          </p>
        </FadeUp>
        <FadeUp delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button variant="primary" href="/contact">
              Request a Demo
            </Button>
            <Button variant="ghost" href="#processors">
              Explore Agents
            </Button>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
