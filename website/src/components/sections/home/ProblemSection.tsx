'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import { PROBLEM_ITEMS } from '@/lib/constants';

export default function ProblemSection() {
  return (
    <section id="problem" className="py-32">
      <Container>
        <SectionHeading
          label="THE PROBLEM"
          labelColor="text-guard"
          title={
            <>
              Solving the AI <GradientText>Governance Gap</GradientText> with AgentFlow
            </>
          }
          subtitle="Most AI agent frameworks are built for demos, not production. The gap between prototype and enterprise deployment is massive."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
          {/* AgentFlow Way - Good (left) */}
          <FadeUp>
            <GlassCard borderColor="border-planner">
              <h3 className="text-xl font-semibold text-planner mb-6">
                The AgentFlow Way
              </h3>
              <ul className="space-y-4">
                {PROBLEM_ITEMS.good.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-planner text-lg mt-0.5 shrink-0">&#10003;</span>
                    <span className="text-text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </FadeUp>

          {/* Status Quo - Bad (right) */}
          <FadeUp delay={0.15}>
            <GlassCard borderColor="border-guard">
              <h3 className="text-xl font-semibold text-guard mb-6">
                The Status Quo
              </h3>
              <ul className="space-y-4">
                {PROBLEM_ITEMS.bad.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-guard text-lg mt-0.5 shrink-0">&#10007;</span>
                    <span className="text-text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
