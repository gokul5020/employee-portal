import React, { useEffect, useState } from 'react';
import { reportApi } from '../services/api';
import { FileText, Download, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';

interface PayrollProps {
  user: any;
}

interface Payslip {
  id: number;
  userId: number;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  generatedAt: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const Payroll: React.FC<PayrollProps> = ({ user }) => {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<{ [key: number]: boolean }>({});
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const data = await reportApi.getPayslips();
      setPayslips(data);
      if (data.length > 0) setSelectedPayslip(data[0]);
    } catch {
      // Non-critical: show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = async (id: number, month: number, year: number) => {
    setDownloadLoading(prev => ({ ...prev, [id]: true }));
    try {
      await reportApi.downloadPayslip(id, `payslip_${month}_${year}.pdf`);
      showToast(`Payslip for ${MONTHS[month - 1]} ${year} downloaded`, 'success');
    } catch {
      showToast('Failed to download payslip. Please try again.', 'error');
    } finally {
      setDownloadLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div className="skeleton" style={{ height: 28, width: 160, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 240 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  const annualSalary = user?.salary ?? 0;
  const monthlySalary = annualSalary / 12;
  const standardAllowance = 400;
  const standardDeduction = 200;

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Payroll & Compensation
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
          View monthly payslips, digital statements, and compensation breakdowns
        </p>
      </div>

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span className="stat-label">Annual salary</span>
            <DollarSign size={16} style={{ color: 'var(--color-brand-500)' }} />
          </div>
          <p className="stat-value">${fmt(annualSalary)}</p>
          <p className="stat-label" style={{ marginTop: 4 }}>Gross CTC per year</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span className="stat-label">Monthly base</span>
            <DollarSign size={16} style={{ color: '#0ea5e9' }} />
          </div>
          <p className="stat-value">${fmt(Math.round(monthlySalary))}</p>
          <p className="stat-label" style={{ marginTop: 4 }}>Before allowances</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span className="stat-label">Monthly allowances</span>
            <TrendingUp size={16} style={{ color: '#10b981' }} />
          </div>
          <p className="stat-value" style={{ color: '#10b981' }}>+${fmt(standardAllowance)}</p>
          <p className="stat-label" style={{ marginTop: 4 }}>Housing, medical & conveyance</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span className="stat-label">Monthly deductions</span>
            <TrendingDown size={16} style={{ color: '#ef4444' }} />
          </div>
          <p className="stat-value" style={{ color: '#ef4444' }}>-${fmt(standardDeduction)}</p>
          <p className="stat-label" style={{ marginTop: 4 }}>PF, Medicare & state tax</p>
        </div>
      </div>

      {/* Main payslip area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>

        {/* Payslip list */}
        <section style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Payslips
          </h2>
          {payslips.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {payslips.map((slip) => (
                <div
                  key={slip.id}
                  className={`payslip-item ${selectedPayslip?.id === slip.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPayslip(slip)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedPayslip(slip)}
                  aria-pressed={selectedPayslip?.id === slip.id}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Month icon */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 6,
                        backgroundColor: selectedPayslip?.id === slip.id ? 'var(--brand-subtle)' : 'var(--bg-surface-raised)',
                        border: `1px solid ${selectedPayslip?.id === slip.id ? 'var(--brand-border)' : 'var(--border-default)'}`,
                        display: 'flex',
                        flexDirection: 'column' as const,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: selectedPayslip?.id === slip.id ? 'var(--color-brand-600)' : 'var(--text-muted)',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {MONTHS_SHORT[slip.month - 1]}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{slip.year}</span>
                    </div>

                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {MONTHS[slip.month - 1]} {slip.year}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        Net take-home: <span style={{ color: '#10b981', fontWeight: 600 }}>${fmt(slip.netSalary)}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(slip.id, slip.month, slip.year);
                    }}
                    className="btn btn-secondary btn-sm"
                    disabled={downloadLoading[slip.id]}
                    title={`Download ${MONTHS[slip.month - 1]} ${slip.year} payslip PDF`}
                    style={{ flexShrink: 0 }}
                  >
                    {downloadLoading[slip.id] ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    <span style={{ display: 'none' }}>Download</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface">
              <div className="empty-state">
                <FileText size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p className="empty-state-title">No payslips yet</p>
                <p className="empty-state-desc">Payslips are generated monthly by the HR team.</p>
              </div>
            </div>
          )}
        </section>

        {/* Payslip detail panel */}
        {selectedPayslip && (
          <aside style={{ width: 280, flexShrink: 0 }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Breakdown
            </h2>
            <div className="surface" style={{ padding: 18 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {MONTHS[selectedPayslip.month - 1]} {selectedPayslip.year}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                {user?.fullName}
              </p>

              <hr className="divider" style={{ margin: '0 0 14px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem' }}>
                <PayslipRow label="Basic salary" value={`$${fmt(selectedPayslip.basicSalary)}`} />
                <PayslipRow label="Disbursement Bank" value={user?.bankName || '—'} />
                <PayslipRow label="Account Number" value={user?.bankAccountNumber || '—'} dim />
              </div>

              <hr className="divider" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem' }}>
                <PayslipRow label="Basic (monthly)" value={`$${fmt(selectedPayslip.basicSalary)}`} />
                <PayslipRow
                  label="Allowances"
                  value={`+$${fmt(selectedPayslip.allowances ?? 0)}`}
                  valueColor="#10b981"
                />
                <PayslipRow
                  label="Deductions"
                  value={`-$${fmt(selectedPayslip.deductions ?? 0)}`}
                  valueColor="#ef4444"
                />
              </div>

              <hr className="divider" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Net pay</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981' }}>
                  ${fmt(selectedPayslip.netSalary)}
                </span>
              </div>

              <button
                onClick={() => handleDownload(selectedPayslip.id, selectedPayslip.month, selectedPayslip.year)}
                disabled={downloadLoading[selectedPayslip.id]}
                className="btn btn-primary btn-sm btn-block"
              >
                {downloadLoading[selectedPayslip.id] ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                Download PDF
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

const PayslipRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
  dim?: boolean;
}> = ({ label, value, valueColor, dim }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <span
      style={{
        fontWeight: 500,
        color: valueColor ?? (dim ? 'var(--text-muted)' : 'var(--text-primary)'),
        fontFamily: dim ? 'var(--font-mono)' : undefined,
        fontSize: dim ? '0.75rem' : undefined,
        textAlign: 'right',
        wordBreak: 'break-all',
      }}
    >
      {value}
    </span>
  </div>
);
