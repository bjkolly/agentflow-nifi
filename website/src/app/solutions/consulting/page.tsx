import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import Button from '@/components/ui/Button';
import FadeUp from '@/components/animations/FadeUp';

export const metadata = {
  title: 'AI Business Consulting & Strategy',
  description:
    'We analyze your unique business challenges to determine where AI fits, translate objectives into technical requirements, and design implementation roadmaps.',
};

const SERVICES = [
  {
    icon: '🎯',
    title: 'Strategic Needs Assessment',
    color: '#7c3aed',
    description:
      'We analyze your unique business challenges to determine exactly where and how artificial intelligence can drive measurable value. We identify high-impact use cases, evaluate data readiness, and prioritize initiatives by ROI potential — so you invest in AI that actually moves the needle.',
  },
  {
    icon: '🔄',
    title: 'Business-to-Technical Translation',
    color: '#3b82f6',
    description:
      'We bridge the gap between business objectives and technical execution, breaking down high-level goals into clear, actionable technical requirements. Your leadership team speaks outcomes. Your engineering team speaks architecture. We make sure both sides are aligned before work begins.',
  },
  {
    icon: '✅',
    title: 'Objective Feasibility Analysis',
    color: '#10b981',
    description:
      'We provide expert guidance on whether AI is the right tool for the job, ensuring you only invest in technology that solves real problems. Not every challenge needs AI. We\u2019ll tell you honestly when a simpler solution is the better answer — saving you time, budget, and complexity.',
  },
  {
    icon: '🗺️',
    title: 'Custom Implementation Roadmaps',
    color: '#f59e0b',
    description:
      'We design step-by-step strategies to integrate AI solutions seamlessly into your existing workflows. From phased rollout plans to resource requirements, technology selection, and success metrics — you get a concrete blueprint, not a slide deck full of buzzwords.',
  },
];

const PERSONAS = [
  {
    question: '\u201CWhere should we start with AI?\u201D',
    answer:
      'You know AI matters but aren\u2019t sure which use cases will actually deliver ROI for your specific business.',
  },
  {
    question: '\u201CIs this technically feasible?\u201D',
    answer:
      'You have a vision for AI but need an honest assessment of what\u2019s possible given your data, systems, and timelines.',
  },
  {
    question: '\u201CHow do we get from strategy to execution?\u201D',
    answer:
      'You\u2019ve talked about AI in leadership meetings but don\u2019t have a concrete technical plan to make it happen.',
  },
];

export default function ConsultingPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16">
        <Container>
          <FadeUp>
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-base font-bold text-white bg-llm">
                01
              </span>
              <p className="text-xs uppercase tracking-[3px] font-semibold text-llm">
                AI Business Consulting & Strategy
              </p>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] mb-6 max-w-4xl">
              Know exactly where AI drives value —{' '}
              <GradientText>before you build anything</GradientText>
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-xl text-text-muted max-w-2xl mb-10 leading-relaxed">
              We analyze your unique business challenges to determine where AI
              fits, translate business objectives into technical requirements,
              and design implementation roadmaps — so every AI investment solves
              a real problem.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" href="/contact">
                Schedule a Consultation
              </Button>
              <Button variant="ghost" href="/">
                ← Back to Overview
              </Button>
            </div>
          </FadeUp>
        </Container>
      </section>

      {/* Services */}
      <section className="py-24">
        <Container>
          <SectionHeading
            label="WHAT WE DELIVER"
            labelColor="#7c3aed"
            title="Four Core Consulting Services"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map((svc, i) => (
              <FadeUp key={svc.title} delay={0.1 + i * 0.1}>
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

      {/* Who This Is For */}
      <section className="py-24">
        <Container>
          <SectionHeading
            label="WHO THIS IS FOR"
            labelColor="#7c3aed"
            title={
              <>
                You&apos;re asking the{' '}
                <GradientText>right questions</GradientText>
              </>
            }
            subtitle="This engagement is for leaders who want clarity before committing resources to AI initiatives."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PERSONAS.map((p, i) => (
              <FadeUp key={p.question} delay={0.1 + i * 0.1}>
                <GlassCard className="p-6 h-full">
                  <p className="text-base font-bold text-llm mb-3">
                    {p.question}
                  </p>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {p.answer}
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
                Ready to find out where AI fits?
              </h2>
              <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto">
                Start with a conversation. No commitment, no pitch — just an
                honest assessment of your AI opportunity.
              </p>
              <Button variant="primary" href="/contact">
                Schedule a Consultation
              </Button>
              <div className="mt-10 flex flex-wrap gap-4 justify-center">
                <p className="text-text-dim text-sm w-full mb-2">
                  Also from Foundatation
                </p>
                <Button variant="ghost" href="/solutions/migration">
                  Prototype-to-Production Migration →
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
