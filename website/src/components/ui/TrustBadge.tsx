type TrustBadgeProps = {
  label: string;
};

export default function TrustBadge({ label }: TrustBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface/50 text-xs text-text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      {label}
    </span>
  );
}
