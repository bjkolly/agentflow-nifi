import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import TrustBadge from '@/components/ui/TrustBadge';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export const metadata = {
  title: 'Prototype-to-Production Migration',
  description:
    'We transition your AI prototypes into robust, scalable, fault-tolerant applications built on cloud infrastructure designed to handle real-world failure gracefully.',
};

const CLOUD_BADGES = ['Cloud Agnostic', 'AWS', 'Google Cloud', 'Azure', 'On-Premise'];

const SERVICES = [
  {
    icon: '🔬',
    title: 'Technical Prototype Review',
    color: '#3b82f6',
    description:
      'We conduct rigorous technical reviews of your proof of concepts, assessing each for scalability, feasibility, and alignment with your business goals. We help you double down on the strongest candidates and confidently shelve the rest — so your engineering resources go where they\u2019ll have the most impact.',
  },
  {
    icon: '🚀',
    title: 'Enterprise-Grade Scaling',
    color: '#7c3aed',
    description:
      'We transition your initial prototypes into robust, fully scalable applications ready for production environments. What works for 10 users needs fundamentally different architecture for 10,000 — across any cloud provider or on-premise infrastructure.',
  },
  {
    icon: '⚡',
    title: 'Code Refactoring & Optimization',
    color: '#f59e0b',
    description:
      'We rewrite and optimize your application\u2019s codebase to improve processing speed, enhance language efficiency, and reduce operational costs. Cleaner code means faster execution, fewer bugs, and lower cloud bills — often dramatically.',
  },
  {
    icon: '🏗️',
    title: 'Infrastructure & Cloud Architecture',
    color: '#10b981',
    description:
      'We design secure, resilient infrastructure across AWS, GCP, Azure, or on-premise — tailored to your requirements, not locked to a single vendor. Every architecture decision accounts for your specific business constraints, compliance needs, and growth trajectory.',
  },
  {
    icon: '🛡️',
    title: 'Fault Tolerance & Reliability',
    color: '#06b6d4',
    description:
      'AI systems fail differently than traditional software — an LLM call times out, a model hallucinates, an API returns garbage. Most prototypes don\u2019t handle any of this. We design for failure from the start: intelligent retry logic, graceful degradation, circuit breakers, fallback paths, and monitoring that catches problems before your users do.',
  },
  {
    icon: '🔍',
    title: 'Expert Architecture Review',
    color: '#ec4899',
    description:
      'Already built something? We stress-test your application\u2019s design against real-world production demands — identifying risks, bottlenecks, single points of failure, and optimization opportunities before they become production incidents.',
  },
];

const BEFORE_ITEMS = [
  'Works on your laptop with test data',
  'Single user, single process',
  'LLM call fails? The whole thing breaks',
  'No retry logic, no fallback paths',
  'Hardcoded keys, no secrets management',
  'No monitoring, no alerting',
  'Locked to one cloud (or none)',
];

const AFTER_ITEMS = [
  'Handles production traffic at scale',
  'Multi-user, load-balanced, fault-tolerant',
  'Intelligent retries, circuit breakers, graceful degradation',
  'Designed for how AI actually fails — not just how it succeeds',
  'Secure secrets management and config',
  'Full observability — dashboards, logs, alerts',
  'Cloud-agnostic — AWS, GCP, Azure, or on-premise',
];

const FAULT_CARDS = [
  {
    title: 'Intelligent Retry Logic',
    description:
      'Not every failure should be retried the same way. We build context-aware retry strategies that know the difference between a transient timeout and a fundamental model error.',
    color: '#3b82f6',
  },
  {
    title: 'Graceful Degradation',
    description:
      'When a component fails, the system should degrade gracefully — not crash entirely. We design fallback paths and reduced-functionality modes so users experience a hiccup, not an outage.',
    color: '#10b981',
  },
  {
    title: 'Circuit Breakers & Health Checks',
    description:
      'Continuous monitoring detects degraded services before they cascade. Circuit breakers stop bad calls from piling up. Automated health checks route traffic away from unhealthy nodes.',
    color: '#f59e0b',
  },
];

