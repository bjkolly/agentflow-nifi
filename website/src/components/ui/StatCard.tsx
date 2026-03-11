import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';

type StatCardProps = {
  number: string;
  label: string;
};

export default function StatCard({ number, label }: StatCardProps) {
  return (
    <GlassCard className="p-6 text-center">
      <div className="text-5xl font-extrabold">
        <GradientText>{number}</GradientText>
      </div>
      <p className="text-text-muted mt-2 text-sm">{label}</p>
    </GlassCard>
  );
}
