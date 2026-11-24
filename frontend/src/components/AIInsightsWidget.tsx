import React, { useState, useEffect } from 'react';
import { aiInsightsApi } from '../services/api';
import { TrendingUp, AlertTriangle, Lightbulb, Zap, Brain, Sparkles, Clock, Calendar, Heart } from 'lucide-react';

interface AttendanceInsight {
  enabled: boolean;
  summary?: string;
  strengths?: string[];
  suggestions?: string[];
  productivity_score?: number;
  risk_flags?: string[];
  weekly_pattern_insight?: string;
  burnout_risk?: string;
  optimal_schedule?: {
    recommended_start_time: string;
    recommended_end_time: string;
    reasoning: string;
  };
  forecast?: {
    trend: string;
    forecast_message: string;
    alerts: string[];
    recommended_actions: string[];
  };
}

interface AIInsightsWidgetProps {
  user: any;
}

export const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ user }) => {
  const [insights, setInsights] = useState<AttendanceInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  const fetchInsights = async () => {
    try {
      const data = await aiInsightsApi.getAttendanceInsights();
      setInsights(data);
    } catch (err) {
      setError("Could not retrieve AI insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user]);

  if (!insights || !insights.enabled) {
    return (
      <div className="ai-insights-widget">
        <h3 className="widget-title">
          <Sparkles className="icon" size={18} />
          AI-Powered Insights
        </h3>
        <div className="widget-content">
          <div className="ai-disabled-state">
            <Brain size={32} className="ai-icon" />
            <p>AI insights are not configured or unavailable.</p>
            <small>Contact your administrator to enable AI features.</small>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ai-insights-widget">
        <h3 className="widget-title">
          <Sparkles className="icon" size={18} />
          AI-Powered Insights
        </h3>
        <div className="widget-content loading">
          <div className="spinner" />
          <p>Analyzing your patterns with AI...</p>
        </div>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="trend-up" size={14} />;
      case 'declining': return <TrendingUp className="trend-down" size={14} style={{ transform: 'rotate(180deg)' }} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="ai-insights-widget">
      <div className="widget-header">
        <h3 className="widget-title">
          <Sparkles className="icon" size={18} />
          AI-Powered Insights
        </h3>
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div className={`widget-content ${expanded ? 'expanded' : ''}`}>
        {/* Main Summary Card */}
        <div className="insight-card summary-card">
          <div className="insight-header">
            <div className="insight-icon productivity">
              <TrendingUp size={20} />
            </div>
            <div className="insight-meta">
              <p className="insight-summary">{insights.summary || 'Analyzing your attendance patterns...'}</p>
              <div className="productivity-score">
                <span>Productivity Score</span>
                <span className="score-value">{insights.productivity_score || '—'}/100</span>
              </div>
            </div>
          </div>

          <div className="insight-badges">
            {insights.burnout_risk && (
              <span className={`badge burnout-risk ${insights.burnout_risk}`}>
                <Heart size={12} />
                Burnout Risk: {insights.burnout_risk}
              </span>
            )}
            {insights.weekly_pattern_insight && (
              <span className="badge pattern">
                <Calendar size={12} />
                {insights.weekly_pattern_insight}
              </span>
            )}
          </div>
        </div>

        {expanded && (
          <>
            {/* Optimal Schedule */}
            {insights.optimal_schedule && (
              <div className="insight-card schedule-card">
                <div className="insight-header">
                  <div className="insight-icon schedule">
                    <Clock size={20} />
                  </div>
                  <div className="insight-meta">
                    <p className="insight-label">Optimal Work Schedule</p>
                    <p className="insight-value">
                      {insights.optimal_schedule.recommended_start_time} – {insights.optimal_schedule.recommended_end_time}
                    </p>
                  </div>
                </div>
                <p className="insight-reasoning">{insights.optimal_schedule.reasoning}</p>
              </div>
            )}

            {/* Strengths */}
            {insights.strengths && insights.strengths.length > 0 && (
              <div className="insight-card strengths-card">
                <div className="insight-header">
                  <div className="insight-icon strengths">
                    <Lightbulb size={20} />
                  </div>
                  <div className="insight-meta">
                    <p className="insight-label">Your Strengths</p>
                  </div>
                </div>
                <ul className="insight-list">
                  {insights.strengths.map((strength, i) => (
                    <li key={i}>
                      <span className="bullet" /> {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {insights.suggestions && insights.suggestions.length > 0 && (
              <div className="insight-card suggestions-card">
                <div className="insight-header">
                  <div className="insight-icon suggestions">
                    <Zap size={20} />
                  </div>
                  <div className="insight-meta">
                    <p className="insight-label">AI Suggestions</p>
                  </div>
                </div>
                <ul className="insight-list">
                  {insights.suggestions.map((suggestion, i) => (
                    <li key={i}>
                      <span className="bullet" /> {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Flags */}
            {insights.risk_flags && insights.risk_flags.length > 0 && (
              <div className="insight-card risks-card">
                <div className="insight-header">
                  <div className="insight-icon risks">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="insight-meta">
                    <p className="insight-label">Areas to Watch</p>
                  </div>
                </div>
                <ul className="insight-list">
                  {insights.risk_flags.map((flag, i) => (
                    <li key={i}>
                      <span className="bullet" /> {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Forecast */}
            {insights.forecast && (
              <div className="insight-card forecast-card">
                <div className="insight-header">
                  <div className="insight-icon forecast">
                    <getTrendIcon(insights.forecast.trend) />
                  </div>
                  <div className="insight-meta">
                    <p className="insight-label">Weekly Forecast</p>
                    <p className="insight-value trend">{insights.forecast.trend}</p>
                  </div>
                </div>
                <p className="insight-forecast-message">{insights.forecast.forecast_message}</p>
                {insights.forecast.alerts && insights.forecast.alerts.length > 0 && (
                  <div className="forecast-alerts">
                    <strong>Alerts:</strong>
                    <ul>
                      {insights.forecast.alerts.map((alert, i) => (
                        <li key={i}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {insights.forecast.recommended_actions && insights.forecast.recommended_actions.length > 0 && (
                  <div className="forecast-actions">
                    <strong>Recommended Actions:</strong>
                    <ul>
                      {insights.forecast.recommended_actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .ai-insights-widget {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          overflow: hidden;
        }
        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-surface-raised);
        }
        .widget-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }
        .widget-title .icon {
          color: var(--color-brand-500);
        }
        .expand-btn {
          background: none;
          border: none;
          color: var(--color-brand-500);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .expand-btn:hover {
          background: var(--brand-subtle);
        }
        .widget-content {
          padding: 20px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
        }
        .widget-content.expanded {
          max-height: 2000px;
          padding: 20px;
        }
        .widget-content.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-height: 120px;
          color: var(--text-muted);
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-default);
          border-top-color: var(--color-brand-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .ai-disabled-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px;
          text-align: center;
          color: var(--text-muted);
        }
        .ai-disabled-state .ai-icon {
          opacity: 0.5;
        }
        .insight-card {
          background: var(--bg-surface-raised);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .insight-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .insight-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
        }
        .insight-icon.productivity { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .insight-icon.schedule { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
        .insight-icon.strengths { background: linear-gradient(135deg, #10b981, #059669); }
        .insight-icon.suggestions { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .insight-icon.risks { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .insight-icon.forecast { background: linear-gradient(135deg, #06b6d4, #0891b2); }
        .insight-meta {
          flex: 1;
        }
        .insight-summary {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 8px 0;
          line-height: 1.5;
        }
        .insight-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          margin: 0 0 4px 0;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .insight-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .insight-value.trend {
          color: var(--color-brand-500);
        }
        .productivity-score {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .productivity-score span:first-child {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .score-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-brand-500);
        }
        .insight-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge.burnout-risk.low { background: #d1fae5; color: #065f46; }
        .badge.burnout-risk.medium { background: #fef3c7; color: #92400e; }
        .badge.burnout-risk.high { background: #fee2e2; color: #991b1b; }
        .badge.pattern { background: var(--brand-subtle); color: var(--color-brand-600); }
        .insight-list {
          list-style: none;
          padding: 0;
          margin: 8px 0 0 0;
        }
        .insight-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 6px 0;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .bullet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-brand-500);
          margin-top: 6px;
          flex-shrink: 0;
        }
        .insight-reasoning {
          margin: 8px 0 0 0;
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .insight-forecast-message {
          margin: 8px 0;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .forecast-alerts, .forecast-actions {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
        }
        .forecast-alerts strong, .forecast-actions strong {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .forecast-alerts ul, .forecast-actions ul {
          margin: 0;
          padding-left: 16px;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        .forecast-alerts li, .forecast-actions li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};