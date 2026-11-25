import React, { useCallback, useState, useEffect } from 'react';
import { aiInsightsApi } from '../services/api';
import type { AttendanceInsight, LeaveSuggestion, LeaveDraft, PayrollInsight, PerformanceInsight, DailyBriefing, WorkSummary } from '../services/api';
import { AIInsightsWidget } from '../components/AIInsightsWidget';
import { RefreshCw } from 'lucide-react';

interface AIInsightsPageProps {
  user: any;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({ user }) => {
  const [tabs, setTabs] = useState<'attendance' | 'leave' | 'payroll' | 'performance' | 'briefing'>('attendance');
  const [overallLoading, setOverallLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [workSummary, setWorkSummary] = useState<WorkSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  const fetchWorkSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      setWorkSummary(await aiInsightsApi.getWorkSummary());
    } catch {
      setSummaryError('Could not load your work records. Check your connection and refresh.');
    } finally {
      setSummaryLoading(false);
      setOverallLoading(false);
    }
  }, []);

  // Attendance
  const [attendanceInsights, setAttendanceInsights] = useState<AttendanceInsight | null>(null);
  const fetchAttendance = async () => {
    try {
      const data = await aiInsightsApi.getAttendanceInsights();
      setAttendanceInsights(data);
    } catch {
      setErrors(prev => ({ ...prev, attendance: "Could not retrieve attendance insights" }));
    }
  };

  // Leave
  const [leaveSuggestions, setLeaveSuggestions] = useState<LeaveSuggestion | null>(null);
  const [leaveDraft, setLeaveDraft] = useState<LeaveDraft | null>(null);
  const [draftLeaveType, setDraftLeaveType] = useState('ANNUAL');
  const [draftDuration, setDraftDuration] = useState(1);
  const [draftLoading, setDraftLoading] = useState(false);
  const fetchLeave = async () => {
    try {
      const suggestions = await aiInsightsApi.getLeaveSuggestions();
      setLeaveSuggestions(suggestions);
    } catch {
      setErrors(prev => ({ ...prev, leave: "Could not retrieve leave suggestions" }));
    }
  };

  const fetchLeaveDraft = async () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.max(1, draftDuration) - 1);
    const toDateInput = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    };

    setDraftLoading(true);
    setErrors(prev => ({ ...prev, leave: '' }));
    try {
      const draft = await aiInsightsApi.draftLeaveReason({
        leave_type: draftLeaveType,
        start_date: toDateInput(startDate),
        end_date: toDateInput(endDate),
      });
      setLeaveDraft(draft);
    } catch {
      setErrors(prev => ({ ...prev, leave: "Could not draft leave reason" }));
    } finally {
      setDraftLoading(false);
    }
  };

  // Payroll
  const [payrollInsights, setPayrollInsights] = useState<PayrollInsight | null>(null);
  const fetchPayroll = async () => {
    try {
      const data = await aiInsightsApi.getPayrollInsights();
      setPayrollInsights(data);
    } catch {
      setErrors(prev => ({ ...prev, payroll: "Could not retrieve payroll insights" }));
    }
  };

  // Performance
  const [performanceInsights, setPerformanceInsights] = useState<PerformanceInsight | null>(null);
  const fetchPerformance = async () => {
    try {
      const data = await aiInsightsApi.getPerformanceSummary();
      setPerformanceInsights(data);
    } catch {
      setErrors(prev => ({ ...prev, performance: "Could not retrieve performance summary" }));
    }
  };

  // Daily briefing
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const fetchBriefing = async () => {
    try {
      const data = await aiInsightsApi.getDailyBriefing();
      setDailyBriefing(data);
    } catch {
      setErrors(prev => ({ ...prev, briefing: "Could not retrieve daily briefing" }));
    }
  };

  // Smart recommendations
  useEffect(() => {
    void fetchWorkSummary();
    fetchAttendance();
    fetchLeave();
    fetchPayroll();
    fetchPerformance();
    fetchBriefing();
    const refreshInterval = window.setInterval(() => void fetchWorkSummary(), 60_000);
    return () => window.clearInterval(refreshInterval);
  }, [fetchWorkSummary]);

  const handleApplyLeaveSuggestion = (period: NonNullable<LeaveSuggestion['suggested_periods']>[number]) => {
    if (!period) return;
    // Auto-populate leave form with suggested dates
    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    const formattedStart = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`;
    const formattedEnd = `${end.getFullYear()}-${(end.getMonth() + 1).toString().padStart(2, '0')}-${end.getDate().toString().padStart(2, '0')}`;
    // This would be connected to the LeaveManagement form
    alert(`Suggested period: ${formattedStart} to ${formattedEnd} - ${period.reason}`);
  };

  if (overallLoading) {
    return (
      <div className="page-stack insights-page" style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner spinner-brand" style={{ width: 40, height: 40 }} />
          <p>Loading work insights…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack insights-page" style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header className="page-heading insights-heading">
        <div>
          <h1>Work insights</h1>
          <p>Patterns and planning notes based on your recent activity.</p>
          {workSummary && (
            <p className="insights-updated">
              Updated {new Date(workSummary.as_of).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void fetchWorkSummary()}
          disabled={summaryLoading}
          aria-label="Refresh work insights"
        >
          <RefreshCw size={14} className={summaryLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>
      {summaryError && <div className="alert alert-error" role="alert">{summaryError}</div>}
      <div className="tab-navigation" style={{ display: 'flex', gap: 4, background: 'var(--bg-surface-raised)', padding: 8, borderRadius: 10 }}>
        <button
          className={`tab-btn ${tabs === 'attendance' ? 'active' : ''}`}
          onClick={() => setTabs('attendance')}
          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
        >
          Attendance
        </button>
        <button
          className={`tab-btn ${tabs === 'leave' ? 'active' : ''}`}
          onClick={() => setTabs('leave')}
          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
        >
          Leave planning
        </button>
        <button
          className={`tab-btn ${tabs === 'payroll' ? 'active' : ''}`}
          onClick={() => setTabs('payroll')}
          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
        >
          Pay & finance
        </button>
        <button
          className={`tab-btn ${tabs === 'performance' ? 'active' : ''}`}
          onClick={() => setTabs('performance')}
          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
        >
          Growth
        </button>
        <button
          className={`tab-btn ${tabs === 'briefing' ? 'active' : ''}`}
          onClick={() => setTabs('briefing')}
          style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
        >
          Daily brief
        </button>
      </div>

      {/* Tab Content */}
      {tabs === 'attendance' && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Attendance patterns
          </h2>
          {errors.attendance && <div className="alert alert-error" role="alert">{errors.attendance}</div>}
          {workSummary && (
            <div className="work-summary-panel">
              <h3>Attendance in the last 30 days</h3>
              <div className="insight-stat-grid">
                <InsightStat label="Recorded days" value={workSummary.attendance.days_recorded} />
                <InsightStat label="Hours recorded" value={`${workSummary.attendance.total_hours}h`} />
                <InsightStat label="Average completed day" value={workSummary.attendance.average_hours == null ? '—' : `${workSummary.attendance.average_hours}h`} />
              </div>
              {workSummary.attendance.active_check_in_at && (
                <p className="work-summary-note">
                  Currently clocked in since {new Date(workSummary.attendance.active_check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                </p>
              )}
              {workSummary.attendance.days_recorded === 0 && (
                <p className="work-summary-note">No completed attendance records in this period yet.</p>
              )}
            </div>
          )}
          {attendanceInsights?.enabled && <AIInsightsWidget user={user} />}
          {!summaryLoading && !workSummary && !summaryError && (
            <p style={{ color: 'var(--text-muted)' }}>No attendance data is available yet.</p>
          )}
        </div>
      )}

      {tabs === 'leave' && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Leave planning
          </h2>
          {errors.leave && <div className="alert alert-error" role="alert">{errors.leave}</div>}
          {workSummary && (
            <div className="work-summary-panel">
              <h3>Your leave requests</h3>
              <div className="insight-stat-grid">
                <InsightStat label="Total requests" value={workSummary.leave.total_requests} />
                <InsightStat label="Awaiting review" value={workSummary.leave.pending} />
                <InsightStat label="Approved" value={workSummary.leave.approved} />
              </div>
              {workSummary.leave.next_approved && (
                <p className="work-summary-note">
                  Next approved leave: {formatWorkDate(workSummary.leave.next_approved.start_date)} – {formatWorkDate(workSummary.leave.next_approved.end_date)}.
                </p>
              )}
              {workSummary.leave.total_requests === 0 && (
                <p className="work-summary-note">Your submitted leave requests will appear here.</p>
              )}
            </div>
          )}

          {/* Leave Suggestions */}
          {leaveSuggestions?.enabled && (
            <div className="leave-suggestions-panel">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Possible leave windows
              </h3>
              {leaveSuggestions.suggested_periods && leaveSuggestions.suggested_periods.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {leaveSuggestions.suggested_periods.map((period, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'var(--bg-surface-raised)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {period.start_date} – {period.end_date}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-brand-500)', background: 'var(--brand-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                          {period.duration_days} days
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {period.reason}
                      </p>
                      {period.type && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Type: {period.type}</p>}
                      <button
                        onClick={() => handleApplyLeaveSuggestion(period)}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          background: 'var(--color-brand-600)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Apply This Period
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No leave suggestions are available yet.</p>
              )}

              <div style={{ marginTop: 16 }}>
                {leaveSuggestions.work_life_balance_score !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Work-Life Balance Score</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: getScoreColor(leaveSuggestions.work_life_balance_score) }}>
                      {leaveSuggestions.work_life_balance_score}/100
                    </span>
                  </div>
                )}
                {leaveSuggestions.recommendation_summary && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {leaveSuggestions.recommendation_summary}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Draft Leave Reason */}
          {leaveSuggestions?.enabled && (
            <div className="leave-draft-panel" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Draft a leave explanation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label htmlFor="draft-leave-type" className="field-label">Leave type</label>
                  <select
                    id="draft-leave-type"
                    className="field-input"
                    value={draftLeaveType}
                    onChange={(event) => setDraftLeaveType(event.target.value)}
                  >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="CASUAL">Casual Leave</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="draft-duration" className="field-label">Duration</label>
                  <input
                    id="draft-duration"
                    type="number"
                    className="field-input"
                    min={1}
                    max={30}
                    value={draftDuration}
                    onChange={(event) => setDraftDuration(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
                  />
                </div>
              </div>
              <button
                onClick={() => void fetchLeaveDraft()}
                disabled={draftLoading}
                className="btn btn-primary btn-block"
                style={{
                  width: '100%',
                  background: 'var(--color-brand-600)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {draftLoading ? 'Generating…' : 'Generate draft'}
              </button>
              {leaveDraft && leaveDraft.enabled && (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--brand-subtle)', borderRadius: 6, fontSize: '0.8125rem' }}>
                  <strong>Draft:</strong> {leaveDraft.draft}<br />
                  <em>Tone: {leaveDraft.tone}</em>
                  {leaveDraft.alternative_drafts && leaveDraft.alternative_drafts.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem' }}>
                      <strong>Alternatives:</strong> {leaveDraft.alternative_drafts.join(' | ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tabs === 'payroll' && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Pay and financial overview
          </h2>
          {errors.payroll && <div className="alert alert-error" role="alert">{errors.payroll}</div>}
          {workSummary && (
            <div className="work-summary-panel">
              <h3>Payroll records</h3>
              <div className="insight-stat-grid">
                <InsightStat label="Payslips available" value={workSummary.payroll.payslip_count} />
                <InsightStat
                  label="Latest net pay"
                  value={workSummary.payroll.latest_payslip ? `$${workSummary.payroll.latest_payslip.net_salary.toLocaleString()}` : '—'}
                />
                <InsightStat
                  label="Latest period"
                  value={workSummary.payroll.latest_payslip ? formatPayPeriod(workSummary.payroll.latest_payslip.month, workSummary.payroll.latest_payslip.year) : '—'}
                />
              </div>
              {workSummary.payroll.payslip_count === 0 && (
                <p className="work-summary-note">No payslip records are available yet.</p>
              )}
            </div>
          )}
          {payrollInsights && payrollInsights.enabled && (
            <div className="payroll-insights-panel">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Financial Health Score</p>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: getScoreColor(payrollInsights.financial_health_score || 0) }}>
                    {payrollInsights.financial_health_score || '—'}/100
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Est. Monthly Savings</p>
                  <span style={{ fontSize: '1.5rem', color: '#10b981' }}>
                    ${(payrollInsights.estimated_monthly_savings_potential || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Projected Annual Net</p>
                  <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>
                    ${(payrollInsights.forecast?.projected_annual_net || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Market Position</p>
                  <span style={{ fontSize: '1.5rem', color: '#f59e0b' }}>
                    {payrollInsights.market_comparison?.competitiveness || '—'}
                  </span>
                </div>
              </div>

              {payrollInsights.insights && payrollInsights.insights.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Insights:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {payrollInsights.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {payrollInsights.savings_tips && payrollInsights.savings_tips.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Savings Tips:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {payrollInsights.savings_tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {payrollInsights.budget_recommendation && (
                <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Budget Recommendation: {payrollInsights.budget_recommendation}</p>
                </div>
              )}

              {payrollInsights.tax_optimization_tips && payrollInsights.tax_optimization_tips.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Tax Optimisation:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {payrollInsights.tax_optimization_tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {payrollInsights.forecast && (
                <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: 12 }}>
                  <strong>Annual Forecast:</strong> {payrollInsights.forecast?.forecast_summary || 'N/A'}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
                    Projected annual net: ${payrollInsights.forecast?.projected_annual_net?.toLocaleString() || '—'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Savings goal suggestion: ${payrollInsights.forecast?.savings_goal_suggestion?.toLocaleString() || '—'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tabs === 'performance' && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Performance and development
          </h2>
          {errors.performance && <div className="alert alert-error" role="alert">{errors.performance}</div>}
          {workSummary && (
            <div className="work-summary-panel">
              <h3>Learning activity</h3>
              <div className="insight-stat-grid">
                <InsightStat label="Courses" value={workSummary.learning.total_courses} />
                <InsightStat label="Completed" value={workSummary.learning.completed_courses} />
                <InsightStat label="Hours completed" value={workSummary.learning.completed_hours} />
              </div>
              {workSummary.learning.courses.length > 0 ? (
                <ul className="work-summary-list">
                  {workSummary.learning.courses.map(course => (
                    <li key={course.title}>
                      <span>{course.title}</span>
                      <span>{course.status.replaceAll('_', ' ').toLowerCase()} · {course.hours}h</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="work-summary-note">Assigned courses and completed training will appear here.</p>
              )}
            </div>
          )}
          {performanceInsights && performanceInsights.enabled && (
            <div className="performance-insights-panel">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Overall Score</p>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: getPerformanceScoreColor(performanceInsights.overall_score || 0) }}>
                    {performanceInsights.overall_score || '—'}/100
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{performanceInsights.grade || ''}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Promotion Readiness</p>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: getPromotionReadinessColor(performanceInsights.promotion_readiness || '') }}>
                    {performanceInsights.promotion_readiness || '—'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Learning Path</p>
                  <span style={{ fontSize: '1.5rem', color: '#8b5cf6' }}>
                    {performanceInsights.learning_path_summary || 'In progress'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Quarterly Focus</p>
                  <span style={{ fontSize: '1.5rem', color: '#059669' }}>
                    {performanceInsights.focus_area || 'General development'}
                  </span>
                </div>
              </div>

              {performanceInsights.recognition_message && (
                <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{performanceInsights.recognition_message}</p>
                </div>
              )}

              {performanceInsights.next_steps && performanceInsights.next_steps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Next Steps:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {performanceInsights.next_steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {performanceInsights.recommended_courses && performanceInsights.recommended_courses.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Suggested courses:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {performanceInsights.recommended_courses.map((course, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-brand-600)', width: 120, flexShrink: 0 }}>
                          {course.title}
                        </span>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.duration_hours}h</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.priority}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {performanceInsights.quarterly_goals && performanceInsights.quarterly_goals.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Quarterly Goals:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {performanceInsights.quarterly_goals.map((goal, i) => (
                      <li key={i} style={{ marginBottom: 8, fontSize: '0.75rem' }}>
                        <strong>{goal.goal}</strong> ({goal.category}) — {goal.measurable_outcome} by {goal.timeline}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {performanceInsights.coaching_tip && (
                <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                  <strong>Coaching Tip:</strong> {performanceInsights.coaching_tip}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tabs === 'briefing' && (
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Daily briefing
          </h2>
          {errors.briefing && <div className="alert alert-error" role="alert">{errors.briefing}</div>}
          {workSummary && (
            <div className="work-summary-panel">
              <h3>Today in your workspace</h3>
              <ul className="work-summary-list">
                <li>
                  <span>Attendance</span>
                  <span>{workSummary.attendance.active_check_in_at ? `Clocked in at ${new Date(workSummary.attendance.active_check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not clocked in'}</span>
                </li>
                <li><span>Leave requests awaiting review</span><span>{workSummary.leave.pending}</span></li>
                <li><span>Courses in progress</span><span>{workSummary.learning.in_progress_courses.length}</span></li>
              </ul>
              {workSummary.leave.next_approved && (
                <p className="work-summary-note">
                  Upcoming leave: {formatWorkDate(workSummary.leave.next_approved.start_date)} – {formatWorkDate(workSummary.leave.next_approved.end_date)}.
                </p>
              )}
            </div>
          )}
          {dailyBriefing && dailyBriefing.enabled && (
            <div className="daily-briefing-panel">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Greeting</p>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                    {dailyBriefing.greeting || 'Good morning'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Focus Suggestion</p>
                  <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>
                    {dailyBriefing.focus_suggestion || 'Prioritise your top 3 tasks'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Wellness Check</p>
                  <span style={{ fontSize: '1.5rem', color: getWellnessColor(dailyBriefing.wellness?.stress_level || 'low') }}>
                    {dailyBriefing.wellness?.stress_level || 'low'}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>Burnout Score</p>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: getBurnoutColor(dailyBriefing.wellness?.burnout_risk_score || 0) }}>
                    {dailyBriefing.wellness?.burnout_risk_score || '—'}/100
                  </span>
                </div>
              </div>

              {dailyBriefing.priorities && dailyBriefing.priorities.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Top Priorities ({dailyBriefing.priorities.length}):</strong>
                  <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {dailyBriefing.priorities.map((priority, i) => (
                      <li key={i}>{i + 1}. {priority}</li>
                    ))}
                  </ol>
                </div>
              )}

              {dailyBriefing.reminders && dailyBriefing.reminders.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <strong>Gentle Reminders:</strong>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {dailyBriefing.reminders.map((reminder, i) => (
                      <li key={i}>{reminder}</li>
                    ))}
                  </ul>
                </div>
              )}

              {dailyBriefing.motivational_tip && (
                <div style={{ background: 'var(--brand-subtle)', borderRadius: 8, padding: 12, marginBottom: 16, fontStyle: 'italic' }}>
                  {dailyBriefing.motivational_tip}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const InsightStat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="insight-stat">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

function formatWorkDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPayPeriod(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

// Helper color functions
const getScoreColor = (score: number) => {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const getPerformanceScoreColor = (score: number) => {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#f59e0b';
  return '#8b5cf6';
};

const getPromotionReadinessColor = (status: string) => {
  switch (status) {
    case 'ready': return '#10b981';
    case 'developing': return '#f59e0b';
    case 'not_ready': return '#6b7280';
    case 'overdue': return '#ef4444';
    default: return '#6b7280';
  }
};

const getWellnessColor = (level: string) => {
  switch (level) {
    case 'low': return '#10b981';
    case 'moderate': return '#f59e0b';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

const getBurnoutColor = (score: number) => {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
};