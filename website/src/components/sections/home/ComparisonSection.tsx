'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import ComparisonTable from '@/components/ui/ComparisonTable';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';

export default function ComparisonSection() {
  return (
    <section id="comparison" className="py-32">
      <Container>
        <SectionHeading
          label="COMPETITIVE LANDSCAPE"
          labelColor="text-tool"
          title={
            <>
              How AgentFlow <GradientText>Compares</GradientText>
            </>
          }
          subtitle="See how AgentFlow stacks up against other AI agent frameworks and orchestration platforms."
        />

        <FadeUp>
          <GlassCard className="mt-16 overflow-hidden">
            <ComparisonTable />
          </GlassCard>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="text-center text-text-muted mt-8 text-sm">
            AgentFlow is the only platform built on a{' '}
            <span className="text-text-primary font-medium">
              10+ year enterprise-proven foundation
            </span>
          </p>
        </FadeUp>
      </Container>
    </section>
  );
}
