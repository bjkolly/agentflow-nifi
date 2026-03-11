'use client';

import { motion, type Variants } from 'framer-motion';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import ProcessorCard from '@/components/ui/ProcessorCard';
import StaggerChildren, { itemVariants } from '@/components/animations/StaggerChildren';
import { PROCESSORS } from '@/lib/constants';

const itemVars = itemVariants as Variants;

export default function ProcessorsSection() {
  return (
    <section id="processors" className="py-24">
      <Container>
        <SectionHeading
          label="Core Processors"
          labelColor="#7c3aed"
          title="Purpose-Built AI Processors"
          subtitle="Seven custom NiFi processors that handle every aspect of AI agent orchestration — from LLM inference to guardrails enforcement."
        />

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROCESSORS.map((proc) => (
            <motion.div key={proc.name} variants={itemVars}>
              <ProcessorCard {...proc} />
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
