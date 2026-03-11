export type Processor = {
  icon: string;
  name: string;
  color: string;
  description: string;
  relationships: { name: string; color: string }[];
};

export type Stat = { number: string; label: string };

export type NifiMapping = {
  nifiConcept: string;
  agentflowMapping: string;
  whyItMatters: string;
};

export type ComparisonRow = {
  capability: string;
  agentflow: 'yes' | 'partial' | 'no';
  langchain: 'yes' | 'partial' | 'no';
  crewai: 'yes' | 'partial' | 'no';
  autogen: 'yes' | 'partial' | 'no';
  semanticKernel: 'yes' | 'partial' | 'no';
};

export type UseCase = {
  id: string;
  title: string;
  pattern: string;
  agentCount: number;
  guardrails: string[];
  description: string;
  steps: { label: string; color: string }[];
};

export type TechItem = { layer: string; name: string };

export type ArchLayer = {
  name: string;
  color: string;
  pills: string[];
};

export type DeployStage = {
  icon: string;
  title: string;
  description: string;
  items: string[];
};

export type DemoProcessor = {
  id: string;
  name: string;
  processorType: string;
  position: [number, number, number];
  color: string;
};

export type DemoConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  particleCount: number;
};

export type IndustryCard = {
  icon: string;
  title: string;
  description: string;
  color: string;
};

export type DataJourneyStage = {
  icon: string;
  title: string;
  color: string;
  description: string;
};

export type DataFoundationStat = {
  number: string;
  label: string;
};
