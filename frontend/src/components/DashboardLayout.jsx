import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, Menu, Megaphone, Pencil, X, Edit2, Bell, CheckCircle2 } from 'lucide-react';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';
import useBroadcastStore from '../store/broadcastStore';
import useNotificationStore from '../store/notificationStore';
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchActiveBroadcasts();
  }, [fetchActiveBroadcasts]);

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
          className="fixed inset-0 bg-slate-900/50 dark:bg-[#0a0a0c]/80 backdrop-blur-sm z-30 lg:hidden animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      {/* Main Content Wrapper */}
      <main className={`min-h-screen flex flex-col transition-all duration-300 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        
        {/* Broadcast Banner */}
        {(activeBroadcast || isEditingBroadcast) && (
          <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 dark:from-brand-900/80 dark:via-brand-800/80 dark:to-indigo-900/80 text-white px-4 py-2.5 flex items-center justify-center gap-3 relative shadow-md z-40">
            <Megaphone size={16} className="animate-pulse flex-shrink-0 opacity-80" />
            
            {isEditingBroadcast ? (
              <div className="flex items-center gap-2 w-full max-w-lg">
                <input 
                  type="text" 
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  placeholder="Enter broadcast message (leave empty to remove)..."
                  className="flex-1 bg-white/20 dark:bg-black/20 text-white placeholder-white/50 px-3 py-1 rounded outline-none text-sm font-medium focus:ring-2 focus:ring-white/50"
                  autoFocus
                />
                <button onClick={handleSaveBroadcast} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors">
                  Save
                </button>
                <button onClick={() => setIsEditingBroadcast(false)} className="p-1 hover:bg-white/20 rounded transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="text-sm font-bold tracking-wide">
                {activeBroadcast?.message}
              </div>
            )}
            
            {(user?.role === 'ADMIN' || user?.role === 'OWNER') && !isEditingBroadcast && (
              <button 
                onClick={() => { setBroadcastInput(activeBroadcast?.message || ''); setIsEditingBroadcast(true); }}
                className="absolute right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Edit Banner"
              >
                <Edit2 size={14} opacity={0.8} />
              </button>
            )}
          </div>
        )}

        {/* Global Transparent Header */}
        <header className="sticky top-0 z-30 w-full flex items-center justify-between lg:justify-end h-20 px-6 md:px-10 gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
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
            <div className="relative">
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
        <div className="max-w-[1600px] mx-auto px-6 pt-10 pb-24 md:px-10 lg:px-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
