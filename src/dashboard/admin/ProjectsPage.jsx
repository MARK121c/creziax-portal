import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getProjectsAPI, createProjectAPI, updateProjectAPI, deleteProjectAPI, getClientsAPI, downloadContractPDFAPI } from '../../store/api';
import { Plus, X, Trash2, Layout, Search, Briefcase, Calendar, Loader2, CheckCircle2, Clock, PlayCircle, FileText, ExternalLink, Filter, ChevronRight, Activity } from 'lucide-react';
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

const getFormattedLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const ProjectsPage = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [error, setError] = useState(null);
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    clientId: '', 
    status: 'CHANNEL_SETUP',
    communicationUrl: '', 
    logoUrl: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([getProjectsAPI(), getClientsAPI()]);
      setProjects(pRes.data);
      setClients(cRes.data);
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
    if (!form.name || !form.clientId) {
      setError(t('please_fill_all_fields'));
      return;
    }
    setSubmitting(true);
    const loadingToast = toast.loading(t('syncing'));
    try { 
      // Map communicationUrl to notionUrl for backend storage
      await createProjectAPI({
        ...form,
        notionUrl: form.communicationUrl 
      }); 
      toast.success(t('launch_workspace'), { id: loadingToast });
      addNotification(`${t('launch_workspace')}: ${form.name}`, 'success');
      setShowModal(false); 
      setForm({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP', communicationUrl: '', logoUrl: '' }); 
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

  const handleStatusUpdate = async (id, status) => {
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await updateProjectAPI(id, { status }); 
      toast.success(t('status'), { id: loadingToast });
      addNotification(`${t('status')}: ${status}`, 'success');
      fetchData(); 
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
      addNotification(t('loading'), 'error');
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

  const handleDownloadContract = async (id, name) => {
    const loadingToast = toast.loading(t('syncing'));
    try {
      const response = await downloadContractPDFAPI(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contract-${name.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success(t('status'), { id: loadingToast });
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
    }
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
      {/* Supreme Header with Versioning */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg">
               <Briefcase size={22} />
             </div>
             <div className="px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border border-brand-500/20">
               V2.5 STABLE
             </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">
             {t('projects_management')}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold mt-2 text-sm uppercase tracking-widest">{t('projects_management_desc')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_projects')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.25rem] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center justify-center gap-2 px-7 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.25rem] font-bold shadow-xl shadow-brand-600/20 hover:-translate-y-1 active:scale-95 transition-all duration-300"
          >
            <Plus size={20} />
            <span>{t('new_project')}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 custom-scrollbar scroll-smooth">
        <button 
          onClick={() => setActiveFilter('ALL')}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
            activeFilter === 'ALL' 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg' 
            : 'bg-white dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-500/30'
          }`}
        >
          {t('all_projects')}
        </button>
        {Object.keys(statusConfig).map(status => {
          const config = getStatusStyle(status);
          return (
            <button 
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                activeFilter === status 
                ? `${config.bg} ${config.color} ${config.border} shadow-md` 
                : 'bg-white dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-500/30'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeFilter === status ? 'bg-current animate-pulse' : 'bg-slate-300'}`}></div>
              {status.replace('_', ' ')}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48">
          <Loader2 size={48} className="animate-spin text-brand-500 mb-8" />
          <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">{t('syncing_workspaces')}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/10 rounded-[2.5rem] py-32 text-center shadow-sm relative overflow-hidden group">
           <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/10 shadow-inner">
             <Briefcase size={40} className="text-slate-300 dark:text-slate-700" />
           </div>
           <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">{t('no_projects')}</h3>
           <p className="text-slate-400 font-bold max-w-sm mx-auto uppercase text-[10px] tracking-widest leading-relaxed">{t('projects_empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map(p => {
            const statusConfig = getStatusStyle(p.status);
            return (
              <div key={p.id} className="group relative bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-brand-500/30">
                {/* Actions Layer */}
                <div className="absolute top-6 left-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleDownloadContract(p.id, p.name)}
                    className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-500 rounded-xl transition-all"
                  >
                    <FileText size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Profile-like Info */}
                <div className="flex flex-col items-center text-center pt-2">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-slate-100 dark:border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                      {p.logoUrl ? (
                        <img src={getFormattedLogoUrl(p.logoUrl)} alt="" className="w-full h-full object-cover" />
                      ) : p.client?.logoUrl ? (
                        <img src={getFormattedLogoUrl(p.client.logoUrl)} alt="" className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <div className="w-full h-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-3xl font-black text-slate-300">
                          {p.name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#0a0a0c]">
                      <Activity size={16} />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight line-clamp-1">{p.name}</h3>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border mb-5 transition-all ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                    {statusConfig.label}
                  </div>

                  <div className="w-full p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2rem] mb-6 flex items-center justify-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center text-[10px] font-bold text-brand-500">
                      {p.client?.user?.firstName?.[0]}
                    </div>
                    <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {p.client?.user?.firstName} {p.client?.user?.lastName}
                    </p>
                  </div>

                  <Link 
                    to={`/admin/projects/${p.id}`}
                    className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-brand-600/20 active:scale-95 group-hover:-translate-y-1"
                  >
                    <ExternalLink size={18} />
                    {t('open_project')}
                  </Link>

                  <div className="mt-4 flex items-center justify-between w-full px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                    <span>#{String(p.id).split('-')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Sectioned Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 max-h-[90vh] overflow-y-auto">
            
            <div className="px-8 py-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('new_project')}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-8">
              {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold border border-rose-100">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('label_project_name')}</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('label_client')}</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all appearance-none cursor-pointer">
                    <option value="">{t('select_client')}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('open_client_channel')} (URL)</label>
                <input value={form.communicationUrl} onChange={e => setForm({...form, communicationUrl: e.target.value})} placeholder="WhatsApp/Discord Link" className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Image (URL)</label>
                <input value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} placeholder="Optional: Override client logo" className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest">
                  {submitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : t('launch_workspace')}
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
