import type { ProvenanceEventDTO } from '../../types/nifi';
import { formatTimestamp, formatDuration } from '../../utils/format';

type ProvenanceEventProps = {
  event: ProvenanceEventDTO;
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  RECEIVE: '#3b82f6',
  SEND: '#22c55e',
  ROUTE: '#f59e0b',
  CONTENT_MODIFIED: '#7c3aed',
  ATTRIBUTES_MODIFIED: '#06b6d4',
  DROP: '#ef4444',
  default: '#6366f1',
};

function getEventColor(eventType: string): string {
  return EVENT_TYPE_COLORS[eventType] ?? EVENT_TYPE_COLORS.default;
}

export default function ProvenanceEvent({ event }: ProvenanceEventProps) {
  const color = getEventColor(event.eventType);
  const tokensAttr = event.updatedAttributes.find((a) => a.name === 'llm.tokens.input');
  const tokensOutAttr = event.updatedAttributes.find((a) => a.name === 'llm.tokens.output');

  return (
    <div
      className="py-1.5 px-2 border-l-2 hover:bg-white/[0.02] transition-colors"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 font-mono shrink-0">
          {formatTimestamp(event.eventTime)}
        </span>
        <span
          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: color + '20',
            color: color,
          }}
        >
          {event.eventType}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-gray-300 truncate">{event.componentName}</span>
        <span className="text-[10px] text-gray-600">{formatDuration(event.eventDuration)}</span>
      </div>
      {(tokensAttr || tokensOutAttr) && (
        <div className="flex items-center gap-2 mt-0.5">
          {tokensAttr && (
            <span className="text-[9px] text-cyan-500">
              in:{tokensAttr.value}
            </span>
          )}
          {tokensOutAttr && (
            <span className="text-[9px] text-amber-500">
              out:{tokensOutAttr.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
