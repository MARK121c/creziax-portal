import { useEffect, useState, useCallback, useMemo } from 'react';
import { getTasksAPI, updateTaskAPI } from '../../store/api';
import { useTranslation } from 'react-i18next';
import {
  ListTodo, Loader2, CheckCircle2, Clock, PlayCircle, Clock4,
  CheckCircle, ArrowLeft, RefreshCw, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeamTasksPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const tRes = await getTasksAPI();
      const allTeamTasks = tRes.data?.data || tRes.data || [];
      // Filter out tasks that definitely belong to production/phases
      setTasks(allTeamTasks.filter(task => !task.phaseId));
    } catch (err) {
      toast.error(isRTL ? 'فشل جلب المهام' : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (taskId, newStatus) => {
    const previousTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateTaskAPI(taskId, { status: newStatus });
      toast.success(isRTL ? 'تم تحديث المهمة بنجاح وإشعار الإدارة' : 'Task updated and Admin notified', {
        icon: '🚀'
      });
    } catch (err) {
      console.error('Task status update failed:', err);
      toast.error(isRTL ? 'فشل التحديث، جاري التراجع...' : 'Update failed, reverting...');
      setTasks(previousTasks);
    }
  };

  const isOverdue = (task) => {
    if (task.status === 'DELIVERED') return false;
    if (!task.deadline) return false;
    try {
      const d = new Date(task.deadline);
      return new Date() > d;
    } catch (e) { return false; }
  };

  // ── Data Segmentation ──────────────────────────────────────────
  const { activeTasks, historyTasks } = useMemo(() => {
    return {
      activeTasks: tasks.filter(t => t.status !== 'DELIVERED' && t.status !== 'COMPLETED'),
      historyTasks: tasks.filter(t => t.status === 'DELIVERED' || t.status === 'COMPLETED')
        .sort((a,b) => new Date(b.updatedAt || b.deadline) - new Date(a.updatedAt || a.deadline))
    };
  }, [tasks]);

  const columns = useMemo(() => {
    const cols = {
      TODO: { title: isRTL ? 'المهام قيد التنفيذ' : 'In Progress', icon: PlayCircle, color: 'text-cyan-500', bg: 'bg-cyan-500', items: [] },
      REVIEW: { title: isRTL ? 'تحت المراجعة' : 'In Review', icon: Clock4, color: 'text-amber-500', bg: 'bg-amber-500', items: [] },
    };

    activeTasks.forEach(task => {
      if (task.status === 'REVIEW') {
        cols.REVIEW.items.push(task);
      } else {
        cols.TODO.items.push(task);
      }
    });

    const sorter = (a, b) => new Date(a.deadline) - new Date(b.deadline);
    Object.keys(cols).forEach(k => cols[k].items.sort(sorter));

    return cols;
  }, [activeTasks, isRTL]);

  const efficiencyScore = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((historyTasks.length / tasks.length) * 100);
  }, [tasks, historyTasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0c]">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors duration-500" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-12 space-y-12">
        
        {/* 🚀 Header & Efficiency Stats */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-4">
              <ListTodo size={40} className="text-cyan-500" />
              {isRTL ? 'مركز العمليات' : 'Operations Hub'}
            </h1>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-2 opacity-60">
              {isRTL ? 'تتبع الإنجازات والمهام الحرجة' : 'Task lifecycle & clearance tracking'}
            </p>
          </div>
          
          <div className="flex items-center gap-8 bg-white dark:bg-[#111111] p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'معدل الإنجاز' : 'Clearance Rate'}</p>
                <p className="text-2xl font-black text-cyan-500">{efficiencyScore}%</p>
             </div>
             <div className="w-px h-10 bg-slate-100 dark:bg-white/5" />
             <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'مهمات نشطة' : 'Active Missions'}</p>
                <p className="text-2xl font-black text-amber-500">{activeTasks.length}</p>
             </div>
             <div className="w-px h-10 bg-slate-100 dark:bg-white/5" />
             <div className="text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRTL ? 'تم تصفيتها' : 'Cleared'}</p>
                <p className="text-2xl font-black text-emerald-500">{historyTasks.length}</p>
             </div>
             <button onClick={fetchData} className="p-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-cyan-500 rounded-2xl transition-all">
                <RefreshCw size={20} />
             </button>
          </div>
        </div>

        {/* ── Level 1: Active Missions Grid ───────────────────────────── */}
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <span className="w-1.5 h-4 bg-cyan-500 rounded-full" />
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{isRTL ? 'المهمات الجارية' : 'Current Missions'}</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.entries(columns).map(([colKey, col]) => (
                <div key={colKey} className="space-y-4">
                  <div className={`p-4 bg-white dark:bg-[#111111] border-x border-b border-t-[3px] border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between`} style={{ borderTopColor: colKey === 'TODO' ? '#06b6d4' : '#f59e0b' }}>
                    <div className="flex items-center gap-3">
                      <col.icon size={18} className={col.color} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{col.title}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{col.items.length}</span>
                  </div>

                  <div className="space-y-4 min-h-[100px]">
                    {col.items.length === 0 ? (
                      <div className="h-24 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-center opacity-40">
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isRTL ? 'لا توجد مهمات' : 'No Missions'}</p>
                      </div>
                    ) : (
                      col.items.map(task => {
                        const overdue = colKey === 'TODO' && isOverdue(task);
                        return (
                          <div key={task.id} className="p-6 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden flex flex-col gap-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3">
                                <span className="px-3 py-1 bg-cyan-500/5 text-cyan-600 rounded-lg text-[9px] font-black border border-cyan-500/10 uppercase tracking-widest">
                                  {task.project?.name || 'General Operation'}
                                </span>
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">{task.title}</h3>
                              </div>
                              {overdue && <AlertCircle className="text-rose-500 animate-pulse" size={20} />}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                   <Clock size={12} />
                                   {task.deadline ? new Date(task.deadline).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'short' }) : '--'}
                                </div>
                                
                                {colKey === 'TODO' ? (
                                  <button onClick={() => handleStatusChange(task.id, 'REVIEW')} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95">
                                     {isRTL ? 'إرسال للمراجعة' : 'Submit Review'}
                                  </button>
                                ) : (
                                  <div className="flex gap-2">
                                     <button onClick={() => handleStatusChange(task.id, 'EDITING')} className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-xl text-[9px] font-black hover:bg-slate-200 transition-all">
                                        <ArrowLeft size={14} />
                                     </button>
                                     <button onClick={() => handleStatusChange(task.id, 'DELIVERED')} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
                                        {isRTL ? 'تأكيد الإنجاز' : 'Mission Clear'}
                                     </button>
                                  </div>
                                )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* ── Level 2: Operational History List ───────────────────────────── */}
        <div className="space-y-6 pt-12 border-t border-slate-200 dark:border-white/5">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                 <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">{isRTL ? 'سجل العمليات المنتهية' : 'Operational History'}</h2>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">{historyTasks.length} {isRTL ? 'مهمة' : 'Missions'}</span>
           </div>

           <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/5 rounded-[2.5rem] shadow-sm overflow-hidden">
              {historyTasks.length === 0 ? (
                <div className="py-20 text-center opacity-30 italic text-sm">{isRTL ? 'لا يوجد سجل عمليات مسجل حالياً' : 'No history clears found yet'}</div>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                   {historyTasks.map(task => (
                      <div key={task.id} className="p-8 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                               <CheckCircle size={24} />
                            </div>
                            <div>
                               <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{task.title}</h4>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                  {task.project?.name || 'Administrative'} • {isRTL ? 'تم الإغلاق' : 'Closed Operative'}
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{isRTL ? 'تاريخ الإنجاز' : 'Cleared on'}</p>
                             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {new Date(task.updatedAt || task.deadline).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                             </p>
                         </div>
                      </div>
                   ))}
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default TeamTasksPage;
