'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import StaggerChildren from '@/components/animations/StaggerChildren';
import { STATS, NIFI_MAPPING } from '@/lib/constants';
import { motion } from 'framer-motion';
import { itemVariants } from '@/components/animations/StaggerChildren';

export default function WhyNifiSection() {
  return (
    <section id="why-nifi" className="py-32">
      <Container>
        <SectionHeading
          label="WHY APACHE NIFI"
          labelColor="text-router"
          title={
            <>
              Built on a <GradientText>Battle-Tested Foundation</GradientText>
            </>
          }
          subtitle="Apache NiFi has powered mission-critical data flows for over a decade. AgentFlow extends this proven foundation into the AI agent era."
        />

        {/* Stats Row */}
        <FadeUp>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 mb-16">
            {STATS.map((stat) => (
              <StatCard key={stat.label} number={stat.number} label={stat.label} />
            ))}
          </div>
        </FadeUp>

        {/* NiFi Mapping Table */}
        <FadeUp delay={0.2}>
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-4 pr-6 text-sm font-semibold text-text-primary uppercase tracking-wider">
                      NiFi Concept
                    </th>
                    <th className="pb-4 pr-6 text-sm font-semibold text-text-primary uppercase tracking-wider">
                      AgentFlow Mapping
                    </th>
                    <th className="pb-4 text-sm font-semibold text-text-primary uppercase tracking-wider">
                      Why It Matters
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {NIFI_MAPPING.map((row, i) => (
                    <tr
                      key={row.nifiConcept}
                      className={`border-b border-border/50 ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <td className="py-4 pr-6 text-text-primary font-medium">
                        {row.nifiConcept}
                      </td>
                      <td className="py-4 pr-6 text-llm font-mono text-sm">
                        {row.agentflowMapping}
                      </td>
                      <td className="py-4 text-text-muted text-sm">
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
