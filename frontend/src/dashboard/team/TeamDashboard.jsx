import { useEffect, useState } from 'react';
import { getTasksAPI, updateTaskAPI } from '../../store/api';

const taskStatusColors = {
  PENDING: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  REVIEW: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const TeamDashboard = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try { const { data } = await getTasksAPI(); setTasks(data); } catch {}
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStatusUpdate = async (id, status) => {
    try { await updateTaskAPI(id, { status }); fetchTasks(); } catch {}
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Team Dashboard</h1>
        <p className="text-gray-500 mt-1">Your assigned tasks</p>
      </div>

      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{t.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{t.project?.name} {t.deadline ? `• Due: ${new Date(t.deadline).toLocaleDateString()}` : ''}</p>
              </div>
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
        {tasks.length === 0 && <p className="text-gray-500 text-center py-10">No tasks assigned yet</p>}
      </div>
    </div>
  );
};

export default TeamDashboard;
