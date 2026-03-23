import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { notifications, markAllRead, clearAll } = useNotificationStore();

  useEffect(() => {
    console.log("🔔 NotificationsPage Mounted for role:", localStorage.getItem('user_role') || 'Unknown');
  }, []);

  if (!notifications) return <div className="p-10 text-center font-bold">Loading Notifications...</div>;
  const isRTL = i18n.language === 'ar';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">
            {t('notifications', 'الاشعارات')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-base md:text-lg italic mt-2">
            {t('notifications_subtitle', 'سجل التنبيهات والنبض العالمي للنظام.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllRead}
                className="px-6 py-3 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={18} />
                {t('mark_all_read', 'تحديد الكل كمقروء')}
              </button>
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                {t('clear_all', 'مسح السجل')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-16 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400">
                <Bell size={40} className="opacity-20" />
              </div>
              <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">
                {t('no_notifications', 'لا توجد إشعارات')}
              </h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">
                {t('no_notifications_desc', 'انت هادئ جداً اليوم، لم تصلك أي تنبيهات جديدة بعد.')}
              </p>
            </motion.div>
          ) : (
            notifications.map((n, index) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden bg-white dark:bg-[#0a0a0c]/40 border rounded-[2rem] p-6 transition-all duration-300 ${
                  !n.read 
                    ? 'border-brand-500/30 bg-brand-500/[0.02] shadow-lg shadow-brand-500/5' 
                    : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-5 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    n.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-brand-500/10 text-brand-500'
                  }`}>
                    {n.type === 'success' ? <CheckCircle2 size={24} /> : <Bell size={24} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        n.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-brand-500/10 text-brand-500'
                      }`}>
                        {n.type || 'INFO'}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                        <Clock size={12} />
                        {new Date(n.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <p className="text-base md:text-lg font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                      {typeof n.message === 'string' ? n.message : n.message?.message || JSON.stringify(n.message)}
                    </p>
                  </div>
                </div>

                {/* Status indicator pulse */}
                {!n.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]" />
                )}

                {/* Subtle backdrop glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-violet-500 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none" />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsPage;
