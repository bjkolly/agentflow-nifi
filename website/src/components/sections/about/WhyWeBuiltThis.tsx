'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import FadeUp from '@/components/animations/FadeUp';

const REASONS = [
  {
    title: 'The Data Foundation',
    color: '#3b82f6',
    description:
      'Enterprises already invested billions in data infrastructure. NiFi is the proven backbone for data flow across 75%+ of Fortune 100. We build ON that foundation, not beside it.',
  },
  {
    title: 'The Governance Gap',
    color: '#7c3aed',
    description:
      'AI agent frameworks ship fast but leave enterprises exposed. No audit trails, no approval gates, no compliance controls. AgentFlow fills that gap with NiFi\u2019s battle-tested provenance.',
  },
  {
    title: 'The AI Opportunity',
    color: '#10b981',
    description:
      'The companies that govern AI well will win. AgentFlow gives your teams the tools to build, deploy, and scale AI agents with the same rigor as your data pipelines.',
  },
];

export default function WhyWeBuiltThis() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="The Story"
          title="Why We Built AgentFlow"
          subtitle="Three truths drive everything we do."
        />

        <div className="grid md:grid-cols-3 gap-8">
          {REASONS.map((reason, i) => (
            <FadeUp key={reason.title} delay={i * 0.1}>
              <GlassCard className="p-8 h-full" borderColor={reason.color}>
                <h3 className="text-xl font-bold text-text-primary mb-4">
                  {reason.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {reason.description}
                </p>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </Container>
    </section>
  );
}
