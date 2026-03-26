import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast as rToast } from 'react-toastify';

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
      globalCountVisible: true,
      
      setActiveThreadId: (id) => set({ activeThreadId: id }),
      setGlobalCountVisible: (visible) => set({ globalCountVisible: visible }),
      
      incrementUnreadMessages: (threadId) => set((state) => {
        const newUnreadThreads = { ...state.unreadThreads };
        newUnreadThreads[threadId] = (newUnreadThreads[threadId] || 0) + 1;
        const globalCount = Object.values(newUnreadThreads).reduce((a, b) => a + b, 0);
        return { 
          unreadThreads: newUnreadThreads,
          unreadMessagesCount: globalCount
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

      // V17.6-SUPREME: Global Kill Switch for Sidebar Badge ONLY
      resetAllGlobalUnread: () => set({ 
        unreadMessagesCount: 0, 
        globalCountVisible: false 
      }),
      
      addNotification: (message, type = 'info', toastId = null) => {
        // v17.6 Single Sound & Single ToastId Hardening
        const finalToastId = 'global-chat-toast';
        
        if (type === 'success' || type === 'error' || type === 'message') {
          playNotificationSound();
        }

        // Trigger rToast directly if not on messages page (decided by caller usually, but enforced here via ID)
        if (type === 'message') {
           rToast(message, { 
             toastId: finalToastId, 
             type: 'info',
             autoClose: 3000,
             hideProgressBar: false,
             pauseOnHover: true,
             draggable: true,
             theme: "dark"
           });
        }
        
        set((state) => {
          const currentValid = filterExpired(state.notifications);
          return {
            notifications: [
              {
                id: Date.now().toString(),
                message,
                type,
                timestamp: new Date().toISOString(),
                read: false
              },
              ...currentValid
            ].slice(0, MAX_NOTIFICATIONS)
          };
        });
      },
      
      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },

      testSound: () => {
        console.log("🔔 Manual sound test triggered.");
        playNotificationSound();
      }
    }),
    {
      name: 'creziax-notifications'
    }
  )
);

export default useNotificationStore;
