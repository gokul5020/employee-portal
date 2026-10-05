import React from 'react';
import { X, Calendar, Megaphone } from 'lucide-react';

export interface Announcement {
  id: string;
  title: string;
  tag: 'Important' | 'Benefits' | 'Event' | 'System';
  date: string;
  summary: string;
  author: string;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: '2026 Annual Health & Wellness Benefits Open Enrollment',
    tag: 'Benefits',
    date: 'Oct 01, 2026',
    summary: 'Open enrollment for health insurance, dental, vision, and 401(k) matching opens this week. Please review your elected coverage in the benefits portal before October 31.',
    author: 'People Operations / HR',
  },
  {
    id: 'a2',
    title: 'Q4 Global All-Hands Town Hall & Product Roadmap',
    tag: 'Event',
    date: 'Sep 28, 2026',
    summary: 'Join leadership for our quarterly recap, strategic goals, and live Q&A session. A calendar invite has been sent with Zoom and in-office amphitheater streaming details.',
    author: 'Executive Team',
  },
  {
    id: 'a3',
    title: 'Direct Deposit & Payroll Modernization Update',
    tag: 'System',
    date: 'Sep 15, 2026',
    summary: 'Our payroll disbursement pipeline has been upgraded with automated digital payslip verification and fast settlement. Make sure your banking details in My Profile are verified.',
    author: 'Finance & Payroll',
  },
];

export const AnnouncementsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getTagBadge = (tag: Announcement['tag']) => {
    switch (tag) {
      case 'Important': return 'badge badge-error';
      case 'Benefits': return 'badge badge-approved';
      case 'Event': return 'badge badge-admin';
      case 'System': return 'badge badge-info';
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="command-palette-modal"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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
              <Megaphone size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Company Notices & Announcements
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Stay informed with official updates from HR and Leadership
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-ghost"
            style={{ padding: 6, borderRadius: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Notices list */}
        <div style={{ padding: '16px 20px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ANNOUNCEMENTS.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '14px 16px',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className={getTagBadge(item.tag)}>{item.tag}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  {item.date}
                </span>
              </div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                {item.summary}
              </p>
              <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                Posted by: {item.author}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--bg-surface)',
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
