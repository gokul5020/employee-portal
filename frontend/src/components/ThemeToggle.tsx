import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, type Theme } from '../context/ThemeContext';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const themes: { id: Theme; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const currentIcon = resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="theme-toggle-btn"
        aria-label={`Current theme: ${theme}. Click to change theme`}
        title={`Current theme: ${theme}. Click to change`}
      >
        <span className="theme-toggle-icon">
          {currentIcon}
        </span>
        {!compact && (
          <>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, textTransform: 'capitalize' }}>
              {theme}
            </span>
            <ChevronDown size={14} style={{ opacity: 0.6 }} />
          </>
        )}
      </button>

      {menuOpen && (
        <div className="theme-dropdown-menu" role="menu">
          <div style={{ padding: '6px 8px', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Theme appearance
          </div>
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setMenuOpen(false);
                }}
                className={`theme-dropdown-item ${isSelected ? 'active' : ''}`}
                role="menuitem"
              >
                <Icon size={15} />
                <span>{t.label}</span>
                {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-brand-500)' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
