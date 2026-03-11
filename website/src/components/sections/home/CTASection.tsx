'use client';

import Container from '@/components/layout/Container';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import GradientText from '@/components/ui/GradientText';
import FadeUp from '@/components/animations/FadeUp';
import StaggerChildren, { itemVariants } from '@/components/animations/StaggerChildren';
import { INDUSTRIES } from '@/lib/constants';
import { motion } from 'framer-motion';

const INDUSTRY_COLORS: Record<string, string> = {
  llm: 'border-t-llm',
  tool: 'border-t-tool',
  memory: 'border-t-memory',
  planner: 'border-t-planner',
  router: 'border-t-router',
  hitl: 'border-t-hitl',
  guard: 'border-t-guard',
};

export default function CTASection() {
  return (
    <section id="cta" className="py-32">
      <Container>
        {/* Main CTA Block */}
        <FadeUp>
          <div className="relative rounded-2xl overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-llm via-router to-memory p-[1px]">
              <div className="w-full h-full rounded-2xl bg-surface" />
            </div>

            <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
                Ready to Build{' '}
                <GradientText>Enterprise AI Agents</GradientText>?
              </h2>
              <p className="text-text-muted text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                Get started with AgentFlow today. Deploy production-grade AI agents
                with the governance and reliability your enterprise demands.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" href="/contact">
                  Start Building
                </Button>
                <Button variant="ghost" href="/product">
                  View Documentation
                </Button>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Industries Grid */}
        <div className="mt-20">
          <FadeUp>
            <h3 className="text-center text-lg font-semibold text-text-primary mb-10">
              Purpose-Built for Regulated Industries
            </h3>
          </FadeUp>

          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INDUSTRIES.map((industry) => {
              const borderColor =
                INDUSTRY_COLORS[industry.color] || 'border-t-router';

              return (
                <motion.div key={industry.title} variants={itemVariants}>
                  <GlassCard borderColor={borderColor} className="h-full">
                    <div className="text-3xl mb-4">{industry.icon}</div>
                    <h4 className="text-lg font-semibold text-text-primary mb-2">
                      {industry.title}
                    </h4>
                    <p className="text-text-muted text-sm leading-relaxed">
                      {industry.description}
                    </p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </StaggerChildren>
        </div>
      </Container>
    </section>
  );
}
