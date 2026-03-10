import { nifiClient } from '../nifiClient';

export function submitProvenanceQuery(request: unknown): Promise<unknown> {
  return nifiClient.post('/provenance', request);
}

export function getProvenanceResults(queryId: string): Promise<unknown> {
  return nifiClient.get(`/provenance/${queryId}`);
}

export function deleteProvenanceQuery(queryId: string): Promise<void> {
  return nifiClient.delete(`/provenance/${queryId}`);
}
