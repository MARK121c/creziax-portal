import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  getProjectsAPI, 
  createProjectAPI, 
  updateProjectAPI, 
  deleteProjectAPI, 
  getClientsAPI, 
  getUsersAPI,
  uploadImageAPI 
} from '../../store/api';
import { 
  Plus, X, Trash2, Layout, Search, Briefcase, Calendar, Loader2, 
  CheckCircle2, Clock, PlayCircle, FileText, ExternalLink, Filter, 
  ChevronRight, Activity, Users, Image as ImageIcon, Link as LinkIcon 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const statusConfig = {
  CHANNEL_SETUP: { label: 'Setup', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Layout },
  EDITING: { label: 'Editing', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: PlayCircle },
  THUMBNAIL: { label: 'Design', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: Layout },
  SCRIPT: { label: 'Script', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', icon: Layout },
  PUBLISHING: { label: 'Publish', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: Clock },
  COMPLETED: { label: 'Done', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
};

const getStatusStyle = (status) => {
  return statusConfig[status] || { 
    label: status?.replace('_', ' ') || 'PROJECT', 
    color: 'text-slate-500', 
    bg: 'bg-slate-50', 
    border: 'border-slate-200', 
    icon: Activity 
  };
};

const getFormattedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const ProjectsPage = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    clientId: '', 
    status: 'CHANNEL_SETUP',
    clientChannelLink: '', 
    notionUrl: '',
    logoUrl: '',
    teamMemberIds: []
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes, uRes] = await Promise.all([
        getProjectsAPI(), 
        getClientsAPI(),
        getUsersAPI()
      ]);
      setProjects(pRes.data);
      setClients(cRes.data);
      setTeamMembers((uRes.data.data || uRes.data || []).filter(u => u.role === 'TEAM'));
    } catch (err) {
      toast.error(t('loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.clientId || !form.clientChannelLink) {
      setError(t('please_fill_all_fields'));
      return;
    }
    setSubmitting(true);
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await createProjectAPI(form); 
      toast.success(t('launch_workspace'), { id: loadingToast });
      addNotification(`${t('launch_workspace')}: ${form.name}`, 'success');
      setShowModal(false); 
      setForm({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP', clientChannelLink: '', notionUrl: '', logoUrl: '', teamMemberIds: [] }); 
      fetchData(); 
    } catch (err) {
      const msg = err.response?.data?.message || t('loading');
      setError(msg);
      toast.error(msg, { id: loadingToast });
      addNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    const loadingToast = toast.loading(t('syncing'));
    try {
      const res = await uploadImageAPI(formData);
      setForm(prev => ({ ...prev, logoUrl: res.data.url }));
      toast.success(t('saved_successfully'), { id: loadingToast });
    } catch (err) {
      toast.error(t('error_general'), { id: loadingToast });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`${t('delete_project_confirm')} ${name}?`)) return;
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteProjectAPI(id); 
      toast.success(t('client_removed'), { id: loadingToast });
      addNotification(`${t('client_removed')}: ${name}`, 'success');
      fetchData(); 
    } catch (err) {
      toast.error(t('failed_remove_client'), { id: loadingToast });
      addNotification(t('failed_remove_client'), 'error');
    }
  };

  const toggleTeamMember = (tmId) => {
    setForm(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(tmId)
        ? prev.teamMemberIds.filter(id => id !== tmId)
        : [...prev.teamMemberIds, tmId]
    }));
  };

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (p.name?.toLowerCase() || '').includes(q) ||
      (p.client?.user?.firstName?.toLowerCase() || '').includes(q) ||
      (p.client?.user?.lastName?.toLowerCase() || '').includes(q);
    
    const matchesFilter = activeFilter === 'ALL' || p.status === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 md:space-y-10 pb-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg">
               <Briefcase size={22} />
             </div>
             <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border border-emerald-500/20">
               V3.2 BUSINESS FOUNDATION
             </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">
             إدارة المشاريع
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest leading-relaxed">نظام التشغيل الهندسي للقنوات والمشاريع</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="ابحث عن مشروع أو عميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95 transition-all duration-300"
          >
            <Plus size={20} />
            <span>مشروع جديد</span>
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-slate-100 dark:bg-white/5 my-4"></div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48">
          <Loader2 size={64} className="animate-spin text-brand-500 mb-8 opacity-20" />
          <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">{t('syncing_workspaces')}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] py-32 text-center shadow-sm relative overflow-hidden group">
           <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/10 shadow-inner">
             <Briefcase size={40} className="text-slate-200 dark:text-slate-800" />
           </div>
           <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">لا توجد مشاريع حالياً</h3>
           <p className="text-slate-400 font-bold max-w-sm mx-auto uppercase text-[10px] tracking-widest leading-relaxed">ابدأ بإضافة أول قناة أو مشروع للعملاء للبدء في التشغيل</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map(p => {
            const statusConfig = getStatusStyle(p.status);
            return (
              <div key={p.id} className="group relative bg-white dark:bg-[#0a0a0c]/60 border border-slate-100 dark:border-white/5 rounded-[2rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-brand-500/30">
                <div className="absolute top-6 left-6 flex gap-2">
                  <button 
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-3 bg-white dark:bg-white/5 text-slate-400 hover:text-rose-500 rounded-xl transition-all border border-slate-100 dark:border-white/10 shadow-sm active:scale-90"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-slate-100 dark:border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110 bg-slate-50 dark:bg-white/5">
                      {p.logoUrl ? (
                        <img src={getFormattedUrl(p.logoUrl)} alt="" className="w-full h-full object-cover" />
                      ) : p.client?.logoUrl ? (
                        <img src={getFormattedUrl(p.client.logoUrl)} alt="" className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-200 dark:text-slate-800 uppercase">
                          {p.name?.[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight line-clamp-1">{p.name}</h3>

                  <div className="w-full p-4 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-2xl mb-8 flex items-center justify-between">
                    <div className="flex -space-x-3">
                      {(p.teamMembers || []).slice(0, 4).map((member, i) => (
                        <div key={i} className="w-9 h-9 rounded-xl border-4 border-white dark:border-[#0f0f12] bg-slate-200 overflow-hidden shadow-md">
                          {member.user?.avatarUrl ? (
                            <img src={getFormattedUrl(member.user.avatarUrl)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-400 italic">
                              {member.user?.firstName?.[0]}
                            </div>
                          )}
                        </div>
                      ))}
                      {(p.teamMembers || []).length > 4 && (
                        <div className="w-9 h-9 rounded-xl border-4 border-white dark:border-[#0f0f12] bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                          +{p.teamMembers.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Layout size={14} className="text-brand-500" />
                       {p.tasks?.length || 0} مهام
                    </div>
                  </div>

                  <Link 
                    to={`/admin/projects/${p.id}`}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-xl shadow-brand-600/20 active:scale-95"
                  >
                    <ExternalLink size={16} />
                    دخول مركز القيادة
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 max-h-[90vh] flex flex-col">
            
            <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-4">
                 <div className="w-2 h-8 bg-brand-500 rounded-full"></div>
                 <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">إنشاء مشروع جديد</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-10 space-y-10 overflow-y-auto">
              {error && <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-100 dark:border-rose-500/20">{error}</div>}

              <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">شعار المشروع</label>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-32 h-32 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group overflow-hidden"
                  >
                    {form.logoUrl ? (
                      <img src={getFormattedUrl(form.logoUrl)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <>
                        <ImageIcon size={28} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                        <span className="text-[8px] font-black text-slate-400 uppercase mt-2 tracking-widest">رفع صورة</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                </div>

                <div className="space-y-8 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed italic opacity-70">اسم المشروع / القناة (إلزامي)</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="مثال: قناة كرزياكس للألعاب" className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all placeholder:opacity-30" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed italic opacity-70">العميل المسؤول (إلزامي)</label>
                    <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer">
                      <option value="">اختر العميل...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName} {c.company ? `(${c.company})` : ''}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed italic opacity-70">حالة المشروع</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer">
                      {Object.keys(statusConfig).map(status => <option key={status} value={status}>{statusConfig[status].label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed italic opacity-70">رابط القناة / التواصل (إلزامي)</label>
                  <div className="relative">
                    <LinkIcon size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="url" value={form.clientChannelLink} onChange={e => setForm({...form, clientChannelLink: e.target.value})} placeholder="https://..." required className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed italic opacity-70">رابط النوشن (Notion)</label>
                  <div className="relative">
                    <FileText size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input type="url" value={form.notionUrl} onChange={e => setForm({...form, notionUrl: e.target.value})} placeholder="https://notion.so/..." className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed italic opacity-70">الفريق المسؤول عن التشغيل</label>
                <div className="grid grid-cols-2 gap-4">
                  {teamMembers.map(member => {
                    const isSelected = member.teamMemberInfo?.id && form.teamMemberIds.includes(member.teamMemberInfo.id);
                    return (
                      <div 
                        key={member.id} 
                        onClick={() => toggleTeamMember(member.teamMemberInfo?.id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group ${
                          isSelected
                          ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10' 
                          : 'border-slate-100 dark:border-white/10 hover:border-brand-500/30 bg-slate-50/50 dark:bg-white/5'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 p-1.5 bg-brand-500 text-white rounded-bl-xl">
                            <CheckCircle2 size={12} strokeWidth={3} />
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-white/10 flex-shrink-0">
                          {member.avatarUrl ? (
                            <img src={getFormattedUrl(member.avatarUrl)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-black text-slate-300 italic uppercase">
                              {member.firstName?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-black truncate ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{member.teamMemberInfo?.position || 'Video Production'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={submitting} className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-2xl shadow-brand-600/30 transition-all active:scale-95 text-xs uppercase tracking-[0.2em]">
                  {submitting ? <Loader2 size={24} className="animate-spin mx-auto" /> : 'تـدشـيـن الـمـشـروع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
