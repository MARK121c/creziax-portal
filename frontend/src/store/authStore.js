import { create } from 'zustand';
import { loginAPI, getProfileAPI } from './api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await loginAPI({ email, password });
      localStorage.setItem('token', data.token);
      set({ user: data, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchProfile: async () => {
    try {
      const { data } = await getProfileAPI();
      set({ user: data });
    } catch (err) {
      if (err.response?.status === 401) {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
