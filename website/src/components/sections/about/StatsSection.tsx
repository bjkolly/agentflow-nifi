'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import StatCard from '@/components/ui/StatCard';
import FadeUp from '@/components/animations/FadeUp';
import { STATS } from '@/lib/constants';

export default function StatsSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="By The Numbers"
          labelColor="#06b6d4"
          title="Enterprise-Proven Scale"
          subtitle="Built on a platform trusted by the world's largest organizations."
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <FadeUp key={stat.label} delay={i * 0.1}>
              <StatCard number={stat.number} label={stat.label} />
            </FadeUp>
          ))}
        </div>
      </Container>
    </section>
  );
}
