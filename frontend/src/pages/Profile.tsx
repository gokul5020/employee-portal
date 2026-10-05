import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/api';
import { Shield, CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

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
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setBankName(user.bankName || '');
      setBankAccountNumber(user.bankAccountNumber || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const updated = await profileApi.updateProfile({ fullName, bankName, bankAccountNumber });
      onProfileUpdate(updated);
      setMessage({ type: 'success', text: 'Profile updated.' });
      showToast('Profile saved successfully', 'success');
    } catch (err: any) {
      const msg = err.response?.data;
      const text = typeof msg === 'string' ? msg : 'Failed to save profile. Please try again.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  function getRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN': return 'HR Admin';
      case 'ROLE_MANAGER': return 'Manager';
      default: return 'Employee';
    }
  }

  function getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN': return 'badge badge-admin';
      case 'ROLE_MANAGER': return 'badge badge-manager';
      default: return 'badge badge-employee';
    }
  }

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          My Profile
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Manage your identity credentials and verified banking details for payroll settlement
        </p>
      </div>

      {/* Identity card */}
      <div className="surface" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--brand-subtle)',
              border: '2px solid var(--brand-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--color-brand-600)',
              flexShrink: 0,
            }}
          >
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {user?.fullName}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {user?.position} · {user?.department}
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={getRoleBadgeClass(user?.role)}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>

        <hr className="divider" />

        {/* Read-only details grid */}
        <div>
          <p
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Shield size={13} />
            Employment details
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            <InfoField label="Email" value={user?.email} />
            <InfoField label="Position" value={user?.position} />
            <InfoField label="Department" value={user?.department} />
            <InfoField label="Gender" value={user?.gender || '—'} />
            <InfoField
              label="Annual salary"
              value={user?.salary ? `$${user.salary.toLocaleString()}` : '—'}
            />
            <InfoField
              label="Reporting manager"
              value={user?.reportingManager?.fullName || 'CEO'}
            />
          </div>
        </div>
      </div>

      {/* Editable section */}
      <div className="surface" style={{ padding: 20 }}>
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CreditCard size={13} />
          Banking & payout details
        </p>

        {message && (
          <div
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
            role="alert"
            style={{ marginBottom: 16 }}
          >
            {message.type === 'success'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />
            }
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label htmlFor="full-name" className="field-label">
                Full name <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(required)</span>
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="field-input"
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="bank-name" className="field-label">
                Bank name
              </label>
              <input
                id="bank-name"
                type="text"
                required
                placeholder="e.g. Chase Bank, Wells Fargo"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="field-input"
                disabled={loading}
                autoComplete="organization"
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="bank-account" className="field-label">
                Account number
              </label>
              <input
                id="bank-account"
                type="text"
                required
                placeholder="Enter your account number"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="field-input"
                disabled={loading}
                autoComplete="off"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InfoField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div>
    <dt style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</dt>
    <dd
      style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--text-primary)',
        margin: 0,
        wordBreak: 'break-word',
      }}
    >
      {value || '—'}
    </dd>
  </div>
);
