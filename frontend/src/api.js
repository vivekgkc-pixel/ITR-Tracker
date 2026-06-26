import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyPin: (data) => api.post('/auth/verify-pin', data),
  changePin: (data) => api.post('/auth/change-pin', data),
};

export const clientAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.put(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/clients/${id}/document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteDocument: (id) => api.delete(`/clients/${id}/document`),
  downloadDocument: (id) => api.get(`/clients/${id}/document`, { responseType: 'blob' }),
  addNote: (id, data) => api.post(`/clients/${id}/notes`, data),
  bulkUpdate: (data) => api.post('/clients/bulk-update', data),
};

export const assessmentYearAPI = {
  getAssessmentYears: () => api.get('/assessment-years'),
  createAssessmentYear: (data) => api.post('/assessment-years', data),
  deleteAssessmentYear: (id) => api.delete(`/assessment-years/${id}`),
};

export const staffAPI = {
  getStaff: () => api.get('/staff'),
  createStaff: (data) => api.post('/staff', data),
  deleteStaff: (id) => api.delete(`/staff/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const analyticsAPI = {
  getStatusBreakdown: () => api.get('/analytics/status-breakdown'),
  getStaffWorkload: () => api.get('/analytics/staff-workload'),
  getMonthlyTrend: () => api.get('/analytics/monthly-trend'),
  getPriorityDistribution: () => api.get('/analytics/priority-distribution'),
};

export const dataAPI = {
  exportCSV: () => api.get('/data/export-csv', { responseType: 'blob' }),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/data/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  backup: () => api.post('/data/backup', {}, { responseType: 'blob' }),
  restore: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/data/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  reset: () => api.post('/data/reset'),
  triggerReminders: () => api.post('/data/trigger-reminders'),
};

export default api;
