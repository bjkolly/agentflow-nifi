import { nifiClient } from '../nifiClient';
import type { ProcessGroupFlowEntity } from '../../types/nifi';

export function getRootProcessGroup(): Promise<ProcessGroupFlowEntity> {
  return nifiClient.get<ProcessGroupFlowEntity>('/flow/process-groups/root');
}

export function getProcessGroupFlow(id: string): Promise<ProcessGroupFlowEntity> {
  return nifiClient.get<ProcessGroupFlowEntity>(`/flow/process-groups/${id}`);
}

export function getFlowStatus(): Promise<unknown> {
  return nifiClient.get('/flow/status');
}
