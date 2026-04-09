'use client';

import { useTheme } from '../../context/ThemeContext';

export type BMLogoVariant = 'full' | 'compact' | 'icon';

interface BMLogoProps {
  variant: BMLogoVariant;
  className?: string;
}

export function BMLogo({ variant, className = '' }: BMLogoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Minimal logo mark - geometric BM monogram
  const logoMark = (
    <svg
      viewBox="0 0 60 60"
      className="shrink-0 w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main Structure - Emerald Teal #047857 */}
      <rect x="5" y="10" width="8" height="40" fill={isDark ? "#10b981" : "#047857"}/>
      <rect x="5" y="10" width="40" height="8" fill={isDark ? "#10b981" : "#047857"}/>
      <rect x="47" y="10" width="8" height="40" fill={isDark ? "#10b981" : "#047857"}/>
      <rect x="21" y="10" width="8" height="40" fill={isDark ? "#10b981" : "#047857"}/>
      
      {/* Accent Lines - Emerald Green #10b981 */}
      <path d="M32 10 L38 2 L44 10 L38 6 Z" fill="#10b981"/>
      <rect x="13" y="22" width="26" height="3" fill="#10b981"/>
      <rect x="13" y="29" width="34" height="3" fill="#10b981"/>
      <rect x="13" y="36" width="34" height="3" fill="#10b981"/>
      <rect x="29" y="22" width="3" height="17" fill="#10b981"/>
      
      {/* Gaucho hat silhouette - white negative space */}
      <rect x="21" y="24" width="8" height="4" fill={isDark ? "#020617" : "#ffffff"}/>
      <rect x="18" y="28" width="14" height="2" fill={isDark ? "#020617" : "#ffffff"}/>
      <rect x="23" y="18" width="4" height="6" fill={isDark ? "#020617" : "#ffffff"}/>
    </svg>
  );

  const textBM = (
    <span className="text-foreground font-bold text-lg leading-none tracking-tight">
      BM
    </span>
  );

  const textBuildManage = (
    <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: isDark ? '#10b981' : '#047857' }}>
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
      <div className="flex flex-col leading-none">
        {textBM}
        {textBuildManage}
      </div>
    ),
    compact: (
      <div className="flex flex-col leading-none">
        {textBM}
      </div>
    ),
    icon: null,
  };

  const sizeClass = {
    full: 'w-8 h-8',
    compact: 'w-7 h-7', 
    icon: 'w-6 h-6'
  }[variant];

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className={`shrink-0 ${sizeClass}`}>
        {logoMark}
      </div>
      {textElements[variant]}
    </div>
  );
}

export default BMLogo;
