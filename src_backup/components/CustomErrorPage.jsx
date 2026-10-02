import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const CustomErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full bg-white/[0.03] border border-white/5 p-12 rounded-[3rem] backdrop-blur-xl shadow-2xl"
      >
        <div className="w-20 h-20 bg-brand-500/10 text-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-brand-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <ShieldAlert size={40} />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase">
          Oops!
        </h1>
        
        <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
          Something went wrong, but we're on it. Let's get you back to your workspace.
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/client')}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20 active:scale-95"
          >
            <Home size={18} />
            Back to Dashboard
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/5 active:scale-95"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </motion.div>

      <div className="mt-12 opacity-30">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          Powered by <span className="text-brand-500">Creziax</span>
        </p>
      </div>
    </div>
  );
};

export default CustomErrorPage;
