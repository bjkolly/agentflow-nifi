'use client';

import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonProps = {
  variant: 'primary' | 'ghost';
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

const variants = {
  primary:
    'bg-gradient-to-r from-llm via-router to-memory text-white font-semibold px-8 py-3 rounded-lg hover:-translate-y-0.5 transition-all hover:shadow-[0_8px_30px_rgba(124,58,237,0.3)]',
  ghost:
    'border border-border-light text-text-primary px-8 py-3 rounded-lg hover:border-text-muted transition-all',
};

export default function Button({
  variant,
  href,
  onClick,
  children,
  className = '',
  type,
}: ButtonProps) {
  const classes = `${variants[variant]} inline-flex items-center justify-center ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? 'button'} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
