import { useEffect } from 'react';
import { useFlowStore } from '../store/flowStore';
import { useNifiStore } from '../store/nifiStore';
import { getProcessGroupFlow } from '../api/endpoints/flow';

export function useNifiPolling(): void {
  const demoMode = useFlowStore((s) => s.demoMode);
  const currentGroupId = useFlowStore((s) => s.currentGroupId);
  const setFlowData = useFlowStore((s) => s.setFlowData);
  const setConnected = useNifiStore((s) => s.setConnected);

  useEffect(() => {
    if (demoMode) return;
    if (!currentGroupId) return;

    let cancelled = false;

    async function poll() {
      try {
        const data = await getProcessGroupFlow(currentGroupId!);
        if (!cancelled) {
          setFlowData(data);
          setConnected(true);
        }
      } catch (err) {
        if (!cancelled) {
          setConnected(false, err instanceof Error ? err.message : 'Connection failed');
        }
      }
    }

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [demoMode, currentGroupId, setFlowData, setConnected]);
}
