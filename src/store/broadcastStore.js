import { create } from 'zustand';
import { getActiveBroadcastsAPI, createBroadcastAPI, updateBroadcastAPI, deleteBroadcastAPI } from './api';

const useBroadcastStore = create((set, get) => ({
  broadcasts: [],
  loading: false,
  error: null,

  fetchActiveBroadcasts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getActiveBroadcastsAPI();
      set({ broadcasts: response.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch broadcasts', loading: false });
    }
  },

  createBroadcast: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await createBroadcastAPI(data);
      // If it's active, it might replace current ones. Re-fetch to be safe.
      await get().fetchActiveBroadcasts();
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to create broadcast', loading: false });
      throw error;
    }
  },

  updateBroadcast: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const response = await updateBroadcastAPI(id, data);
      await get().fetchActiveBroadcasts();
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update broadcast', loading: false });
      throw error;
    }
  },

  deleteBroadcast: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteBroadcastAPI(id);
      set(state => ({
        broadcasts: state.broadcasts.filter(b => b.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete broadcast', loading: false });
      throw error;
    }
  }
}));

export default useBroadcastStore;
