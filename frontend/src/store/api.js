import axios from 'axios';

// Hardcoded API URL to bypass Vercel environment variable issues
const API_URL = 'https://api.creziax.cloud/api';

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

// Auth
export const loginAPI = (data) => api.post('/auth/login', data);
export const getProfileAPI = () => api.get('/auth/profile');
export const updateProfileAPI = (data) => api.put('/auth/profile', data);

// Users
export const getUsersAPI = () => api.get('/users');
export const createUserAPI = (data) => api.post('/users', data);
export const deleteUserAPI = (id) => api.delete(`/users/${id}`);

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

// Invoices
export const getInvoicesAPI = () => api.get('/invoices');
export const getInvoiceAPI = (id) => api.get(`/invoices/${id}`);
export const createInvoiceAPI = (data) => api.post('/invoices', data);
export const updateInvoiceAPI = (id, data) => api.put(`/invoices/${id}`, data);
export const deleteInvoiceAPI = (id) => api.delete(`/invoices/${id}`);

// Payments
export const getPaymentsAPI = (invoiceId) => api.get(`/payments?invoiceId=${invoiceId}`);
export const createPaymentAPI = (data) => api.post('/payments', data);

// Broadcasts
export const getActiveBroadcastsAPI = () => api.get('/broadcasts');
export const createBroadcastAPI = (data) => api.post('/broadcasts', data);
export const updateBroadcastAPI = (id, data) => api.put(`/broadcasts/${id}`, data);
export const deleteBroadcastAPI = (id) => api.delete(`/broadcasts/${id}`);

// Uploads
export const uploadImageAPI = (formData) => api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
