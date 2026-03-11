'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import FadeUp from '@/components/animations/FadeUp';
import { NIFI_MAPPING } from '@/lib/constants';

export default function NifiMappingSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="NiFi Foundation"
          labelColor="#06b6d4"
          title="How NiFi Becomes AgentFlow"
          subtitle="Every NiFi concept maps to an AgentFlow capability. Ten years of battle-tested enterprise features, repurposed for AI."
        />

        <FadeUp>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left font-semibold text-memory">
                      NiFi Concept
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-llm">
                      AgentFlow Mapping
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-text-muted">
                      Why It Matters
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {NIFI_MAPPING.map((row, i) => (
                    <tr
                      key={row.nifiConcept}
                      className={`border-b border-border/30 ${
                        i % 2 === 0 ? 'bg-surface/50' : 'bg-bg/50'
                      } hover:bg-surface2/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-memory font-medium whitespace-nowrap">
                        {row.nifiConcept}
                      </td>
                      <td className="px-6 py-4 text-text-primary font-medium whitespace-nowrap">
                        {row.agentflowMapping}
                      </td>
                      <td className="px-6 py-4 text-text-muted leading-relaxed">
                        {row.whyItMatters}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </FadeUp>
      </Container>
    </section>
  );
}
