import type { Metadata } from 'next';
import Container from '@/components/layout/Container';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import TrustBadge from '@/components/ui/TrustBadge';
import FadeUp from '@/components/animations/FadeUp';
import Button from '@/components/ui/Button';
import { TRUST_BADGES, PROCESSORS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Apache NiFi AI Processors \u2014 Enterprise AI Agent Orchestration',
  description:
    'AgentFlow extends Apache NiFi with 7 purpose-built AI processors for LLM inference, tool execution, memory management, task planning, agent routing, human-in-the-loop, and guardrails enforcement. Production-grade AI orchestration for NiFi users.',
  keywords: [
    'Apache NiFi AI',
    'NiFi AI processors',
    'NiFi LLM integration',
    'Apache NiFi agents',
    'NiFi machine learning',
    'NiFi AI orchestration',
    'AgentFlow NiFi',
    'NiFi enterprise AI',
    'Apache NiFi custom processors',
    'NiFi data provenance AI',
  ],
  openGraph: {
    title: 'Apache NiFi AI Processors \u2014 7 Custom Agentic Processors for NiFi',
    description:
      'Extend Apache NiFi with purpose-built AI agent processors. LLM inference, tool execution, memory, planning, routing, human-in-the-loop, and guardrails.',
    url: 'https://www.foundatation.com/nifi/',
    siteName: 'Foundatation',
    images: [
      {
        url: 'https://www.foundatation.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Apache NiFi AI Processors by Foundatation',
      },
    ],
  },
  alternates: {
    canonical: 'https://www.foundatation.com/nifi/',
  },
};

const NIFI_ADVANTAGES = [
  {
    title: 'Native NiFi Integration',
    description:
      'AgentFlow processors are real NiFi processors. They appear in the NiFi canvas, use NiFi controller services, and follow NiFi conventions. No wrappers, no bridges, no hacks.',
    icon: '\u{1F9E9}',
  },
  {
    title: 'Data Provenance for AI',
    description:
      'Every LLM call, tool execution, and agent routing decision is recorded in NiFi provenance. Full audit trail for every AI agent action with queryable lineage.',
    icon: '\u{1F50D}',
  },
  {
    title: 'Back-Pressure for LLM APIs',
    description:
      'NiFi back-pressure prevents runaway API spend. Set token budgets and rate limits that throttle gracefully instead of failing or racking up surprise bills.',
    icon: '\u{1F6E1}\uFE0F',
  },
  {
    title: 'Zero-Code Scaling',
    description:
      'NiFi native clustering. Scale your AI agent workflows across multiple nodes with zero code changes. ZooKeeper coordination handles failover automatically.',
    icon: '\u{1F4C8}',
  },
  {
    title: 'FlowSync Deployment',
    description:
      'Version-controlled flow templates. Deploy AI agent workflows from dev to staging to production with versioned blueprints and CI/CD integration.',
    icon: '\u{1F680}',
  },
  {
    title: 'Enterprise Auth & Security',
    description:
      'Inherit NiFi LDAP/SSO authentication, role-based access control, and encrypted data at rest. FedRAMP-ready, HIPAA-compliant infrastructure.',
    icon: '\u{1F512}',
  },
];

