'use client';

import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export default function SolutionsCTA() {
  return (
    <section className="py-24">
      <Container>
        <FadeUp>
          <div className="glass p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-1/4 w-[350px] h-[200px] bg-planner/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-1/4 w-[300px] h-[180px] bg-router/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary">
                {"Let's Solve Your "}
                <GradientText>Challenge</GradientText>
              </h2>
              <p className="text-lg text-text-muted mt-4 max-w-2xl mx-auto">
                Whether you need automated compliance, intelligent support triage, or
                production-grade code generation — our team will architect the right
                AgentFlow solution for your enterprise.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Button variant="primary" href="/contact">
                  Contact Us
                </Button>
                <Button variant="ghost" href="/product">
                  Explore the Platform
                </Button>
              </div>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
