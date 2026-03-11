import type { TechItem } from '@/lib/types';
import GlassCard from '@/components/ui/GlassCard';

type TechStackGridProps = {
  items: TechItem[];
};

export default function TechStackGrid({ items }: TechStackGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map((item) => (
        <GlassCard key={item.name} className="p-4">
          <p className="text-xs text-text-dim uppercase tracking-wide mb-1">
            {item.layer}
          </p>
          <p className="text-sm text-text-primary font-medium">{item.name}</p>
        </GlassCard>
      ))}
    </div>
  );
}
