import { useEffect, useState } from 'react';
import { getUsersAPI, createUserAPI, deleteUserAPI } from '../../store/api';
import { Trash2, Plus, X } from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', company: '', phone: '' });

  const fetchClients = async () => {
    try {
      const { data } = await getUsersAPI();
      setClients(data.filter(u => u.role === 'CLIENT'));
    } catch {}
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUserAPI({ ...form, role: 'CLIENT' });
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', company: '', phone: '' });
      fetchClients();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try { await deleteUserAPI(id); fetchClients(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-gray-500 text-sm">Manage your agency clients</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Email</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Joined</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-white font-medium">{c.firstName} {c.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{c.email}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-500 py-10">No clients yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Client</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="First Name" required className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Last Name" required className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              </div>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="Email" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="Password" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company (optional)" className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone (optional)" className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-violet-500 hover:to-indigo-500 transition-all">Create Client</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
