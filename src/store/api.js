import axios from 'axios';

// Use environment variable or fallback to relative path (best for Coolify/Docker)
const API_URL = import.meta.env.VITE_API_URL || '/api';
// Version: 1.3.2 (Session-safe 401 handling)

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor: ONLY force logout if the auth profile endpoint returns 401
// DO NOT logout on 401 from expense, bonus, or other non-auth endpoints
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/profile');
    if (error.response?.status === 401 && isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginAPI = (data) => api.post('/auth/login', data);
export const getProfileAPI = () => api.get('/auth/profile');
export const updateProfileAPI = (data) => api.put('/auth/profile', data);

// Users
export const getUsersAPI = () => api.get('/users');
export const getUserAPI = (id) => api.get(`/users/${id}`);
export const createUserAPI = (data) => api.post('/users', data);
export const updateUserAPI = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserAPI = (id) => api.delete(`/users/${id}`);
export const resetPasswordAPI = (id, newPassword) => api.post(`/users/${id}/reset-password`, { newPassword });
export const grantChatAccessAPI = (userId, chatId) => api.patch(`/users/${userId}/grant-chat`, { chatId });

// Clients
export const getClientsAPI = () => api.get('/clients');
export const getClientAPI = (id) => api.get(`/clients/${id}`);
export const updateClientAPI = (id, data) => api.put(`/clients/${id}`, data);

// Projects
export const getProjectsAPI = () => api.get('/projects');
export const getProjectAPI = (id) => api.get(`/projects/${id}`);
export const createProjectAPI = (data) => api.post('/projects', data);
export const updateProjectAPI = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProjectAPI = (id) => api.delete(`/projects/${id}`);
export const downloadContractPDFAPI = (id) => api.get(`/projects/${id}/download`, { responseType: 'blob' });

// Tasks
export const getTasksAPI = () => api.get('/tasks');
export const getTaskAPI = (id) => api.get(`/tasks/${id}`);
export const createTaskAPI = (data) => api.post('/tasks', data);
export const updateTaskAPI = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTaskAPI = (id) => api.delete(`/tasks/${id}`);

// Files
export const getFilesAPI = (projectId) => api.get(`/files?projectId=${projectId}`);
export const uploadFileAPI = (formData) => api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteFileAPI = (id) => api.delete(`/files/${id}`);

// Messages
export const getMessagesAPI = (threadId) => api.get(`/messages?threadId=${threadId}`);
export const sendMessageAPI = (data) => api.post('/messages', data);
export const getThreadsAPI = () => api.get('/messages/threads');
export const createTeamGroupAPI = (data) => api.post('/messages/groups', data);
export const getTeamGroupsAPI = () => api.get('/messages/groups');
export const clearMessagesAPI = (threadId) => api.delete(threadId ? `/messages/clear?threadId=${threadId}` : '/messages/clear');

// Invoices
export const getInvoicesAPI = () => api.get('/invoices');
export const getInvoiceAPI = (id) => api.get(`/invoices/${id}`);
export const createInvoiceAPI = (data) => api.post('/invoices', data);
export const updateInvoiceAPI = (id, data) => api.put(`/invoices/${id}`, data);
export const deleteInvoiceAPI = (id) => api.delete(`/invoices/${id}`);
export const downloadInvoicePDFAPI = (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' });

// Payments
export const getPaymentsAPI = (invoiceId) => api.get(`/payments?invoiceId=${invoiceId}`);
export const createPaymentAPI = (data) => api.post('/payments', data);
export const verifyPaymentAPI = (id, status) => api.put(`/payments/${id}/verify`, { status });

// Broadcasts
export const getActiveBroadcastsAPI = () => api.get('/broadcasts');
export const createBroadcastAPI = (data) => api.post('/broadcasts', data);
export const updateBroadcastAPI = (id, data) => api.put(`/broadcasts/${id}`, data);
export const deleteBroadcastAPI = (id) => api.delete(`/broadcasts/${id}`);

// Uploads
export const uploadImageAPI = (formData) => api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const uploadAttachmentAPI = (formData) => api.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// Tickets
export const getTicketsAPI = () => api.get('/tickets');
export const getTicketAPI = (id) => api.get(`/tickets/${id}`);
export const createTicketAPI = (data) => api.post('/tickets', data);
export const updateTicketAPI = (id, data) => api.put(`/tickets/${id}`, data);

// Dashboard & Financials
export const getDashboardStatsAPI = () => api.get('/stats/dashboard');

// Expenses
export const getExpensesAPI = () => api.get('/expenses');
export const createExpenseAPI = (data) => api.post('/expenses', data);
export const deleteExpenseAPI = (id) => api.delete(`/expenses/${id}`);

// Bonuses
export const getBonusesAPI = () => api.get('/bonuses');
export const createBonusAPI = (data) => api.post('/bonuses', data);
export const deleteBonusAPI = (id) => api.delete(`/bonuses/${id}`);

// Activity Log
export const getRecentActivityAPI = (limit = 5) => api.get(`/activities?limit=${limit}`);

// Workspaces (Professional Retainer Management)
export const getWorkspacesAPI = () => api.get('/workspaces');
export const getWorkspaceAPI = (id) => api.get(`/workspaces/${id}`);
export const getPhaseTasksAPI = (phaseId) => api.get(`/workspaces/phases/${phaseId}/tasks`);
export const updateWorkspaceTaskAPI = (id, data) => api.put(`/workspaces/tasks/${id}`, data);
export const createPhaseAPI = (projectId, data) => api.post(`/workspaces/${projectId}/phases`, data);
export const deletePhaseAPI = (id) => api.delete(`/workspaces/phases/${id}`);
export const createWorkspaceTaskAPI = (phaseId, data) => api.post(`/workspaces/phases/${phaseId}/tasks`, data);
export const deleteWorkspaceTaskAPI = (id) => api.delete(`/workspaces/tasks/${id}`);

export default api;
