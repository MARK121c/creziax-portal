import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast as rToast } from 'react-toastify';
import { 
  getNotificationsAPI, 
  markNotificationReadAPI, 
  markAllNotificationsReadAPI,
  getUnreadMessagesCountAPI,
  deleteAllNotificationsAPI
} from './api';

// Using the local MP3 file downloaded to /public/sounds/notification.mp3
const soundPath = "/sounds/notification.mp3";

let audioInstance = null;
let isAudioUnlocked = false;

if (typeof window !== 'undefined') {
  audioInstance = new Audio(soundPath);
  audioInstance.volume = 0.6;

  const unlockAudio = () => {
    if (!isAudioUnlocked && audioInstance) {
      console.log("🔊 Supreme Interaction: Unlocking audio...");
      audioInstance.play()
        .then(() => {
          audioInstance.pause();
          audioInstance.currentTime = 0;
          isAudioUnlocked = true;
          console.log("✅ Audio context SUPREME UNLOCKED.");
          
          document.removeEventListener('mousedown', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
        })
        .catch(err => console.log("Still locked:", err));
    }
  };

  document.addEventListener('mousedown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
}

const playNotificationSound = () => {
  if (audioInstance) {
    audioInstance.currentTime = 0;
    audioInstance.play().catch(e => console.log("Playback failed:", e));
  }
};

const playTinSound = () => {
  // Use a second audio instance for the distinctive "Tin" sound
  // For now, we reuse the instance but we can add a different file path if needed.
  if (audioInstance) {
    audioInstance.currentTime = 0;
    // Potentially speed up or change pitch for "Tin" effect if supported, 
    // but a separate file "tin.mp3" would be better.
    audioInstance.playbackRate = 1.5; 
    audioInstance.play().catch(e => console.log("Playback failed:", e));
    setTimeout(() => { if(audioInstance) audioInstance.playbackRate = 1.0; }, 500);
  }
};

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_NOTIFICATIONS = 50;

const filterExpired = (notifications) => {
  const now = Date.now();
  return notifications.filter(n => {
    const age = now - new Date(n.timestamp).getTime();
    return age < TWO_DAYS_MS;
  });
};

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      activeThreadId: null,
      unreadThreads: {}, // { threadId: count }
      unreadMessagesCount: 0,
      unreadNotificationsCount: 0,
      globalCountVisible: true,
      
      setActiveThreadId: (id) => set({ activeThreadId: id }),
      setGlobalCountVisible: (visible) => set({ globalCountVisible: visible }),
      
      resetUnreadNotifications: () => set({ unreadNotificationsCount: 0 }),
      
      fetchNotifications: async () => {
        try {
          const { data } = await getNotificationsAPI();
          const mapped = data.map(n => ({
            id: n.id,
            message: n.content,
            type: n.type?.toLowerCase() || 'info', 
            timestamp: n.createdAt,
            read: n.isRead
          }));

          set((state) => {
            const existing = state.notifications || [];
            
            // v21.7 Supreme Persistence: Merge backend history with local transient notifications
            // We use a Map to deduplicate by ID, prioritizing newer data from backend or local
            const allNotifsMap = new Map();
            
            // 1. Add existing local notifications first
            existing.forEach(n => allNotifsMap.set(n.id, n));
            
            // 2. Overwrite with/add latest from backend (Source of Truth for history)
            mapped.forEach(n => allNotifsMap.set(n.id, n));
            
            // 3. Convert back to array, sort, and slice
            const merged = Array.from(allNotifsMap.values())
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, MAX_NOTIFICATIONS);

            const unreadCount = merged.filter(n => !n.read).length;
            return { 
              notifications: merged, 
              unreadNotificationsCount: unreadCount 
            };
          });
        } catch (err) {
          console.error("Fetch Notifications Error:", err);
        }
      },

      fetchUnreadCount: async () => {
        try {
          const { data } = await getUnreadMessagesCountAPI();
          set({ unreadMessagesCount: data.count, globalCountVisible: data.count > 0 });
        } catch (err) {
          console.error("Fetch Unread Count Error:", err);
        }
      },

      incrementUnreadMessages: (threadId) => set((state) => {
        const newUnreadThreads = { ...state.unreadThreads };
        newUnreadThreads[threadId] = (newUnreadThreads[threadId] || 0) + 1;
        const globalCount = Object.values(newUnreadThreads).reduce((a, b) => a + b, 0);
        return { 
          unreadThreads: newUnreadThreads,
          unreadMessagesCount: globalCount,
          globalCountVisible: true
        };
      }),
      
      resetUnreadMessages: (threadId) => set((state) => {
        const newUnreadThreads = { ...state.unreadThreads };
        if (threadId) {
          delete newUnreadThreads[threadId];
        } else {
          return { unreadThreads: {}, unreadMessagesCount: 0 };
        }
        const globalCount = Object.values(newUnreadThreads).reduce((a, b) => a + b, 0);
        return { 
          unreadThreads: newUnreadThreads,
          unreadMessagesCount: globalCount
        };
      }),

      resetAllGlobalUnread: () => set({ 
        globalCountVisible: false 
      }),
      
      addNotification: (message, type = 'info', metadata = {}) => {
        const { id, senderId, senderName, threadId } = metadata;
        const currentValid = filterExpired(get().notifications);
        
        // v21.4 Elite Sync: Deduplication check
        if (id && currentValid.some(n => n.id === id)) return;

        // Visual / Audio Feedback
        if (['success', 'error', 'message', 'file_upload', 'task_update'].includes(type.toLowerCase())) {
          playNotificationSound();
        }

        // Persistent State Update
        set((state) => {
          const newNotif = {
            id: id || Date.now().toString(),
            message,
            type: type.toLowerCase(),
            timestamp: new Date().toISOString(),
            read: false,
            senderId,
            senderName,
            threadId
          };

          const updates = {
            notifications: [newNotif, ...currentValid].slice(0, MAX_NOTIFICATIONS),
            unreadNotificationsCount: state.unreadNotificationsCount + 1
          };

          // If it's a message, we ALSO increment the specific message counter
          // unless the user is already looking at it (handled in App.jsx)
          if (type.toLowerCase() === 'message' && threadId) {
             // Let incrementUnreadMessages handle the internal map update
             // Logic will be triggered inside App.jsx for specific threadId
          }

          return updates;
        });
      },
      
      markAllRead: async () => {
        // Optimistic UI update
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
        try {
          await markAllNotificationsReadAPI();
        } catch (err) {
          console.error("Mark All Read API Error:", err);
        }
      },
      
      clearAll: async () => {
        // v20.2.6: Immediately clear UI AND localStorage persistence
        set({ notifications: [], unreadNotificationsCount: 0 });
        try {
          await deleteAllNotificationsAPI();
          // Force clear persisted storage so they don't return on refresh
          try {
            const storageKey = 'creziax-notifications';
            const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
            if (stored.state) {
              stored.state.notifications = [];
              stored.state.unreadNotificationsCount = 0;
              localStorage.setItem(storageKey, JSON.stringify(stored));
            }
          } catch (_) {}
        } catch (err) {
          console.error("Clear All Notifications API Error:", err);
        }
      },

      testSound: () => {
        console.log("🔔 Manual sound test triggered.");
        playNotificationSound();
      },

      playTin: () => {
        playTinSound();
      }
    }),
    {
      name: 'creziax-notifications',
      version: 1, // v21.8: Force reset for all users to fix white screen crashes
    }
  )
);

export default useNotificationStore;
