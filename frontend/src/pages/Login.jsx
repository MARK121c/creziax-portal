import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      // Redirect based on role
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'TEAM':
          navigate('/team');
          break;
        case 'CLIENT':
          navigate('/client');
          break;
        default:
          navigate('/login');
      }
    } catch {
      // error is stored in state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c] px-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="bg-blob -top-24 -left-24 opacity-60"></div>
      <div className="bg-blob bottom-neg-24 -right-24 opacity-40" style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%)' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-600 mb-6 shadow-2xl shadow-violet-500/30">
            <span className="text-3xl font-black text-white tracking-tighter">C</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Creziax Portal
          </h1>
          <p className="text-slate-500 mt-3 font-medium tracking-wide border-t border-white/5 pt-3 inline-block">
            ENTERPRISE ACCESS
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl text-sm font-medium animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all duration-300"
                placeholder="admin@creziax.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all duration-300"
                placeholder="••••••••"
                required
              />
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
                  VALIDATING...
                </span>
              ) : 'SIGN IN'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-8">
          © 2026 CREZIAX DIGITAL SYSTEM
        </p>
      </div>
    </div>
  );
};

export default Login;
