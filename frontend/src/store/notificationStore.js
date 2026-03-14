import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// A short subtle pop sound base64 encoded
const popSoundBase64 = "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

let audioInstance = null;
let isAudioUnlocked = false;

if (typeof window !== 'undefined') {
  audioInstance = new Audio(popSoundBase64);
  audioInstance.volume = 0.5;

  const unlockAudio = () => {
    if (!isAudioUnlocked && audioInstance) {
      console.log("🔊 Attempting to unlock audio context...");
      // Play and immediately pause to unlock the audio context
      audioInstance.play().then(() => {
        audioInstance.pause();
        audioInstance.currentTime = 0;
        isAudioUnlocked = true;
        console.log("✅ Audio context unlocked successfully.");
      }).catch((err) => {
        console.warn("⚠️ Audio unlock failed (still need interaction):", err);
      });
      
      // Keep listeners until success or remove after first try
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    }
  };

  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

const playPopSound = () => {
  if (audioInstance && isAudioUnlocked) {
    try {
      audioInstance.currentTime = 0;
      const playPromise = audioInstance.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("❌ Audio playback blocked:", error);
        });
      }
    } catch (error) {
      console.warn("❌ Error playing sound:", error);
    }
  } else {
    console.log("ℹ️ Sound skipped: Audio not unlocked yet. Click anywhere on the page first.");
  }
};

const THIRTY_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // Actually 2 days (48 hours) as requested
const MAX_NOTIFICATIONS = 50; // Keep up to 50 local notifications

const filterExpired = (notifications) => {
  const now = Date.now();
  return notifications.filter(n => {
    const age = now - new Date(n.timestamp).getTime();
    return age < THIRTY_DAYS_MS;
  });
};

const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (message, type = 'info') => {
        playPopSound();
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
      }
    }),
    {
      name: 'creziax-notifications'
    }
  )
);

export default useNotificationStore;
