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

  const currentTheme = theme;
  const Icon = theme === 'dark' ? Moon : Sun;

  const handleSelect = (id: 'light' | 'dark' | 'system') => {
    if (id === 'system') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        localStorage.removeItem('theme');
        setTheme(getSystemTheme());
      } else {
        setTheme(systemTheme);
      }
    } else {
      setTheme(id);
    }
    setIsOpen(false);
  };

  function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-all duration-300 shadow-sm group"
        aria-label="Cambiar tema"
        aria-expanded={isOpen}
      >
        <Icon className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform duration-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Tema
            </p>
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = option.id === 'system' 
                ? theme === systemTheme && !localStorage.getItem('theme')
                : option.id === currentTheme;

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                    isActive 
                      ? 'bg-indigo-600/10 text-indigo-600' 
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <IconComponent size={18} className={isActive ? 'text-indigo-600' : 'text-muted-foreground'} />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', isActive && 'text-indigo-600')}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
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
