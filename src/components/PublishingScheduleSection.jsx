import { useState, useEffect, useCallback } from 'react';
import { getPublishSchedulesAPI, createPublishScheduleAPI, deletePublishScheduleAPI, updatePublishScheduleAPI } from '../store/api';
import { Calendar, Plus, Trash2, Clock, CheckCircle2, AlertCircle, Loader2, X, Film, Sparkles, SendHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const PublishingScheduleSection = ({ projectId, isAdmin = false, isRTL = true }) => {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState({
    title: '',
    publishTime: '',
    frequency: 'weekly',
    notes: ''
  });

  const fetchSchedules = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await getPublishSchedulesAPI(projectId);
      const list = Array.isArray(data) ? data : (data?.data || []);
      // Sort chronologically ascending
      setSchedules(list.sort((a, b) => new Date(a.publishTime) - new Date(b.publishTime)));
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
    if (!form.title.trim() || !form.publishTime) {
      toast.error('يرجى ملء عنوان الفيديو وتاريخ النشر');
      return;
    }
    setSubmitting(true);
    try {
      if (editingItem) {
        await updatePublishScheduleAPI(editingItem.id, form);
        toast.success('تم تحديث موعد النشر بنجاح');
      } else {
        await createPublishScheduleAPI({ ...form, projectId });
        toast.success('تمت إضافة موعد النشر بنجاح');
      }
      setShowModal(false);
      setEditingItem(null);
      setForm({ title: '', publishTime: '', frequency: 'weekly', notes: '' });
      fetchSchedules();
    } catch (err) {
      toast.error('فشل حفظ موعد النشر');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`هل أنت متأكد من حذف موعد نشر "${title}"؟`)) return;
    try {
      await deletePublishScheduleAPI(id);
      toast.success('تم الحذف بنجاح');
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    const dateStr = item.publishTime ? new Date(item.publishTime).toISOString().slice(0, 16) : '';
    setForm({
      title: item.title || '',
      publishTime: dateStr,
      frequency: item.frequency || 'weekly',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const getStatus = (publishTime) => {
    const now = new Date();
    const target = new Date(publishTime);
    const diffMs = target - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return { label: 'تم النشر', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    }
    if (diffDays <= 2) {
      return { label: 'قريب جداً (خلال 48 ساعة)', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse' };
    }
    return { label: `مجدول (بعد ${diffDays} يوم)`, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0c]/80 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Calendar size={20} />
            </div>
            جدول مواعيد النشر الثابتة
          </h3>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            خطة مواعيد النشر المعتمدة مرتبة زمنياً
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingItem(null);
              setForm({ title: '', publishTime: '', frequency: 'weekly', notes: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus size={16} />
            إضافة موعد نشر
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري تحميل جدول النشر...</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl p-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Film size={28} />
          </div>
          <h4 className="text-base font-black text-slate-700 dark:text-slate-200">لا توجد مواعيد نشر مجدولة حالياً</h4>
          <p className="text-xs font-bold text-slate-400 mt-1 max-w-sm mx-auto">
            {isAdmin ? 'قم بإضافة أول موعد نشر للفيديو لتنظيم جدول الإطلاق للعميل.' : 'سيتم إدراج مواعيد نشر الفيديوهات هنا بناءً على الخطة المعتمدة مع الفريق.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingItem(null);
                setForm({ title: '', publishTime: '', frequency: 'weekly', notes: '' });
                setShowModal(true);
              }}
              className="mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
            >
              + إضافة موعد
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((item, idx) => {
            const status = getStatus(item.publishTime);
            const pubDate = new Date(item.publishTime);
            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                      {item.title}
                    </h4>
                    {item.frequency && (
                      <span className="inline-block text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-1">
                        تكرار: {item.frequency === 'weekly' ? 'أسبوعي' : item.frequency === 'biweekly' ? 'مرتين أسبوعياً' : item.frequency === 'monthly' ? 'شهري' : item.frequency}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                    <Clock size={16} className="text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ وتوقيت النشر</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                        {pubDate.toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 p-3 rounded-2xl leading-relaxed italic">
                      💬 {item.notes}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => openEdit(item)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar size={20} className="text-emerald-500" />
                {editingItem ? 'تعديل موعد النشر' : 'إضافة موعد نشر جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عنوان الفيديو / المحتوى</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="مثال: حلقة 15: أسرار المونتاج السريع"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخ ووقت النشر</label>
                  <input
                    type="datetime-local"
                    value={form.publishTime}
                    onChange={e => setForm({ ...form, publishTime: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التكرار (Frequency)</label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="weekly">أسبوعي (Weekly)</option>
                    <option value="biweekly">مرتين أسبوعياً (Bi-weekly)</option>
                    <option value="monthly">شهري (Monthly)</option>
                    <option value="once">مرة واحدة (One-time)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ملاحظات واستراتيجية النشر</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="مثال: يرجى النشر في ذروة المشاهدات الساعة 7 مساءً وتجهيز الكومنت المثبت"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : (editingItem ? 'حفظ التعديلات' : 'إضافة الموعد')}
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
