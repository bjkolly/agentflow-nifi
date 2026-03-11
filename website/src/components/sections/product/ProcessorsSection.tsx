'use client';

import { motion, type Variants } from 'framer-motion';
import Container from '@/components/layout/Container';
import SectionHeading from '@/components/layout/SectionHeading';
import ProcessorCard from '@/components/ui/ProcessorCard';
import GlassCard from '@/components/ui/GlassCard';
import StaggerChildren, { itemVariants } from '@/components/animations/StaggerChildren';
import FadeUp from '@/components/animations/FadeUp';
import { PROCESSORS } from '@/lib/constants';

const itemVars = itemVariants as Variants;

const OUT_OF_BOX_PROCESSORS = [
  {
    title: 'Data Ingestion',
    color: '#3b82f6',
    processors: [
      'GetFile / PutFile',
      'GetSFTP / PutSFTP',
      'ConsumeKafka / PublishKafka',
      'GetHTTP / InvokeHTTP',
      'ListenHTTP',
      'ListS3 / FetchS3Object',
      'ConsumeJMS',
      'GetMongo / PutMongo',
    ],
  },
  {
    title: 'Data Transformation',
    color: '#7c3aed',
    processors: [
      'ConvertRecord',
      'JoltTransformJSON',
      'TransformXml',
      'ConvertAvroToJSON',
      'ConvertCSVToAvro',
      'ReplaceText',
      'UpdateAttribute',
      'SplitJson / SplitRecord',
    ],
  },
  {
    title: 'Database & Query',
    color: '#10b981',
    processors: [
      'ExecuteSQL / ExecuteSQLRecord',
      'PutDatabaseRecord',
      'QueryDatabaseTable',
      'ListDatabaseTables',
      'PutSQL',
      'GenerateTableFetch',
      'QueryRecord',
      'LookupRecord',
    ],
  },
  {
    title: 'Routing & Enrichment',
    color: '#f59e0b',
    processors: [
      'RouteOnAttribute',
      'RouteOnContent',
      'ValidateRecord',
      'PartitionRecord',
      'MergeContent / MergeRecord',
      'UpdateRecord',
      'EvaluateJsonPath',
      'ExtractText',
    ],
  },
];

export default function ProcessorsSection() {
  return (
    <section id="processors" className="py-24">
      <Container>
        <SectionHeading
          label="Core Processors"
          labelColor="#7c3aed"
          title="Purpose-Built Agentic Processors"
          subtitle="Seven custom NiFi processors that handle every aspect of AI agent orchestration — from LLM inference to guardrails enforcement."
        />

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROCESSORS.map((proc) => (
            <motion.div key={proc.name} variants={itemVars}>
              <ProcessorCard {...proc} />
            </motion.div>
          ))}
        </StaggerChildren>

        {/* Out of Box Processors Sub-section */}
        <div className="mt-20">
          <FadeUp>
            <h3 className="text-2xl font-bold text-text-primary text-center mb-3">
              100&apos;s Out of Box Processors
            </h3>
            <p className="text-text-muted text-center max-w-2xl mx-auto mb-10 text-sm">
              Foundatation is ready with hundreds of production-ready processors for data acquisition, transformation, and routing — purpose-built embedded with 10&apos;s of years of best practices for turning legacy and siloed data into AI-ready pipelines.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OUT_OF_BOX_PROCESSORS.map((category, idx) => (
              <FadeUp key={category.title} delay={idx * 0.1}>
                <GlassCard
                  borderColor={category.color}
                  className="h-full"
                >
                  <div
                    className="h-1 w-full rounded-full mb-4"
                    style={{ backgroundColor: category.color }}
                  />
                  <h4
                    className="text-sm font-semibold mb-3"
                    style={{ color: category.color }}
                  >
                    {category.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {category.processors.map((proc) => (
                      <li
                        key={proc}
                        className="text-text-muted text-xs flex items-start gap-2"
                      >
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: category.color, opacity: 0.6 }}
                        />
                        <code className="font-mono text-[11px]">{proc}</code>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </FadeUp>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
