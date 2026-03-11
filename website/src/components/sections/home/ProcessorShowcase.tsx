'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import ProcessorCard from '@/components/ui/ProcessorCard';
import GradientText from '@/components/ui/GradientText';
import StaggerChildren, { itemVariants } from '@/components/animations/StaggerChildren';
import { PROCESSORS } from '@/lib/constants';
import { motion } from 'framer-motion';

export default function ProcessorShowcase() {
  return (
    <section id="processors" className="py-32">
      <Container>
        <SectionHeading
          label="CUSTOM PROCESSORS"
          labelColor="text-llm"
          title={
            <>
              <GradientText>7 Purpose-Built</GradientText> Processors
            </>
          }
          subtitle="Each processor is a modular, configurable NiFi component designed for a specific AI agent capability."
        />

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
          {PROCESSORS.map((processor) => (
            <motion.div key={processor.name} variants={itemVariants}>
              <ProcessorCard {...processor} />
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
