import React, { useState } from 'react';
import { PartyPopper, Clock } from 'lucide-react';

export interface CompanyHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  type: 'Public' | 'Company' | 'Floating';
  description: string;
}

const DEFAULT_HOLIDAYS: CompanyHoliday[] = [
  {
    id: 'h1',
    name: 'New Year’s Day',
    date: '2026-01-01',
    dayOfWeek: 'Thursday',
    type: 'Public',
    description: 'Statutory paid public holiday to celebrate the new calendar year.',
  },
  {
    id: 'h2',
    name: 'Martin Luther King Jr. Day',
    date: '2026-01-19',
    dayOfWeek: 'Monday',
    type: 'Public',
    description: 'Federal holiday honoring civil rights leader Dr. Martin Luther King Jr.',
  },
  {
    id: 'h3',
    name: 'Memorial Day',
    date: '2026-05-25',
    dayOfWeek: 'Monday',
    type: 'Public',
    description: 'National remembrance day honoring military personnel who gave their lives.',
  },
  {
    id: 'h4',
    name: 'Company Wellness Day',
    date: '2026-07-03',
    dayOfWeek: 'Friday',
    type: 'Company',
    description: 'Company-wide recharge and mental health day off for all staff.',
  },
  {
    id: 'h5',
    name: 'Labor Day',
    date: '2026-09-07',
    dayOfWeek: 'Monday',
    type: 'Public',
    description: 'Honoring the American labor movement and workers across the nation.',
  },
  {
    id: 'h6',
    name: 'Thanksgiving Day',
    date: '2026-11-26',
    dayOfWeek: 'Thursday',
    type: 'Public',
    description: 'National holiday for family gathering, gratitude, and community.',
  },
  {
    id: 'h7',
    name: 'Day After Thanksgiving',
    date: '2026-11-27',
    dayOfWeek: 'Friday',
    type: 'Company',
    description: 'Extended corporate weekend holiday.',
  },
  {
    id: 'h8',
    name: 'Winter Holiday / Christmas',
    date: '2026-12-25',
    dayOfWeek: 'Friday',
    type: 'Public',
    description: 'Official corporate winter holiday recess.',
  },
];

export const UpcomingHolidays: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Upcoming'>('Upcoming');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const holidaysWithCountdown = DEFAULT_HOLIDAYS.map((h) => {
    const daysLeft = getDaysDiff(h.date);
    return { ...h, daysLeft };
  });

  const displayedHolidays = holidaysWithCountdown.filter((h) => {
    if (filter === 'Upcoming') return h.daysLeft >= 0;
    return true;
  });

  const getTypeBadgeClass = (type: CompanyHoliday['type']) => {
    switch (type) {
      case 'Public': return 'badge badge-approved';
      case 'Company': return 'badge badge-info';
      case 'Floating': return 'badge badge-pending';
    }
  };

  return (
    <div className="surface" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: 'var(--brand-subtle)',
              color: 'var(--color-brand-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PartyPopper size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Company Holidays & Recess
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Official paid days off for 2026
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface-raised)', padding: 3, borderRadius: 6 }}>
          <button
            type="button"
            onClick={() => setFilter('Upcoming')}
            className={`btn-filter ${filter === 'Upcoming' ? 'active' : ''}`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setFilter('All')}
            className={`btn-filter ${filter === 'All' ? 'active' : ''}`}
          >
            All Year
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayedHolidays.map((holiday) => {
          const isSoon = holiday.daysLeft >= 0 && holiday.daysLeft <= 30;
          return (
            <div
              key={holiday.id}
              className="holiday-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-default)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Date indicator block */}
                <div
                  style={{
                    width: 52,
                    padding: '6px 4px',
                    borderRadius: 6,
                    textAlign: 'center',
                    background: isSoon ? 'var(--brand-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${isSoon ? 'var(--brand-border)' : 'var(--border-default)'}`,
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 600, color: isSoon ? 'var(--color-brand-500)' : 'var(--text-muted)' }}>
                    {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {new Date(holiday.date).toLocaleDateString('en-US', { day: '2-digit' })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {holiday.name}
                    </span>
                    <span className={getTypeBadgeClass(holiday.type)} style={{ fontSize: '0.6875rem' }}>
                      {holiday.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {holiday.dayOfWeek} • {holiday.description}
                  </div>
                </div>
              </div>

              {/* Countdown or Passed */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {holiday.daysLeft === 0 ? (
                  <span className="badge badge-success" style={{ fontWeight: 600 }}>Today!</span>
                ) : holiday.daysLeft > 0 ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isSoon ? 'var(--color-brand-500)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Clock size={12} />
                    In {holiday.daysLeft} day{holiday.daysLeft > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Passed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
