export type FlowNode = {
  id: string;
  name: string;
  type: 'processor' | 'process-group';
  processorType: string;
  state: 'RUNNING' | 'STOPPED' | 'DISABLED' | 'INVALID';
  position: [number, number, number];
  parentGroupId: string;
  color: string;
  stats: {
    flowFilesIn: number;
    flowFilesOut: number;
    bytesIn: number;
    bytesOut: number;
    activeThreads: number;
  };
};

export type FlowConnection = {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: string;
  queuedCount: number;
  backPressureActive: boolean;
};

export type FlowGroup = {
  id: string;
  name: string;
  parentGroupId: string;
  position: [number, number, number];
  childNodeIds: string[];
  childConnectionIds: string[];
  runningCount: number;
  stoppedCount: number;
  color: string;
  isExpanded: boolean;
};
