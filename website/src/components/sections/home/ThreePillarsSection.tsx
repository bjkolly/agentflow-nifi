'use client';

import Link from 'next/link';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

/* ─── AgentFlow feature boxes (same pattern as DataFoundationSection) ─── */

const AGENTFLOW_FEATURES = [
  {
    title: '7 Agentic Processors',
    description:
      'LLM Inference, Tool Executor, Memory, Planner, Router, HITL, Guardrails',
    color: '#7c3aed',
  },
  {
    title: 'Enterprise Governance',
    description:
      'Audit trails, PII detection, approval gates, cost controls, versioning',
    color: '#3b82f6',
  },
  {
    title: 'Data Foundation',
    description:
      'Acquisition, transformation, normalization, vectorization — end to end',
    color: '#10b981',
  },
  {
    title: 'Production Scale',
    description:
      'NiFi clustering, back-pressure, FlowSync versioned deployment',
    color: '#f59e0b',
  },
];

/* ─── Service list items for each pillar ─── */

const CONSULTING_ITEMS = [
  { name: 'Strategic Needs Assessment', desc: 'Identify where AI drives real business value' },
  { name: 'Business-to-Technical Translation', desc: 'Bridge goals to actionable requirements' },
  { name: 'Feasibility Analysis', desc: 'Expert guidance before you invest' },
  { name: 'Implementation Roadmaps', desc: 'Step-by-step integration strategies' },
];

const MIGRATION_ITEMS = [
  { name: 'Technical Prototype Review', desc: 'Rigorous POC assessment for scalability and fit' },
  { name: 'Code Refactoring & Optimization', desc: 'Faster processing, lower costs' },
  { name: 'Cloud Architecture', desc: 'AWS, GCP, Azure, on-premise — cloud agnostic' },
  { name: 'Fault Tolerance & Reliability', desc: 'Designed for how AI actually fails' },
];

/* ─── Service item component ─── */

function ServiceItem({ name, desc, color }: { name: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <span
        className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-sm font-semibold text-text-primary">{name}</p>
        <p className="text-xs text-text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Pillar card wrapper (uses GlassCard) ─── */

function PillarCard({
  href,
  badgeNum,
  badgeColor,
  title,
  subtitle,
  subtitleColor,
  description,
  items,
  dotColor,
  linkColor,
}: {
  href: string;
  badgeNum: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  subtitleColor: string;
  description: string;
  items: { name: string; desc: string }[];
  dotColor: string;
  linkColor: string;
}) {
  return (
    <Link href={href} className="block">
      <GlassCard className="p-6 h-full hover:-translate-y-1 transition-transform duration-300">
        <div className="flex items-center gap-3 mb-4">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: badgeColor }}
          >
            {badgeNum}
          </span>
          <div>
            <h3 className="text-lg font-bold text-text-primary leading-tight">
              {title}
            </h3>
            <p className="text-sm font-semibold" style={{ color: subtitleColor }}>
              {subtitle}
            </p>
          </div>
        </div>

        <p className="text-sm text-text-muted leading-relaxed mb-5">
          {description}
        </p>

        {items.map((item) => (
          <ServiceItem
            key={item.name}
            name={item.name}
            desc={item.desc}
            color={dotColor}
          />
        ))}

        <div className="mt-4">
          <span className="text-sm font-semibold" style={{ color: linkColor }}>
            Learn more →
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}

/* ─── Main section ─── */

export default function ThreePillarsSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="OUR SERVICES"
          labelColor="#7c3aed"
          title={
            <>
              Three Pillars of{' '}
              <GradientText>Enterprise AI Delivery</GradientText>
            </>
          }
          subtitle="Each offering stands on its own. Together, they cover the full enterprise AI lifecycle. Engage with one, two, or all three — wherever you need us."
        />

        {/* AgentFlow — full-width feature card */}
        <FadeUp>
          <Link href="/solutions" className="block mb-8">
            <GlassCard className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">
                    AgentFlow Platform
                  </h3>
                  <p className="text-base font-semibold text-llm mb-4">
                    Enterprise AI Agent Orchestration
                  </p>
                  <p className="text-base text-text-muted leading-relaxed mb-6">
                    The enterprise AI agent orchestration platform built on
                    Apache NiFi. From raw, unprepared data to production AI
                    agents with governance, compliance, and scale built in from
                    day one.
                  </p>
                  <Button variant="primary" href="/solutions">
                    Explore AgentFlow →
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {AGENTFLOW_FEATURES.map((feat) => (
                    <GlassCard
                      key={feat.title}
                      className="p-4"
                      borderColor={feat.color}
                    >
                      <h4
                        className="text-sm font-bold mb-1"
                        style={{ color: feat.color }}
                      >
                        {feat.title}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {feat.description}
                      </p>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </GlassCard>
          </Link>
        </FadeUp>

        {/* Consulting + Migration — side by side */}
        <FadeUp delay={0.15}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PillarCard
              href="/solutions/consulting"
              badgeNum="01"
              badgeColor="#7c3aed"
              title="AI Business Consulting"
              subtitle="& Strategy"
              subtitleColor="#7c3aed"
              description="We analyze your unique business challenges to determine exactly where and how AI can drive measurable value — before you write a single line of code."
              items={CONSULTING_ITEMS}
              dotColor="#7c3aed"
              linkColor="#7c3aed"
            />

            <PillarCard
              href="/solutions/migration"
              badgeNum="02"
              badgeColor="#3b82f6"
              title="Prototype-to-Production"
              subtitle="Migration"
              subtitleColor="#3b82f6"
              description="We transition your GPT-created prototypes into robust, fully scalable applications ready for real-world production environments."
              items={MIGRATION_ITEMS}
              dotColor="#3b82f6"
              linkColor="#3b82f6"
            />
          </div>
        </FadeUp>

        {/* Combine message */}
        <FadeUp delay={0.25}>
          <div className="text-center mt-12">
            <GlassCard className="inline-block px-8 py-5">
              <p className="text-text-muted text-sm">
                Each service stands alone.{' '}
                <span className="text-text-primary font-semibold">
                  Need more than one?
                </span>{' '}
                They combine seamlessly for full-lifecycle coverage.
              </p>
            </GlassCard>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
