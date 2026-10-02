import { create } from 'zustand';
import { loginAPI, getProfileAPI, updateProfileAPI, logoutAPI } from './api';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
  isInitializing: !!localStorage.getItem('token'), // true while fetching profile on refresh

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await loginAPI({ email, password });
      localStorage.setItem('token', data.token);
      set({ user: data, token: data.token, loading: false, isInitializing: false });
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
      set({ user: data, isInitializing: false });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        set({ user: null, token: null, isInitializing: false });
      } else {
        // Network error etc - don't block the app
        set({ isInitializing: false });
      }
    }
  },

  updateProfile: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await updateProfileAPI(data);
      set({ user: res.data, loading: false });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Update failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await logoutAPI();
    } catch (err) {
      console.warn('Backend logout failed or session already expired');
    } finally {
      localStorage.removeItem('token');
      set({ user: null, token: null, isInitializing: false });
    }
  },
}));

export default useAuthStore;
