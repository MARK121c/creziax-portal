import { useEffect, useState } from 'react';
import { getProjectsAPI, createProjectAPI, updateProjectAPI, deleteProjectAPI, getClientsAPI } from '../../store/api';
import { Plus, X, Trash2, Edit, Layout, Search, Briefcase, Calendar, Loader2, MoreVertical, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const statusConfig = {
  CHANNEL_SETUP: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20', icon: Layout },
  EDITING: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', icon: PlayCircle },
  THUMBNAIL: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-100 dark:border-purple-500/20', icon: Layout },
  SCRIPT: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-100 dark:border-cyan-500/20', icon: Layout },
  PUBLISHING: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-100 dark:border-orange-500/20', icon: Clock },
  COMPLETED: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle2 },
};

const ProjectsPage = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([getProjectsAPI(), getClientsAPI()]);
      setProjects(pRes.data);
      setClients(cRes.data);
    } catch (err) {
      toast.error('Failed to sync project data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const loadingToast = toast.loading('Initializing project workspace...');
    try { 
      await createProjectAPI(form); 
      toast.success('Project launched successfully!', { id: loadingToast });
      setShowModal(false); 
      setForm({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP' }); 
      fetchData(); 
    } catch (err) {
      const msg = err.response?.data?.message || 'Initialization failed.';
      setError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    const loadingToast = toast.loading(`Updating pipeline to ${status.replace('_', ' ')}...`);
    try { 
      await updateProjectAPI(id, { status }); 
      toast.success('Pipeline status updated.', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Pipeline update failed.', { id: loadingToast });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to decommission project: ${name}?`)) return;
    const loadingToast = toast.loading('Decommissioning project...');
    try { 
      await deleteProjectAPI(id); 
      toast.success('Project decommissioned.', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Decommission failure.', { id: loadingToast });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.user?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.user?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('projects_management')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg">{t('track_delivery')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-80 shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t('new_project')}</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
          <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Synchronizing Workspaces...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] py-32 text-center shadow-xl shadow-slate-200/40 dark:shadow-none">
          <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 transform -rotate-12 border border-slate-100 dark:border-white/5">
            <Briefcase size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_projects')}</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">Your project list is currently empty. Start by initializing a new client workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProjects.map(p => (
            <div key={p.id} className="group bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30 dark:shadow-none hover:border-brand-500/30 dark:hover:border-brand-500/30 transition-all duration-500 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Briefcase size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(p.id, p.name)} 
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{p.name}</h3>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                  {p.client?.user?.firstName} {p.client?.user?.lastName}
                </p>
              </div>

              {p.description && (
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 dark:border-white/5 pl-4">
                  "{p.description}"
                </p>
              )}

              <div className="mt-auto space-y-5">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(statusConfig).map(s => {
                    const isActive = p.status === s;
                    const config = statusConfig[s];
                    return (
                      <button 
                        key={s} 
                        onClick={() => handleStatusUpdate(p.id, s)} 
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                          isActive 
                            ? `${config.bg} ${config.color} ${config.border}` 
                            : 'bg-transparent border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-600 hover:border-brand-500/20'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
                
                <div className="pt-5 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Calendar size={14} />
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border-2 border-white dark:border-[#0a0a0c] flex items-center justify-center text-[10px] font-black">{p.client?.user?.firstName?.[0]}</div>
                    <div className="w-8 h-8 rounded-full bg-brand-500 border-2 border-white dark:border-[#0a0a0c] flex items-center justify-center text-[10px] font-black text-white">C</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('new_project')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Configure the production workspace for your client.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-10 space-y-7">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  {error}
                </div>
              )}

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Project Identifier</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  placeholder="Project Name" 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Collaborating Partner</label>
                <select 
                  value={form.clientId} 
                  onChange={e => setForm({...form, clientId: e.target.value})} 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all appearance-none font-bold"
                >
                  <option value="" className="dark:bg-slate-900">Select Client Account</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.user?.firstName} {c.user?.lastName}</option>)}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Workspace Objective</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Brief project description..." 
                  rows={3} 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold resize-none" 
                />
              </div>

              <div className="pt-8 flex gap-5 border-t border-slate-100 dark:border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4.5 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-4.5 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all duration-300 active:scale-95"
                >
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Launch Workspace'}
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
