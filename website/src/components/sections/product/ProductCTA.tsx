'use client';

import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export default function ProductCTA() {
  return (
    <section className="py-24">
      <Container>
        <FadeUp>
          <div className="glass p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-llm/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary">
                Ready to See It <GradientText>In Action</GradientText>?
              </h2>
              <p className="text-lg text-text-muted mt-4 max-w-2xl mx-auto">
                Schedule a live demo with our engineering team. See how AgentFlow transforms
                AI agent development from prototype scripts to production-grade orchestration.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Button variant="primary" href="/contact">
                  Schedule a Demo
                </Button>
                <Button variant="ghost" href="/solutions">
                  View Solutions
                </Button>
              </div>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
