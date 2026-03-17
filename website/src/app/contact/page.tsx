import type { Metadata } from 'next';
import Container from '@/components/layout/Container';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import TrustBadge from '@/components/ui/TrustBadge';
import FadeUp from '@/components/animations/FadeUp';
import ContactForm from '@/components/sections/contact/ContactForm';
import { TRUST_BADGES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact Foundatation \u2014 Request a Demo',
  description:
    'Get in touch with Foundatation. Request a demo of AgentFlow, schedule a technical deep-dive, or explore enterprise AI orchestration partnerships.',
  openGraph: {
    title: 'Contact Foundatation \u2014 Request a Demo',
    description:
      'Request a live demo of AgentFlow or discuss enterprise AI agent orchestration for your organization.',
    url: 'https://www.foundatation.com/contact/',
    siteName: 'Foundatation',
    images: [{ url: 'https://www.foundatation.com/og-image.png', width: 1200, height: 630, alt: 'Foundatation \u2014 The Enterprise Data Foundation for AI' }],
  },
  alternates: {
    canonical: 'https://www.foundatation.com/contact/',
  },
};

const CONTACT_INFO = [
  {
    icon: '\u{1F4E7}',
    label: 'Email',
    value: 'info@foundatation.com',
    href: 'mailto:info@foundatation.com',
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero + Form Section */}
      <section className="relative pt-32 pb-24">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-llm/5 via-transparent to-transparent" />

        <Container className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Column — Heading & Contact Info */}
            <div>
              <FadeUp>
                <p className="text-xs uppercase tracking-[3px] font-semibold text-llm mb-6">
                  Contact Us
                </p>
              </FadeUp>

              <FadeUp delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
                  Let&apos;s{' '}
                  <GradientText>Talk</GradientText>
                </h1>
              </FadeUp>

              <FadeUp delay={0.2}>
                <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-lg">
                  Whether you want a live demo of AgentFlow, a technical deep-dive
                  into our NiFi-based architecture, or to explore a partnership —
                  we&apos;d love to hear from you.
                </p>
              </FadeUp>

              {/* Contact info cards */}
              <FadeUp delay={0.3}>
                <div className="space-y-4">
                  {CONTACT_INFO.map((item) => (
                    <GlassCard key={item.label} className="p-5 flex items-center gap-4">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-text-dim font-medium">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="text-text-primary hover:text-llm transition-colors font-medium"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-text-primary font-medium">{item.value}</p>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </FadeUp>
            </div>

            {/* Right Column — Form */}
            <FadeUp delay={0.2}>
              <ContactForm />
            </FadeUp>
          </div>
        </Container>
      </section>

      {/* Trust Section */}
      <section className="py-16">
        <Container>
          <FadeUp>
            <div className="text-center">
              <p className="text-sm text-text-dim uppercase tracking-wider font-medium mb-6">
                Trusted by Fortune 100
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {TRUST_BADGES.map((badge) => (
                  <TrustBadge key={badge} label={badge} />
                ))}
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </>
  );
}
