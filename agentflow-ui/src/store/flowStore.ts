import { create } from 'zustand';
import type { FlowNode, FlowConnection, FlowGroup } from '../types/flow';
import type { ProcessGroupFlowEntity } from '../types/nifi';
import { nifiToWorld } from '../utils/layout';
import { getProcessorColor } from '../utils/colors';

type FlowState = {
  nodes: Record<string, FlowNode>;
  connections: Record<string, FlowConnection>;
  groups: Record<string, FlowGroup>;
  rootGroupId: string | null;
  currentGroupId: string | null;
  demoMode: boolean;
};

type FlowActions = {
  setFlowData: (entity: ProcessGroupFlowEntity) => void;
  setNodePosition: (id: string, pos: [number, number, number]) => void;
  toggleGroupExpanded: (id: string) => void;
  navigateToGroup: (id: string) => void;
  navigateUp: () => void;
  initDemoData: () => void;
};

function createDemoData(): { nodes: Record<string, FlowNode>; connections: Record<string, FlowConnection> } {
  const processors = [
    { id: 'demo-1', name: 'Plan Task', processorType: 'com.agentflow.nifi.processors.TaskPlannerProcessor', x: 0, y: 0 },
    { id: 'demo-2', name: 'Route Agent', processorType: 'com.agentflow.nifi.processors.AgentRouterProcessor', x: 5, y: 0 },
    { id: 'demo-3', name: 'LLM Inference', processorType: 'com.agentflow.nifi.processors.LLMInferenceProcessor', x: 10, y: -3 },
    { id: 'demo-4', name: 'Execute Tool', processorType: 'com.agentflow.nifi.processors.ToolExecutorProcessor', x: 10, y: 3 },
    { id: 'demo-5', name: 'Manage Memory', processorType: 'com.agentflow.nifi.processors.MemoryManagerProcessor', x: 15, y: 0 },
    { id: 'demo-6', name: 'Enforce Guardrails', processorType: 'com.agentflow.nifi.processors.GuardrailsEnforcerProcessor', x: 20, y: 0 },
  ];

  const nodes: Record<string, FlowNode> = {};
  for (const p of processors) {
    nodes[p.id] = {
      id: p.id,
      name: p.name,
      type: 'processor',
      processorType: p.processorType,
      state: 'RUNNING',
      position: [p.x, 0.5, p.y],
      parentGroupId: 'root',
      color: getProcessorColor(p.processorType),
      stats: {
        flowFilesIn: Math.floor(Math.random() * 200),
        flowFilesOut: Math.floor(Math.random() * 180),
        bytesIn: Math.floor(Math.random() * 50000),
        bytesOut: Math.floor(Math.random() * 45000),
        activeThreads: Math.floor(Math.random() * 4),
      },
    };
  }

  const connectionDefs = [
    { id: 'conn-1', sourceId: 'demo-1', targetId: 'demo-2', relationship: 'success', queued: 3 },
    { id: 'conn-2', sourceId: 'demo-2', targetId: 'demo-3', relationship: 'success', queued: 1 },
    { id: 'conn-3', sourceId: 'demo-2', targetId: 'demo-4', relationship: 'tool_call', queued: 2 },
    { id: 'conn-4', sourceId: 'demo-3', targetId: 'demo-5', relationship: 'success', queued: 0 },
    { id: 'conn-5', sourceId: 'demo-4', targetId: 'demo-5', relationship: 'success', queued: 1 },
  ];

  const connections: Record<string, FlowConnection> = {};
  for (const c of connectionDefs) {
    connections[c.id] = {
      id: c.id,
      sourceId: c.sourceId,
      targetId: c.targetId,
      relationship: c.relationship,
      queuedCount: c.queued,
      backPressureActive: false,
    };
  }

  return { nodes, connections };
}

export const useFlowStore = create<FlowState & FlowActions>((set, get) => ({
  nodes: {},
  connections: {},
  groups: {},
  rootGroupId: null,
  currentGroupId: null,
  demoMode: true,

  initDemoData: () => {
    const { nodes, connections } = createDemoData();
    set({
      nodes,
      connections,
      groups: {},
      rootGroupId: 'root',
      currentGroupId: 'root',
    });
  },

  setFlowData: (entity: ProcessGroupFlowEntity) => {
    const flow = entity.processGroupFlow.flow;
    const groupId = entity.processGroupFlow.id;

    const nodes: Record<string, FlowNode> = {};
    for (const p of flow.processors) {
      const comp = p.component;
      const snap = p.status.aggregateSnapshot;
      nodes[comp.id] = {
        id: comp.id,
        name: comp.name,
        type: 'processor',
        processorType: comp.type,
        state: comp.state,
        position: nifiToWorld(comp.position.x, comp.position.y),
        parentGroupId: comp.parentGroupId,
        color: getProcessorColor(comp.type),
        stats: {
          flowFilesIn: snap.flowFilesIn,
          flowFilesOut: snap.flowFilesOut,
          bytesIn: snap.bytesIn,
          bytesOut: snap.bytesOut,
          activeThreads: snap.activeThreadCount,
        },
      };
    }

    const connections: Record<string, FlowConnection> = {};
    for (const c of flow.connections) {
      const comp = c.component;
      const snap = c.status.aggregateSnapshot;
      connections[comp.id] = {
        id: comp.id,
        sourceId: comp.source.id,
        targetId: comp.destination.id,
        relationship: comp.selectedRelationships[0] ?? 'default',
        queuedCount: snap.flowFilesQueued,
        backPressureActive: snap.flowFilesQueued >= comp.backPressureObjectThreshold,
      };
    }

    const groups: Record<string, FlowGroup> = {};
    for (const g of flow.processGroups) {
      const comp = g.component;
      groups[comp.id] = {
        id: comp.id,
        name: comp.name,
        parentGroupId: comp.parentGroupId,
        position: nifiToWorld(comp.position.x, comp.position.y),
        childNodeIds: [],
        childConnectionIds: [],
        runningCount: comp.runningCount,
        stoppedCount: comp.stoppedCount,
        color: '#3b82f6',
        isExpanded: get().groups[comp.id]?.isExpanded ?? false,
      };
    }

    set({
      nodes,
      connections,
      groups,
      rootGroupId: get().rootGroupId ?? groupId,
      currentGroupId: get().currentGroupId ?? groupId,
    });
  },

  setNodePosition: (id: string, pos: [number, number, number]) => {
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { ...state.nodes[id], position: pos },
      },
    }));
  },

  toggleGroupExpanded: (id: string) => {
    set((state) => ({
      groups: {
        ...state.groups,
        [id]: { ...state.groups[id], isExpanded: !state.groups[id].isExpanded },
      },
    }));
  },

  navigateToGroup: (id: string) => {
    set({ currentGroupId: id });
  },

  navigateUp: () => {
    const state = get();
    if (state.currentGroupId && state.currentGroupId !== state.rootGroupId) {
      const group = state.groups[state.currentGroupId];
      if (group) {
        set({ currentGroupId: group.parentGroupId });
      }
    }
  },
}));
