'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import TechStackGrid from '@/components/ui/TechStackGrid';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import { DEPLOY_STAGES, TECH_STACK } from '@/lib/constants';

export default function DeploymentSection() {
  return (
    <section id="deployment" className="py-32">
      <Container>
        <SectionHeading
          label="DEV TO PROD"
          labelColor="text-planner"
          title={
            <>
              From Prototype to <GradientText>Production</GradientText> in Days
            </>
          }
          subtitle="A streamlined path from development to deployment with enterprise-grade tooling at every stage."
        />

        {/* Deploy Stages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16 relative">
          {DEPLOY_STAGES.map((stage, i) => (
            <FadeUp key={stage.title} delay={i * 0.1}>
              <div className="relative">
                <GlassCard className="h-full">
                  <div className="text-3xl mb-4">{stage.icon}</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-text-muted text-sm mb-6 leading-relaxed">
                    {stage.description}
                  </p>
                  <ul className="space-y-2">
                    {stage.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-text-muted"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-planner shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Arrow between stages */}
                {i < DEPLOY_STAGES.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-text-muted text-2xl">
                    &rarr;
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Tech Stack */}
        <FadeUp delay={0.3}>
          <div className="mt-20">
            <h3 className="text-center text-lg font-semibold text-text-primary mb-8">
              Powered by Industry-Standard Technologies
            </h3>
            <TechStackGrid items={TECH_STACK} />
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
