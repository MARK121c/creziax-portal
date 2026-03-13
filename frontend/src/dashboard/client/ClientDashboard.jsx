import { useEffect, useState } from 'react';
import { getProjectsAPI, getTasksAPI, getInvoicesAPI } from '../../store/api';
import { FolderKanban, CheckSquare, Receipt } from 'lucide-react';

const statusColors = {
  CHANNEL_SETUP: 'bg-blue-500/10 text-blue-400',
  EDITING: 'bg-amber-500/10 text-amber-400',
  THUMBNAIL: 'bg-purple-500/10 text-purple-400',
  SCRIPT: 'bg-cyan-500/10 text-cyan-400',
  PUBLISHING: 'bg-orange-500/10 text-orange-400',
  COMPLETED: 'bg-emerald-500/10 text-emerald-400',
};

const ClientDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes, iRes] = await Promise.all([getProjectsAPI(), getTasksAPI(), getInvoicesAPI()]);
        setProjects(pRes.data);
        setTasks(tRes.data);
        setInvoices(iRes.data);
      } catch {}
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to your Creziax project portal</p>
      </div>

      {/* Project Status */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><FolderKanban size={18} /> Project Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-semibold text-white">{p.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{p.description}</p>
              <div className="mt-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${statusColors[p.status] || 'bg-gray-800 text-gray-400'}`}>
                  {p.status?.replace('_', ' ')}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 flex gap-1">
                {Object.keys(statusColors).map((s, i) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full ${Object.keys(statusColors).indexOf(p.status) >= i ? 'bg-violet-500' : 'bg-gray-800'}`} />
                ))}
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-gray-500">No projects assigned yet</p>}
        </div>
      </div>

      {/* Tasks */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><CheckSquare size={18} /> Tasks</h2>
        <div className="space-y-2">
          {tasks.slice(0, 5).map(t => (
            <div key={t.id} className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{t.title}</p>
                <p className="text-xs text-gray-500">{t.deadline ? `Due: ${new Date(t.deadline).toLocaleDateString()}` : 'No deadline'}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${t.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {t.status?.replace('_', ' ')}
              </span>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-gray-500 text-sm">No tasks yet</p>}
        </div>
      </div>

      {/* Invoices */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Receipt size={18} /> Invoices</h2>
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-800">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Invoice #</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Service</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Status</th>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-800/50">
                  <td className="px-6 py-3 text-sm text-white font-mono">{inv.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-400">{inv.service}</td>
                  <td className="px-6 py-3 text-sm text-white font-semibold">${inv.amount}</td>
                  <td className="px-6 py-3"><span className={`px-3 py-1 rounded-lg text-xs font-medium ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{inv.status}</span></td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-8">No invoices</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
