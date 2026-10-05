import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  User as UserIcon,
  CalendarDays,
  DollarSign,
  Sun,
  Moon,
  Clock,
  Download,
  Copy,
  Check,
  CornerDownLeft,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { attendanceApi } from '../services/api';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Preferences';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, user }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle global Cmd+K or Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or custom event
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClockToggle = async () => {
    try {
      const status = await attendanceApi.getStatus();
      const isCheckedIn = status && status.checkInTime && !status.checkOutTime;

      if (!isCheckedIn) {
        await attendanceApi.checkIn();
        showToast('Successfully clocked in for today', 'success');
      } else {
        await attendanceApi.checkOut();
        showToast('Successfully clocked out. Have a great day!', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.detail || err.response?.data || 'Failed to update attendance', 'error');
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(`EMP-${user.id}`);
      setCopied(true);
      showToast(`Copied Employee ID (EMP-${user.id}) to clipboard`, 'info');
      setTimeout(() => setCopied(false), 2000);
      onClose();
    }
  };

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Go to Dashboard',
      subtitle: 'Overview, attendance timer & quick stats',
      icon: LayoutDashboard,
      keywords: ['home', 'main', 'overview'],
      action: () => { navigate('/'); onClose(); }
    },
    {
      id: 'nav-leaves',
      category: 'Navigation',
      title: 'Go to Leave & Attendance',
      subtitle: 'Apply leave, view balance and attendance logs',
      icon: CalendarDays,
      keywords: ['vacation', 'holiday', 'time off', 'sick leave'],
      action: () => { navigate('/leaves'); onClose(); }
    },
    {
      id: 'nav-payroll',
      category: 'Navigation',
      title: 'Go to Payroll',
      subtitle: 'View payslips and salary breakdown',
      icon: DollarSign,
      keywords: ['salary', 'pay', 'compensation', 'taxes'],
      action: () => { navigate('/payroll'); onClose(); }
    },
    {
      id: 'nav-profile',
      category: 'Navigation',
      title: 'Go to My Profile',
      subtitle: 'Personal details and direct deposit banking',
      icon: UserIcon,
      keywords: ['account', 'user', 'bank', 'settings'],
      action: () => { navigate('/profile'); onClose(); }
    },

    // Actions
    {
      id: 'action-clock',
      category: 'Actions',
      title: 'Clock In / Clock Out',
      subtitle: 'Record daily attendance punch',
      icon: Clock,
      keywords: ['punch', 'time', 'check in', 'check out'],
      action: handleClockToggle
    },
    {
      id: 'action-apply-leave',
      category: 'Actions',
      title: 'Apply for Leave',
      subtitle: 'Submit a new time-off request',
      icon: CalendarDays,
      keywords: ['request', 'vacation', 'sick', 'pto'],
      action: () => { navigate('/leaves'); onClose(); }
    },
    {
      id: 'action-payroll-view',
      category: 'Actions',
      title: 'Download Latest Payslip',
      subtitle: 'Open payroll portal to generate PDF payslip',
      icon: Download,
      keywords: ['pdf', 'statement', 'tax'],
      action: () => { navigate('/payroll'); onClose(); }
    },
    {
      id: 'action-copy-id',
      category: 'Actions',
      title: 'Copy Employee ID',
      subtitle: `EMP-${user?.id || '---'}`,
      icon: copied ? Check : Copy,
      keywords: ['badge', 'number', 'emp'],
      action: handleCopyId
    },

    // Preferences
    {
      id: 'pref-theme',
      category: 'Preferences',
      title: resolvedTheme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: `Currently in ${resolvedTheme} mode`,
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      keywords: ['theme', 'dark', 'light', 'white', 'mode', 'color'],
      action: () => { toggleTheme(); onClose(); }
    }
  ];

  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchTitle = cmd.title.toLowerCase().includes(q);
    const matchSub = cmd.subtitle?.toLowerCase().includes(q);
    const matchKeyword = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
    const matchCat = cmd.category.toLowerCase().includes(q);
    return matchTitle || matchSub || matchKeyword || matchCat;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="command-palette-modal" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="command-palette-input-box">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search (e.g. leaves, clock in, theme)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="command-palette-clear"
              onClick={() => setQuery('')}
              aria-label="Clear query"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="command-palette-kbd">ESC</kbd>
          )}
        </div>

        {/* Command List */}
        <div className="command-palette-list">
          {filtered.length === 0 ? (
            <div className="command-palette-empty">
              No matching commands or pages found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-palette-item-icon">
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="command-palette-item-title">{item.title}</div>
                    {item.subtitle && (
                      <div className="command-palette-item-subtitle">{item.subtitle}</div>
                    )}
                  </div>
                  <span className="command-palette-item-badge">{item.category}</span>
                  {isSelected && (
                    <CornerDownLeft size={14} className="command-palette-item-enter" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="command-palette-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to select</span>
            <span><kbd>esc</kbd> to close</span>
          </div>
          <div>Employee Self-Service</div>
        </div>
      </div>
    </div>
  );
};
