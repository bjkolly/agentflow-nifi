import { useEffect } from 'react';
import Canvas3D from './components/canvas/Canvas3D';
import TopBar from './components/overlays/TopBar';
import Sidebar from './components/overlays/Sidebar';
import ProvenancePanel from './components/overlays/ProvenancePanel';
import ContextMenu from './components/overlays/ContextMenu';
import { useUiStore } from './store/uiStore';
import { useFlowStore } from './store/flowStore';
import { startDemoProvenanceGenerator } from './store/provenanceStore';
import { useNifiPolling } from './hooks/useNifiPolling';

export default function App() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const provenancePanelOpen = useUiStore((s) => s.provenancePanelOpen);
  const initDemoData = useFlowStore((s) => s.initDemoData);
  const demoMode = useFlowStore((s) => s.demoMode);

  useNifiPolling();

  useEffect(() => {
    if (demoMode) {
      initDemoData();
      const cleanup = startDemoProvenanceGenerator();
      return cleanup;
    }
  }, [demoMode, initDemoData]);

  return (
    <div className="w-full h-full relative bg-[#0a0a0f]">
      <Canvas3D />
      <TopBar />
      {sidebarOpen && <Sidebar />}
      {provenancePanelOpen && <ProvenancePanel />}
      <ContextMenu />
    </div>
  );
}
