import GlassmorphicPanel from '../shared/GlassmorphicPanel';
import { useFlowStore } from '../../store/flowStore';
import { useNifiStore } from '../../store/nifiStore';
import { useProvenanceStore } from '../../store/provenanceStore';
import { formatTokens, formatCost } from '../../utils/format';

export default function TopBar() {
  const nodes = useFlowStore((s) => s.nodes);
  const demoMode = useFlowStore((s) => s.demoMode);
  const baseUrl = useNifiStore((s) => s.baseUrl);
  const isConnected = useNifiStore((s) => s.isConnected);
  const totalTokensIn = useProvenanceStore((s) => s.totalTokensIn);
  const totalTokensOut = useProvenanceStore((s) => s.totalTokensOut);
  const estimatedCost = useProvenanceStore((s) => s.estimatedCost);

  const nodeList = Object.values(nodes);
  const processorCount = nodeList.length;
  const runningCount = nodeList.filter((n) => n.state === 'RUNNING').length;

  return (
    <GlassmorphicPanel className="absolute top-0 left-0 right-0 h-12 z-50 flex items-center px-4 rounded-none border-t-0 border-x-0">
      {/* Left: Brand */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
        <span className="text-white font-bold text-sm tracking-wide">AgentFlow</span>
      </div>

      {/* Center: Connection status */}
      <div className="flex-1 flex justify-center items-center gap-2 text-xs text-gray-400">
        <span className="font-mono">{demoMode ? 'Demo Mode' : baseUrl}</span>
        {!demoMode && (
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        )}
        {demoMode && (
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-[10px] font-medium">
            DEMO
          </span>
        )}
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>
          <span className="text-gray-500">Processors:</span>{' '}
          <span className="text-white">{processorCount}</span>
        </span>
        <span>
          <span className="text-gray-500">Running:</span>{' '}
          <span className="text-green-400">{runningCount}</span>
        </span>
        <span>
          <span className="text-gray-500">Tokens:</span>{' '}
          <span className="text-cyan-400">{formatTokens(totalTokensIn + totalTokensOut)}</span>
        </span>
        <span>
          <span className="text-gray-500">Cost:</span>{' '}
          <span className="text-amber-400">{formatCost(estimatedCost)}</span>
        </span>
      </div>
    </GlassmorphicPanel>
  );
}
