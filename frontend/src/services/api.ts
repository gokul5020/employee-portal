import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  department?: string;
  position?: string;
  salary?: number;
  gender?: string;
  bankName?: string;
  bankAccountNumber?: string;
  reportingManager?: User;
}

export interface Attendance {
  id: number;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  hoursWorked?: number;
  user?: User;
}

export interface LeaveRequest {
  id?: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status?: string;
  managerComments?: string;
  reviewedBy?: User;
  createdAt?: string;
  user?: User;
}

export interface Payslip {
  id: number;
  month: number;
  year: number;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  netSalary: number;
  generatedAt: string;
}

export interface AssistantAnswer {
  answer: string;
}

export interface AssistantStatus {
  enabled: boolean;
}

export interface AttendanceInsight {
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
    peak_productivity_window?: string;
    break_schedule?: string[];
    reasoning: string;
    weekly_hours_target?: number;
  };
  forecast?: {
    trend: string;
    forecast_message: string;
    predicted_weekly_hours: number;
    alerts: string[];
    recommended_actions: string[];
  };
}

export interface LeaveSuggestion {
  enabled: boolean;
  suggested_periods?: Array<{
    start_date: string;
    end_date: string;
    duration_days: number;
    reason: string;
    type: string;
  }>;
  tips?: string[];
  work_life_balance_score?: number;
  recommendation_summary?: string;
}

export interface LeaveAnalysis {
  enabled: boolean;
  risk_level?: string;
  considerations?: string[];
  recommendation?: string;
  reasoning?: string;
  approval_confidence?: number;
  suggested_manager_response?: string;
}

export interface LeaveDraft {
  enabled: boolean;
  draft?: string;
  tone?: string;
  alternative_drafts?: string[];
}

export interface PayrollInsight {
  enabled: boolean;
  insights?: string[];
  savings_tips?: string[];
  budget_recommendation?: string;
  financial_health_score?: number;
  estimated_monthly_savings_potential?: number;
  tax_optimization_tips?: string[];
  market_comparison?: {
    market_range: { min: number; mid: number; max: number };
    competitiveness: string;
    percentile_estimate: number;
    growth_potential: string;
    skills_to_develop: string[];
    negotiation_tips: string[];
    next_role_suggestions: string[];
  };
  forecast?: {
    projected_annual_net: number;
    projected_annual_gross: number;
    savings_goal_suggestion: number;
    investment_tip: string;
    forecast_summary: string;
  };
}

export interface PerformanceInsight {
  enabled: boolean;
  overall_score?: number;
  grade?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  career_path_suggestions?: string[];
  next_steps?: string[];
  promotion_readiness?: string;
  recognition_message?: string;
  recommended_courses?: Array<{
    title: string;
    category: string;
    duration_hours: number;
    priority: string;
    relevance_reason: string;
    skill_gap_addressed: string;
  }>;
  learning_path_summary?: string;
  estimated_completion_weeks?: number;
  quarterly_goals?: Array<{
    goal: string;
    category: string;
    measurable_outcome: string;
    timeline: string;
  }>;
  focus_area?: string;
  coaching_tip?: string;
}

export interface DailyBriefing {
  enabled: boolean;
  greeting?: string;
  priorities?: string[];
  reminders?: string[];
  motivational_tip?: string;
  focus_suggestion?: string;
  wellness?: {
    stress_level: string;
    burnout_risk_score: number;
    wellness_message: string;
    recommended_actions: string[];
    leave_recommendation: string;
  };
}

export interface SmartRecommendations {
  enabled: boolean;
  timestamp: string;
  modules: {
    attendance?: { alert: string; message: string; suggestion: string };
    leave?: { pending_count: number; message: string };
    training?: { message: string; suggestion: string };
    payroll?: { alert: string; message: string };
  };
}

