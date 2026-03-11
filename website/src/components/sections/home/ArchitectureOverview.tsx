'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import { ARCHITECTURE_LAYERS } from '@/lib/constants';

const LAYER_COLORS: Record<string, string> = {
  llm: 'border-l-llm',
  tool: 'border-l-tool',
  memory: 'border-l-memory',
  planner: 'border-l-planner',
  router: 'border-l-router',
  hitl: 'border-l-hitl',
  guard: 'border-l-guard',
};

const PILL_COLORS: Record<string, string> = {
  llm: 'bg-llm/15 text-llm',
  tool: 'bg-tool/15 text-tool',
  memory: 'bg-memory/15 text-memory',
  planner: 'bg-planner/15 text-planner',
  router: 'bg-router/15 text-router',
  hitl: 'bg-hitl/15 text-hitl',
  guard: 'bg-guard/15 text-guard',
};

export default function ArchitectureOverview() {
  return (
    <section id="architecture" className="py-32">
      <Container>
        <SectionHeading
          label="ARCHITECTURE"
          labelColor="text-memory"
          title={
            <>
              A <GradientText>Layered Platform</GradientText> for Enterprise AI
            </>
          }
          subtitle="Four architectural layers provide separation of concerns, security boundaries, and operational clarity."
        />

        <FadeUp>
          <GlassCard className="mt-16">
            <div className="space-y-4">
              {ARCHITECTURE_LAYERS.map((layer, i) => {
                const colorClass = LAYER_COLORS[layer.color] || 'border-l-router';
                const pillColor = PILL_COLORS[layer.color] || 'bg-router/15 text-router';

                return (
                  <div
                    key={layer.name}
                    className={`border-l-4 ${colorClass} bg-white/[0.02] rounded-r-lg p-5 transition-colors hover:bg-white/[0.04]`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h3 className="text-text-primary font-semibold min-w-[200px]">
                        {layer.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {layer.pills.map((pill) => (
                          <span
                            key={pill}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${pillColor}`}
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <img
              src="/architecture.svg"
              alt="Architecture"
              className="w-full mt-8"
            />
          </GlassCard>
        </FadeUp>
      </Container>
    </section>
  );
}
