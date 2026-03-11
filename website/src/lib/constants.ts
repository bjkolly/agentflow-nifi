import type {
  Processor,
  Stat,
  NifiMapping,
  ComparisonRow,
  UseCase,
  TechItem,
  ArchLayer,
  DeployStage,
  DemoProcessor,
  DemoConnection,
  IndustryCard,
} from '@/lib/types';

/* ─── Processors ──────────────────────────────────────────────────────── */

export const PROCESSORS: Processor[] = [
  {
    icon: '🧠',
    name: 'LLM Inference',
    color: '#7c3aed',
    description:
      'Multi-provider LLM integration with streaming, token tracking, and automatic retries. Supports Claude, GPT-4, Bedrock, and local models via Ollama.',
    relationships: [
      { name: 'success', color: '#22c55e' },
      { name: 'failure', color: '#ef4444' },
      { name: 'rate_limit', color: '#f97316' },
    ],
  },
  {
    icon: '🔧',
    name: 'Tool Executor',
    color: '#f59e0b',
    description:
      'Sandboxed execution of external tools via HTTP, MCP, database, and custom protocols. Docker/gVisor isolation with timeout enforcement.',
    relationships: [
      { name: 'success', color: '#22c55e' },
      { name: 'failure', color: '#ef4444' },
      { name: 'tool_error', color: '#f97316' },
    ],
  },
  {
    icon: '💾',
    name: 'Memory Manager',
    color: '#06b6d4',
    description:
      'Long-term and short-term memory via vector database integration. Semantic retrieval, conversation history, and knowledge base management.',
    relationships: [
      { name: 'success', color: '#22c55e' },
      { name: 'cache_hit', color: '#06b6d4' },
      { name: 'failure', color: '#ef4444' },
    ],
  },
  {
    icon: '📋',
    name: 'Task Planner',
    color: '#10b981',
    description:
      'Decomposes complex objectives into executable sub-tasks with dependency tracking, priority assignment, and adaptive re-planning.',
    relationships: [
      { name: 'success', color: '#22c55e' },
      { name: 'needs_input', color: '#f59e0b' },
      { name: 'failure', color: '#ef4444' },
    ],
  },
  {
    icon: '🔀',
    name: 'Agent Router',
    color: '#3b82f6',
    description:
      'Intelligent routing between agents and processors based on content analysis, capability matching, and load balancing.',
    relationships: [
      { name: 'success', color: '#22c55e' },
      { name: 'tool_call', color: '#f59e0b' },
      { name: 'escalate', color: '#ec4899' },
      { name: 'failure', color: '#ef4444' },
    ],
  },
  {
    icon: '👤',
    name: 'Human In The Loop',
    color: '#ec4899',
    description:
      'Configurable approval gates for high-risk actions with multi-channel notifications (UI, Slack, email, API) and SLA tracking.',
    relationships: [
      { name: 'approved', color: '#22c55e' },
      { name: 'rejected', color: '#ef4444' },
      { name: 'timeout', color: '#f59e0b' },
    ],
  },
  {
    icon: '🛡️',
    name: 'Guardrails Enforcer',
    color: '#ef4444',
    description:
      'Pre-LLM and post-LLM guardrails: PII detection, content policy enforcement, token budgets, iteration limits, and prohibited action boundaries.',
    relationships: [
      { name: 'pass', color: '#22c55e' },
      { name: 'violation', color: '#ef4444' },
    ],
  },
];

/* ─── Stats ────────────────────────────────────────────────────────────── */

export const STATS: Stat[] = [
  { number: '10+', label: 'Years in Enterprise Production' },
  { number: '75%', label: 'of Fortune 100 Use NiFi' },
  { number: '5B+', label: 'FlowFiles Processed Daily' },
  { number: '0', label: 'Code Changes to Scale' },
];

/* ─── Trust Badges ─────────────────────────────────────────────────────── */

export const TRUST_BADGES: string[] = [
  'NSA Heritage',
  '10+ Years Production',
  '75%+ Fortune 100',
  'FedRAMP',
  'HIPAA',
];

/* ─── NiFi Mapping ─────────────────────────────────────────────────────── */

