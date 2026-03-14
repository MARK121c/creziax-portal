import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (message, type = 'info') => {
        set((state) => ({
          notifications: [
            {
              id: Date.now().toString(),
              message,
              type,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ].slice(0, 20) // Keep latest 20
        }));
      },
      
      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      get unreadCount() {
        return get().notifications.filter(n => !n.read).length;
      }
    }),
    {
      name: 'creziax-notifications'
    }
  )
);

export default useNotificationStore;
