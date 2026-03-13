import { useEffect, useState } from 'react';
import { getProjectsAPI, createProjectAPI, updateProjectAPI, deleteProjectAPI, getClientsAPI } from '../../store/api';
import { Plus, X, Trash2, Edit } from 'lucide-react';

const statusColors = {
  CHANNEL_SETUP: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  EDITING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  THUMBNAIL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SCRIPT: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PUBLISHING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP' });

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([getProjectsAPI(), getClientsAPI()]);
      setProjects(pRes.data);
      setClients(cRes.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await createProjectAPI(form); setShowModal(false); setForm({ name: '', description: '', clientId: '', status: 'CHANNEL_SETUP' }); fetchData(); } catch {}
  };

  const handleStatusUpdate = async (id, status) => {
    try { await updateProjectAPI(id, { status }); fetchData(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try { await deleteProjectAPI(id); fetchData(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm">Manage client projects</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map(p => (
          <div key={p.id} className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{p.client?.user?.firstName} {p.client?.user?.lastName}</p>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
            {p.description && <p className="text-sm text-gray-400 mb-3">{p.description}</p>}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.keys(statusColors).map(s => (
                <button key={s} onClick={() => handleStatusUpdate(p.id, s)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${p.status === s ? statusColors[s] : 'border-gray-800 text-gray-600 hover:text-gray-400'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
        {projects.length === 0 && <p className="text-gray-500 col-span-2 text-center py-10">No projects yet</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">New Project</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Project Name" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 outline-none" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 outline-none resize-none" />
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500/50 outline-none">
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
              </select>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm">Create Project</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
