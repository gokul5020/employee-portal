import React, { useState, useEffect } from 'react';
import { leaveApi, attendanceApi, reportApi } from '../services/api';
import {
  Calendar,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { UpcomingHolidays } from '../components/UpcomingHolidays';

interface LeaveManagementProps {
  user: any;
}

function getStatusBadge(status?: string) {
  switch (status) {
    case 'APPROVED': return 'badge badge-approved';
    case 'REJECTED': return 'badge badge-rejected';
    default: return 'badge badge-pending';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const leaveTypes = [
  { value: 'ANNUAL', label: 'Annual leave' },
  { value: 'SICK', label: 'Sick leave' },
  { value: 'CASUAL', label: 'Casual leave' },
  { value: 'MATERNITY', label: 'Maternity leave' },
  { value: 'PATERNITY', label: 'Paternity leave' },
];

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ user }) => {
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [reason, setReason] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // List state
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Review state
  const [reviewComments, setReviewComments] = useState<{ [key: number]: string }>({});
  const [reviewLoading, setReviewLoading] = useState<{ [key: number]: boolean }>({});

  // Export loading states
  const [exportLoading, setExportLoading] = useState<{ [key: string]: boolean }>({});

  const { showToast } = useToast();

  const isHrOrManager = user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MANAGER';

  const loadData = async () => {
    try {
      const leaves = await leaveApi.getMyLeaves();
      setMyLeaves(leaves);

      const attendance = await attendanceApi.getHistory();
      setAttendanceHistory(attendance);

      if (isHrOrManager) {
        const pending = await leaveApi.getPendingLeaves();
        setPendingRequests(pending);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date must be on or before the end date.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please enter a reason for the leave.');
      return;
    }

    setApplyLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await leaveApi.applyLeave({
        startDate,
        endDate,
        leaveType,
        reason: reason.trim(),
      });
      setFormSuccess(true);
      setStartDate('');
      setEndDate('');
      setReason('');
      showToast('Leave request submitted successfully', 'success');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data || 'Failed to submit leave request.';
      setFormError(typeof msg === 'string' ? msg : 'An error occurred.');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setReviewLoading(prev => ({ ...prev, [id]: true }));
    try {
      await leaveApi.reviewLeave(id, {
        status,
        comments: reviewComments[id] || '',
      });
      showToast(`Leave request ${status.toLowerCase()} successfully`, 'success');
      loadData();
    } catch {
      showToast('Failed to update leave request. Please try again.', 'error');
    } finally {
      setReviewLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleExport = async (key: string, fn: () => Promise<void>, successMsg: string) => {
    setExportLoading(prev => ({ ...prev, [key]: true }));
    try {
      await fn();
      showToast(successMsg, 'success');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    } finally {
      setExportLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Leave & Attendance
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Manage leave requests, view calendar holidays, and track attendance history
          </p>
        </div>

        {/* Export buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ExportButton
            label="My leaves"
            loading={!!exportLoading['myLeaves']}
            onClick={() => handleExport('myLeaves', reportApi.downloadLeavesExcel, 'Leaves exported')}
          />
          <ExportButton
            label="My attendance"
            loading={!!exportLoading['myAttendance']}
            onClick={() => handleExport('myAttendance', reportApi.downloadAttendanceExcel, 'Attendance exported')}
          />
          {isHrOrManager && (
            <>
              <ExportButton
                label="All leaves"
                loading={!!exportLoading['allLeaves']}
                onClick={() => handleExport('allLeaves', reportApi.downloadAdminLeavesExcel, 'All leaves exported')}
              />
              <ExportButton
                label="All attendance"
                loading={!!exportLoading['allAttendance']}
                onClick={() => handleExport('allAttendance', reportApi.downloadAdminAttendanceExcel, 'All attendance exported')}
              />
            </>
          )}
        </div>
      </div>

      {/* Pending approvals queue (managers/admins) */}
      {isHrOrManager && (
        <section>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Pending approvals
            {pendingRequests.length > 0 && (
              <span className="badge badge-pending" style={{ marginLeft: 8, fontSize: '0.75rem' }}>
                {pendingRequests.length}
              </span>
            )}
          </h2>
          {loadingLists ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />)}
            </div>
          ) : pendingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
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
                        aria-hidden="true"
                      >
                        {req.user?.fullName?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {req.user?.fullName}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          {req.user?.position} · {req.user?.department}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge badge-info">{leaveTypeLabel(req.leaveType)}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {formatDate(req.startDate)} – {formatDate(req.endDate)}
                      </span>
                    </div>
                  </div>

                  {req.reason && (
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 12,
                        paddingLeft: 12,
                        borderLeft: '2px solid var(--border-default)',
                      }}
                    >
                      {req.reason}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Optional comments for the employee"
                      value={reviewComments[req.id] || ''}
                      onChange={(e) => setReviewComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="field-input"
                      style={{ flex: '1 1 200px', minWidth: 0, padding: '7px 10px' }}
                    />
                    <button
                      onClick={() => handleReview(req.id, 'APPROVED')}
                      disabled={reviewLoading[req.id]}
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#10b981',
                        borderColor: '#10b981',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {reviewLoading[req.id] ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(req.id, 'REJECTED')}
                      disabled={reviewLoading[req.id]}
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#ef4444',
                        borderColor: '#ef4444',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {reviewLoading[req.id] ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="surface" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No pending leave requests.</p>
            </div>
          )}
        </section>
      )}

      {/* Two-column: Request form + Upcoming Holidays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>

        {/* Leave application form */}
        <div>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Request leave
          </h2>
          <div className="surface" style={{ padding: 20 }}>
            {formError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={15} />
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle size={15} />
                Leave request submitted successfully.
              </div>
            )}

            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="leave-type" className="field-label">Leave type</label>
                <select
                  id="leave-type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="field-input"
                >
                  {leaveTypes.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label htmlFor="start-date" className="field-label">Start date</label>
                  <input
                    id="start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="field-label">End date</label>
                  <input
                    id="end-date"
                    type="date"
                    required
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="field-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reason" className="field-label">Reason</label>
                <textarea
                  id="reason"
                  required
                  rows={3}
                  placeholder="Briefly describe the reason for your leave"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="field-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={applyLoading}
                className="btn btn-primary"
              >
                {applyLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Submit request
              </button>
            </form>
          </div>
        </div>

        {/* New Feature: Upcoming Holidays Widget */}
        <div>
          <UpcomingHolidays />
        </div>
      </div>

      {/* My leave history */}
      <div>
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          My leave history
        </h2>
        <div className="surface" style={{ overflowX: 'auto' }}>
          {loadingLists ? (
            <div style={{ padding: 20 }}>
              <div className="skeleton" style={{ height: 120 }} />
            </div>
          ) : myLeaves.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {leaveTypeLabel(item.leaveType)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDate(item.startDate)}
                      {item.startDate !== item.endDate && (
                        <span style={{ color: 'var(--text-muted)' }}> – {formatDate(item.endDate)}</span>
                      )}
                    </td>
                    <td
                      style={{
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                      }}
                      title={item.reason}
                    >
                      {item.reason}
                    </td>
                    <td>
                      <span className={getStatusBadge(item.status)}>
                        {item.status?.charAt(0) + item.status?.slice(1).toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Calendar size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p className="empty-state-title">No leave requests yet</p>
              <p className="empty-state-desc">Submit your first request using the form above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Attendance history */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Attendance history
          </h2>
        </div>
        <div className="surface" style={{ overflowX: 'auto' }}>
          {loadingLists ? (
            <div style={{ padding: 20 }}>
              <div className="skeleton" style={{ height: 160 }} />
            </div>
          ) : attendanceHistory.length > 0 ? (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check in</th>
                    <th>Check out</th>
                    <th style={{ textAlign: 'right' }}>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {formatDate(item.date)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{formatTime(item.checkInTime)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {item.checkOutTime ? (
                          <span style={{ color: 'var(--text-secondary)' }}>{formatTime(item.checkOutTime)}</span>
                        ) : (
                          <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>In progress</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {item.hoursWorked != null ? `${item.hoursWorked}h` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <Clock size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p className="empty-state-title">No attendance records</p>
              <p className="empty-state-desc">Use the clock-in button on the dashboard to start tracking.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

function leaveTypeLabel(type: string): string {
  return leaveTypes.find(lt => lt.value === type)?.label ?? type;
}

const ExportButton: React.FC<{ label: string; loading: boolean; onClick: () => void }> = ({ label, loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="btn btn-secondary btn-sm"
  >
    {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
    {label}
  </button>
);