export interface SdgStats {
  trainingCompletedHours: number;
  totalCourses: number;
  completedCourses: number;
  coursesList: any[];
  averageWorkHours: number;
  payGapPercentage: number;
  maleSalaryAvg: number;
  femaleSalaryAvg: number;
}

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/profile', data);
    return response.data;
  },
  getSdgStats: async () => {
    const response = await api.get('/profile/sdg-stats');
    return response.data;
  },
};

export const leaveApi = {
  getMyLeaves: async () => {
    const response = await api.get('/leaves');
    return response.data;
  },
  applyLeave: async (data: LeaveRequest) => {
    const response = await api.post('/leaves', data);
    return response.data;
  },
  getPendingLeaves: async () => {
    const response = await api.get('/leaves/pending');
    return response.data;
  },
  reviewLeave: async (id: number, data: { status: string; comments: string }) => {
    const response = await api.post(`/leaves/${id}/review`, data);
    return response.data;
  },
};

export const attendanceApi = {
  getStatus: async () => {
    const response = await api.get('/attendance/status');
    return response.data;
  },
  checkIn: async () => {
    const response = await api.post('/attendance/check-in');
    return response.data;
  },
  checkOut: async () => {
    const response = await api.post('/attendance/check-out');
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/attendance/history');
    return response.data;
  },
};

export const assistantApi = {
  getStatus: async (): Promise<AssistantStatus> => {
    const response = await api.get<AssistantStatus>('/assistant/status');
    return response.data;
  },
  ask: async (question: string): Promise<AssistantAnswer> => {
    const response = await api.post<AssistantAnswer>('/assistant/ask', { question });
    return response.data;
  },
};

export const aiInsightsApi = {
  getAttendanceInsights: async (): Promise<AttendanceInsight> => {
    const response = await api.get<AttendanceInsight>('/ai/attendance/insights');
    return response.data;
  },
  getLeaveSuggestions: async (): Promise<LeaveSuggestion> => {
    const response = await api.get<LeaveSuggestion>('/ai/leave/suggestions');
    return response.data;
  },
  analyzeLeaveRequest: async (leaveId: number): Promise<LeaveAnalysis> => {
    const response = await api.get<LeaveAnalysis>(`/ai/leave/analyze/${leaveId}`);
    return response.data;
  },
  draftLeaveReason: async (data: { leave_type: string; start_date: string; end_date: string }): Promise<LeaveDraft> => {
    const response = await api.post<LeaveDraft>('/ai/leave/draft', data);
    return response.data;
  },
  getPayrollInsights: async (): Promise<PayrollInsight> => {
    const response = await api.get<PayrollInsight>('/ai/payroll/insights');
    return response.data;
  },
  getPerformanceSummary: async (): Promise<PerformanceInsight> => {
    const response = await api.get<PerformanceInsight>('/ai/performance/summary');
    return response.data;
  },
  getDailyBriefing: async (): Promise<DailyBriefing> => {
    const response = await api.get<DailyBriefing>('/ai/daily-briefing');
    return response.data;
  },
  getSmartRecommendations: async (): Promise<SmartRecommendations> => {
    const response = await api.get<SmartRecommendations>('/ai/smart-recommendations');
    return response.data;
  },
};

export const reportApi = {
  getPayslips: async () => {
    const response = await api.get('/reports/payslips');
    return response.data;
  },
  downloadPayslip: async (id: number, filename: string) => {
    const response = await api.get(`/reports/payslips/download/${id}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadAttendanceExcel: async () => {
    const response = await api.get('/reports/attendance/excel', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'my_attendance_history.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadLeavesExcel: async () => {
    const response = await api.get('/reports/leaves/excel', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'my_leave_history.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadAdminAttendanceExcel: async () => {
    const response = await api.get('/reports/admin/attendance/excel', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'all_attendance_history.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadAdminLeavesExcel: async () => {
    const response = await api.get('/reports/admin/leaves/excel', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'all_leaves_history.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default api;