export const NIFI_MAPPING: NifiMapping[] = [
  {
    nifiConcept: 'Process Group',
    agentflowMapping: 'Autonomous Agent',
    whyItMatters:
      'Each agent is a self-contained Process Group with its own processors, connections, and configuration',
  },
  {
    nifiConcept: 'Processor',
    agentflowMapping: 'Agent Capability',
    whyItMatters:
      'Custom processors implement specific AI capabilities — LLM inference, tool execution, memory, routing',
  },
  {
    nifiConcept: 'FlowFile',
    agentflowMapping: 'Task / Message',
    whyItMatters:
      'FlowFiles carry task data, conversation history, and metadata through the agent pipeline',
  },
  {
    nifiConcept: 'Data Provenance',
    agentflowMapping: 'Complete Audit Trail',
    whyItMatters:
      'Every action, decision, and data transformation is automatically recorded and queryable',
  },
  {
    nifiConcept: 'Back-pressure',
    agentflowMapping: 'Cost & Rate Control',
    whyItMatters:
      'Connection queues prevent runaway agents from overwhelming LLM APIs or exceeding budgets',
  },
  {
    nifiConcept: 'Clustering',
    agentflowMapping: 'Horizontal Scale',
    whyItMatters:
      'Multi-node NiFi clusters distribute agent workloads with zero code changes',
  },
  {
    nifiConcept: 'FlowSync',
    agentflowMapping: 'Agent Version Control',
    whyItMatters:
      'Version, promote, and rollback agent definitions across environments',
  },
  {
    nifiConcept: 'Controller Service',
    agentflowMapping: 'Shared Infrastructure',
    whyItMatters:
      'LLM clients, vector DB connections, and guardrail configs shared across agents',
  },
];

/* ─── Comparison Data ──────────────────────────────────────────────────── */

