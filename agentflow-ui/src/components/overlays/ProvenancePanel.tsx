import { motion, AnimatePresence } from 'framer-motion';
import GlassmorphicPanel from '../shared/GlassmorphicPanel';
import ProvenanceEventRow from './ProvenanceEvent';
import { useUiStore } from '../../store/uiStore';
import { useProvenanceStore } from '../../store/provenanceStore';
import { formatTokens, formatCost } from '../../utils/format';

export default function ProvenancePanel() {
  const provenancePanelOpen = useUiStore((s) => s.provenancePanelOpen);
  const events = useProvenanceStore((s) => s.events);
  const totalTokensIn = useProvenanceStore((s) => s.totalTokensIn);
  const totalTokensOut = useProvenanceStore((s) => s.totalTokensOut);
  const estimatedCost = useProvenanceStore((s) => s.estimatedCost);
  const setAutoScrollPaused = useProvenanceStore((s) => s.setAutoScrollPaused);

  return (
    <AnimatePresence>
      {provenancePanelOpen && (
        <motion.div
          initial={{ x: 280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 280, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="absolute top-12 right-0 bottom-0 w-72 z-40"
        >
          <GlassmorphicPanel className="h-full rounded-none border-r-0 border-b-0 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                Provenance Log
              </h3>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-600">{events.length} events</span>
              </div>
            </div>

            {/* Scrollable events list */}
            <div
              className="flex-1 overflow-y-auto min-h-0"
              onMouseEnter={() => setAutoScrollPaused(true)}
              onMouseLeave={() => setAutoScrollPaused(false)}
            >
              {events.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-600 italic">
                  Waiting for provenance events...
                </div>
              ) : (
                events.map((evt) => (
                  <ProvenanceEventRow key={evt.eventId} event={evt} />
                ))
              )}
            </div>

            {/* Footer stats */}
            <div className="p-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-gray-500">
              <span>
                Tokens: <span className="text-cyan-400">{formatTokens(totalTokensIn)}</span>
                {' / '}
                <span className="text-amber-400">{formatTokens(totalTokensOut)}</span>
              </span>
              <span>
                Cost: <span className="text-green-400">{formatCost(estimatedCost)}</span>
              </span>
            </div>
          </GlassmorphicPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
