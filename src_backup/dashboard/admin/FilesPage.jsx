import { useEffect, useState, useCallback } from 'react';
import { 
  getProjectsAPI, 
  updateProjectAPI,
  deleteProjectAPI 
} from '../../store/api';
import { 
  Briefcase, 
  ExternalLink, 
  Search, 
  Layout, 
  FileText, 
  Edit3, 
  Trash2,
  X, 
  Loader2, 
  Link as LinkIcon,
  Palette,
  Type
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const FilesPage = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);

  const [editForm, setEditForm] = useState({
    driveUrl: '',
    brandColors: '',
    brandFonts: '',
    description: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProjectsAPI();
      setProjects(res.data);
    } catch (err) {
      toast.error(t('loading_error') || 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickEdit = (project) => {
    setEditingProject(project);
    setEditForm({
      driveUrl: project.driveUrl || '',
      brandColors: project.brandColors || '',
      brandFonts: project.brandFonts || '',
      description: project.description || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    
    setSubmitting(true);
    const loadingToast = toast.loading(t('saving') || 'جاري الحفظ...');
    
    try {
      await updateProjectAPI(editingProject.id, editForm);
      toast.success(t('update_success') || 'تم التحديث بنجاح', { id: loadingToast });
      addNotification(`${t('project_updated') || 'تم تحديث المشروع'}: ${editingProject.name}`, 'success');
      setEditingProject(null);
      fetchData();
    } catch (err) {
      toast.error(t('update_error') || 'خطأ في التحديث', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`${t('confirm_delete_project', 'هل أنت متأكد من حذف هذا المشروع؟')} (${name})`)) return;
    
    const loadingToast = toast.loading(t('deleting') || 'جاري الحذف...');
    try {
      await deleteProjectAPI(id);
      toast.success(t('delete_success') || 'تم الحذف بنجاح', { id: loadingToast });
      addNotification(`${t('project_deleted') || 'تم حذف المشروع'}: ${name}`, 'error');
      fetchData();
    } catch (err) {
      toast.error(t('delete_error') || 'خطأ في الحذف', { id: loadingToast });
    }
  };

  const filteredProjects = (projects || []).filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.client?.company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFormattedUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-4">
            <span className="w-2 h-10 bg-brand-500 rounded-full"></span>
            {t('file_management_title', 'دليل الملفات الذكي')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 opacity-60">{t('file_management_desc', 'Zero-Upload Assets Hub - إصدار 3.5')}</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder={t('search_project_client', "بحث عن مشروع أو عميل...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-16 pr-8 py-5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[2rem] text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all w-full sm:w-96 shadow-xl"
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 rounded-[3rem] shadow-2xl overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-48">
            <Loader2 size={48} className="animate-spin text-brand-500 mb-6" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">{t('syncing', 'جاري الوصول للملفات...')}</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 text-center px-10">
            <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 dark:border-white/10">
              <Search size={40} className="text-slate-200 dark:text-slate-800" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-3">{t('no_results', 'لا يوجد نتائج')}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">{t('check_project_name_hint', 'تأكد من اسم المشروع أو العميل وحاول مرة أخرى')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-right" dir="rtl">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('project_col', 'المشروع')}</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">{t('google_drive_link_label', 'رابط الدرايف الشامل')}</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">Brand Kit</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">{t('notes', 'ملاحظات')}</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none text-center">{t('actions', 'الإجراءات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {filteredProjects.map(p => (
                  <tr key={p.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 overflow-hidden shadow-lg flex-shrink-0">
                          {p.logoUrl ? (
                            <img src={getFormattedUrl(p.logoUrl)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-200 dark:text-slate-800 uppercase italic">
                              {(p.name || '?')[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-brand-500 transition-colors">{p.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">{p.client?.company || t('general_client')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      {p.driveUrl ? (
                        <a 
                          href={p.driveUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 active:scale-95 group/btn"
                        >
                          <Briefcase size={16} />
                          {t('open_master_drive', 'Open Master Drive')}
                        </a>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">{t('link_not_available', 'رابط غير متوفر')}</span>
                      )}
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col items-center gap-3">
                        {/* Colors */}
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 shadow-inner">
                          {p.brandColors ? p.brandColors.split(',').slice(0, 4).map((color, i) => (
                            <div key={i} className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color.trim() }}></div>
                          )) : <Palette size={14} className="text-slate-300" />}
                        </div>
                        {/* Font */}
                        <div className="flex items-center gap-2">
                           <Type size={12} className="text-brand-500" />
                           <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest max-w-[120px] truncate">{p.brandFonts || 'Standard Fonts'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right max-w-xs">
                       <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-2">
                         {p.description || t('no_notes_found', "لا يوجد ملاحظات إدارية مثبتة لهذا المشروع.")}
                       </p>
                    </td>
                    <td className="px-10 py-8 text-center">
                       <div className="flex items-center justify-center gap-2">
                         <button 
                           onClick={() => handleQuickEdit(p)}
                           className="p-3.5 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl transition-all active:scale-90"
                           title={t('edit', 'تعديل')}
                         >
                           <Edit3 size={18} />
                         </button>
                         <button 
                           onClick={() => handleDeleteProject(p.id, p.name)}
                           className="p-3.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 bg-slate-100 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl transition-all active:scale-90"
                           title={t('delete', 'حذف')}
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Edit Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-10">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditingProject(null)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-2 h-8 bg-brand-500 rounded-full"></div>
                 <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">تعديل الروابط السريع</h2>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate} className="p-10 space-y-8 text-right" dir="rtl">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic opacity-70">رابط الدرايف الشامل (Drive Link)</label>
                <div className="relative">
                  <LinkIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="url" 
                    value={editForm.driveUrl} 
                    onChange={e => setEditForm({...editForm, driveUrl: e.target.value})} 
                    placeholder="https://drive.google.com/..." 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic opacity-70">ألوان البراند (Hex Codes)</label>
                <div className="relative">
                  <Palette size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    value={editForm.brandColors} 
                    onChange={e => setEditForm({...editForm, brandColors: e.target.value})} 
                    placeholder="#FF0000, #00FF00" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic opacity-70">خطوط البراند (Brand Fonts)</label>
                <div className="relative">
                  <FileText size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    value={editForm.brandFonts} 
                    onChange={e => setEditForm({...editForm, brandFonts: e.target.value})} 
                    placeholder="Inter, Montserrat" 
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic opacity-70">ملاحظات إدارية (Internal Notes)</label>
                <textarea 
                  rows="3"
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  placeholder="أضف ملاحظات إدارية للمشروع هنا..." 
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-brand-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Edit3 size={20} />}
                {t('update_data_now', 'تحديث البيانات الآن')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesPage;
