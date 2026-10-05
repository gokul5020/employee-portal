import React, { useEffect, useState, useRef } from 'react';
import { attendanceApi } from '../services/api';
import { Play, Square, Clock, DollarSign, ChevronRight, User as UserIcon, CalendarDays, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { DailyPlanner } from '../components/DailyPlanner';

interface DashboardProps {
  user: any;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState('');
  const [timeString, setTimeString] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const attData = await attendanceApi.getStatus();
      setAttendance(attData);
    } catch {
      // Attendance status unavailable — non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Live elapsed timer for active check-in
  useEffect(() => {
    if (attendance && attendance.checkInTime && !attendance.checkOutTime) {
      const checkIn = new Date(attendance.checkInTime).getTime();

      const update = () => {
        const diff = Date.now() - checkIn;
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeString(`${pad(h)}:${pad(m)}:${pad(s)}`);
        }
      };

      update();
      timerRef.current = setInterval(update, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimeString('00:00:00');
    }
  }, [attendance]);

  const handleClockToggle = async () => {
    setClockLoading(true);
    setClockError('');
    try {
      if (attendance && !attendance.checkOutTime) {
        const updated = await attendanceApi.checkOut();
        setAttendance(updated);
        showToast('Clocked out successfully', 'success');
      } else {
        const updated = await attendanceApi.checkIn();
        setAttendance(updated);
        showToast('Clocked in successfully', 'success');
      }
    } catch (err: any) {
      const raw = err.response?.data;
      const msg = typeof raw === 'string' ? raw : raw?.detail || 'Clock action failed. Please try again.';
      setClockError(typeof msg === 'string' ? msg : 'An error occurred.');
    } finally {
      setClockLoading(false);
    }
  };

  const isCheckedIn = attendance && !attendance.checkOutTime;
  const monthlyPay = user?.salary ? (user.salary / 12) : 0;

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>
        {/* Greeting skeleton */}
        <div>
          <div className="skeleton" style={{ height: 28, width: 280, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 200 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 160 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>

      {/* Page greeting */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Good {getGreeting()}, {user?.fullName?.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {today} · {user?.position}, {user?.department}
        </p>
      </div>

      {/* Top metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>

        {/* Time clock */}
        <div
          className="stat-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-label">Time clock</p>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: isCheckedIn ? '#10b981' : 'var(--text-muted)',
                  marginTop: 2,
                  fontWeight: 500,
                }}
              >
                {isCheckedIn
                  ? `Checked in at ${formatTime(attendance.checkInTime)}`
                  : 'Not checked in'}
              </p>
            </div>
            <Clock size={18} style={{ color: 'var(--color-brand-500)', flexShrink: 0, marginTop: 2 }} />
          </div>

          {/* Elapsed time */}
          <div>
            <p
              className={`clock-display ${!isCheckedIn ? 'inactive' : ''}`}
              aria-label={isCheckedIn ? `Elapsed time: ${timeString}` : 'Not checked in'}
            >
              {timeString}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {isCheckedIn ? 'Elapsed today' : 'Ready to start'}
            </p>
          </div>

          {/* Error message */}
          {clockError && (
            <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '0.8125rem' }}>
              <AlertCircle size={14} />
              {clockError}
            </div>
          )}

          {/* Clock button */}
          <button
            onClick={handleClockToggle}
            disabled={clockLoading}
            className={`btn btn-block`}
            style={{
              backgroundColor: isCheckedIn ? '#dc2626' : 'var(--color-brand-600)',
              borderColor: isCheckedIn ? '#dc2626' : 'var(--color-brand-600)',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {clockLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isCheckedIn ? (
              <>
                <Square size={13} fill="white" />
                Clock out
              </>
            ) : (
              <>
                <Play size={13} fill="white" />
                Clock in
              </>
            )}
          </button>
        </div>

        {/* Monthly pay */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <p className="stat-label">Monthly pay</p>
            <DollarSign size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          </div>
          <p className="stat-value">
            ${monthlyPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="stat-label" style={{ marginTop: 4 }}>Net take-home per month</p>
          <button
            onClick={() => navigate('/payroll')}
            style={{
              marginTop: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              color: 'var(--color-brand-500)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 0,
              fontWeight: 500,
            }}
          >
            View payslips
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="stat-card">
          <p className="stat-label" style={{ marginBottom: 12 }}>Quick actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <QuickLink
              icon={<CalendarDays size={15} />}
              label="Request leave"
              onClick={() => navigate('/leaves')}
            />
            <QuickLink
              icon={<UserIcon size={15} />}
              label="Update banking details"
              onClick={() => navigate('/profile')}
            />
            <QuickLink
              icon={<DollarSign size={15} />}
              label="Download payslip"
              onClick={() => navigate('/payroll')}
            />
          </div>
        </div>
      </div>

      {/* Productivity Section: Daily Planner / Standup Notes */}
      <DailyPlanner user={user} />
    </div>
  );
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const QuickLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn-ghost"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 12px',
      borderRadius: 6,
      cursor: 'pointer',
      color: 'var(--text-secondary)',
      fontSize: '0.875rem',
      textAlign: 'left',
      width: '100%',
      transition: 'all 0.12s ease',
      border: '1px solid transparent',
    }}
  >
    <span style={{ color: 'var(--color-brand-500)', flexShrink: 0 }}>{icon}</span>
    <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
    <ChevronRight size={13} style={{ opacity: 0.5, color: 'var(--text-muted)' }} />
  </button>
);
