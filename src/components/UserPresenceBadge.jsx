import { useMemo } from 'react';
import usePresenceStore from '../store/presenceStore';

export default function UserPresenceBadge({ userId, initialOnline, initialLastActive, variant = 'full', className = '' }) {
  const presenceMap = usePresenceStore(state => state.presenceMap);

  const presence = useMemo(() => {
    if (userId && presenceMap[userId]) {
      return presenceMap[userId];
    }
    return {
      isOnline: Boolean(initialOnline),
      lastActiveAt: initialLastActive || null
    };
  }, [userId, presenceMap, initialOnline, initialLastActive]);

  const formatLastActive = (dateString) => {
    if (!dateString) return 'غير متواجد';
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'منذ لحظات';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    } catch {
      return 'غير متواجد';
    }
  };

  if (variant === 'dot') {
    return (
      <span
        title={presence.isOnline ? 'متواجد الآن (Online)' : `آخر ظهور: ${formatLastActive(presence.lastActiveAt)}`}
        className={`relative flex h-3 w-3 ${className}`}
      >
        {presence.isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 border-2 border-white dark:border-[#0a0a0c] ${
            presence.isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
          }`}
        />
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${
        presence.isOnline
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {presence.isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            presence.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      </span>
      <span>{presence.isOnline ? 'متواجد الآن' : formatLastActive(presence.lastActiveAt)}</span>
    </div>
  );
}
