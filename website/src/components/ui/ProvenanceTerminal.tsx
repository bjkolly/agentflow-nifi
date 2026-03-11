'use client';

import FadeUp from '@/components/animations/FadeUp';

type LogEntry = {
  time: string;
  event: string;
  eventColor: string;
  detail: string;
};

const LOG_ENTRIES: LogEntry[] = [
  { time: '12:34:01', event: 'RECEIVE', eventColor: '#3b82f6', detail: 'FlowFile ff-2847 \u2192 TaskPlanner' },
  { time: '12:34:01', event: 'ROUTE', eventColor: '#10b981', detail: 'TaskPlanner \u2192 AgentRouter [success]' },
  { time: '12:34:02', event: 'ROUTE', eventColor: '#10b981', detail: 'AgentRouter \u2192 LLMInference [success]' },
  { time: '12:34:02', event: 'CONTENT', eventColor: '#7c3aed', detail: 'LLMInference modified content (tokens: 1,847)' },
  { time: '12:34:03', event: 'ATTRIBUTE', eventColor: '#06b6d4', detail: 'LLMInference set llm.model = claude-3-opus' },
  { time: '12:34:03', event: 'ROUTE', eventColor: '#10b981', detail: 'LLMInference \u2192 ToolExecutor [tool_call]' },
  { time: '12:34:04', event: 'REMOTE', eventColor: '#f59e0b', detail: 'ToolExecutor invoked api.weather.com (247ms)' },
  { time: '12:34:04', event: 'CONTENT', eventColor: '#7c3aed', detail: 'ToolExecutor modified content (bytes: 3,412)' },
  { time: '12:34:04', event: 'ROUTE', eventColor: '#10b981', detail: 'ToolExecutor \u2192 MemoryManager [success]' },
  { time: '12:34:05', event: 'CONTENT', eventColor: '#7c3aed', detail: 'MemoryManager stored to vectordb (dims: 1536)' },
  { time: '12:34:05', event: 'ROUTE', eventColor: '#10b981', detail: 'MemoryManager \u2192 GuardrailsEnforcer [success]' },
  { time: '12:34:05', event: 'DROP', eventColor: '#ef4444', detail: 'GuardrailsEnforcer quarantined PII (SSN detected)' },
];

export default function ProvenanceTerminal() {
  return (
    <FadeUp>
      <div className="rounded-xl overflow-hidden border border-border bg-[#0d0d12]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#111118] border-b border-border/50">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-xs text-text-dim font-mono">
            Data Provenance &mdash; FlowFile ff-2847
          </span>
        </div>

        {/* Log body */}
        <div className="p-4 font-mono text-xs leading-6 overflow-x-auto">
          {LOG_ENTRIES.map((entry, i) => (
            <div key={i} className="whitespace-nowrap">
              <span className="text-text-dim">[{entry.time}]</span>{' '}
              <span
                className="inline-block w-24 font-semibold"
                style={{ color: entry.eventColor }}
              >
                {entry.event}
              </span>{' '}
              <span className="text-text-muted">{entry.detail}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/50 bg-[#111118] text-xs text-text-dim font-mono">
          12 events &middot; 4.2s &middot; 1,847 tokens &middot; $0.024
        </div>
      </div>
    </FadeUp>
  );
}
