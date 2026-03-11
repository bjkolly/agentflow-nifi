'use client';

import Image from 'next/image';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import FadeUp from '@/components/animations/FadeUp';
import { ARCHITECTURE_LAYERS } from '@/lib/constants';

export default function ArchitectureSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="Architecture"
          labelColor="#3b82f6"
          title="Layered Enterprise Architecture"
          subtitle="From the visual interface to the infrastructure layer, every component is designed for production reliability."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Architecture layers */}
          <FadeUp>
            <div className="space-y-4">
              {ARCHITECTURE_LAYERS.map((layer, i) => (
                <div key={layer.name} className="relative">
                  <div
                    className="glass p-5 rounded-xl"
                    style={{ borderLeft: `4px solid ${layer.color}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      <h3
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: layer.color }}
                      >
                        {layer.name}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {layer.pills.map((pill) => (
                        <span
                          key={pill}
                          className="text-xs px-3 py-1.5 rounded-full bg-surface2 text-text-muted border border-border/50"
                        >
                          {pill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Connector line between layers */}
                  {i < ARCHITECTURE_LAYERS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-px h-4 bg-border-light/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </FadeUp>

          {/* Architecture diagram */}
          <FadeUp delay={0.2}>
            <GlassCard className="p-6 flex items-center justify-center">
              <Image
                src="/architecture.svg"
                alt="AgentFlow architecture diagram"
                width={560}
                height={400}
                className="w-full h-auto opacity-90"
              />
            </GlassCard>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
