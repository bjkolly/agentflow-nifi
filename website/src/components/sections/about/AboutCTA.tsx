'use client';

import Container from '@/components/layout/Container';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export default function AboutCTA() {
  return (
    <section className="py-24">
      <Container>
        <div className="glass p-12 md:p-16 text-center">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Join Us in Building the Future of{' '}
              <GradientText>Enterprise AI</GradientText>
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
              Whether you&apos;re exploring AI orchestration or ready to deploy at scale,
              we&apos;d love to hear from you.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" href="/contact">
                Get in Touch
              </Button>
              <Button variant="ghost" href="/product">
                Explore the Platform
              </Button>
            </div>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
