'use client';

import { useTheme } from '../../context/ThemeContext';

export type BMLogoVariant = 'full' | 'compact' | 'icon';

interface BMLogoProps {
  variant: BMLogoVariant;
  className?: string;
  /** Force a specific mode regardless of system theme */
  forceMode?: 'light' | 'dark';
}

/**
 * BMBuildManage Logo Component — Construction Identity
 * 
 * Brand Mark: Isometric building structure
 * - Recognizable as a building/construction project
 * - Three isometric faces with emerald gradients
 * - Window grid pattern communicates "building"
 * - Structural beam at top communicates "under construction"
 * 
 * Modes: Light (slate text) / Dark (white text)
 */
export function BMLogo({ variant, className = '', forceMode }: BMLogoProps) {
  const { theme } = useTheme();
  const isDark = forceMode ? forceMode === 'dark' : theme === 'dark';
  
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subtitleColor = '#10B981';
  
  // Building Structure Isotipo
  const isotipo = (
    <svg
      viewBox="0 0 80 88"
      className="shrink-0 w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BM Build Manage Logo"
    >
      <defs>
        {/* Front face — primary, brightest */}
        <linearGradient id="bm-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        
        {/* Side face — darker for depth */}
        <linearGradient id="bm-side" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        
        {/* Roof / top — brightest highlight */}
        <linearGradient id="bm-roof" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* ─── Building Structure ──────────────────────────────── */}
      
      {/* Front face — main building facade */}
      <path d="M8 28 L44 28 L44 82 L8 82 Z" fill="url(#bm-front)" />
      
      {/* Right side face — isometric depth */}
      <path d="M44 28 L72 14 L72 68 L44 82 Z" fill="url(#bm-side)" />
      
      {/* Roof — top face */}
      <path d="M8 28 L36 14 L72 14 L44 28 Z" fill="url(#bm-roof)" />
      
      {/* ─── Window Grid (front face) — communicates "building" */}
      {/* Row 1 */}
      <rect x="13" y="35" width="8" height="10" rx="1" fill="#A7F3D0" opacity="0.45" />
      <rect x="25" y="35" width="8" height="10" rx="1" fill="#A7F3D0" opacity="0.45" />
      <rect x="37" y="35" width="4" height="10" rx="1" fill="#A7F3D0" opacity="0.35" />
      
      {/* Row 2 */}
      <rect x="13" y="50" width="8" height="10" rx="1" fill="#A7F3D0" opacity="0.35" />
      <rect x="25" y="50" width="8" height="10" rx="1" fill="#A7F3D0" opacity="0.35" />
      <rect x="37" y="50" width="4" height="10" rx="1" fill="#A7F3D0" opacity="0.25" />
      
      {/* Row 3 — entrance/door */}
      <rect x="13" y="65" width="8" height="10" rx="1" fill="#A7F3D0" opacity="0.25" />
      <rect x="25" y="66" width="8" height="16" rx="1.5" fill="#6EE7B7" opacity="0.35" />
      
      {/* ─── Side windows (perspective) */}
      <path d="M48 35 L60 29 L60 37 L48 43 Z" fill="#A7F3D0" opacity="0.2" />
      <path d="M48 50 L60 44 L60 52 L48 58 Z" fill="#A7F3D0" opacity="0.15" />
      <path d="M48 65 L60 59 L60 67 L48 73 Z" fill="#A7F3D0" opacity="0.1" />
      
      {/* ─── Construction Crane Beam — "under construction" signal */}
      {/* Vertical mast */}
      <rect x="4" y="4" width="3" height="78" rx="1" fill="#047857" opacity="0.7" />
      {/* Horizontal jib */}
      <rect x="4" y="4" width="50" height="3" rx="1" fill="#047857" opacity="0.6" />
      {/* Counter-jib */}
      <rect x="4" y="4" width="3" height="3" rx="0.5" fill="#34D399" opacity="0.8" />
      {/* Cable line */}
      <line x1="54" y1="7" x2="54" y2="18" stroke="#6EE7B7" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      {/* Hook */}
      <path d="M52 18 Q54 22 56 18" stroke="#6EE7B7" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      
      {/* ─── Edge highlights */}
      <path d="M8 28 L44 28 L72 14" stroke="#6EE7B7" strokeWidth="1" fill="none" opacity="0.4" strokeLinejoin="round" />
    </svg>
  );
  
  // Text elements
  const textBM = (
    <span 
      className="font-extrabold text-lg leading-none tracking-tight"
      style={{ color: textColor }}
    >
      BM
    </span>
  );
  
  const textBuildManage = (
    <span 
      className="text-[10px] font-bold tracking-[0.2em] uppercase"
      style={{ color: subtitleColor }}
    >
      BUILD MANAGE
    </span>
  );
  
  // Layout configurations
  const containerClasses = {
    full: 'flex items-center gap-2.5',
    compact: 'flex items-center gap-2', 
    icon: 'flex items-center justify-center',
  };
  
  const textElements = {
    full: (
      <div className="flex flex-col leading-none gap-0.5">
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
    full: 'w-9 h-9',
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