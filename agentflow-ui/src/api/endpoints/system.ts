import { nifiClient } from '../nifiClient';
import type { SystemDiagnosticsEntity } from '../../types/nifi';

export function getSystemDiagnostics(): Promise<SystemDiagnosticsEntity> {
  return nifiClient.get<SystemDiagnosticsEntity>('/system-diagnostics');
}
