'use client';

import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import TechStackGrid from '@/components/ui/TechStackGrid';
import FadeUp from '@/components/animations/FadeUp';
import { TECH_STACK } from '@/lib/constants';

export default function TechStackSection() {
  return (
    <section className="py-24">
      <Container>
        <SectionHeading
          label="Tech Stack"
          labelColor="#f59e0b"
          title="Built on Proven Technology"
          subtitle="Every layer of the AgentFlow stack uses mature, production-tested technologies trusted by the world's largest enterprises."
        />

        <FadeUp>
          <TechStackGrid items={TECH_STACK} />
        </FadeUp>
      </Container>
    </section>
  );
}
