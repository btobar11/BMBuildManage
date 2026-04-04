import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
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

  const handleSelect = (id: 'light' | 'dark' | 'system') => {
    setTheme(id);
    setIsOpen(false);
  };

  const themeOptions = [
    { id: 'light', label: 'Claro', icon: Sun },
    { id: 'dark', label: 'Oscuro', icon: Moon },
    { id: 'system', label: 'Sistema', icon: Monitor },
  ];

  const isActive = (id: string) => {
    if (id === 'system') return theme === 'system';
    return theme === id;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
        aria-label="Cambiar tema"
      >
        {theme === 'dark' ? (
          <Moon size={18} className="text-foreground" />
        ) : (
          <Sun size={18} className="text-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-up">
          <div className="py-1">
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id as 'light' | 'dark' | 'system')}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                    isActive(option.id) 
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <IconComponent size={16} />
                  <span className="flex-1 text-left">{option.label}</span>
                  {isActive(option.id) && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
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
