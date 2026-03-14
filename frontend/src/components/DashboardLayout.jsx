import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, Menu } from 'lucide-react';
import useThemeStore from '../store/themeStore';
import { useState } from 'react';

const DashboardLayout = () => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const isRTL = i18n.language === 'ar';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <main className={`min-h-screen transition-all duration-300 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        
        {/* Global Transparent Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between lg:justify-end h-20 px-6 md:px-10 gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2 p-1.5 glass-panel rounded-2xl shadow-sm">
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
