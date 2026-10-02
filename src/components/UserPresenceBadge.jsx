import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import usePresenceStore from '../store/presenceStore';

export default function UserPresenceBadge({ userId, initialOnline, initialLastActive, variant = 'full', className = '' }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const presenceMap = usePresenceStore(state => state.presenceMap);

  const presence = useMemo(() => {
    if (userId && presenceMap[userId] !== undefined) {
      return presenceMap[userId];
    }
    return {
      isOnline: Boolean(initialOnline),
      lastActiveAt: initialLastActive || null
    };
  }, [userId, presenceMap, initialOnline, initialLastActive]);

  const formatLastActive = (dateString) => {
    if (!dateString) return isRTL ? 'غير متصل' : 'Offline';
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return isRTL ? 'منذ لحظات' : 'Just now';
      if (diffMins < 60) return isRTL ? `منذ ${diffMins} د` : `${diffMins}m ago`;
      if (diffHours < 24) return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`;
      if (diffDays === 1) return isRTL ? 'أمس' : 'Yesterday';
      return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return isRTL ? 'غير متصل' : 'Offline';
    }
  };

  if (variant === 'dot') {
    return (
      <span
        title={presence.isOnline ? (isRTL ? 'متصل الآن (Online)' : 'Online') : (isRTL ? `آخر ظهور: ${formatLastActive(presence.lastActiveAt)}` : `Last seen: ${formatLastActive(presence.lastActiveAt)}`)}
        className={`relative inline-flex items-center justify-center ${className}`}
      >
        {presence.isOnline && (
          <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-[#0a0a0c] shadow-sm ${
            presence.isOnline 
              ? 'bg-emerald-500 shadow-emerald-500/50' 
              : 'bg-slate-400 dark:bg-slate-600'
          }`}
        />
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border transition-all duration-300 shadow-sm ${
        presence.isOnline
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/10'
          : 'bg-slate-100 dark:bg-white/[0.03] text-slate-400 border-slate-200 dark:border-white/10'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {presence.isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            presence.isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
          }`}
        />
      </span>
      <span className="tracking-tight">{presence.isOnline ? (isRTL ? 'متصل الآن' : 'Online') : (isRTL ? `آخر ظهور: ${formatLastActive(presence.lastActiveAt)}` : `Last seen ${formatLastActive(presence.lastActiveAt)}`)}</span>
    </div>
  );
}