export default function MigrationPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16">
        <Container>
          <FadeUp>
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-base font-bold text-white bg-router">
                02
              </span>
              <p className="text-xs uppercase tracking-[3px] font-semibold text-router">
                Prototype-to-Production Migration
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] mb-6 max-w-4xl">
              Your prototype works.{' '}
              <GradientText>Now make it production-ready.</GradientText>
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-xl text-text-muted max-w-2xl mb-10 leading-relaxed">
              We transition your AI prototypes into robust, scalable,
              fault-tolerant applications — built on cloud infrastructure
              designed to handle real-world failure gracefully, not just
              real-world traffic.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="flex flex-wrap gap-4 mb-8">
              <Button variant="primary" href="/contact">
                Start Your Migration
              </Button>
              <Button variant="ghost" href="/">
                ← Back to Overview
              </Button>
            </div>
          </FadeUp>
          <FadeUp delay={0.4}>
            <div className="flex flex-wrap gap-3">
              {CLOUD_BADGES.map((badge) => (
                <TrustBadge key={badge} label={badge} />
              ))}
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* Services */}
      <section className="py-24">
        <Container>
          <SectionHeading
            label="WHAT WE DELIVER"
            labelColor="#3b82f6"
            title="Six Migration Services"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map((svc, i) => (
              <FadeUp key={svc.title} delay={0.1 + i * 0.08}>
                <GlassCard className="p-6 h-full" borderColor={svc.color}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{svc.icon}</span>
                    <h3 className="text-lg font-bold text-text-primary">
                      {svc.title}
                    </h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {svc.description}
                  </p>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* Before / After */}
      <section className="py-24">
        <Container>
          <SectionHeading
            label="THE MIGRATION GAP"
            labelColor="#3b82f6"
            title={
              <>
                Prototype ≠{' '}
                <GradientText>Production</GradientText>
              </>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FadeUp>
              <GlassCard className="p-6 h-full">
                <h3 className="text-lg font-bold text-text-muted mb-5">
                  Your Prototype
                </h3>
                <div className="space-y-3">
                  {BEFORE_ITEMS.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="text-tool font-bold text-sm">⚠</span>
                      <span className="text-sm text-text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </FadeUp>
            <FadeUp delay={0.1}>
              <GlassCard className="p-6 h-full" borderColor="#3b82f6">
                <h3 className="text-lg font-bold text-text-primary mb-5">
                  After Migration
                </h3>
                <div className="space-y-3">
                  {AFTER_ITEMS.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="text-success font-bold text-sm">✓</span>
                      <span className="text-sm text-text-primary">{item}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* Fault Tolerance Philosophy */}
      <section className="py-24">
        <Container>
          <SectionHeading
            label="OUR APPROACH"
            labelColor="#3b82f6"
            title={
              <>
                We Design for How AI{' '}
                <GradientText>Actually Fails</GradientText>
              </>
            }
            subtitle="Traditional software fails in predictable ways. AI systems don't. An LLM might timeout, hallucinate, return malformed output, or silently degrade in quality. Most prototypes treat these as edge cases. We treat them as certainties."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FAULT_CARDS.map((card, i) => (
              <FadeUp key={card.title} delay={0.1 + i * 0.1}>
                <GlassCard
                  className="p-6 h-full"
                  borderColor={card.color}
                >
                  <h4
                    className="text-base font-bold mb-3"
                    style={{ color: card.color }}
                  >
                    {card.title}
                  </h4>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {card.description}
                  </p>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24">
        <Container>
          <FadeUp>
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                Ready to go from prototype to production?
              </h2>
              <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto">
                Tell us about your prototype and we&apos;ll scope the migration
                path — across AWS, GCP, Azure, or on-premise.
              </p>
              <Button variant="primary" href="/contact">
                Start Your Migration
              </Button>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <p className="text-text-dim text-sm w-full mb-2">
                  Also from Foundatation
                </p>
                <Button variant="ghost" href="/solutions/consulting">
                  AI Business Consulting →
                </Button>
                <Button variant="ghost" href="/solutions">
                  AgentFlow Platform →
                </Button>
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
