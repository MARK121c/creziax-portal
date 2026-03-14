import { useEffect, useState } from 'react';
import { getUsersAPI, createUserAPI, deleteUserAPI } from '../../store/api';
import { Trash2, Plus, X, Building2, Mail, Phone, Calendar, Loader2, Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const ClientsPage = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', company: '', phone: '' 
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await getUsersAPI();
      setClients(data.filter(u => u.role === 'CLIENT'));
    } catch (err) {
      toast.error('Could not load clients directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const loadingToast = toast.loading('Onboarding client...');
    try {
      await createUserAPI({ ...form, role: 'CLIENT' });
      toast.success(`${form.firstName} has been added successfully!`, { id: loadingToast });
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', company: '', phone: '' });
      fetchClients();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create client.';
      setError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) return;
    const loadingToast = toast.loading('Removing client...');
    try { 
      await deleteUserAPI(id); 
      toast.success('Client removed successfully.', { id: loadingToast });
      fetchClients(); 
    } catch (err) {
      toast.error('Failed to remove client.', { id: loadingToast });
    }
  };

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientInfo?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header & Stats Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('clients_directory')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg">{t('manage_clients')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-80 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">{t('add_client')}</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Synchronizing Data...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 transform -rotate-12 border border-slate-100 dark:border-white/5">
              <Building2 size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_clients')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">Start building your client portfolio by onboarding your first partner today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('client_name')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('contact_info')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('joined_date')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-black shadow-sm border border-brand-100 dark:border-brand-500/20">
                          {c.firstName?.[0]}{c.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-800 dark:text-white leading-tight">{c.firstName} {c.lastName}</p>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                            <Building2 size={12} className="text-brand-500" /> {c.clientInfo?.company || 'Independent Partner'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                            <Mail size={13} className="text-slate-400" />
                          </div>
                          {c.email}
                        </p>
                        {c.clientInfo?.phone && (
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 invisible"></div>
                            <Phone size={13} className="text-slate-400" /> {c.clientInfo.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <button 
                        onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)} 
                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-500/20"
                        title="Delete Client"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal - Redesigned for Clarity */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('add_client')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Configure access and profile for the new partner.</p>
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

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">First Name</label>
                  <input 
                    value={form.firstName} 
                    onChange={e => setForm({...form, firstName: e.target.value})} 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                    placeholder="John" 
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Last Name</label>
                  <input 
                    value={form.lastName} 
                    onChange={e => setForm({...form, lastName: e.target.value})} 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                    placeholder="Doe" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Account Credentials</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                    type="email" 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                    placeholder="Email Address" 
                  />
                  <input 
                    value={form.password} 
                    onChange={e => setForm({...form, password: e.target.value})} 
                    type="password" 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                    placeholder="System Password" 
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Organization Details</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input 
                    value={form.company} 
                    onChange={e => setForm({...form, company: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                    placeholder="Company Name" 
                  />
                  <input 
                    value={form.phone} 
                    onChange={e => setForm({...form, phone: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                    placeholder="Phone Number" 
                  />
                </div>
              </div>

              <div className="pt-8 flex gap-5">
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
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
