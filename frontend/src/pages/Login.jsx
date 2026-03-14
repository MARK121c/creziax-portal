import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Moon, Sun, Globe } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      switch (user.role) {
        case 'ADMIN': return navigate('/admin');
        case 'TEAM': return navigate('/team');
        case 'CLIENT': return navigate('/client');
        default: return navigate('/login');
      }
    } catch {
      // error is handled in state
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('ar') ? 'en' : 'ar');
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0a0a0c]' : 'bg-slate-50'}`} dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
      
      {/* Top right / left controls for Theme & Language */}
      <div className={`absolute top-6 ${i18n.language.startsWith('ar') ? 'left-6' : 'right-6'} flex items-center gap-3 z-50`}>
        <button 
          type="button"
          onClick={toggleLanguage}
          className={`p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10' : 'bg-white border border-slate-200 text-slate-600 hover:text-brand-600'}`}
        >
          <Globe size={18} />
          {i18n.language.startsWith('ar') ? 'English' : 'العربية'}
        </button>
        <button 
          type="button"
          onClick={toggleTheme}
          className={`p-3 rounded-2xl transition-all shadow-sm ${theme === 'dark' ? 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10' : 'bg-white border border-slate-200 text-slate-600 hover:text-brand-600'}`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Premium Background Effects */}
      <div className={`bg-blob -top-24 -left-24 opacity-60 ${theme === 'light' ? 'mix-blend-multiply opacity-20' : ''}`}></div>
      <div className={`bg-blob bottom-neg-24 -right-24 opacity-40 ${theme === 'light' ? 'mix-blend-multiply opacity-10' : ''}`} style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%)' }}></div>

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 mb-6 shadow-2xl shadow-violet-500/30">
            <span className="text-4xl font-black text-white tracking-tighter">X</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
            {t('login_title')}
          </h1>
          <p className={`mt-3 font-medium tracking-wide border-t pt-3 inline-block ${theme === 'dark' ? 'text-slate-500 border-white/5' : 'text-slate-500 border-slate-200'}`}>
            {t('login_subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className={`glass-panel border rounded-[2.5rem] p-8 sm:p-10 shadow-2xl ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-white/80'}`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl text-sm font-medium animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className={`block text-xs font-bold uppercase tracking-widest ${i18n.language.startsWith('ar') ? 'mr-1' : 'ml-1'} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('email_label')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-6 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all duration-300 font-bold ${
                  theme === 'dark' 
                    ? 'bg-white/[0.03] border-white/5 text-white placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
                placeholder=""
                required
              />
            </div>

            <div className="space-y-2 relative">
              <label className={`block text-xs font-bold uppercase tracking-widest ${i18n.language.startsWith('ar') ? 'mr-1' : 'ml-1'} ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('password_label')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${i18n.language.startsWith('ar') ? 'pr-6 pl-14' : 'pl-6 pr-14'} py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all duration-300 font-bold ${
                    theme === 'dark' 
                      ? 'bg-white/[0.03] border-white/5 text-white placeholder-slate-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${i18n.language.startsWith('ar') ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-colors ${
                    theme === 'dark' 
                      ? 'text-slate-400 hover:text-white hover:bg-white/10' 
                      : 'text-slate-500 hover:text-brand-600 hover:bg-slate-200/50'
                  }`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-violet-600/20 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {t('validating')}
                </span>
              ) : t('sign_in')}
            </button>
          </form>
        </div>

        <p className={`text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] mt-8 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
          {t('copyright')}
        </p>
      </div>
    </div>
  );
};

export default Login;
