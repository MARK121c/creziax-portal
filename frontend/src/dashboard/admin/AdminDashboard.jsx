import { useEffect, useState } from 'react';
import { Users, FolderKanban, CheckSquare, Receipt, MessageSquare, UserCircle } from 'lucide-react';
import { getUsersAPI, getProjectsAPI, getTasksAPI, getInvoicesAPI } from '../../store/api';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="glass-card rounded-[2rem] p-7 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${color}`}>
      <Icon size={26} className="text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, projects: 0, tasks: 0, invoices: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, projectsRes, tasksRes, invoicesRes] = await Promise.all([
          getUsersAPI(),
          getProjectsAPI(),
          getTasksAPI(),
          getInvoicesAPI(),
        ]);
        setStats({
          users: usersRes.data.length,
          projects: projectsRes.data.length,
          tasks: tasksRes.data.length,
          invoices: invoicesRes.data.length,
        });
      } catch {
        // API may not be connected yet
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Overview
        </h1>
        <p className="text-slate-500 font-medium">
          Welcome back, here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Users" value={stats.users} color="bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-violet-500/20" />
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.projects} color="bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20" />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={stats.tasks} color="bg-gradient-to-tr from-amber-600 to-orange-500 shadow-amber-500/20" />
        <StatCard icon={Receipt} label="Total Invoices" value={stats.invoices} color="bg-gradient-to-tr from-rose-600 to-pink-500 shadow-rose-500/20" />
      </div>

      {/* Placeholder for future sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 glass-panel rounded-[2.5rem] p-8 border border-white/5 flex items-center justify-center">
            <p className="text-slate-600 font-medium italic">Activity Chart Placeholder</p>
        </div>
        <div className="h-80 glass-panel rounded-[2.5rem] p-8 border border-white/5 flex items-center justify-center">
            <p className="text-slate-600 font-medium italic">Quick Actions</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
