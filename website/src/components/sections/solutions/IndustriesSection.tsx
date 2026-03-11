'use client';

import { motion, type Variants } from 'framer-motion';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import GlassCard from '@/components/ui/GlassCard';
import StaggerChildren, { itemVariants } from '@/components/animations/StaggerChildren';
import { INDUSTRIES } from '@/lib/constants';

const itemVars = itemVariants as Variants;

export default function IndustriesSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="Industries"
          labelColor="#f59e0b"
          title="Trusted Across Verticals"
          subtitle="AgentFlow meets the compliance, security, and scalability requirements of the most demanding industries."
        />

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INDUSTRIES.map((ind) => (
            <motion.div key={ind.title} variants={itemVars}>
              <GlassCard
                borderColor={ind.color}
                className="p-6 h-full flex flex-col"
              >
                <span className="text-3xl mb-4">{ind.icon}</span>
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {ind.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-1">
                  {ind.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
