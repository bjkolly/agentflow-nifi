import { create } from 'zustand';
import type { ProvenanceEventDTO } from '../types/nifi';

const MAX_EVENTS = 500;

type ProvenanceState = {
  events: ProvenanceEventDTO[];
  totalTokensIn: number;
  totalTokensOut: number;
  estimatedCost: number;
  autoScrollPaused: boolean;
  filters: {
    eventTypes: string[];
    processorName: string | null;
  };
};

type ProvenanceActions = {
  appendEvents: (events: ProvenanceEventDTO[]) => void;
  setAutoScrollPaused: (paused: boolean) => void;
  setFilters: (eventTypes: string[], processorName: string | null) => void;
  clearFilters: () => void;
};

function extractTokens(attrs: Array<{ name: string; value: string }>): { tokensIn: number; tokensOut: number } {
  let tokensIn = 0;
  let tokensOut = 0;
  for (const attr of attrs) {
    if (attr.name === 'llm.tokens.input') {
      tokensIn = parseInt(attr.value, 10) || 0;
    } else if (attr.name === 'llm.tokens.output') {
      tokensOut = parseInt(attr.value, 10) || 0;
    }
  }
  return { tokensIn, tokensOut };
}

const COST_PER_INPUT_TOKEN = 0.000003;
const COST_PER_OUTPUT_TOKEN = 0.000015;

export const useProvenanceStore = create<ProvenanceState & ProvenanceActions>((set) => ({
  events: [],
  totalTokensIn: 0,
  totalTokensOut: 0,
  estimatedCost: 0,
  autoScrollPaused: false,
  filters: {
    eventTypes: [],
    processorName: null,
  },

  appendEvents: (newEvents: ProvenanceEventDTO[]) => {
    set((state) => {
      let addedTokensIn = 0;
      let addedTokensOut = 0;
      for (const evt of newEvents) {
        const { tokensIn, tokensOut } = extractTokens(evt.updatedAttributes);
        addedTokensIn += tokensIn;
        addedTokensOut += tokensOut;
      }

      const merged = [...newEvents, ...state.events].slice(0, MAX_EVENTS);
      const totalIn = state.totalTokensIn + addedTokensIn;
      const totalOut = state.totalTokensOut + addedTokensOut;

      return {
        events: merged,
        totalTokensIn: totalIn,
        totalTokensOut: totalOut,
        estimatedCost:
          totalIn * COST_PER_INPUT_TOKEN + totalOut * COST_PER_OUTPUT_TOKEN,
      };
    });
  },

  setAutoScrollPaused: (paused: boolean) => {
    set({ autoScrollPaused: paused });
  },

  setFilters: (eventTypes: string[], processorName: string | null) => {
    set({ filters: { eventTypes, processorName } });
  },

  clearFilters: () => {
    set({ filters: { eventTypes: [], processorName: null } });
  },
}));

// ---- Demo provenance event generator ----

const DEMO_EVENT_TYPES = ['RECEIVE', 'CONTENT_MODIFIED', 'ROUTE', 'SEND'] as const;
const DEMO_COMPONENTS = [
  { id: 'demo-1', name: 'Plan Task', type: 'TaskPlannerProcessor' },
  { id: 'demo-2', name: 'Route Agent', type: 'AgentRouterProcessor' },
  { id: 'demo-3', name: 'LLM Inference', type: 'LLMInferenceProcessor' },
  { id: 'demo-4', name: 'Execute Tool', type: 'ToolExecutorProcessor' },
  { id: 'demo-5', name: 'Manage Memory', type: 'MemoryManagerProcessor' },
  { id: 'demo-6', name: 'Enforce Guardrails', type: 'GuardrailsEnforcerProcessor' },
];

let demoEventCounter = 0;
let demoInterval: ReturnType<typeof setInterval> | null = null;

function generateDemoEvent(): ProvenanceEventDTO {
  const idx = demoEventCounter++;
  const comp = DEMO_COMPONENTS[idx % DEMO_COMPONENTS.length];
  const eventType = DEMO_EVENT_TYPES[idx % DEMO_EVENT_TYPES.length];
  const tokensIn = Math.floor(Math.random() * 500) + 100;
  const tokensOut = Math.floor(Math.random() * 300) + 50;

  return {
    eventId: idx,
    eventTime: new Date().toISOString(),
    eventType,
    componentId: comp.id,
    componentName: comp.name,
    componentType: comp.type,
    processGroupId: 'root',
    flowFileUuid: `ff-${crypto.randomUUID().slice(0, 8)}`,
    fileSize: `${Math.floor(Math.random() * 5000 + 200)} bytes`,
    eventDuration: Math.floor(Math.random() * 800) + 20,
    updatedAttributes: [
      { name: 'llm.tokens.input', value: String(tokensIn) },
      { name: 'llm.tokens.output', value: String(tokensOut) },
      { name: 'llm.model', value: 'claude-3-opus' },
    ],
  };
}

export function startDemoProvenanceGenerator(): () => void {
  if (demoInterval) return () => {};
  demoInterval = setInterval(() => {
    const event = generateDemoEvent();
    useProvenanceStore.getState().appendEvents([event]);
  }, 2000);

  return () => {
    if (demoInterval) {
      clearInterval(demoInterval);
      demoInterval = null;
    }
  };
}
