import { useEffect, useState } from 'react';
import { Users, FolderKanban, CheckSquare, Receipt, MessageSquare, UserCircle } from 'lucide-react';
import { getUsersAPI, getProjectsAPI, getTasksAPI, getInvoicesAPI } from '../../store/api';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-700 transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your agency portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total Users" value={stats.users} color="bg-gradient-to-tr from-violet-600 to-indigo-500" />
        <StatCard icon={FolderKanban} label="Projects" value={stats.projects} color="bg-gradient-to-tr from-emerald-600 to-teal-500" />
        <StatCard icon={CheckSquare} label="Tasks" value={stats.tasks} color="bg-gradient-to-tr from-amber-600 to-orange-500" />
        <StatCard icon={Receipt} label="Invoices" value={stats.invoices} color="bg-gradient-to-tr from-rose-600 to-pink-500" />
      </div>
    </div>
  );
};

export default AdminDashboard;
