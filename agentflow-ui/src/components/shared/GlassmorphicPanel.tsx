import type { ReactNode } from 'react';

type GlassmorphicPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function GlassmorphicPanel({ children, className = '' }: GlassmorphicPanelProps) {
  return (
    <div
      className={`bg-[#0d1117]/85 backdrop-blur-xl border border-white/[0.06] rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}
