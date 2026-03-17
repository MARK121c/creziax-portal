import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUsersAPI, createUserAPI, deleteUserAPI, updateClientAPI, uploadImageAPI } from '../../store/api';
import { Trash2, Plus, X, Building2, Mail, Phone, Calendar, Loader2, Search, UserPlus, Edit2, Star, Camera, UploadCloud, ExternalLink, Bell, FileText, Briefcase, Filter, ChevronRight, Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const healthScores = [
  { value: 'GOOD', label: 'health_good', emoji: '🟢', color: 'text-emerald-500' },
  { value: 'MONITOR', label: 'health_monitor', emoji: '🟡', color: 'text-amber-500' },
  { value: 'AT_RISK', label: 'health_risk', emoji: '🔴', color: 'text-rose-500' },
];

const COUNTRY_FLAGS = {
  '+20': 'eg',
  '+966': 'sa',
  '+971': 'ae',
  '+974': 'qa',
  '+965': 'kw',
  '+968': 'om',
  '+973': 'bh',
  '+961': 'lb',
  '+962': 'jo',
  '+1': 'us',
  '+39': 'it',
  '+7': 'ru',
  '+33': 'fr',
  '+49': 'de',
  '+90': 'tr',
  '+212': 'ma',
  '+213': 'dz',
  '+216': 'tn',
  '+249': 'sd',
};

const getFormattedLogoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const getCountryFlagUrl = (phone) => {
  if (!phone) return null;
  const match = Object.keys(COUNTRY_FLAGS).find(code => phone.startsWith(code));
  return match ? `https://flagcdn.com/w40/${COUNTRY_FLAGS[match]}.png` : null;
};

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
    tier: 'REGULAR', budget: '', isVip: false, logoUrl: '', notionLink: '', telegram: '', managedChannels: '',
    contractStartDate: '', contractEndDate: '', healthScore: 'GOOD', internalNotes: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [fileError, setFileError] = useState('');
  const [activeFilter, setActiveFilter] = useState({ tier: 'ALL', health: 'ALL' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };



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
      const response = await getUsersAPI();
      const data = response?.data || [];
      if (!Array.isArray(data)) {
        console.error("API returned non-array data:", data);
        setClients([]);
        return;
      }
      setClients(data.filter(u => u?.role === 'CLIENT'));
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error(t('failed_load_clients'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const [countryCode, setCountryCode] = useState('+20');

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const loadingToast = toast.loading(isEditing ? t('syncing') : t('onboarding_client'));
    try {
      // Merge country code with phone for storage
      const fullPhone = form.phone.startsWith('+') ? form.phone : `${countryCode}${form.phone}`;
      
      if (isEditing) {
        await updateClientAPI(editId, { 
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          company: form.company, 
          phone: fullPhone, 
          tier: form.tier,
          isVip: form.isVip,
          logoUrl: form.logoUrl,
          notionLink: form.notionLink,
          telegram: form.telegram,
          managedChannels: form.managedChannels || 0,
          contractStartDate: form.contractStartDate,
          contractEndDate: form.contractEndDate,
          healthScore: form.healthScore,
          internalNotes: form.internalNotes
        });
        toast.success(t('saved_successfully'), { id: loadingToast });
        addNotification(`${t('saved_successfully')}: ${form.firstName} ${form.lastName}`, 'success');
      } else {
        await createUserAPI({ ...form, phone: fullPhone, role: 'CLIENT' });
        toast.success(`${form.firstName} ${t('client_added')}`, { id: loadingToast });
        addNotification(`${t('client_added')}: ${form.firstName} ${form.lastName}`, 'success');
      }
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', company: '', phone: '', tier: 'REGULAR', budget: '', isVip: false, logoUrl: '', notionLink: '', telegram: '', managedChannels: '', contractStartDate: '', contractEndDate: '', healthScore: 'GOOD', internalNotes: '' });
      setIsEditing(false);
      setEditId(null);
      fetchClients();
    } catch (err) {
      const msg = err.response?.data?.message || t('error_general');
      setError(msg);
      toast.error(msg, { id: loadingToast });
      addNotification(`فشل العملية: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (client) => {
    if (!client) return;

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      try {
        return d.toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    };

    setForm({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      password: '', 
      company: client.clientInfo?.company || '',
      phone: client.clientInfo?.phone || '',
      tier: client.clientInfo?.tier || 'REGULAR',
      budget: '',
      isVip: !!client.clientInfo?.isVip,
      logoUrl: client.clientInfo?.logoUrl || '',
      notionLink: client.clientInfo?.notionLink || '',
      telegram: client.clientInfo?.telegram || '',
      managedChannels: client.clientInfo?.managedChannels || '',
      contractStartDate: formatDate(client.clientInfo?.contractStartDate),
      contractEndDate: formatDate(client.clientInfo?.contractEndDate),
      healthScore: client.clientInfo?.healthScore || 'GOOD',
      internalNotes: client.clientInfo?.internalNotes || ''
    });
    setEditId(client.clientInfo?.id || client.id);
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم اللوجو يجب أن يكون أقل من 5 ميجا");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError(t('file_size_limit'));
      toast.error(t('file_size_error'));
      return;
    }
    
    setFileError('');
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await uploadImageAPI(formData);
      // Ensure the logo URL is complete
      const finalUrl = data.url.startsWith('http') ? data.url : `${import.meta.env.VITE_API_URL || ''}${data.url}`;
      setForm({ ...form, logoUrl: finalUrl });
      toast.success(t('saved_successfully'));
    } catch (err) {
      toast.error(t('error_general'));
    } finally {
      setUploadingLogo(false);
    }
  };
  
  const handleQuickLogoUpload = async (clientId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const loadingToast = toast.loading(t('syncing'));
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadImageAPI(formData);
      const finalUrl = data.url.startsWith('http') ? data.url : `${import.meta.env.VITE_API_URL || ''}${data.url}`;
      await updateClientAPI(clientId, { logoUrl: finalUrl });
      toast.success(t('saved_successfully'), { id: loadingToast });
      fetchClients();
    } catch (err) {
      toast.error(t('error_general'), { id: loadingToast });
    }
  };

  const filteredClients = (clients || []).filter(c => {
    if (!c) return false;
    const query = (searchQuery || '').toLowerCase();
    const firstName = (c.firstName || '').toLowerCase();
    const lastName = (c.lastName || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const company = (c.clientInfo?.company || '').toLowerCase();

    const queryMatch = firstName.includes(query) ||
                       lastName.includes(query) ||
                       email.includes(query) ||
                       company.includes(query);
    
    const tierMatch = activeFilter.tier === 'ALL' || c.clientInfo?.tier === activeFilter.tier;
    const healthMatch = activeFilter.health === 'ALL' || c.clientInfo?.healthScore === activeFilter.health;

    return queryMatch && tierMatch && healthMatch;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    // 1. VIP First
    if (a.clientInfo?.isVip && !b.clientInfo?.isVip) return -1;
    if (!a.clientInfo?.isVip && b.clientInfo?.isVip) return 1;

    // 2. Expiring contracts first (< 7 days)
    const now = new Date();
    const aEndDate = a.clientInfo?.contractEndDate ? new Date(a.clientInfo.contractEndDate) : null;
    const bEndDate = b.clientInfo?.contractEndDate ? new Date(b.clientInfo.contractEndDate) : null;
    
    const aIsExpiring = aEndDate && (aEndDate - now) / (1000 * 60 * 60 * 24) < 7;
    const bIsExpiring = bEndDate && (bEndDate - now) / (1000 * 60 * 60 * 24) < 7;

    if (aIsExpiring && !bIsExpiring) return -1;
    if (!aIsExpiring && bIsExpiring) return 1;

    return 0;
  });

  const getHealthDisplay = (score) => {
    return healthScores.find(h => h.value === score) || healthScores[0];
  };

  const getContractStatus = (endDate) => {
    if (!endDate) return null;
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return { daysLeft, isCritical: daysLeft < 7, isExpired: daysLeft < 0 };
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('clients_directory')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">{t('manage_clients')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_clients')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-1 shadow-sm">
            <div className="flex items-center gap-1 px-3 text-slate-400 border-r border-slate-100 dark:border-white/5 mr-1">
              <Filter size={16} />
            </div>
            <select 
              value={activeFilter.tier}
              onChange={(e) => setActiveFilter({...activeFilter, tier: e.target.value})}
              className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none px-2 py-1.5 cursor-pointer"
            >
              <option value="ALL">{t('tier')}: الكل</option>
              {tiers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select 
              value={activeFilter.health}
              onChange={(e) => setActiveFilter({...activeFilter, health: e.target.value})}
              className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none px-2 py-1.5 cursor-pointer"
            >
              <option value="ALL">{t('health_score')}: الكل</option>
              {healthScores.map(h => <option key={h.value} value={h.value}>{h.emoji} {t(h.label)}</option>)}
            </select>
          </div>

          <button 
            onClick={() => { setIsEditing(false); setShowModal(true); }} 
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
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">{t('contract')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">{t('health_score')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">{t('total_paid')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {sortedClients.map(c => {
                  const contractStatus = getContractStatus(c.clientInfo?.contractEndDate);
                  const health = getHealthDisplay(c.clientInfo?.healthScore);
                  
                  return (
                    <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group ${contractStatus?.isCritical ? 'bg-rose-500/[0.02]' : ''}`}>
                      <td className="px-6 md:px-10 py-5 md:py-7">
                        <Link to={`/admin/clients/${c.clientInfo?.id || c.id}`} className="flex items-center gap-4 group/item">
                          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-black shadow-sm border border-brand-100 dark:border-brand-500/20 flex-shrink-0 overflow-hidden relative group/logo">
                            {c.clientInfo?.logoUrl ? (
                              <img src={getFormattedLogoUrl(c.clientInfo.logoUrl)} alt={c.clientInfo.company} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 size={20} className="opacity-40" />
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10">
                              <Camera size={14} className="text-white pointer-events-none" />
                              <input type="file" className="hidden" onChange={(e) => handleQuickLogoUpload(c.clientInfo?.id, e)} onClick={(e) => e.stopPropagation()} />
                            </label>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {getCountryFlagUrl(c.clientInfo?.phone) && (
                                <img src={getCountryFlagUrl(c.clientInfo?.phone)} alt="flag" className="w-5 h-auto rounded-sm" />
                              )}
                              <p className="text-sm md:text-base font-bold text-slate-800 dark:text-white leading-tight group-hover/item:text-brand-500 transition-colors">{c.firstName} {c.lastName}</p>
                              {c.clientInfo?.isVip && (
                                <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                  <Star size={10} className="fill-amber-500 text-amber-500" />
                                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">{t('vip_member')}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                               <p className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                                <Building2 size={12} className="text-brand-500 flex-shrink-0" /> {c.clientInfo?.company || 'Creziax Partner'}
                              </p>
                              {c.clientInfo?.tier && c.clientInfo.tier !== 'REGULAR' && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-tighter border border-slate-200 dark:border-white/10">
                                  {c.clientInfo.tier.replace('VIP_', '').replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                        <div className="space-y-1.5">
                          {contractStatus ? (
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${contractStatus.isCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'}`}>
                                <Bell size={13} className={contractStatus.isCritical ? 'animate-bounce' : ''} />
                                <span className="text-xs font-black uppercase tracking-tight">
                                  {contractStatus.isExpired ? t('expired') : `${contractStatus.daysLeft} ${t('days_left')}`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 italic">No Active Contract</span>
                          )}
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
                            {c.clientInfo?.contractEndDate ? new Date(c.clientInfo.contractEndDate).toLocaleDateString() : '--'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 hidden lg:table-cell">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 ${health.color}`}>
                          <span className="text-lg">{health.emoji}</span>
                          <span className="text-xs font-black uppercase tracking-tight">{t(health.label)}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 hidden lg:table-cell">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-800 dark:text-white">${(c.totalPaid || 0).toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('total_paid')}</span>
                        </div>
                      </td>
                      <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/admin/clients/${c.clientInfo?.id || c.id}`}
                            className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-brand-500/20"
                            title={t('view_profile')}
                          >
                            <ExternalLink size={16} />
                          </Link>
                          <button 
                            onClick={() => openEditModal(c)} 
                            className="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-brand-500/20"
                            title={t('edit_client')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(c.id, `${c.firstName} ${c.lastName}`)} 
                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-rose-500/20"
                            title={t('delete_client')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0a0a0c] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-300 custom-scrollbar relative">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{isEditing ? t('edit_client') : t('add_client')}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('add_client_desc')}</p>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setIsEditing(false); }} className="p-3 text-slate-400 hover:text-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 md:p-8 space-y-8">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold animate-shake">{error}</div>
              )}

              {/* Section 1: Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <Building2 size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('basic_info')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('first_name')}</label>
                    <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('last_name')}</label>
                    <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email_address')}</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  {!isEditing ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                      <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                      <input type="password" name="password" value={form.password} onChange={handleChange} placeholder={t('password_placeholder')} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('company_name')}</label>
                    <input name="company" value={form.company} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phone_number')}</label>
                    <div className="flex gap-2">
                      <select 
                        value={countryCode} 
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-24 px-3 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold"
                      >
                        <option value="+20">🇪🇬 +20</option>
                        <option value="+966">🇸🇦 +966</option>
                        <option value="+971">🇦🇪 +971</option>
                        <option value="+974">🇶🇦 +974</option>
                        <option value="+965">🇰🇼 +965</option>
                        <option value="+968">🇴🇲 +968</option>
                        <option value="+973">🇧🇭 +973</option>
                        <option value="+961">🇱🇧 +961</option>
                        <option value="+962">🇯🇴 +962</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+39">🇮🇹 +39</option>
                        <option value="+7">🇷🇺 +7</option>
                        <option value="+33">🇫🇷 +33</option>
                        <option value="+49">🇩🇪 +49</option>
                        <option value="+90">🇹🇷 +90</option>
                        <option value="+212">🇲🇦 +212</option>
                        <option value="+213">🇩🇿 +213</option>
                        <option value="+216">🇹🇳 +216</option>
                        <option value="+249">🇸🇩 +249</option>
                      </select>
                      <div className="flex-1 relative group">
                        <input 
                          name="phone" 
                          value={form.phone} 
                          onChange={(e) => {
                            handleChange(e);
                            // Visual feedback: If user pastes + code, update countryCode select
                            if (e.target.value.startsWith('+')) {
                              const match = Object.keys(COUNTRY_FLAGS).find(code => e.target.value.startsWith(code));
                              if (match) setCountryCode(match);
                            }
                          }} 
                          placeholder="012xxxxxxx"
                          className="w-full pl-12 pr-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" 
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          {getCountryFlagUrl(form.phone.startsWith('+') ? form.phone : `${countryCode}${form.phone}`) ? (
                            <img 
                              src={getCountryFlagUrl(form.phone.startsWith('+') ? form.phone : `${countryCode}${form.phone}`)} 
                              alt="flag" 
                              className="w-5 h-auto rounded-sm shadow-sm" 
                            />
                          ) : (
                            <Phone size={14} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Professional Details */}
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <Briefcase size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('professional_info')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('tier')}</label>
                    <select name="tier" value={form.tier} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold">
                      {tiers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('stat_managed_channels')}</label>
                    <input type="number" name="managedChannels" value={form.managedChannels} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('notion_link_label')}</label>
                    <input name="notionLink" value={form.notionLink} onChange={handleChange} placeholder={t('notion_link_placeholder')} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('telegram_link')}</label>
                    <input name="telegram" value={form.telegram} onChange={handleChange} placeholder={t('telegram_placeholder')} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  
                  {/* VIP Toggle & Logo Upload */}
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('vip_status')}</label>
                      <button type="button" onClick={() => setForm({...form, isVip: !form.isVip})} className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border transition-all font-black text-sm ${form.isVip ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                        <Star size={16} className={form.isVip ? 'fill-white' : ''} />
                        {form.isVip ? t('vip_activated') : t('set_as_vip')}
                      </button>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('client_logo')}</label>
                       <div className="relative group/logo w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all hover:border-brand-500/50">
                          {uploadingLogo ? (
                            <Loader2 size={24} className="animate-spin text-brand-500" />
                          ) : form.logoUrl ? (
                            <img src={form.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                          ) : (
                            <Plus size={20} className="text-slate-400" />
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                          />
                       </div>
                       {fileError && <p className="text-[9px] font-bold text-rose-500 mt-1">{fileError}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Contract & Operations */}
              <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">{t('contract_ops')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contract_start')}</label>
                    <input type="date" name="contractStartDate" value={form.contractStartDate} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contract_end')}</label>
                    <input type="date" name="contractEndDate" value={form.contractEndDate} onChange={handleChange} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('health_score')}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {healthScores.map(h => (
                        <button
                          key={h.value}
                          type="button"
                          onClick={() => setForm({...form, healthScore: h.value})}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${form.healthScore === h.value ? 'bg-white dark:bg-white/10 border-brand-500 text-brand-500 shadow-sm' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}
                        >
                          <span className="text-lg">{h.emoji}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('total_paid')}</label>
                       <div className="w-full px-5 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm font-black text-emerald-600 flex items-center justify-between">
                          <span>$ {(clients.find(c => (c.clientInfo?.id || c.id) === editId)?.totalPaid || 0).toLocaleString()}</span>
                          <span className="text-[9px] uppercase tracking-tighter">Verified Ledger</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('internal_notes')}</label>
                    <textarea name="internalNotes" value={form.internalNotes} onChange={handleChange} rows="3" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-bold resize-none" placeholder={t('internal_notes_placeholder')} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-4 sticky bottom-0 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md pb-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-600/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0">
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? t('save_changes') : t('complete_onboarding'))}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); }} className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                  {t('cancel')}
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
