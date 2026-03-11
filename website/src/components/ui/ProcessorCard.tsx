import type { Processor } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';

export default function ProcessorCard({
  icon,
  name,
  color,
  description,
  relationships,
}: Processor) {
  return (
    <GlassCard borderColor={color} className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-text-primary">{name}</h3>
      </div>
      <p className="text-sm text-text-muted leading-relaxed flex-1">
        {description}
      </p>
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
        {relationships.map((rel) => (
          <span
            key={rel.name}
            className="text-xs px-2.5 py-1 rounded-full border"
            style={{
              borderColor: rel.color,
              color: rel.color,
            }}
          >
            {rel.name}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
