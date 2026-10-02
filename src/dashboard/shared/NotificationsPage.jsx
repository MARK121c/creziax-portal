import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle2, Clock, Trash2, Loader2, MessageSquare, Users, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';

// Strip internal prefix tags like [رسالة], [جروب] before display
const cleanMessage = (raw) => {
  if (!raw) return '';
  let msg = String(raw)
    .replace(/^\[رسالة\]\s*/i, '')
    .replace(/^\[جروب\]\s*/i, '')
    .replace(/^\[رسالة خاصة\]\s*/i, '')
    .replace(/^undefined\s*(?:undefined)?:?\s*/i, '')
    .replace(/^undefined:\s*/i, '')
    .replace(/undefined\s*undefined:/i, '')
    .trim();
    
    if (msg.includes('[VOICE]')) return "🎤 رسالة صوتية";
    if (msg.includes('[FILE]')) return "📎 مرفق جديد";
    if (msg.includes('[MEETING_BOOKING]')) return "🗓 دعوة لاجتماع";
    if (msg.includes('[DRIVE_LINK]')) return "🔗 رابط Drive";
    
    return msg;
};

const getNotifMeta = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'success':
      return { icon: <CheckCircle2 size={20} />, bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'ناجح', dot: 'bg-emerald-400' };
    case 'error':
      return { icon: <AlertTriangle size={20} />, bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'خطأ', dot: 'bg-rose-400' };
    case 'warning':
      return { icon: <ShieldAlert size={20} />, bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'تحذير', dot: 'bg-amber-400' };
    case 'message':
      return { icon: <MessageSquare size={20} />, bg: 'bg-brand-500/10', text: 'text-brand-500', label: 'رسالة', dot: 'bg-brand-400' };
    case 'group':
      return { icon: <Users size={20} />, bg: 'bg-violet-500/10', text: 'text-violet-500', label: 'جروب', dot: 'bg-violet-400' };
    default:
      return { icon: <Info size={20} />, bg: 'bg-slate-500/10', text: 'text-slate-500', label: 'إشعار', dot: 'bg-slate-400' };
  }
};

const NotificationsPage = () => {
  const { i18n } = useTranslation();
  const { notifications = [], fetchNotifications, markAllRead, clearAll, resetUnreadNotifications } = useNotificationStore();

  useEffect(() => {
    resetUnreadNotifications();
    if (typeof fetchNotifications === 'function') {
      fetchNotifications();
    }
  }, [resetUnreadNotifications, fetchNotifications]);

  if (!notifications || !Array.isArray(notifications)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 text-center">
        <Loader2 size={40} className="animate-spin text-brand-500 mb-4" />
        <p className="font-bold text-slate-500 italic">جارٍ تحميل الإشعارات...</p>
      </div>
    );
  }

  const isRTL = i18n.language === 'ar' || i18n.language === 'AR';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Bell size={24} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              الإشعارات
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs font-bold text-brand-500 mt-0.5">
                {unreadCount} إشعار غير مقروء
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllRead}
                className="px-5 py-2.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                تحديد الكل كمقروء
              </button>
              <button
                onClick={clearAll}
                className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <Trash2 size={16} />
                مسح الكل
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-16 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Bell size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-600 dark:text-slate-300 mb-2">
                لا توجد إشعارات
              </h3>
              <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto">
                أنت هادئ جداً اليوم، لم تصلك أي تنبيهات جديدة بعد.
              </p>
            </motion.div>
          ) : (
            notifications.map((n, index) => {
              const meta = getNotifMeta(n.type);
              const msg = cleanMessage(n.message);
              return (
                <motion.div
                  key={n.id || index}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className={`group relative overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300 border ${
                    !n.read
                      ? 'bg-white dark:bg-[#0d0d10] border-brand-500/25 shadow-md shadow-brand-500/5'
                      : 'bg-white/60 dark:bg-[#0a0a0c]/30 border-slate-200/60 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.text}`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px]">
                          <Clock size={10} />
                          {new Date(n.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                        {msg}
                      </p>
                      {n.senderName && (
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">من: {n.senderName}</p>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!n.read && (
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 animate-pulse ${meta.dot}`} />
                    )}
                  </div>

                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-violet-500 opacity-0 group-hover:opacity-[0.025] transition-opacity pointer-events-none rounded-[1.5rem]" />
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsPage;