export const COMPARISON_DATA: ComparisonRow[] = [
  { capability: 'Data Provenance', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Visual Agent Designer', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Native Clustering/HA', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Back-pressure/Rate Control', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Human-in-the-Loop', agentflow: 'yes', langchain: 'partial', crewai: 'no', autogen: 'partial', semanticKernel: 'no' },
  { capability: 'Agent Version Control', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Tool Sandboxing', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'partial', semanticKernel: 'no' },
  { capability: 'PII Detection/Redaction', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Cost/Token Budgets', agentflow: 'yes', langchain: 'partial', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: 'Production Monitoring', agentflow: 'yes', langchain: 'partial', crewai: 'no', autogen: 'partial', semanticKernel: 'partial' },
  { capability: 'Enterprise Auth (LDAP/SSO)', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
  { capability: '10+ Year Track Record', agentflow: 'yes', langchain: 'no', crewai: 'no', autogen: 'no', semanticKernel: 'no' },
];

/* ─── Use Cases ────────────────────────────────────────────────────────── */

export const USE_CASES: UseCase[] = [
  {
    id: 'research-pipeline',
    title: 'Automated Research Pipeline',
    pattern: 'Supervisor/Worker',
    agentCount: 5,
    guardrails: ['PII redaction', 'Source verification', 'Budget limits'],
    description:
      'Supervisor agent decomposes research queries, dispatches specialized researchers, analysts synthesize findings, human approves before publish.',
    steps: [
      { label: 'Intake', color: '#3b82f6' },
      { label: 'Supervisor', color: '#7c3aed' },
      { label: 'Researchers', color: '#10b981' },
      { label: 'Analyst', color: '#06b6d4' },
      { label: 'Human Review', color: '#ec4899' },
      { label: 'Publish', color: '#22c55e' },
    ],
  },
  {
    id: 'customer-support',
    title: 'Customer Support Triage',
    pattern: 'Sequential Pipeline',
    agentCount: 3,
    guardrails: ['Response policy', 'Escalation rules', 'PII masking'],
    description:
      'Classify incoming tickets, route to specialist agents, escalate edge cases via human-in-the-loop approval gates.',
    steps: [
      { label: 'Classify', color: '#3b82f6' },
      { label: 'Route', color: '#7c3aed' },
      { label: 'Specialist', color: '#10b981' },
      { label: 'QA Check', color: '#ef4444' },
      { label: 'Respond', color: '#22c55e' },
    ],
  },
  {
    id: 'compliance-review',
    title: 'Compliance Document Review',
    pattern: 'Debate/Consensus',
    agentCount: 4,
    guardrails: ['Legal standards', 'Regulatory checks', 'Audit logging'],
    description:
      'Multiple agents analyze documents from different regulatory perspectives, debate findings, and reach consensus with human oversight.',
    steps: [
      { label: 'Ingest', color: '#3b82f6' },
      { label: 'Analyze', color: '#7c3aed' },
      { label: 'Pro/Con Debate', color: '#f59e0b' },
      { label: 'Judge', color: '#ec4899' },
      { label: 'Legal Review', color: '#22c55e' },
    ],
  },
  {
    id: 'code-generation',
    title: 'Code Generation & Review',
    pattern: 'MapReduce Fan-out',
    agentCount: 4,
    guardrails: ['Security scan', 'License check', 'Test coverage'],
    description:
      'Task planning decomposes requirements, code gen agents work in parallel, peer review via debate pattern, security scan guardrails.',
    steps: [
      { label: 'Plan', color: '#10b981' },
      { label: 'Generate', color: '#7c3aed' },
      { label: 'Peer Review', color: '#f59e0b' },
      { label: 'Security Scan', color: '#ef4444' },
      { label: 'Merge', color: '#22c55e' },
    ],
  },
];

/* ─── Tech Stack ───────────────────────────────────────────────────────── */

export const TECH_STACK: TechItem[] = [
  { layer: 'Runtime', name: 'Apache NiFi 2.x' },
  { layer: 'Language', name: 'Java 21+' },
  { layer: 'LLM Providers', name: 'Claude \u00b7 GPT-4 \u00b7 Bedrock \u00b7 Ollama' },
  { layer: 'Vector DBs', name: 'Pinecone \u00b7 ChromaDB \u00b7 pgvector' },
  { layer: 'Messaging', name: 'Apache Kafka' },
  { layer: 'State', name: 'Redis' },
  { layer: 'Secrets', name: 'HashiCorp Vault' },
  { layer: 'Coordination', name: 'Apache ZooKeeper' },
  { layer: 'Monitoring', name: 'Prometheus \u00b7 Grafana' },
  { layer: 'Sandboxing', name: 'Docker \u00b7 gVisor' },
  { layer: 'Versioning', name: 'FlowSync \u00b7 Git' },
  { layer: 'Frontend', name: 'React Three Fiber' },
  { layer: 'State Mgmt', name: 'Zustand' },
  { layer: 'Styling', name: 'Tailwind CSS' },
  { layer: 'Protocols', name: 'HTTP \u00b7 MCP \u00b7 SQL' },
];

/* ─── Architecture Layers ──────────────────────────────────────────────── */

export const ARCHITECTURE_LAYERS: ArchLayer[] = [
  {
    name: 'Interface Layer',
    color: '#3b82f6',
    pills: ['AgentFlow 3D UI', 'NiFi Canvas', 'REST API', 'FlowSync'],
  },
  {
    name: 'Agent Orchestration',
    color: '#7c3aed',
    pills: ['Agent A (Research)', 'Agent B (Planner)', 'Agent C (Tools)'],
  },
  {
    name: 'Controller Services',
    color: '#06b6d4',
    pills: ['LLMClientService', 'VectorDBService', 'ToolRegistryService', 'GuardrailsService'],
  },
  {
    name: 'Infrastructure',
    color: '#9ca3af',
    pills: ['LLM APIs', 'Vector DBs', 'Kafka', 'Redis', 'Vault', 'ZooKeeper'],
  },
];

/* ─── Deploy Stages ────────────────────────────────────────────────────── */

export const DEPLOY_STAGES: DeployStage[] = [
  {
    icon: '🛠️',
    title: 'Development',
    description:
      'Single NiFi instance with visual agent designer. Rapid iteration, instant feedback.',
    items: [
      'Single NiFi instance',
      'Visual agent design',
      'Rapid iteration',
      'Local LLM testing',
    ],
  },
  {
    icon: '🧪',
    title: 'Staging',
    description:
      'FlowSync for version control. CI/CD pipeline integration. Automated testing.',
    items: [
      'FlowSync',
      'Versioned blueprints',
      'CI/CD integration',
      'Automated testing',
    ],
  },
  {
    icon: '🚀',
    title: 'Production',
    description:
      'Multi-node cluster with ZooKeeper. Full monitoring, alerting, and auto-scaling.',
    items: [
      'Multi-node cluster',
      'ZooKeeper coordination',
      'Prometheus/Grafana',
      'Zero downtime deploys',
    ],
  },
];

/* ─── Demo Processors ──────────────────────────────────────────────────── */

export const DEMO_PROCESSORS: DemoProcessor[] = [
  { id: 'demo-1', name: 'Plan Task', processorType: 'TaskPlannerProcessor', position: [-5, 1.2, 0], color: '#10b981' },
  { id: 'demo-2', name: 'Route Agent', processorType: 'AgentRouterProcessor', position: [1, 1.2, 0], color: '#3b82f6' },
  { id: 'demo-3', name: 'LLM Inference', processorType: 'LLMInferenceProcessor', position: [7, 1.2, -5], color: '#7c3aed' },
  { id: 'demo-4', name: 'Execute Tool', processorType: 'ToolExecutorProcessor', position: [7, 1.2, 5], color: '#f59e0b' },
  { id: 'demo-5', name: 'Manage Memory', processorType: 'MemoryManagerProcessor', position: [13, 1.2, 0], color: '#06b6d4' },
  { id: 'demo-6', name: 'Enforce Guardrails', processorType: 'GuardrailsEnforcerProcessor', position: [19, 1.2, 0], color: '#ef4444' },
];

/* ─── Demo Connections ─────────────────────────────────────────────────── */

export const DEMO_CONNECTIONS: DemoConnection[] = [
  { id: 'conn-1', sourceId: 'demo-1', targetId: 'demo-2', relationship: 'success', particleCount: 3 },
  { id: 'conn-2', sourceId: 'demo-2', targetId: 'demo-3', relationship: 'success', particleCount: 1 },
  { id: 'conn-3', sourceId: 'demo-2', targetId: 'demo-4', relationship: 'tool_call', particleCount: 2 },
  { id: 'conn-4', sourceId: 'demo-3', targetId: 'demo-5', relationship: 'success', particleCount: 1 },
  { id: 'conn-5', sourceId: 'demo-4', targetId: 'demo-5', relationship: 'success', particleCount: 1 },
  { id: 'conn-6', sourceId: 'demo-5', targetId: 'demo-6', relationship: 'success', particleCount: 2 },
];

/* ─── Industries ───────────────────────────────────────────────────────── */

export const INDUSTRIES: IndustryCard[] = [
  {
    icon: '🏦',
    title: 'Financial Services',
    description:
      'Automate compliance reviews, risk assessments, and regulatory document processing with full audit trails and PII protection.',
    color: '#3b82f6',
  },
  {
    icon: '🏥',
    title: 'Healthcare',
    description:
      'HIPAA-compliant patient data workflows, clinical document analysis, and medical research synthesis with human oversight.',
    color: '#10b981',
  },
  {
    icon: '🛡️',
    title: 'Defense & Intelligence',
    description:
      'FedRAMP-ready agent orchestration for mission-critical intelligence analysis, classified data processing, and operational planning.',
    color: '#7c3aed',
  },
  {
    icon: '🏢',
    title: 'Enterprise',
    description:
      'Customer support automation, internal knowledge management, code generation pipelines, and cross-functional research workflows.',
    color: '#f59e0b',
  },
];

/* ─── Problem/Solution Items ───────────────────────────────────────────── */

export const PROBLEM_ITEMS = {
  bad: [
    'Python scripts with no governance',
    'No audit trail for agent actions',
    'Manual scaling with custom infrastructure',
    'No cost controls \u2014 runaway API spend',
    'No version control for agent logic',
    'Compliance gaps regulators will find',
    'Prototype frameworks in production',
  ],
  good: [
    'Enterprise-grade orchestration platform',
    'Complete data provenance for every action',
    'Native clustering \u2014 zero code changes to scale',
    'Built-in back-pressure and cost budgets',
    'Version-controlled agent definitions',
    'FedRAMP, HIPAA, SOX compliant infrastructure',
    '10+ year production track record',
  ],
};

/* ─── Navigation ───────────────────────────────────────────────────────── */

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/product', label: 'Platform' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;
