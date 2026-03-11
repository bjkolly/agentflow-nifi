'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import FadeUp from '@/components/animations/FadeUp';

const PRINCIPLES = [
  {
    icon: '\u{1F3D7}\uFE0F',
    title: 'Build on Proven Foundations',
    description:
      'We don\u2019t reinvent the wheel. Apache NiFi has 10+ years of enterprise battle-testing.',
    color: '#3b82f6',
  },
  {
    icon: '\u{1F50D}',
    title: 'Transparency First',
    description:
      'Every agent action is recorded, queryable, and auditable. No black boxes.',
    color: '#7c3aed',
  },
  {
    icon: '\u{1F6E1}\uFE0F',
    title: 'Safety by Design',
    description:
      'Guardrails, approval gates, and cost controls are not afterthoughts \u2014 they\u2019re core architecture.',
    color: '#ef4444',
  },
  {
    icon: '\u{1F680}',
    title: 'Enterprise Scale',
    description:
      'From single instance to multi-node clusters. Zero code changes required.',
    color: '#10b981',
  },
];

export default function PrinciplesSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="What We Stand For"
          labelColor="#f59e0b"
          title="Our Principles"
          subtitle="The beliefs that guide every design decision."
        />

        <div className="grid md:grid-cols-2 gap-8">
          {PRINCIPLES.map((principle, i) => (
            <FadeUp key={principle.title} delay={i * 0.1}>
              <GlassCard className="p-8 h-full" borderColor={principle.color}>
                <div className="text-4xl mb-4">{principle.icon}</div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {principle.title}
                </h3>
                <p className="text-text-muted leading-relaxed">
                  {principle.description}
                </p>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </Container>
    </section>
  );
}
