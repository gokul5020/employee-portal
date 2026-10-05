import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User as UserIcon,
  CalendarDays,
  DollarSign,
  LogOut,
  Menu,
  X,
  Search,
  Megaphone,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { CommandPalette } from './CommandPalette';
import { AnnouncementsModal } from './AnnouncementsModal';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Profile', path: '/profile', icon: UserIcon },
  { name: 'Leave & Attendance', path: '/leaves', icon: CalendarDays },
  { name: 'Payroll', path: '/payroll', icon: DollarSign },
];

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'ROLE_ADMIN': return 'badge badge-admin';
    case 'ROLE_MANAGER': return 'badge badge-manager';
    default: return 'badge badge-employee';
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'ROLE_ADMIN': return 'HR Admin';
    case 'ROLE_MANAGER': return 'Manager';
    default: return 'Employee';
  }
}

interface SidebarContentProps {
  user: any;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ user, currentPath, onNavigate, onLogout }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    {/* Logo */}
    <div
      style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid var(--border-default)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          backgroundColor: 'var(--color-brand-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 11,
          color: '#fff',
          flexShrink: 0,
          letterSpacing: '-0.02em',
        }}
      >
        EP
      </div>
      <span
        style={{
          marginLeft: 10,
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        Employee Portal
      </span>
    </div>

    {/* Navigation */}
    <nav style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
      <div style={{ marginBottom: 4 }}>
        {menuItems.map((item) => {
          const active = currentPath === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`nav-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={16} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>

    {/* User Footer */}
    <div
      style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface-raised)',
        flexShrink: 0,
      }}
    >
      {/* User info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'var(--brand-subtle)',
            border: '1px solid var(--brand-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-brand-600)',
            flexShrink: 0,
          }}
        >
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}
          >
            {user?.fullName}
          </p>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}
          >
            {user?.email}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={getRoleBadgeClass(user?.role)}>
          {getRoleLabel(user?.role)}
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-danger btn-sm"
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          title="Sign out"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);

  // Listen for custom event to open palette
  useEffect(() => {
    const handleOpen = () => setCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpen);
    return () => window.removeEventListener('open-command-palette', handleOpen);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const currentPageName =
    menuItems.find((item) => item.path === location.pathname)?.name || 'Portal';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="sidebar"
        style={{
          width: 230,
          flexShrink: 0,
          display: 'none',
        }}
        id="desktop-sidebar"
      >
        <SidebarContent
          user={user}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      </aside>

      {/* Media query styling */}
      <style>{`
        @media (min-width: 1024px) {
          #desktop-sidebar { display: block !important; }
          #mobile-header-title { display: none; }
          #header-search-bar { display: flex !important; }
          #mobile-menu-button { display: none !important; }
          #desktop-page-title { display: block !important; }
        }
        @media (max-width: 1023px) {
          #mobile-header-title { display: flex; }
          #header-search-bar { display: none; }
          #desktop-page-title { display: none; }
        }
      `}</style>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="drawer" role="dialog" aria-label="Navigation menu">
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="btn-ghost"
                style={{ padding: '6px', borderRadius: '6px' }}
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent
              user={user}
              currentPath={location.pathname}
              onNavigate={handleNavigate}
              onLogout={onLogout}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          className="app-header"
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          {/* Header Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile menu button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', padding: '6px', lineHeight: 1 }}
              id="mobile-menu-button"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
            >
              <Menu size={18} />
            </button>

            {/* Mobile Title */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              id="mobile-header-title"
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  backgroundColor: 'var(--color-brand-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 9,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}
              >
                EP
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Employee Portal
              </span>
            </div>

            {/* Desktop Page Title */}
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
              id="desktop-page-title"
            >
              {currentPageName}
            </span>
          </div>

          {/* Header Center / Search Bar (Desktop) */}
          <div
            id="header-search-bar"
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              backgroundColor: 'var(--bg-surface-raised)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem',
              width: 260,
              transition: 'all 0.15s ease',
            }}
          >
            <Search size={14} />
            <span style={{ flex: 1 }}>Search or jump to...</span>
            <kbd className="command-palette-kbd" style={{ fontSize: '0.625rem' }}>⌘K</kbd>
          </div>

          {/* Header Right: Actions & Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Announcements Button */}
            <button
              type="button"
              onClick={() => setAnnouncementsOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative', padding: '6px 10px', gap: 6 }}
              aria-label="View announcements"
              title="Company Notices & Updates"
            >
              <Megaphone size={14} />
              <span style={{ fontSize: '0.75rem' }}>Notices</span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  position: 'absolute',
                  top: 5,
                  right: 5,
                }}
              />
            </button>

            {/* Theme Toggle (Light / Dark / System) */}
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            flex: 1,
            padding: '24px 24px',
            overflowY: 'auto',
          }}
        >
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        user={user}
      />

      {/* Announcements Modal */}
      <AnnouncementsModal
        isOpen={announcementsOpen}
        onClose={() => setAnnouncementsOpen(false)}
      />
    </div>
  );
};
