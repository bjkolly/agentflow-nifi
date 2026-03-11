'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import FadeUp from '@/components/animations/FadeUp';
import { USE_CASES } from '@/lib/constants';

function StepFlow({ steps }: { steps: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-1 flex-wrap mt-5">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: step.color }}
            />
            <span className="text-xs font-medium text-text-primary whitespace-nowrap">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <svg
              className="w-5 h-3 text-text-dim shrink-0 mx-0.5"
              viewBox="0 0 20 12"
              fill="none"
            >
              <path
                d="M1 6h16M13 1l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24">
      <Container>
        <SectionHeading
          label="Use Cases"
          labelColor="#7c3aed"
          title="Pre-Built Agent Patterns"
          subtitle="Production-tested orchestration patterns that accelerate your AI deployment from months to weeks."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {USE_CASES.map((uc, i) => (
            <FadeUp key={uc.id} delay={i * 0.1}>
              <GlassCard className="p-6 md:p-8 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-xl font-bold text-text-primary">{uc.title}</h3>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-llm/10 text-llm whitespace-nowrap shrink-0">
                    {uc.pattern}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-text-muted leading-relaxed flex-1">
                  {uc.description}
                </p>

                {/* Step flow */}
                <StepFlow steps={uc.steps} />

                {/* Footer stats */}
                <div className="flex items-center gap-6 mt-5 pt-5 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-dim">Agents:</span>
                    <span className="text-sm font-bold text-text-primary">
                      {uc.agentCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-text-dim">Guardrails:</span>
                    {uc.guardrails.map((g) => (
                      <span
                        key={g}
                        className="text-xs px-2 py-0.5 rounded-full border border-guard/30 text-guard"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </Container>
    </section>
  );
}
