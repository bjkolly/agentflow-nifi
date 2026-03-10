export type ProcessorDTO = {
  id: string;
  parentGroupId: string;
  position: { x: number; y: number };
  name: string;
  type: string;
  state: 'RUNNING' | 'STOPPED' | 'DISABLED' | 'INVALID';
  config: { properties: Record<string, string> };
};

export type ConnectionDTO = {
  id: string;
  source: { id: string; groupId: string; type: string };
  destination: { id: string; groupId: string; type: string };
  selectedRelationships: string[];
  backPressureObjectThreshold: number;
};

export type ProcessGroupDTO = {
  id: string;
  parentGroupId: string;
  position: { x: number; y: number };
  name: string;
  comments: string;
  runningCount: number;
  stoppedCount: number;
  invalidCount: number;
  disabledCount: number;
};

export type ProvenanceEventDTO = {
  eventId: number;
  eventTime: string;
  eventType: string;
  componentId: string;
  componentName: string;
  componentType: string;
  processGroupId: string;
  flowFileUuid: string;
  fileSize: string;
  eventDuration: number;
  updatedAttributes: Array<{ name: string; value: string }>;
};

export type ProcessGroupFlowEntity = {
  processGroupFlow: {
    id: string;
    flow: {
      processors: Array<{
        id: string;
        component: ProcessorDTO;
        status: {
          aggregateSnapshot: {
            bytesIn: number;
            bytesOut: number;
            flowFilesIn: number;
            flowFilesOut: number;
            activeThreadCount: number;
          };
        };
      }>;
      connections: Array<{
        id: string;
        component: ConnectionDTO;
        status: {
          aggregateSnapshot: {
            flowFilesQueued: number;
            bytesQueued: number;
          };
        };
      }>;
      processGroups: Array<{
        id: string;
        component: ProcessGroupDTO;
        status: {
          aggregateSnapshot: {
            activeThreadCount: number;
          };
        };
      }>;
    };
  };
};

export type SystemDiagnosticsEntity = {
  systemDiagnostics: {
    aggregateSnapshot: {
      totalNonHeap: string;
      usedNonHeap: string;
      maxHeap: string;
      usedHeap: string;
      availableProcessors: number;
    };
  };
};