export default function NifiPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-llm/5 via-transparent to-transparent" />
        <Container className="relative z-10">
          <FadeUp>
            <p className="text-xs uppercase tracking-[3px] font-semibold text-llm mb-6">
              Apache NiFi + AI
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6 max-w-4xl">
              Apache NiFi <GradientText>AI Processors</GradientText> for Enterprise Agent Orchestration
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-xl text-text-muted max-w-3xl mb-10 leading-relaxed">
              AgentFlow extends Apache NiFi with 7 purpose-built agentic processors.
              Add LLM inference, tool execution, memory management, and human-in-the-loop
              controls to your existing NiFi infrastructure. No migration required.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div className="flex flex-wrap gap-4 mb-12">
              <Button variant="primary" href="/contact">
                Request Demo
              </Button>
              <Button variant="ghost" href="/product">
                View All Processors
              </Button>
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="flex flex-wrap gap-3">
              {TRUST_BADGES.map((badge) => (
                <TrustBadge key={badge} label={badge} />
              ))}
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* Why NiFi for AI */}
      <section className="py-24">
        <Container>
          <div className="text-center mb-16">
            <FadeUp>
              <p className="text-xs uppercase tracking-[3px] font-semibold text-tool mb-3">
                Why NiFi
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary">
                Why Apache NiFi is the{' '}
                <GradientText>Ideal Foundation</GradientText> for AI Agents
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-lg text-text-muted mt-4 max-w-2xl mx-auto">
                NiFi has 10+ years of enterprise production use across 75% of the Fortune 100.
                AgentFlow brings that same reliability to AI agent orchestration.
              </p>
            </FadeUp>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NIFI_ADVANTAGES.map((item, i) => (
              <FadeUp key={item.title} delay={i * 0.08}>
                <GlassCard className="p-6 h-full">
                  <span className="text-3xl mb-4 block">{item.icon}</span>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {item.description}
                  </p>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* The 7 Processors */}
      <section className="py-24 bg-bg2/50">
        <Container>
          <div className="text-center mb-16">
            <FadeUp>
              <p className="text-xs uppercase tracking-[3px] font-semibold text-llm mb-3">
                Custom Processors
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary">
                7 Purpose-Built <GradientText>AI Processors</GradientText> for NiFi
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-lg text-text-muted mt-4 max-w-2xl mx-auto">
                Drop these processors into your NiFi canvas and start building
                enterprise AI agent workflows immediately.
              </p>
            </FadeUp>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {PROCESSORS.map((proc, i) => (
              <FadeUp key={proc.name} delay={i * 0.08}>
                <GlassCard className="p-6 h-full" borderColor={proc.color}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{proc.icon}</span>
                    <h3 className="text-lg font-bold text-text-primary">
                      {proc.name}
                    </h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-4">
                    {proc.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {proc.relationships.map((rel) => (
                      <span
                        key={rel.name}
                        className="text-xs px-2 py-1 rounded-full font-mono"
                        style={{
                          color: rel.color,
                          backgroundColor: `${rel.color}15`,
                        }}
                      >
                        {rel.name}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* Existing NiFi Ecosystem */}
      <section className="py-24">
        <Container>
          <div className="text-center mb-16">
            <FadeUp>
              <p className="text-xs uppercase tracking-[3px] font-semibold text-planner mb-3">
                Compatibility
              </p>
            </FadeUp>
            <FadeUp delay={0.1}>
              <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary">
                Works With Your{' '}
                <GradientText>Existing NiFi</GradientText> Infrastructure
              </h2>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-lg text-text-muted mt-4 max-w-2xl mx-auto">
                AgentFlow processors integrate seamlessly with the hundreds of processors
                already in your NiFi instance. Combine AI agent capabilities with your existing
                data ingestion, transformation, and routing workflows.
              </p>
            </FadeUp>
          </div>

          <FadeUp delay={0.3}>
            <GlassCard className="p-8 max-w-4xl mx-auto">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                {[
                  { label: 'Data Ingestion', examples: 'GetFile, ConsumeKafka, GetHTTP, FetchS3Object, ListenHTTP' },
                  { label: 'Transformation', examples: 'ConvertRecord, JoltTransformJSON, TransformXml, ReplaceText' },
                  { label: 'Database', examples: 'ExecuteSQL, PutDatabaseRecord, QueryDatabaseTable, PutSQL' },
                  { label: 'Routing', examples: 'RouteOnAttribute, RouteOnContent, ValidateRecord, MergeContent' },
                ].map((cat) => (
                  <div key={cat.label}>
                    <h4 className="text-sm font-bold text-text-primary mb-2">
                      {cat.label}
                    </h4>
                    <p className="text-xs text-text-dim leading-relaxed">
                      {cat.examples}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </FadeUp>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20">
        <Container>
          <FadeUp>
            <GlassCard className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-llm/10 via-planner/10 to-tool/10" />
              <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
                  Bring <GradientText>AI Agents</GradientText> to Your NiFi Infrastructure
                </h2>
                <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
                  See how AgentFlow processors integrate with your existing NiFi
                  deployment. Schedule a technical deep-dive with our team.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button variant="primary" href="/contact">
                    Request Demo
                  </Button>
                  <Button variant="ghost" href="/product">
                    Explore the Platform
                  </Button>
                </div>
              </div>
            </GlassCard>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
