'use client';

import { useId } from 'react';

export type BMLogoVariant = 'full' | 'compact' | 'icon';

interface BMLogoProps {
  variant: BMLogoVariant;
  className?: string;
}

export function BMLogo({ variant, className = '' }: BMLogoProps) {
  const gradientId = useId();
  const gradientRef = `${gradientId}-emerald`;

  const isotipo = (
    <svg
      viewBox="0 0 40 40"
      className="shrink-0 w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientRef} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <g stroke={`url(#${gradientRef})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 4 L36 14 L20 24 L4 14 Z" />
        <path d="M4 14 L20 24 L20 36 L4 26 Z" />
        <path d="M20 24 L36 14 L36 26 L20 36 Z" />
        <path d="M10 18 L10 22 M10 18 C12 18 13 19 13 20 C13 21 12 22 10 22" strokeWidth="1.5" opacity="0.6" />
        <path d="M26 18 L30 24 L34 18 M28 21 L30 24 L32 21" strokeWidth="1.5" opacity="0.6" />
      </g>
    </svg>
  );

  const textBM = (
    <span className="text-slate-950 dark:text-white font-bold text-lg leading-none">
      BM
    </span>
  );

  const textBuildManage = (
    <span className="text-slate-500 dark:text-slate-400 font-medium text-[10px] tracking-widest uppercase leading-none">
      BUILD MANAGE
    </span>
  );

  const containerClasses = {
    full: 'flex items-center gap-3',
    compact: 'flex items-center gap-2',
    icon: 'flex items-center',
  };

  const textElements = {
    full: (
      <>
        {textBM}
        {textBuildManage}
      </>
    ),
    compact: textBM,
    icon: null,
  };

  const sizeClass = variant === 'icon' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className={`shrink-0 ${sizeClass}`}>
        {isotipo}
      </div>
      {textElements[variant] && (
        <div className="flex flex-col leading-none">
          {textElements[variant]}
        </div>
      )}
    </div>
  );
}

export default BMLogo;
