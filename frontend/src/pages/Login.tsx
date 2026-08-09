import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Lock, Mail, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.login({ email, password });
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (eMail: string, pass: string) => {
    setEmail(eMail);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b11] text-gray-200 relative p-4">
      {/* Decorative Glow Spots */}
      <div className="absolute top-[20%] left-[20%] w-[35%] h-[35%] rounded-full glow-spot-blue pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full glow-spot-purple pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-purple-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-brand-500/20 mb-3">
            ES
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Employee Self-Service
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 text-center">
            A Centralized Platform for Employee Self-Management
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/20 text-rose-300 text-sm p-3.5 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-600/10 hover:shadow-brand-600/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center space-x-2 text-sm disabled:opacity-55"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick-Fill */}
        <div className="mt-8 border-t border-slate-850 pt-6">
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-3 text-center">
            Demo Credentials (Click to pre-fill)
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => fillCredentials('employee1@company.com', 'employee123')}
              className="flex justify-between items-center px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-left text-xs transition-all duration-150"
            >
              <span className="font-medium text-slate-300">Elena (Employee)</span>
              <span className="text-slate-500">employee1@company.com</span>
            </button>
            <button
              onClick={() => fillCredentials('manager@company.com', 'manager123')}
              className="flex justify-between items-center px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-left text-xs transition-all duration-150"
            >
              <span className="font-medium text-slate-300">Marcus (Manager)</span>
              <span className="text-slate-500">manager@company.com</span>
            </button>
            <button
              onClick={() => fillCredentials('admin@company.com', 'admin123')}
              className="flex justify-between items-center px-4 py-2 border border-slate-850 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-left text-xs transition-all duration-150"
            >
              <span className="font-medium text-slate-300">Sarah (HR Admin)</span>
              <span className="text-slate-500">admin@company.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
