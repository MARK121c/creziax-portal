import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTeamDashboardStatsAPI } from '../../store/api';
import { useTranslation } from 'react-i18next';
import {
  Users, Zap, Wallet, Clock,
  FileText, CalendarCheck2,
  Circle, DollarSign, Activity, ExternalLink,
  ChevronRight, ArrowUpRight, Loader2, Fingerprint, CheckCircle2, TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

function StatCard({ icon: Icon, label, value, sub, isLast, colorScheme }) {
  const colorMap = {
    brand: 'bg-cyan-500/10 text-cyan-500 dark:bg-cyan-500/20',
    purple: 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
  };
  const iconTheme = colorMap[colorScheme] || colorMap.brand;

  return (
    <div className={`p-5 md:p-8 transition-colors duration-300 hover:bg-slate-50 dark:hover:bg-white/[0.02] flex flex-col justify-between gap-4 md:gap-6 ${isLast ? '' : 'border-b md:border-b-0 lg:border-r border-slate-200 dark:border-white/5'}`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${iconTheme}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">{label}</p>
        <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{value}</p>
        {sub && (
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-100 dark:border-white/5">{sub}</p>
        )}
      </div>
    </div>
  );
}

function TaskBadge({ status }) {
  const cfg = {
    DELIVERED: { label: 'مكتمل', color: 'text-emerald-500', dot: 'bg-emerald-500' },
    REVIEW:    { label: 'مراجعة', color: 'text-amber-500', dot: 'bg-amber-500' },
    EDITING:   { label: 'قيد التنفيذ', color: 'text-blue-500', dot: 'bg-blue-500' },
    SHOOTING:  { label: 'قيد التنفيذ', color: 'text-indigo-500', dot: 'bg-indigo-500' },
    SCRIPTING: { label: 'تخطيط', color: 'text-slate-500', dot: 'bg-slate-500' },
    IDEA:      { label: 'بانتظار البدء', color: 'text-slate-500', dot: 'bg-slate-500' },
  };
  const c = cfg[status] || cfg.IDEA;
  return (
    <div className="flex items-center gap-1.5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-md">
      <div className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      <span className={`text-[9px] font-black uppercase tracking-widest ${c.color}`}>{c.label}</span>
    </div>
  );
}

const TeamDashboard = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuthStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const EGP_RATE = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTeamDashboardStatsAPI();
      setData(res.data);
    } catch (err) {
      toast.error(isRTL ? 'فشل مزامنة البيانات' : 'Sync Failed');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = data?.stats || {};
  const recentProjects = data?.recentProjects || [];
  const dailyTasks = data?.dailyTasks || [];
  const contract = data?.contract || null;

  const fmt = (n) => {
    let v = parseFloat(n) || 0;
    if (currency === 'EGP') v = v * EGP_RATE;
    return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  const currSymbol = currency === 'USD' ? '$' : 'EGP';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 font-sans bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 transition-colors duration-500" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-12 space-y-12">
        
        {/* ── Header: Identity & Role ───────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 shadow-inner flex items-center justify-center flex-shrink-0 relative overflow-hidden group">
               <Fingerprint size={32} className="text-cyan-500 opacity-90 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
               {/* Team Identifier Dot */}
               <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full border-[3px] border-slate-50 dark:border-[#0a0a0c]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">
                {isRTL ? 'مساحة العمل الشخصية' : 'Personal Workspace'}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                {user?.firstName || 'User'} {user?.lastName || ''}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-1">
              <button 
                onClick={() => setCurrency('USD')}
                className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${currency === 'USD' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                USD
              </button>
              <button 
                onClick={() => setCurrency('EGP')}
                className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${currency === 'EGP' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                EGP
              </button>
            </div>
          </div>
        </div>

        {/* ── LEVEL 1: Unified Metrics Grid ───────────────────────────── */}
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={Users} label={isRTL ? 'العملاء' : 'Clients'} value={stats.assignedClientsCount ?? 0} sub={isRTL ? 'تحت الإدارة' : 'Managed'} colorScheme="brand" />
            <StatCard icon={Zap} label={isRTL ? 'عمليات نشطة' : 'Active'} value={stats.activeProduction ?? 0} sub={isRTL ? 'قيد التنفيذ' : 'In Progress'} colorScheme="amber" />
            <StatCard icon={Wallet} label={isRTL ? 'الأرباح الكلية' : 'Total Earned'} value={`${fmt(stats.totalEarnings)}`} sub={currSymbol} colorScheme="emerald" />
            <StatCard icon={TrendingUp} label={isRTL ? 'ربح الشهر' : 'This Month'} value={`${fmt(stats.thisMonthEarnings)}`} sub={currSymbol} colorScheme="purple" />
            <StatCard icon={Clock} label={isRTL ? 'مستحقات' : 'Pending'} value={`${fmt(stats.pendingPayout || 0)}`} sub={currSymbol} isLast colorScheme="rose" />
          </div>
        </div>

        {/* ── LEVEL 2: Operations & Tasks ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Missions Flow (Left - 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-4 bg-brand-500 rounded-full" />
                 {isRTL ? 'المشاريع الجارية' : 'Active Projects'}
              </h2>
               <div className="flex-1 h-px bg-slate-200 dark:bg-white/10 mx-6 hidden sm:block" />
              <Link to="/team/projects" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                 {isRTL ? 'السجل' : 'Archive'} <ChevronRight size={12} />
              </Link>
            </div>
            
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-sm overflow-hidden">
              {recentProjects.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRTL ? 'لا توجد عمليات حالياً' : 'No active projects'}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {recentProjects.map(project => (
                    <div key={project.id} className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{isRTL ? 'مرحلة الإنتاج' : 'Production Flow'}</p>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{project.name}</h3>
                      </div>
                      <Link
                        to={`/team/projects/${project.id}`}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                      >
                        {isRTL ? 'مساحة العمل' : 'Workspace'}
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Command Access Panel */}
             <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-sm p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{isRTL ? 'لوحة الأداء الأسبوعية' : 'Weekly Review Hub'}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{isRTL ? 'تقييم المهام والتحليلات' : 'Analytics & Task Flow'}</p>
                </div>
                <Link to="/team/tasks?filter=weekly" className="px-6 py-3 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-center w-full sm:w-auto">
                   {isRTL ? 'عرض التقارير' : 'View Reports'}
                </Link>
             </div>
          </div>

          {/* Daily Manifest (Right - 5 Cols) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{isRTL ? 'أوامر اليوم' : 'Daily Manifest'}</h2>
              <Link to="/team/tasks" className="text-[10px] font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors">{isRTL ? 'كل المهام' : 'All Tasks'}</Link>
            </div>
            
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-sm flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 p-8">
                {dailyTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 pt-10">
                    <CheckCircle2 size={32} className="text-slate-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRTL ? 'لا توجد مهام معلقة' : 'No Pending Missions'}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {dailyTasks.map(task => (
                      <div key={task.id} className="group flex flex-col gap-3 pb-6 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{task.title}</p>
                          <TaskBadge status={task.status} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.project?.name || 'Administrative'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* ── LEVEL 3: Personal Finance & HR ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Progress Tracker Layer */}
          <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-sm p-10 flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-8">
              <DollarSign size={20} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{isRTL ? 'مسار الراتب الشهري' : 'Salary Trajectory'}</h3>
            </div>
            
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{isRTL ? 'المحقق هذا الشهر' : 'Earned this block'}</p>
                <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{fmt(stats.thisMonthEarnings)} <span className="text-sm">{currSymbol}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{isRTL ? 'المستهدف الشهري' : 'Target Salary'}</p>
                <p className="text-xl font-black text-slate-600 dark:text-slate-400 tracking-tighter">{fmt(stats.monthlySalary)} <span className="text-xs">{currSymbol}</span></p>
              </div>
            </div>
            
            <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-slate-800 dark:bg-white rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.round(((stats.thisMonthEarnings || 0) / (stats.monthlySalary || 1)) * 100))}%` }}
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">
              {Math.min(100, Math.round(((stats.thisMonthEarnings || 0) / (stats.monthlySalary || 1)) * 100))}% {isRTL ? 'مكتمل' : 'Completed'}
            </p>
          </div>

           {/* Personal Contract / HR Layer */}
           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-sm p-10 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <FileText size={20} className="text-slate-400" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{isRTL ? 'الملف الوظيفي' : 'HR Dossier'}</h3>
               </div>
               {contract?.pdfUrl && (
                  <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-bold text-slate-800 dark:text-white hover:opacity-70 uppercase tracking-widest transition-opacity">
                     <ExternalLink size={14} /> {isRTL ? 'عرض العقد' : 'View PDF'}
                  </a>
               )}
            </div>
            
            {contract ? (
               <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-5">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isRTL ? 'حالة العقد' : 'Status'}</p>
                     <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-2 py-1 rounded-md">{isRTL ? 'ساري العمل' : 'Active'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isRTL ? 'فترة التعاقد' : 'Duration span'}</p>
                     <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 tracking-widest">
                        {contract.startDate || '--'} <span className="text-slate-400 mx-2">→</span> {contract.endDate || '--'}
                     </p>
                  </div>
               </div>
            ) : (
               <div className="text-center opacity-50 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRTL ? 'لا يوجد ملف تعاقد مرفق' : 'No HR Contract on file'}</p>
               </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeamDashboard;
