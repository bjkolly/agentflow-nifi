'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import StatCard from '@/components/ui/StatCard';
import FadeUp from '@/components/animations/FadeUp';
import { DATA_JOURNEY_STAGES, DATA_FOUNDATION_STATS } from '@/lib/constants';

export default function DataFoundationSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="THE FOUNDATATION DIFFERENCE"
          labelColor="#f59e0b"
          title={
            <>
              Your Data Isn&apos;t Ready for AI.{' '}
              <GradientText>We Fix That.</GradientText>
            </>
          }
          subtitle="Most agentic AI companies need clean, API-ready data. We start where your data actually is — messy, siloed, and scattered — and build the foundation for AI."
        />

        {/* End-to-end approach explanation */}
        <FadeUp delay={0.1}>
          <GlassCard className="p-8 max-w-4xl mx-auto mb-16 text-center">
            <p className="text-lg text-text-muted leading-relaxed">
              Foundatation delivers{' '}
              <span className="text-text-primary font-semibold">
                Enterprise Scale Product Enabled Services
              </span>{' '}
              that take organizations on the complete journey from raw,
              unprepared data to production AI agents. While competitors hand you
              a framework and wish you luck, we deliver outcomes.
            </p>
          </GlassCard>
        </FadeUp>

        {/* Data Journey Stages — 4-column grid with arrow connectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-2 items-stretch mb-16">
          {DATA_JOURNEY_STAGES.map((stage, i) => (
            <div key={stage.title} className="contents">
              <FadeUp delay={0.15 + i * 0.1} className="md:col-span-1">
                <GlassCard
                  className="p-4 h-full flex flex-col items-center text-center"
                  borderColor={stage.color}
                >
                  <div className="text-3xl mb-2">{stage.icon}</div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{ color: stage.color }}
                  >
                    {stage.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {stage.description}
                  </p>
                </GlassCard>
              </FadeUp>

              {/* Arrow connector — visible on md+ between cards */}
              {i < DATA_JOURNEY_STAGES.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-1">
                  <span className="text-xl text-text-muted/50 select-none">
                    &rarr;
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <FadeUp delay={0.5}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {DATA_FOUNDATION_STATS.map((stat) => (
              <StatCard
                key={stat.label}
                number={stat.number}
                label={stat.label}
              />
            ))}
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
