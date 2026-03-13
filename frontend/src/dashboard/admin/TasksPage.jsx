import { useEffect, useState } from 'react';
import { getTasksAPI, createTaskAPI, updateTaskAPI, deleteTaskAPI, getProjectsAPI } from '../../store/api';
import { Plus, X, Trash2 } from 'lucide-react';

const taskStatusColors = {
  PENDING: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  REVIEW: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', projectId: '', deadline: '' });

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([getTasksAPI(), getProjectsAPI()]);
      setTasks(tRes.data);
      setProjects(pRes.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTaskAPI({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
      setShowModal(false);
      setForm({ title: '', description: '', projectId: '', deadline: '' });
      fetchData();
    } catch {}
  };

  const handleStatusUpdate = async (id, status) => {
    try { await updateTaskAPI(id, { status }); fetchData(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await deleteTaskAPI(id); fetchData(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Tasks</h1><p className="text-gray-500 text-sm">Manage all tasks</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"><Plus size={16} /> New Task</button>
      </div>

      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{t.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t.project?.name} {t.deadline ? `• Due: ${new Date(t.deadline).toLocaleDateString()}` : ''}</p>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
            </div>
            {t.description && <p className="text-sm text-gray-400 mt-2">{t.description}</p>}
            <div className="flex gap-2 mt-3 flex-wrap">
              {Object.keys(taskStatusColors).map(s => (
                <button key={s} onClick={() => handleStatusUpdate(t.id, s)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${t.status === s ? taskStatusColors[s] : 'border-gray-800 text-gray-600 hover:text-gray-400'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-gray-500 text-center py-10">No tasks yet</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-white">New Task</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task Title" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-violet-500/50 resize-none" />
              <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm">Create Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
