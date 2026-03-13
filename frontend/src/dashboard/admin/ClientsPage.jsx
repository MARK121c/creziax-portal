import { useEffect, useState } from 'react';
import { getUsersAPI, createUserAPI, deleteUserAPI } from '../../store/api';
import { Trash2, Plus, X, Building2, Mail, Phone, Calendar, Loader2 } from 'lucide-react';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', company: '', phone: '' 
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await getUsersAPI();
      setClients(data.filter(u => u.role === 'CLIENT'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createUserAPI({ ...form, role: 'CLIENT' });
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', company: '', phone: '' });
      fetchClients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to completely remove this client?')) return;
    try { 
      await deleteUserAPI(id); 
      fetchClients(); 
    } catch (err) {
      console.error(err);
      alert('Failed to delete client');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Clients Directory</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your agency's client relationships</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
        >
          <Plus size={18} /> Add New Client
        </button>
      </div>

      {/* Content */}
      <div className="glass-panel border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
            <p className="font-medium tracking-widest uppercase text-xs">Loading Directory...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform -rotate-6">
              <Building2 size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Clients Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Get started by adding your first client to the system to manage their projects and invoices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined Date</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{c.firstName} {c.lastName}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 size={12} /> {c.clientInfo?.company || 'Independent'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-300 flex items-center gap-2">
                          <Mail size={14} className="text-slate-500" /> {c.email}
                        </p>
                        {c.clientInfo?.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <Phone size={14} /> {c.clientInfo.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm text-slate-300 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" />
                        {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Client"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a0c]/80 backdrop-blur-md p-4">
          <div className="glass-panel border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white tracking-tight">Onboard New Client</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                    <input 
                      value={form.firstName} 
                      onChange={e => setForm({...form, firstName: e.target.value})} 
                      required 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="John" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input 
                      value={form.lastName} 
                      onChange={e => setForm({...form, lastName: e.target.value})} 
                      required 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="Doe" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Account Credentials</label>
                  <div className="grid grid-cols-2 gap-5">
                    <input 
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})} 
                      type="email" 
                      required 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="Email Address" 
                    />
                    <input 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                      type="password" 
                      required 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="System Password" 
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Business Details (Optional)</label>
                  <div className="grid grid-cols-2 gap-5">
                    <input 
                      value={form.company} 
                      onChange={e => setForm({...form, company: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="Company Name" 
                    />
                    <input 
                      value={form.phone} 
                      onChange={e => setForm({...form, phone: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="Phone Number" 
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 transition-all duration-300 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
