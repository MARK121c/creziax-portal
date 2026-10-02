import { useState, useEffect, useCallback } from 'react';
import { getPublishSchedulesAPI, createPublishScheduleAPI, deletePublishScheduleAPI, updatePublishScheduleAPI } from '../store/api';
import { Calendar, Plus, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, X, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { id: 'sun', name: 'الأحد', nameEn: 'Sunday', dayIndex: 0 },
  { id: 'mon', name: 'الإثنين', nameEn: 'Monday', dayIndex: 1 },
  { id: 'tue', name: 'الثلاثاء', nameEn: 'Tuesday', dayIndex: 2 },
  { id: 'wed', name: 'الأربعاء', nameEn: 'Wednesday', dayIndex: 3 },
  { id: 'thu', name: 'الخميس', nameEn: 'Thursday', dayIndex: 4 },
  { id: 'fri', name: 'الجمعة', nameEn: 'Friday', dayIndex: 5 },
  { id: 'sat', name: 'السبت', nameEn: 'Saturday', dayIndex: 6 },
];

const PublishingScheduleSection = ({ projectId, isAdmin = false, isRTL = true }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDay, setSelectedDay] = useState('wed');
  const [publishTime, setPublishTime] = useState('18:00');
  const [customTitle, setCustomTitle] = useState('');

  const fetchSchedules = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await getPublishSchedulesAPI(projectId);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setSchedules(list);
    } catch (err) {
      console.error('Failed to load publishing schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dayObj = DAYS_OF_WEEK.find(d => d.id === selectedDay) || DAYS_OF_WEEK[3];
    const title = customTitle.trim() || `فيديو يوم ${dayObj.name}`;

    // Calculate next date for that weekday and time
    const now = new Date();
    const resultDate = new Date();
    const currentDay = now.getDay();
    const targetDay = dayObj.dayIndex;
    let daysUntil = (targetDay - currentDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    resultDate.setDate(now.getDate() + daysUntil);

    const [hours, minutes] = publishTime.split(':');
    resultDate.setHours(parseInt(hours || '18', 10), parseInt(minutes || '0', 10), 0, 0);

    const timeFormatted = new Date(`2000-01-01T${publishTime}:00`).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    setSubmitting(true);
    try {
      await createPublishScheduleAPI({
        projectId,
        title,
        publishTime: resultDate.toISOString(),
        frequency: 'weekly',
        notes: `الساعة ${timeFormatted}`
      });
      toast.success('تمت إضافة موعد النشر الأسبوعي بنجاح ✓');
      setShowModal(false);
      setCustomTitle('');
      fetchSchedules();
    } catch (err) {
      toast.error('فشل حفظ موعد النشر');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`هل تريد إزالة موعد "${title}" من جدول النشر؟`)) return;
    try {
      await deletePublishScheduleAPI(id);
      toast.success('تم الحذف بنجاح');
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0c]/80 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title / Header */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              جدول مواعيد النشر الثابتة
            </h3>
            <p className="text-[10px] font-bold text-slate-400">
              مواعيد النشر الأسبوعية المعتمدة لكل حلقة/فيديو
            </p>
          </div>
        </div>

        {/* Schedule Pills & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold py-1 px-3">
              <Loader2 size={14} className="animate-spin text-emerald-500" />
              <span>جاري التحميل...</span>
            </div>
          ) : schedules.length === 0 ? (
            <span className="text-xs font-bold text-slate-400 italic py-1 px-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
              لم يتم تحديد جدول نشر ثابت بعد
            </span>
          ) : (
            schedules.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                <span>{item.title}</span>
                {item.notes && (
                  <span className="text-[10px] opacity-80 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-lg">
                    {item.notes}
                  </span>
                )}
                <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-black">
                  مكرر أسبوعياً
                </span>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors ml-0.5"
                    title="حذف هذا الموعد"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))
          )}

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={15} />
              <span>إضافة موعد نشر أسبوعي</span>
            </button>
          )}
        </div>
      </div>

      {/* Simple Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar size={20} className="text-emerald-500" />
                إضافة موعد نشر أسبوعي ثابت
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Day of Week Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  اختر يوم النشر الأسبوعي
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map(d => {
                    const isSel = selectedDay === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDay(d.id)}
                        className={`py-2.5 px-1 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center ${
                          isSel
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{d.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  وقت وتوقيت النشر
                </label>
                <input
                  type="time"
                  value={publishTime}
                  onChange={e => setPublishTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Custom Title (Optional) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ملاحظة / اسم الفيديو (اختياري)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  placeholder="مثال: حلقة البودكاست الأسبوعية"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                ✓ سيظهر هذا الموعد كجدول ثابت مكرر أسبوعياً في أعلى مساحة العمل للعميل والتيم.
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'حفظ موعد النشر'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishingScheduleSection;
