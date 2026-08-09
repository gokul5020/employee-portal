import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { User as UserIcon, Shield, CreditCard, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface ProfileProps {
  user: any;
  onProfileUpdate: (updatedUser: any) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onProfileUpdate }) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setBankName(user.bankName || '');
      setBankAccountNumber(user.bankAccountNumber || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const updated = await profileApi.updateProfile({
        fullName,
        bankName,
        bankAccountNumber,
      });
      onProfileUpdate(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {message && (
        <div className={`p-4 rounded-xl border flex items-center space-x-2 text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
            : 'bg-rose-950/40 border-rose-500/20 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Profile Info Glass Box */}
      <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-900/60 to-purple-900/40 border-b border-slate-800 relative">
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center font-bold text-3xl text-white shadow-lg">
              {user?.fullName?.charAt(0)}
            </div>
          </div>
        </div>

        <div className="pt-14 p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{user?.fullName}</h2>
              <p className="text-slate-400 text-xs mt-0.5">{user?.position} • {user?.department}</p>
            </div>
            <div className="text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center space-x-2 text-slate-400">
              <Shield size={14} className="text-brand-400" />
              <span>Reporting Manager: <span className="text-slate-200 font-semibold">{user?.reportingManager?.fullName || 'CEO'}</span></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Read-Only Corporate Details */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
                <UserIcon size={14} className="text-brand-400" />
                <span>Corporate Directory Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-900/30 border border-slate-850 p-4 rounded-xl">
                <div>
                  <span className="text-slate-500 text-xs">Official Email</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{user?.email}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Gender Designation</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{user?.gender || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Corporate Position</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">{user?.position}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Salary Allocation (Annual)</span>
                  <p className="text-sm font-medium text-slate-200 mt-0.5">${user?.salary?.toLocaleString() || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Editable Profile Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <CreditCard size={14} className="text-brand-400" />
                <span>Financial & Payout Profile</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                    BANK DISBURSEMENT INSTITUTION
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Union Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-2">
                    DISBURSEMENT ACCOUNT NUMBER
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Account Number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm flex items-center space-x-2 transition-all shadow-md shadow-brand-600/5 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Disbursal Profile</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};
