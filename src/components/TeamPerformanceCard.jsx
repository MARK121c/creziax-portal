import { useMemo } from 'react';
import { Award, CheckCircle2, Clock, AlertTriangle, Flame, TrendingUp, ShieldCheck } from 'lucide-react';

export default function TeamPerformanceCard({ performance, memberName, position }) {
  const perf = useMemo(() => {
    if (!performance) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        onTimeTasks: 0,
        overdueTasks: 0,
        completionRate: 100,
        onTimeRate: 100,
        commitmentScore: 100,
        rating: 'ممتاز',
        averageDeliveryHours: '0.0'
      };
    }
    return performance;
  }, [performance]);

  const ratingColor = useMemo(() => {
    switch (perf.rating) {
      case 'ممتاز':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          gauge: 'text-emerald-500',
          gradient: 'from-emerald-500 to-teal-600',
          glow: 'shadow-emerald-500/20'
        };
      case 'جيد جداً':
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          gauge: 'text-blue-500',
          gradient: 'from-blue-500 to-indigo-600',
          glow: 'shadow-blue-500/20'
        };
      case 'جيد':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          gauge: 'text-amber-500',
          gradient: 'from-amber-500 to-yellow-600',
          glow: 'shadow-amber-500/20'
        };
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          gauge: 'text-rose-500',
          gradient: 'from-rose-500 to-red-600',
          glow: 'shadow-rose-500/20'
        };
    }
  }, [perf.rating]);

  return (
    <div className="bg-white dark:bg-[#0e0e14] rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              مؤشر الالتزام والأداء (Performance Score)
            </h3>
            <p className="text-[11px] font-bold text-slate-400">
              {memberName ? `${memberName} - ${position || 'عضو الفريق'}` : 'تقييم المهام والالتزام بالمواعيد'}
            </p>
          </div>
        </div>

        {/* Rating Badge */}
        <div className={`px-3 py-1 rounded-xl text-xs font-black border ${ratingColor.bg}`}>
          {perf.rating}
        </div>
      </div>

      {/* Main Score Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6 bg-slate-50 dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={ratingColor.gauge}
                strokeDasharray={`${perf.commitmentScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {perf.commitmentScore}%
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2">
            مؤشر الالتزام
          </span>
        </div>

        {/* Progress Bars */}
        <div className="md:col-span-2 space-y-3">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">نسبة إنجاز المهام المسندة</span>
              <span className="text-slate-200 font-black">{perf.completionRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${perf.completionRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-400">الالتزام بمواعيد التسليم (On-Time)</span>
              <span className="text-emerald-400 font-black">{perf.onTimeRate}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${perf.onTimeRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">إجمالي المهام</span>
          <span className="text-lg font-black text-slate-800 dark:text-white">{perf.totalTasks}</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">تم تسليمها</span>
          <span className="text-lg font-black text-emerald-400">{perf.completedTasks}</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">متأخرة عن الموعد</span>
          <span className={`text-lg font-black ${perf.overdueTasks > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {perf.overdueTasks}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 block mb-0.5">متوسط سرعة الإنجاز</span>
          <span className="text-lg font-black text-brand-400">{perf.averageDeliveryHours}h</span>
        </div>
      </div>
    </div>
  );
}
