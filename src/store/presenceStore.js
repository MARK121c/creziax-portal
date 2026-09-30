import { create } from 'zustand';
import { getPresenceUsersAPI } from './api';

const usePresenceStore = create((set, get) => ({
  presenceMap: {},
  loading: false,

  fetchPresence: async () => {
    try {
      set({ loading: true });
      const res = await getPresenceUsersAPI();
      const map = {};
      (res.data || []).forEach(u => {
        map[u.id] = {
          isOnline: !!u.isOnline,
          lastActiveAt: u.lastActiveAt || null
        };
      });
      set({ presenceMap: map, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  updatePresence: (userId, isOnline, lastActiveAt) => {
    set(state => ({
      presenceMap: {
        ...state.presenceMap,
        [userId]: {
          isOnline: Boolean(isOnline),
          lastActiveAt: lastActiveAt || new Date().toISOString()
        }
      }
    }));
  },

  getUserPresence: (userId) => {
    const presence = get().presenceMap[userId];
    if (presence) return presence;
    return { isOnline: false, lastActiveAt: null };
  }
}));

export default usePresenceStore;
