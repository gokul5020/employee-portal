import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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
    const response = await api.post('/attendance/checkin');
    return response.data;
  },
  checkOut: async () => {
    const response = await api.post('/attendance/checkout');
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/attendance/history');
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
