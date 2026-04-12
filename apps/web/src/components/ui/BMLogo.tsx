'use client';

import { useTheme } from '../../context/ThemeContext';

export type BMLogoVariant = 'full' | 'compact' | 'icon';

interface BMLogoProps {
  variant: BMLogoVariant;
  className?: string;
}

/**
 * BMBuildManage Logo Component
 * 
 * Brand Identity: Emerald Cube
 * - Isometric wireframe cube integrating letters B and M
 * - Minimalist monolinear style (constant line weight)
 * - Professional, modern SaaS aesthetic
 */
export function BMLogo({ variant, className = '' }: BMLogoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Brand colors
  const emerald = '#10B981';
  const darkNavy = '#0F172A';
  const textColor = isDark ? '#F8FAFC' : darkNavy;
  
  // Isometric Cube Isotipo - The core brand mark
  const isotipo = (
    <svg
      viewBox="0 0 80 80"
      className="shrink-0 w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon perimeter */}
      <path 
        d="M40 5 L75 25 L75 60 L40 80 L5 60 L5 25 Z" 
        stroke={emerald} 
        strokeWidth="3" 
        fill="none" 
        strokeLinejoin="round"
      />
      
      {/* Center vertical line - isometric axis */}
      <path 
        d="M40 5 L40 80" 
        stroke={emerald} 
        strokeWidth="3" 
        fill="none" 
        strokeLinecap="round"
      />
      
      {/* Left face (B suggestion) */}
      <path 
        d="M5 25 L40 42 L40 60 L5 80 L5 25 Z" 
        stroke={emerald} 
        strokeWidth="2.5" 
        fill="none" 
        strokeLinejoin="round"
      />
      
      {/* Right face (M suggestion) */}
      <path 
        d="M40 42 L75 25 L75 60 L40 80 L40 42 Z" 
        stroke={emerald} 
        strokeWidth="2.5" 
        fill="none" 
        strokeLinejoin="round"
      />
      
      {/* Top face */}
      <path 
        d="M5 25 L40 5 L75 25 L40 42 L5 25 Z" 
        stroke={emerald} 
        strokeWidth="2.5" 
        fill="none" 
        strokeLinejoin="round"
      />
      
      {/* Depth accent lines */}
      <path 
        d="M22 32 L40 42 L58 32" 
        stroke={emerald} 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
      />
      <path 
        d="M22 52 L40 62 L58 52" 
        stroke={emerald} 
        strokeWidth="1.5" 
        fill="none" 
        strokeLinecap="round"
      />
    </svg>
  );
  
  // Text: BM (Extra Bold geometric sans)
  const textBM = (
    <span 
      className="text-foreground font-extrabold text-lg leading-none tracking-tight"
      style={{ color: textColor }}
    >
      BM
    </span>
  );
  
  // Text: BUILD MANAGE (Bold, wide tracking)
  const textBuildManage = (
    <span 
      className="text-xs font-bold tracking-[0.25em] uppercase"
      style={{ color: emerald }}
    >
      BUILD MANAGE
    </span>
  );
  
  // Layout configurations
  const containerClasses = {
    full: 'flex items-center gap-3',
    compact: 'flex items-center gap-2', 
    icon: 'flex items-center justify-center',
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
  
  // Size mapping
  const sizeClass = {
    full: 'w-10 h-10',
    compact: 'w-8 h-8',
    icon: 'w-7 h-7'
  }[variant];
  
  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      <div className={`shrink-0 ${sizeClass}`}>
        {isotipo}
      </div>
      {textElements[variant]}
    </div>
  );
}

export default BMLogo;