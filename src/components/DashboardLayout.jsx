import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, Menu, Megaphone, Pencil, X, Edit2, Bell, CheckCircle2 } from 'lucide-react';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';
import useBroadcastStore from '../store/broadcastStore';
import useNotificationStore from '../store/notificationStore';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { broadcasts, fetchActiveBroadcasts, updateBroadcast, createBroadcast } = useBroadcastStore();
  const { notifications, markAllRead } = useNotificationStore();
  
  const isRTL = i18n.language === 'ar';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingBroadcast, setIsEditingBroadcast] = useState(false);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);

  useEffect(() => {
    fetchActiveBroadcasts();
  }, [fetchActiveBroadcasts]);

  // Click-outside closes notifications panel
  useEffect(() => {
    const handler = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeBroadcast = broadcasts[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSaveBroadcast = async () => {
    try {
      if (activeBroadcast) {
        if (!broadcastInput.trim()) {
           await updateBroadcast(activeBroadcast.id, { isActive: false });
        } else {
           await updateBroadcast(activeBroadcast.id, { message: broadcastInput, isActive: true });
        }
      } else if (broadcastInput.trim()) {
        await createBroadcast({ message: broadcastInput, isActive: true });
      }
      setIsEditingBroadcast(false);
      toast.success(t('saved_successfully') || 'Saved successfully');
    } catch (err) {
      toast.error(t('error_general') || 'Error saving broadcast');
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 transition-colors duration-500" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Dynamic Background Texture */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`bg-blob -top-48 opacity-40 dark:opacity-20 ${isRTL ? '-right-48' : '-left-48'}`}></div>
        <div className={`bg-blob top-[60%] opacity-30 dark:opacity-10 ${isRTL ? '-left-48' : '-right-48'}`} style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0) 70%)' }}></div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-[#0a0a0c]/80 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      {/* Main Content Wrapper */}
      <main className={`min-h-screen flex flex-col w-full lg:w-[calc(100%-16rem)] transition-all duration-300 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        
        {/* Global Transparent Header */}
        <header className="sticky top-0 z-[80] w-full flex items-center justify-between lg:justify-end h-20 px-6 md:px-10 gap-4 bg-slate-50/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-800 dark:text-white hover:text-brand-600 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
            style={{ zIndex: 100 }}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 p-1.5 glass-panel rounded-2xl shadow-sm">
            {/* Admin Broadcast Trigger */}
            {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
              <button
                onClick={() => {
                  setBroadcastInput(activeBroadcast?.message || '');
                  setIsEditingBroadcast(true);
                }}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                title="Edit Banner"
              >
                <Megaphone size={20} />
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#0a0a0c] rounded-full animate-pulse"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className={`absolute top-full mt-2 w-80 bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden ${isRTL ? 'left-0' : 'right-0'}`}>
                  <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800 dark:text-white">{(t && t('notifications')) || 'Notifications'}</h4>
                    {unreadCount > 0 && (
                      <span onClick={markAllRead} className="text-xs text-brand-500 font-medium cursor-pointer hover:underline">
                        {(t && t('mark_all_read')) || 'Mark all read'}
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{(t && t('no_notifications')) || 'No notifications yet'}</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 rounded-xl mb-1 flex items-start gap-3 transition-colors ${!n.read ? 'bg-brand-50/50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400'}`}>
                            {n.type === 'success' ? <CheckCircle2 size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-slate-200 dark:border-white/10 mx-1"></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="w-px h-5 bg-slate-200 dark:border-white/10 mx-1"></div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              <Globe size={18} />
              <span className="hidden sm:inline font-mono">
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </span>
            </button>
          </div>
        </header>

        {/* Page Content Container - Spacious & Breathable */}
        <div className="w-full mx-auto px-6 pt-10 pb-24 md:px-10 lg:px-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </div>
      </main>

      {/* Broadcast Edit Modal */}
      {isEditingBroadcast && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md"
            onClick={() => setIsEditingBroadcast(false)}
          />
          <div className="relative z-10 bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2rem] w-full max-w-lg shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Megaphone size={20} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">رسالة النظام الإعلانية</h3>
                <p className="text-xs text-slate-400">ستظهر للجميع عند دخولهم للنظام</p>
              </div>
              <button 
                onClick={() => setIsEditingBroadcast(false)} 
                className="mr-auto p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
              placeholder={t('banner_placeholder')}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-medium resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setBroadcastInput(''); }}
                className="flex-1 py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-2xl transition-all text-sm"
              >
                {t('clear_broadcast')}
              </button>
              <button
                onClick={handleSaveBroadcast}
                className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all text-sm"
              >
                {t('save_broadcast')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
