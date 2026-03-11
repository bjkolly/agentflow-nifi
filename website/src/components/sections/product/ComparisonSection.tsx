'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import ComparisonTable from '@/components/ui/ComparisonTable';

export default function ComparisonSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="Comparison"
          labelColor="#10b981"
          title="How AgentFlow Compares"
          subtitle="The only AI agent framework with enterprise-grade provenance, governance, and clustering built in from day one."
        />

        <GlassCard className="p-6 md:p-8">
          <ComparisonTable />
        </GlassCard>
      </Container>
    </section>
  );
}
