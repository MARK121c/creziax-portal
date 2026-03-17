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
    setSubmitting(true);
    setError(null);
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
    <div className="space-y-8 md:space-y-12 pb-10">
      {/* Supreme Header with Versioning */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="p-2.5 bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-500/20">
               <Briefcase size={24} />
             </div>
             <div className="px-4 py-1.5 bg-brand-600 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full shadow-2xl shadow-brand-600/40 animate-pulse border-2 border-white/20">
               V2.4 ELITE BUILD
             </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">
             {t('projects_management')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-3 text-lg uppercase tracking-[0.1em] opacity-80">Operational Intelligence & Pipeline Control</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
          <div className="relative group min-w-[350px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-all duration-300" size={22} />
            <input 
              type="text"
              placeholder={t('search_projects')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 pr-8 py-5 bg-white dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-[2rem] text-sm focus:outline-none focus:ring-8 focus:ring-brand-500/10 focus:border-brand-500 transition-all w-full shadow-2xl shadow-slate-200/50 dark:shadow-none font-black placeholder:text-slate-300"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center justify-center gap-3 px-10 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-[2rem] font-black shadow-2xl shadow-brand-600/40 hover:-translate-y-1.5 active:scale-95 transition-all duration-500 uppercase tracking-[0.2em] text-xs border-b-4 border-brand-800 active:border-b-0"
          >
            <Plus size={22} className="stroke-[3px]" />
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
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] translate-y-[-4px]' 
            : 'bg-white dark:bg-white/5 text-slate-400 border-slate-100 dark:border-white/5 hover:border-brand-500/30'
          }`}
        >
          GLOBAL MAPPING
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
          <div className="relative">
             <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
             <Loader2 size={80} className="animate-spin text-brand-500 relative z-10" />
             <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-500/50" size={32} />
          </div>
          <p className="font-black tracking-[0.5em] uppercase text-[11px] text-slate-400 mt-12 animate-pulse">Establishing Neural Command Link</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10 md:gap-14">
          {filteredProjects.map(p => (
            <div key={p.id} className="group bg-white dark:bg-[#0a0a0c] border-2 border-slate-50 dark:border-white/5 rounded-[4rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none hover:border-brand-500 transition-all duration-700 transform hover:-translate-y-5">
              {/* Card Header / Banner */}
              <div className={`h-32 px-10 pt-10 flex items-start justify-between relative ${statusConfig[p.status].bg} opacity-60 group-hover:opacity-100 transition-all duration-700`}>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-[#0a0a0c]"></div>
                 <div className={`relative z-10 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-white/10 flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] ${statusConfig[p.status].color}`}>
                    <span className="w-3 h-3 rounded-full bg-current animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.2)]"></span>
                    {p.status.replace('_', ' ')}
                 </div>
                 <div className="relative z-10 flex gap-3">
                    <button 
                      onClick={() => handleDownloadContract(p.id, p.name)}
                      className="p-3.5 bg-white/80 hover:bg-white hover:text-brand-600 rounded-2xl border border-white/20 shadow-lg transition-all backdrop-blur-md active:scale-90"
                    >
                      <FileText size={20} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-3.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl border border-rose-500/20 shadow-lg transition-all backdrop-blur-md active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
              </div>

              {/* Card Content */}
              <div className="p-10 md:p-12 -mt-8 bg-white dark:bg-[#0a0a0c] rounded-t-[4rem] relative z-10 space-y-10">
                 <div className="space-y-4">
                    <Link to={`/admin/projects/${p.id}`}>
                      <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-none group-hover:text-brand-600 transition-colors uppercase tracking-tighter line-clamp-1">{p.name}</h3>
                    </Link>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border-2 border-slate-200 dark:border-white/10 shadow-inner">
                          <span className="text-xs font-black text-slate-500">{p.client?.user?.firstName?.[0]}</span>
                       </div>
                       <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase">
                         {p.client?.user?.firstName} {p.client?.user?.lastName}
                       </p>
                    </div>
                 </div>

                 <div className="relative">
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[48px] leading-relaxed italic pr-6 pl-4 border-l-4 border-brand-500/20">
                       "{p.description || 'No strategic brief provided for this operation.'}"
                    </p>
                 </div>

                 {/* Action Panel */}
                 <div className="pt-10 border-t-2 border-slate-50 dark:border-white/5 flex flex-col gap-5">
                    <Link 
                      to={`/admin/projects/${p.id}`}
                      className="w-full py-5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-[2rem] transition-all flex items-center justify-center gap-4 text-xs shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-2 uppercase tracking-[0.3em] group/btn"
                    >
                      <Layout size={20} className="group-hover/btn:rotate-12 transition-transform" />
                      {t('Enter Command Center')}
                      <ChevronRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                    </Link>
                    
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] px-4">
                       <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-brand-500/40" />
                          {new Date(p.createdAt).toLocaleDateString()}
                       </div>
                       <span className="font-mono">OPS_ID_{p.id.split('-')[0]}</span>
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simplified Add Operation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border-2 border-slate-100 dark:border-white/10 rounded-[3rem] w-full max-w-2xl shadow-3xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="px-10 py-10 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Deploy Operation</h2>
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em] mt-2">Initialize production workspace</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-10 space-y-10">
              {error && (
                <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-widest leading-loose">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operation Title</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-3xl text-slate-800 dark:text-white font-black text-lg focus:outline-none focus:border-brand-500 transition-all shadow-inner" placeholder="E.g. Summer Campaign" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Partner</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-3xl text-slate-800 dark:text-white font-bold text-sm focus:outline-none focus:border-brand-500 transition-all shadow-inner">
                    <option value="">Select Partner</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Brief</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border-2 border-slate-100 dark:border-white/5 rounded-3xl text-slate-800 dark:text-white font-bold text-sm focus:outline-none focus:border-brand-500 transition-all shadow-inner resize-none" placeholder="Operation goals and requirements..." />
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex gap-6">
                <button type="submit" disabled={submitting} className="flex-[2] py-5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-[2rem] shadow-2xl shadow-brand-600/30 transition-all hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                  {submitting ? <Loader2 className="animate-spin" /> : 'Launch Operation'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-400 font-black rounded-[2rem] hover:bg-slate-200 transition-all text-[10px] uppercase tracking-widest">
                  Abort
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
