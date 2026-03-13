import { useEffect, useState } from 'react';
import { getUsersAPI, createUserAPI, deleteUserAPI } from '../../store/api';
import { Trash2, Plus, X } from 'lucide-react';

const TeamPage = () => {
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', position: '' });

  const fetchMembers = async () => {
    try {
      const { data } = await getUsersAPI();
      setMembers(data.filter(u => u.role === 'TEAM'));
    } catch {}
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUserAPI({ ...form, role: 'TEAM' });
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', position: '' });
      fetchMembers();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try { await deleteUserAPI(id); fetchMembers(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-gray-500 text-sm">Manage your team</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
          <Plus size={16} /> Add Member
        </button>
      </div>

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
            {members.map(m => (
              <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-white font-medium">{m.firstName} {m.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{m.email}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(m.id)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-500 py-10">No team members yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Add Team Member</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="First Name" required className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Last Name" required className="px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              </div>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="Email" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="Password" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Position (e.g. Editor)" className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none" />
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-violet-500 hover:to-indigo-500 transition-all">Add Member</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
