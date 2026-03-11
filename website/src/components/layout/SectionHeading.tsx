'use client';

import type { ReactNode } from 'react';
import FadeUp from '@/components/animations/FadeUp';

type SectionHeadingProps = {
  label: string;
  labelColor?: string;
  title: ReactNode;
  subtitle?: string;
};

export default function SectionHeading({
  label,
  labelColor,
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="text-center mb-16">
      <FadeUp>
        <p
          className="text-xs uppercase tracking-[3px] font-semibold"
          style={{ color: labelColor ?? '#7c3aed' }}
        >
          {label}
        </p>
      </FadeUp>
      <FadeUp delay={0.1}>
        <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary mt-3">
          {title}
        </h2>
      </FadeUp>
      {subtitle && (
        <FadeUp delay={0.2}>
          <p className="text-lg text-text-muted mt-4 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </FadeUp>
      )}
    </div>
  );
}
