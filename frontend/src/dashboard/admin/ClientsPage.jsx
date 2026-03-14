import { useEffect, useState } from 'react';
import { getUsersAPI, createUserAPI, deleteUserAPI, updateClientAPI, uploadImageAPI } from '../../store/api';
import { Trash2, Plus, X, Building2, Mail, Phone, Calendar, Loader2, Search, UserPlus, Edit2, Star, Camera, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const ClientsPage = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', company: '', phone: '',
    tier: 'REGULAR', budget: '', isVip: false, logoUrl: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const tiers = [
    { value: 'REGULAR', label: 'Regular', color: 'bg-slate-500' },
    { value: 'VIP_1X', label: '1x Multiplier', color: 'bg-indigo-500' },
    { value: 'VIP_2X', label: '2x Multiplier', color: 'bg-blue-500' },
    { value: 'VIP_3X', label: '3x Multiplier', color: 'bg-purple-500' },
    { value: 'VIP_4X', label: '4x Multiplier', color: 'bg-pink-500' },
    { value: 'VIP_5X', label: '5x Multiplier', color: 'bg-amber-500' },
  ];

  const suggestTier = (amount) => {
    const val = parseFloat(amount);
    if (isNaN(val)) return 'REGULAR';
    if (val >= 5000) return 'VIP_5X';
    if (val >= 3000) return 'VIP_4X';
    if (val >= 2000) return 'VIP_3X';
    if (val >= 1000) return 'VIP_2X';
    if (val >= 500) return 'VIP_1X';
    return 'REGULAR';
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await getUsersAPI();
      setClients(data.filter(u => u.role === 'CLIENT'));
    } catch (err) {
      toast.error(t('failed_load_clients'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const loadingToast = toast.loading(isEditing ? t('syncing') : t('onboarding_client'));
    try {
      if (isEditing) {
        await updateClientAPI(editId, { 
          company: form.company, 
          phone: form.phone, 
          tier: form.tier,
          isVip: form.isVip,
          logoUrl: form.logoUrl
        });
        toast.success(t('loading'), { id: loadingToast });
        addNotification(`تم تحديث بيانات العميل: ${form.firstName} ${form.lastName}`, 'success');
      } else {
        await createUserAPI({ ...form, role: 'CLIENT' });
        toast.success(`${form.firstName} ${t('client_added')}`, { id: loadingToast });
        addNotification(`تم إضافة العميل الجديد: ${form.firstName} ${form.lastName}`, 'success');
      }
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', company: '', phone: '', tier: 'REGULAR', budget: '', isVip: false, logoUrl: '' });
      setIsEditing(false);
      setEditId(null);
      fetchClients();
    } catch (err) {
      const msg = err.response?.data?.message || t('loading');
      setError(msg);
      toast.error(msg, { id: loadingToast });
      addNotification(`فشل العملية: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (client) => {
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      password: '', // Don't show password for edit
      company: client.clientInfo?.company || '',
      phone: client.clientInfo?.phone || '',
      tier: client.clientInfo?.tier || 'REGULAR',
      budget: '',
      isVip: client.clientInfo?.isVip || false,
      logoUrl: client.clientInfo?.logoUrl || ''
    });
    setEditId(client.clientInfo?.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`${t('delete_client_confirm')} ${name}?`)) return;
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteUserAPI(id); 
      toast.success(t('loading'), { id: loadingToast });
      addNotification(`تم حذف العميل: ${name}`, 'success');
      fetchClients(); 
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
      addNotification(`فشل حذف العميل: ${name}`, 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم اللوجو يجب أن يكون أقل من 2 ميجا");
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await uploadImageAPI(formData);
      setForm({ ...form, logoUrl: data.url });
      toast.success("تم رفع اللوجو بنجاح");
    } catch (err) {
      toast.error("فشل رفع اللوجو");
    } finally {
      setUploadingLogo(false);
    }
  };

  const filteredClients = clients.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.clientInfo?.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('clients_directory')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">{t('manage_clients')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_clients')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <UserPlus size={18} />
            <span>{t('add_client')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-xs text-slate-400">{t('syncing_talent')}</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-24 md:py-32">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
              <Building2 size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_clients')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">{t('add_client_desc')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('client_name')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">{t('contact_info')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">{t('joined_date')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-black shadow-sm border border-brand-100 dark:border-brand-500/20 flex-shrink-0 overflow-hidden">
                          {c.clientInfo?.logoUrl ? (
                            <img src={c.clientInfo.logoUrl} alt={c.clientInfo.company} className="w-full h-full object-cover" />
                          ) : (
                            <span>{c.firstName?.[0]}{c.lastName?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm md:text-base font-bold text-slate-800 dark:text-white leading-tight">{c.firstName} {c.lastName}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                              <Building2 size={12} className="text-brand-500 flex-shrink-0" /> {c.clientInfo?.company || t('add_client')}
                            </p>
                                {c.clientInfo?.isVip && (
                                  <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                    <Star size={10} className="fill-amber-500 text-amber-500" />
                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">VIP</span>
                                  </div>
                                )}
                                {c.clientInfo?.tier && c.clientInfo.tier !== 'REGULAR' && (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-tighter border border-slate-200 dark:border-white/10">
                                    {c.clientInfo.tier.replace('VIP_', '').replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                          <p className="text-xs text-slate-400 mt-1 md:hidden">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                      <div className="space-y-1.5">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <Mail size={13} className="text-slate-400" />
                          {c.email}
                        </p>
                        {c.clientInfo?.phone && (
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <Phone size={13} className="text-slate-400" /> {c.clientInfo.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden lg:table-cell">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => openEditModal(c)} 
                          className="p-2 md:p-3 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-2xl transition-all border border-transparent hover:border-brand-500/20"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)} 
                          className="p-2 md:p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01] sticky top-0 z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {isEditing ? t('edit_client') : t('add_client')}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {isEditing ? 'تحديث بيانات العميل الحالية' : t('add_client_desc')}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); setIsEditing(false); }} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 md:p-10 space-y-5 md:space-y-7">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold">{error}</div>
              )}

              {/* Logo Upload Section */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-slate-50/50 dark:bg-white/[0.02] group transition-all hover:border-brand-500/50">
                <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-[2rem] bg-white dark:bg-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/10 overflow-hidden flex items-center justify-center">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center">
                      <Building2 size={32} />
                      <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Logo</span>
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" />
                  </label>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{form.logoUrl ? 'تحديث اللوجو' : 'رفع لوجو الشركة'}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">JPG, PNG or WebP • Max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_first_name')}</label>
                  <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_last_name')}</label>
                  <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
              </div>

              {!isEditing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('email_address')}</label>
                    <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('password')}</label>
                    <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('company_name')}</label>
                  <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('phone_number')}</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('budget')} ($)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5000"
                    value={form.budget} 
                    onChange={e => {
                      const tier = suggestTier(e.target.value);
                      setForm({...form, budget: e.target.value, tier});
                    }} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold border-dashed" 
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('tier')}</label>
                  <select 
                    value={form.tier} 
                    onChange={e => setForm({...form, tier: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold appearance-none cursor-pointer"
                  >
                    {tiers.map(t => <option key={t.value} value={t.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold">{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">حالة الـ VIP</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">تفعيل الشعار الذهبي لهذا العميل</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setForm({...form, isVip: !form.isVip})}
                  className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${form.isVip ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/10'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${form.isVip ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="pt-6 flex gap-4 md:gap-5">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : (isEditing ? t('save_changes') : t('complete_onboarding'))}
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
