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
    notionUrl: '',
    driveUrl: '',
    brandUrl: '',
    annualContractDate: ''
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
    // ... rest of use existing code
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await createProjectAPI(form); 
      toast.success(t('launch_workspace'), { id: loadingToast });
      addNotification(`${t('launch_workspace')}: ${form.name}`, 'success');
      setShowModal(false); 
      setForm({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP' }); 
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
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase());
    
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

      {/* Radical Filtering Hub */}
      <div className="flex items-center gap-4 overflow-x-auto pb-6 custom-scrollbar scroll-smooth px-2">
        <button 
          onClick={() => setActiveFilter('ALL')}
          className={`px-10 py-4.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 whitespace-nowrap ${
            activeFilter === 'ALL' 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl translate-y-[-2px]' 
            : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/5 hover:border-brand-500/30'
          }`}
        >
          {t('all_projects')}
        </button>
        {Object.keys(statusConfig).map(status => (
          <button 
            key={status}
            onClick={() => setActiveFilter(status)}
            className={`flex items-center gap-4 px-8 py-4.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 whitespace-nowrap ${
              activeFilter === status 
              ? `${statusConfig[status].bg} ${statusConfig[status].color} ${statusConfig[status].border} shadow-xl translate-y-[-4px]` 
              : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/5 hover:border-brand-500/30'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeFilter === status ? 'bg-current animate-ping' : 'bg-slate-300'}`}></span>
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-48">
          <Loader2 size={48} className="animate-spin text-brand-500 mb-8" />
          <p className="font-black tracking-[0.2em] uppercase text-[10px] text-slate-400 animate-pulse">{t('syncing_workspaces')}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c]/60 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[4rem] py-40 text-center shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-2 border-slate-100 dark:border-white/5 shadow-inner transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
             <Briefcase size={56} className="text-slate-200 dark:text-slate-800" />
           </div>
           <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-4 uppercase tracking-tighter">{t('no_projects')}</h3>
           <p className="text-slate-400 font-bold max-w-sm mx-auto uppercase text-[11px] tracking-[0.3em] leading-relaxed">{t('projects_empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredProjects.map(p => (
            <div key={p.id} className={`group relative bg-white dark:bg-[#0a0a0c]/40 border rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 border-slate-100 dark:border-white/5 hover:border-brand-500/30`}>
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                   <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusConfig[p.status].bg} ${statusConfig[p.status].color} ${statusConfig[p.status].border}`}>
                      {p.status.replace('_', ' ')}
                   </div>
                   <div className="flex gap-2">
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
                </div>

                <div className="space-y-4">
                   <Link to={`/admin/projects/${p.id}`}>
                     <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight group-hover:text-brand-600 transition-colors uppercase tracking-tight line-clamp-1">{p.name}</h3>
                   </Link>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
                         <span className="text-[10px] font-black text-slate-500 uppercase">{p.client?.user?.firstName?.[0]}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                        {p.client?.user?.firstName} {p.client?.user?.lastName}
                      </p>
                   </div>
                </div>

                <div className="relative">
                   <p className="text-xs font-medium text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[40px] leading-relaxed italic pr-6 pl-4 border-l-2 border-brand-500/20">
                      "{p.description || t('projects_empty')}"
                   </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col gap-4">
                   <Link 
                     to={`/admin/projects/${p.id}`}
                     className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-brand-600/20 active:scale-95 group-hover:-translate-y-1"
                   >
                     <Layout size={18} />
                     {t('open_project')}
                   </Link>
                   
                   <div className="flex items-center justify-between text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">
                      <div className="flex items-center gap-1.5">
                         <Calendar size={12} className="opacity-50" />
                         {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                      <span className="font-mono opacity-50">PRJ_{p.id.split('-')[0]}</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Sectioned Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-[#0a0a0c]/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-400">
            
            {/* Modal Header */}
            <div className="px-8 md:px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shadow-inner">
                   <Plus size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                    {t('new_project')}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">{t('new_project_desc')}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 md:p-10 space-y-10">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 text-xs font-bold border border-rose-100 dark:border-rose-500/20 animate-in shake duration-300">
                  {error}
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-500 border border-slate-100 dark:border-white/10">
                    <Briefcase size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('basic_info')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t('label_project_name')}
                    </label>
                    <input 
                      value={form.name} 
                      onChange={e => {setForm({...form, name: e.target.value}); if(error) setError(null);}} 
                      required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" 
                      placeholder="E.g. Summer Campaign" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {t('label_client')}
                    </label>
                    <select 
                      value={form.clientId} 
                      onChange={e => {setForm({...form, clientId: e.target.value}); if(error) setError(null);}} 
                      required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all cursor-pointer"
                    >
                      <option value="">{t('select_client')}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Project Details */}
              <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-500 border border-slate-100 dark:border-white/10">
                    <Layout size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('project_details')}</h3>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('label_description')}</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    rows={4} 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all resize-none" 
                    placeholder={t('brief_description')} 
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-[3] py-5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-[1.5rem] shadow-2xl shadow-brand-600/30 hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : t('launch_workspace')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black rounded-[1.5rem] hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs uppercase tracking-[0.2em]"
                >
                  {t('cancel')}
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
