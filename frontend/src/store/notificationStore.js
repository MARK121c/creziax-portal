import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// A clean short "Pop" sound base64
const popSoundBase64 = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQAFBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcAAAAhTEFNRTMuMTAwA8MAAAAAAAAAABRAJAJBAAAAAAAAAAAAnHHY7V0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5DEAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnuAAABGAAAAb4AAAAMAAAAA3IDAAAnXG8=";

let audioInstance = null;
let isAudioUnlocked = false;

if (typeof window !== 'undefined') {
  audioInstance = new Audio(popSoundBase64);
  audioInstance.volume = 0.6;

  const unlockAudio = () => {
    if (!isAudioUnlocked && audioInstance) {
      console.log("🔊 Interaction detected. Unlocking audio...");
      audioInstance.play()
        .then(() => {
          audioInstance.pause();
          audioInstance.currentTime = 0;
          isAudioUnlocked = true;
          console.log("✅ Audio context UNLOCKED.");
          
          // Remove listeners once unlocked
          document.removeEventListener('mousedown', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
        })
        .catch(err => console.log("Still locked:", err));
    }
  };

  document.addEventListener('mousedown', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
}

const playPopSound = () => {
  if (audioInstance) {
    audioInstance.currentTime = 0;
    audioInstance.play().catch(e => console.log("Playback failed:", e));
  }
};

const THIRTY_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const MAX_NOTIFICATIONS = 50;

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
      },

      testSound: () => {
        console.log("🔔 Manual sound test triggered.");
        playPopSound();
      }
    }),
    {
      name: 'creziax-notifications'
    }
  )
);

export default useNotificationStore;
