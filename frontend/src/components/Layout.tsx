import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  CalendarDays, 
  DollarSign, 
  LogOut, 
  Menu
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Profile', path: '/profile', icon: UserIcon },
    { name: 'Leaves & Time', path: '/leaves', icon: CalendarDays },
    { name: 'Payroll & Payslips', path: '/payroll', icon: DollarSign },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'bg-purple-900/40 text-purple-300 border border-purple-500/30';
      case 'ROLE_MANAGER': return 'bg-blue-900/40 text-blue-300 border border-blue-500/30';
      default: return 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/30';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN': return 'HR Admin';
      case 'ROLE_MANAGER': return 'Manager';
      default: return 'Employee';
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080b11] text-gray-200 overflow-hidden relative">
      {/* Background Decorative Glow Spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full glow-spot-blue pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full glow-spot-purple pointer-events-none animate-pulse-slow"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-slate-900 bg-[#080b11]/80 backdrop-blur-md">
          {/* Logo Section */}
          <div className="h-16 flex items-center px-6 border-b border-slate-900 space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/10">
              EP
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white uppercase">Self-Service</span>
          </div>
          
          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 group ${
                    active 
                      ? 'bg-brand-600/15 border border-brand-500/20 text-brand-400 font-bold shadow-md shadow-brand-500/5' 
                      : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={16} className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
          
          {/* User Footer Profile Summary */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/20">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getRoleBadge(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 border border-slate-800 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all duration-200"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-[#080b11]/70 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {}}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {menuItems.find(item => item.path === location.pathname)?.name || 'Portal'}
            </h1>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
};
