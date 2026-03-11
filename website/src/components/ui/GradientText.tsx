import type { ReactNode } from 'react';

type GradientTextProps = {
  children: ReactNode;
  className?: string;
};

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r from-llm via-router to-memory bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
}
