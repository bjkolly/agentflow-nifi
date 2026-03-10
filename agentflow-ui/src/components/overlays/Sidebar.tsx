import { motion, AnimatePresence } from 'framer-motion';
import GlassmorphicPanel from '../shared/GlassmorphicPanel';
import { useUiStore } from '../../store/uiStore';
import { useFlowStore } from '../../store/flowStore';
import { PROCESSOR_COLORS } from '../../utils/colors';

const AGENT_PROCESSOR_TYPES = [
  { key: 'LLMInferenceProcessor', label: 'LLM Inference' },
  { key: 'ToolExecutorProcessor', label: 'Tool Executor' },
  { key: 'MemoryManagerProcessor', label: 'Memory Manager' },
  { key: 'TaskPlannerProcessor', label: 'Task Planner' },
  { key: 'AgentRouterProcessor', label: 'Agent Router' },
  { key: 'HumanInTheLoopProcessor', label: 'Human In The Loop' },
  { key: 'GuardrailsEnforcerProcessor', label: 'Guardrails Enforcer' },
];

export default function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const selectedNodeId = useUiStore((s) => s.selectedNodeId);
  const nodes = useFlowStore((s) => s.nodes);

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.div
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -260, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="absolute top-12 left-0 bottom-0 w-64 z-40"
        >
          <GlassmorphicPanel className="h-full rounded-none border-l-0 border-b-0 p-3 flex flex-col overflow-hidden">
            {/* Processors section */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Processors
              </h3>
              <div className="space-y-1">
                {AGENT_PROCESSOR_TYPES.map((pt) => (
                  <div key={pt.key} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5 transition-colors">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: PROCESSOR_COLORS[pt.key] }}
                    />
                    <span className="text-xs text-gray-300 truncate">{pt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06] my-2" />

            {/* Selected node section */}
            <div className="flex-1 min-h-0">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Selected
              </h3>
              {selectedNode ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-500">Name: </span>
                    <span className="text-white">{selectedNode.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type: </span>
                    <span className="text-gray-300">{selectedNode.processorType.split('.').pop()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">State: </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          selectedNode.state === 'RUNNING'
                            ? '#22c55e'
                            : selectedNode.state === 'STOPPED'
                              ? '#6b7280'
                              : '#ef4444',
                      }}
                    />
                    <span className="text-gray-300">{selectedNode.state}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">FlowFiles In: </span>
                    <span className="text-cyan-400">{selectedNode.stats.flowFilesIn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">FlowFiles Out: </span>
                    <span className="text-cyan-400">{selectedNode.stats.flowFilesOut}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Active Threads: </span>
                    <span className="text-amber-400">{selectedNode.stats.activeThreads}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 italic">Click a node to see details</p>
              )}
            </div>
          </GlassmorphicPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
