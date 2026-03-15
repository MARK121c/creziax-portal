import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Using the local MP3 file downloaded to /public/sounds/notification.mp3
const soundPath = "/sounds/notification.mp3";

let audioInstance = null;
let isAudioUnlocked = false;

if (typeof window !== 'undefined') {
  audioInstance = new Audio(soundPath);
  audioInstance.volume = 0.6;

  const unlockAudio = () => {
    if (!isAudioUnlocked && audioInstance) {
      console.log("🔊 Interaction detected. Unlocking audio...");
      // Play a tiny bit then pause to unlock
      audioInstance.play()
        .then(() => {
          audioInstance.pause();
          audioInstance.currentTime = 0;
          isAudioUnlocked = true;
          console.log("✅ Audio context UNLOCKED.");
          
          // Remove listeners once unlocked
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
      
      addNotification: (message, type = 'info') => {
        // Trigger sound for all notifications except maybe very silent ones
        // But the user asked for Success/Error specifically. 
        // We'll play for all to be safe or filter.
        // The user said: "تأكد إن الصوت بيشتغل تلقائياً مع كل (Success Toast) و (Error Toast)"
        if (type === 'success' || type === 'error') {
          playNotificationSound();
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
