import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions = [
    { id: 'light', label: 'Claro', icon: Sun, description: 'Modo claro' },
    { id: 'dark', label: 'Oscuro', icon: Moon, description: 'Modo oscuro' },
    { id: 'system', label: 'Sistema', icon: Monitor, description: `Seguir al sistema (${systemTheme === 'dark' ? 'oscuro' : 'claro'})` },
  ] as const;

  const Icon = theme === 'dark' ? Moon : Sun;

  const handleSelect = (id: 'light' | 'dark' | 'system') => {
    if (id === 'system') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        localStorage.removeItem('theme');
      }
    }
    setTheme(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 group"
        aria-label="Cambiar tema"
        aria-expanded={isOpen}
      >
        <Icon className="w-5 h-5 text-violet-400 group-hover:rotate-12 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#12121a] border border-white/10 rounded-xl shadow-2xl shadow-violet-500/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
          <div className="p-2">
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider px-3 py-2">
              Tema
            </p>
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = option.id === 'system' 
                ? theme === 'system'
                : option.id === theme;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                    isActive 
                      ? 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 text-violet-300 border border-violet-500/30' 
                      : 'hover:bg-white/5 text-white/60 border border-transparent'
                  )}
                >
                  <IconComponent size={18} className={isActive ? 'text-violet-400' : 'text-white/40'} />
                  <div className="flex-1">
                    <p className={cn('text-sm font-semibold', isActive && 'text-white')}>
                      {option.label}
                    </p>
                    <p className="text-xs text-white/40">
                      {option.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
