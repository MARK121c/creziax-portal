import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const DashboardLayout = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Background Effects */}
      <div className={`bg-blob -top-24 opacity-60 ${isRTL ? '-right-24' : '-left-24'}`}></div>
      <div className={`bg-blob top-[40%] opacity-40 ${isRTL ? '-left-24' : '-right-24'}`} style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)' }}></div>
      
      <Sidebar />
      
      {/* Content Area */}
      <main className={`min-h-screen transition-all duration-300 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 relative">
          
          {/* Language Switcher */}
          <div className={`absolute top-4 md:top-8 ${isRTL ? 'left-4 md:left-8' : 'right-4 md:right-8'} z-50`}>
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 glass-panel border border-white/10 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all shadow-lg"
            >
              <Globe size={16} className="text-violet-400" />
              {i18n.language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          <div className="mt-12 md:mt-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
