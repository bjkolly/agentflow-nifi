'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import FadeUp from '@/components/animations/FadeUp';
import { DEPLOY_STAGES } from '@/lib/constants';

const stageColors = ['#3b82f6', '#f59e0b', '#10b981'];

export default function DeploymentSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="Deployment"
          labelColor="#10b981"
          title="From Dev to Production"
          subtitle="A clear path from single-instance development to multi-node production clusters with zero code changes."
        />

        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 items-stretch">
            {DEPLOY_STAGES.map((stage, i) => (
              <div key={stage.title} className="flex items-stretch">
                <GlassCard
                  borderColor={stageColors[i]}
                  className="p-6 md:p-8 flex flex-col w-full"
                >
                  <span className="text-3xl mb-3">{stage.icon}</span>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed mb-4">
                    {stage.description}
                  </p>
                  <ul className="space-y-2 mt-auto">
                    {stage.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-text-muted"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: stageColors[i] }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Arrow connector between stages */}
                {i < DEPLOY_STAGES.length - 1 && (
                  <div className="hidden md:flex items-center justify-center px-2 shrink-0">
                    <svg
                      className="w-6 h-8 text-text-dim"
                      viewBox="0 0 24 32"
                      fill="none"
                    >
                      <path
                        d="M2 16h18M16 8l6 8-6 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
