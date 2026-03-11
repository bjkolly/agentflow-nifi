import type { ReactNode } from 'react';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  borderColor?: string;
};

export default function GlassCard({
  children,
  className = '',
  borderColor,
}: GlassCardProps) {
  return (
    <div
      className={`glass ${className}`}
      style={
        borderColor
          ? { borderTop: `4px solid ${borderColor}` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
