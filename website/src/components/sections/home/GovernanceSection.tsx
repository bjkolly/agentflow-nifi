'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import ProvenanceTerminal from '@/components/ui/ProvenanceTerminal';
import ApprovalCardMockup from '@/components/ui/ApprovalCardMockup';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';

export default function GovernanceSection() {
  return (
    <section id="governance" className="py-32">
      <Container>
        <SectionHeading
          label="GOVERNANCE & SAFETY"
          labelColor="text-guard"
          title={
            <>
              Every Decision. <GradientText>Every Trace.</GradientText> Every Safeguard.
            </>
          }
          subtitle="Enterprise AI demands accountability. AgentFlow provides complete data provenance, human-in-the-loop controls, and configurable guardrails at every step."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
          {/* Left: Provenance Terminal */}
          <FadeUp>
            <div className="space-y-6">
              <ProvenanceTerminal />
              <div className="space-y-3 pl-1">
                <h3 className="text-lg font-semibold text-text-primary">
                  Complete Data Provenance
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Every agent decision, every LLM call, every tool invocation is recorded with
                  full lineage tracking. Know exactly what happened, when, and why -- powered
                  by NiFi&apos;s battle-tested provenance engine.
                </p>
              </div>
            </div>
          </FadeUp>

          {/* Right: Approval Card + Description */}
          <FadeUp delay={0.15}>
            <div className="space-y-6">
              <ApprovalCardMockup />
              <div className="space-y-3 pl-1">
                <h3 className="text-lg font-semibold text-text-primary">
                  Human-in-the-Loop Controls
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  Configure approval gates for high-stakes decisions. Route sensitive agent
                  actions to human reviewers with full context. Define guardrails that prevent
                  unauthorized actions before they happen -- not after.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
