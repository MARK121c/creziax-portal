import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getClientAPI, getInvoicesAPI, getProjectsAPI, getRecentActivityAPI, updateClientAPI, uploadImageAPI, getContractsAPI } from '../../store/api';
import { 
  Building2, Mail, Phone, Calendar, Star, ExternalLink, 
  ChevronLeft, FileText, Receipt, Briefcase, Activity,
  Download, Plus, Search, Filter, ArrowUpRight, Wallet, Shield,
  FolderKanban, FileBadge, Building, Send, MessageCircle, SendHorizontal, MoreVertical, Loader2, StarHalf, Trash2, X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

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

const getFullFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const getCountryFlagUrl = (phone) => {
  if (!phone) return null;
  // Support both strings and objects if it comes that way
  const tel = typeof phone === 'string' ? phone : phone?.phone;
  if (!tel) return null;
  const match = Object.keys(COUNTRY_FLAGS).find(code => tel.startsWith(code));
  return match ? `https://flagcdn.com/w40/${COUNTRY_FLAGS[match]}.png` : null;
};

// Safe accessors to handle potential structure differences
const getClientPhone = (c) => c?.clientInfo?.phone || c?.phone || '';
const getClientNotion = (c) => c?.clientInfo?.notionLink || c?.notionLink || '';
const getClientTelegram = (c) => c?.clientInfo?.telegram || c?.telegram || '';
const getClientCompany = (c) => c?.clientInfo?.company || c?.company || '';
const getClientLogo = (c) => c?.clientInfo?.logoUrl || c?.logoUrl || '';
const getClientTier = (c) => c?.clientInfo?.tier || c?.tier || 'REGULAR';
const getClientId = (c) => c?.clientInfo?.id || c?.id;
// Prioritize root email (flattened) for 100% guarantee
const getClientEmail = (c) => c?.email || c?.user?.email || c?.clientInfo?.email || '';

const ClientProfilePage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const uploadRef = useRef(null);

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        const [clientRes, invoicesRes, projectsRes, activityRes, contractsRes] = await Promise.all([
          getClientAPI(id),
          getInvoicesAPI(),
          getProjectsAPI(),
          getRecentActivityAPI(10),
          getContractsAPI()
        ]);
        
        const clientData = clientRes.data;
        // Flatten critical fields to root for 100% reliable prop access
        setClient({
          ...clientData,
          email: clientData?.user?.email,
          firstName: clientData?.user?.firstName,
          lastName: clientData?.user?.lastName
        });

        // Use string comparison for UUIDs (parseInt was a bug)
        setInvoices(invoicesRes.data.filter(inv => String(inv.clientId) === String(id)));
        setProjects(projectsRes.data.filter(proj => String(proj.clientId) === String(id)));
        setContracts(contractsRes.data.filter(cont => String(cont.clientId) === String(id)));
        setActivities(activityRes.data.filter(log => String(log.entityId) === String(id) || log.userId === (clientData?.userId)));
      } catch (err) {
        toast.error(t('error_general'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('client_not_found')}</h2>
        <button onClick={() => navigate('/admin/clients')} className="mt-4 text-brand-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2 mx-auto hover:gap-3 transition-all">
          <ChevronLeft size={16} />
          {t('back_to_directory')}
        </button>
      </div>
    );
  }

  const stats = [
    { label: t('active_projects'), value: projects.length, icon: Briefcase, color: 'bg-indigo-500' },
    { label: t('total_invoices'), value: invoices.length, icon: Receipt, color: 'bg-emerald-500' },
    { label: t('total_paid'), value: `$${(client.totalPaid || 0).toLocaleString()}`, icon: Wallet, color: 'bg-amber-500' },
  ];

  const handleContactAction = (type) => {
    const phone = getClientPhone(client);
    const telegram = getClientTelegram(client);
    const email = client.email || '';

    switch (type) {
      case 'INTERNAL':
        navigate(`/admin/messages?clientId=${client.id}`);
        break;
      case 'WHATSAPP':
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else {
          toast.error(t('missing_whatsapp'));
        }
        break;
      case 'EMAIL':
        const targetEmail = getClientEmail(client);
        if (targetEmail) {
          // Direct Gmail web link for 100% reliability as per user request
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${targetEmail}`, '_blank');
        } else {
          toast.error(t('missing_email'));
        }
        break;
      case 'TELEGRAM':
        if (telegram) {
          const raw = telegram.trim();
          const username = raw.startsWith('http') 
            ? raw.split('/').pop().replace('@', '') 
            : raw.replace('@', '').replace('t.me/', '');
          window.open(`https://t.me/${username}`, '_blank');
        } else {
          toast.error(t('missing_telegram'));
        }
        break;
      default: break;
    }
  };

  const handleConfirmLogo = async () => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error(t('image_too_large_5mb', i18n.language === 'ar' ? "الصورة كبيرة جداً (الحد الأقصى 5 ميجا)" : "Image too large (Max 5MB)"));
      return;
    }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('image', selectedFile);
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const r = await fetch(`${apiBase}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });
      const d = await r.json();
      if (d.url) {
        const updateId = getClientId(client);
        // Only update the logo specific fields to preserve other primary data
        await updateClientAPI(updateId, { 
          logoUrl: d.url,
          clientInfo: { ...(client.clientInfo || {}), logoUrl: d.url }
        });
        setClient(prev => ({ 
          ...prev, 
          logoUrl: d.url,
          clientInfo: { ...(prev.clientInfo || {}), logoUrl: d.url }
        }));
        toast.success(t('saved_successfully'));
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err) { toast.error(t('upload_failed', i18n.language === 'ar' ? 'فشل التحميل' : 'Upload failed')); }
    finally { setUploadingLogo(false); }
  };

  const handleDeleteLogo = async () => {
    if (!confirm(t('confirm_delete_logo', i18n.language === 'ar' ? 'هل أنت متأكد من حذف اللوجو؟' : 'Are you sure you want to delete the logo?'))) return;
    setUploadingLogo(true);
    try {
      const updateId = getClientId(client);
      await updateClientAPI(updateId, { 
        logoUrl: '',
        clientInfo: { ...(client.clientInfo || {}), logoUrl: '' }
      });
      setClient(prev => ({ 
        ...prev, 
        logoUrl: '',
        clientInfo: { ...(prev.clientInfo || {}), logoUrl: '' }
      }));
      toast.success(t('saved_successfully'));
    } catch (err) { toast.error('Action failed'); }
    finally { setUploadingLogo(true); setTimeout(() => setUploadingLogo(false), 500); }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/clients')}
            className={`p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-brand-500 transition-all hover:-translate-x-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`}
            title={t('back_to_directory')}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 flex-1">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-white dark:bg-white/10 flex items-center justify-center text-3xl font-black text-slate-400 border-4 border-white dark:border-[#0a0a0c] shadow-2xl overflow-hidden relative group">
                {uploadingLogo ? (
                  <Loader2 size={32} className="animate-spin text-brand-500" />
                ) : previewUrl || getClientLogo(client) ? (
                  <img src={previewUrl || getFormattedLogoUrl(getClientLogo(client))} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Building size={32} className="text-slate-300" />
                    <span className="text-[10px] font-black uppercase text-slate-400">{getClientCompany(client)?.charAt(0)}</span>
                  </div>
                )}
                
                {(previewUrl || getClientLogo(client)) && (
                  <button 
                    onClick={() => window.open(previewUrl || getFormattedLogoUrl(getClientLogo(client)), '_blank')}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Search size={28} />
                  </button>
                )}
              </div>

              {/* Advanced Controls moved below logo */}
              <div className="flex flex-col items-center gap-2">
                {uploadingLogo ? (
                   <div className="flex items-center gap-2 px-6 py-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                      <Loader2 size={18} className="animate-spin text-brand-500" />
                      <span className="text-[10px] font-black uppercase text-slate-500">{t('uploading_ellipsis', i18n.language === 'ar' ? 'جاري التحميل...' : 'UPLOADING...')}</span>
                   </div>
                ) : selectedFile ? (
                  <div className="flex items-center gap-3 animate-in slide-in-from-top-2">
                    <button 
                      onClick={handleConfirmLogo}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-600/20 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <Shield size={14} />
                      {t('confirm_save', i18n.language === 'ar' ? 'تأكيد الحفظ' : 'CONFIRM SAVE')}
                    </button>
                    <button 
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-600/20 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <X size={14} />
                      {t('cancel', i18n.language === 'ar' ? 'إلغاء' : 'CANCEL')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-600/20 cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <Plus size={16} />
                      {t('upload_logo', i18n.language === 'ar' ? 'ارفع الصورة' : 'UPLOAD LOGO')}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(t('image_too_large_5mb', i18n.language === 'ar' ? "الصورة كبيرة جداً" : "File too large"));
                          return;
                        }
                        setSelectedFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }} />
                    </label>
                    {getClientLogo(client) && (
                      <button 
                        onClick={handleDeleteLogo}
                        className="px-6 py-3 bg-rose-600/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        {t('delete_logo', i18n.language === 'ar' ? 'حذف اللوجو' : 'DELETE LOGO')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3">
                {getCountryFlagUrl(getClientPhone(client)) && (
                  <img src={getCountryFlagUrl(getClientPhone(client))} alt="flag" className="w-8 h-auto rounded-sm shadow-md" />
                )}
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {client.firstName} {client.lastName}
                </h1>
                {client.clientInfo?.isVip && (
                  <div className="bg-amber-400/10 text-amber-500 px-3 py-1 rounded-full border border-amber-400/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Star size={12} className="fill-amber-500" />
                    {t('vip_partner', 'VIP PARTNER')}
                  </div>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">
                {getClientCompany(client) || t('creziax_partner', 'Creziax Partner')} • {getClientTier(client)} • v1.5.5
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
            {getClientNotion(client) && (
              <a 
               href={getClientNotion(client)} 
               target="_blank" 
               rel="noopener noreferrer"
               className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg shadow-black/20 hover:-translate-y-1 transition-all flex items-center gap-2 border border-white/5 active:scale-95"
              >
                <div className="w-5 h-5 flex items-center justify-center bg-white/10 dark:bg-black/10 rounded-lg">
                   <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M4.459 4.212c.192-.158.53-.332.883-.342.35-.011.834.137 1.096.22l11.05 4.095c.264.097.464.305.545.568l2.094 10.134c.08.388-.137.765-.515.894-.377.13-.778-.046-.954-.42l-2.015-4.275-9.358-3.465-1.932 4.103c-.176.374-.577.55-1.07.417-.492-.132-.71-.564-.63-1.077l.806-10.886zm2.25 10.32L16.2 18.23l-.22-10.37-9.531-3.328.26 10.0zm11.233-7.51L7.25 4.3l.08 10.2L17.7 18.0l.243-11.0zM8.3 6.0L15.3 8.3l-.06 7.4-7.0-2.3L8.3 6.0z"/>
                   </svg>
                </div>
                Notion
              </a>
            )}
           
           <button 
            onClick={() => handleContactAction('WHATSAPP')}
            className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:-translate-y-1 transition-all flex items-center gap-2"
           >
             <SendHorizontal size={18} />
             WhatsApp
           </button>

           <button 
            onClick={() => handleContactAction('TELEGRAM')}
            className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:-translate-y-1 transition-all flex items-center gap-2"
           >
             <img src="https://telegram.org/favicon.ico" className="w-5 h-5" alt="" />
             Telegram
           </button>

            <button 
             onClick={() => handleContactAction('EMAIL')}
             className="px-6 py-4 bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-600/20 hover:-translate-y-1 transition-all flex items-center gap-2 active:scale-95"
            >
              <Mail size={18} />
              Email
            </button>

           <button 
            onClick={() => handleContactAction('INTERNAL')}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:-translate-y-1 transition-all flex items-center gap-2"
           >
             <MessageCircle size={18} />
             Chat
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 flex items-center gap-5 shadow-sm">
            <div className={`w-14 h-14 rounded-2xl ${s.color} bg-opacity-10 flex items-center justify-center text-white`}>
              <div className={`p-3 rounded-xl ${s.color}`}>
                <s.icon size={20} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Info & Projects */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Info */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-3">
              <Shield size={20} className="text-brand-500" />
              {t('corporate_identity')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/10">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('email_address')}</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/10">
                    <img src="https://telegram.org/favicon.ico" className="w-4 h-4 grayscale opacity-60" alt="" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('telegram_link')}</p>
                    <p className={`font-bold mt-1 ${client.clientInfo?.telegram ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 italic'}`}>
                      {client.clientInfo?.telegram || t('missing_telegram')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/10">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('company_org')}</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{client.clientInfo?.company || t('client')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/10">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('contract_validity')}</p>
                    {client.clientInfo?.contractEndDate ? (
                      <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">
                        {new Date(client.clientInfo.contractStartDate).toLocaleDateString()} 
                        - {new Date(client.clientInfo.contractEndDate).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-slate-400 font-bold italic mt-1">{t('no_active_contract')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-slate-100 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('internal_notes_title')}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  {client.clientInfo?.internalNotes || t('no_internal_notes')}
                </p>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3">
                <Activity size={20} className="text-indigo-500" />
                {t('linked_projects')}
              </h3>
              <Link to="/admin/projects" className="text-xs font-black text-brand-500 uppercase tracking-widest">{t('view_master_repo')}</Link>
            </div>
            
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                  {t('projects_empty')}
                </div>
              ) : (
                projects.map(proj => (
                  <div key={proj.id} className="p-5 bg-slate-100 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-between group transition-all hover:border-brand-500/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-brand-500 shadow-sm border border-slate-100 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                        <FolderKanban size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors uppercase tracking-tight">{proj.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t(proj.status?.toLowerCase()) || proj.status}</p>
                      </div>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Activity & Legal */}
        <div className="space-y-8">
          {/* Contracts List / Legal Vault */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3">
                 <FileBadge size={20} className="text-emerald-500" />
                 {t('archives_contracts') || 'عقود العميل'}
               </h3>
               <Link to={`/admin/contracts?clientId=${id}`} className="text-xs font-black text-brand-500 uppercase tracking-widest">{t('view_all') || 'أرشيف كامل'}</Link>
             </div>
             
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {contracts.length === 0 ? (
                 <div className="text-center py-10 text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
                   {t('contracts_empty') || 'لا توجد عقود مؤرشفة'}
                 </div>
               ) : (
                 contracts.map(cont => (
                   <div key={cont.id} className="p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-between group transition-all hover:border-brand-500/30">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100 dark:border-white/10 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                         <FileText size={18} />
                       </div>
                       <div className="min-w-0">
                         <p className="font-black text-slate-800 dark:text-white truncate text-sm">{cont.title}</p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                           {cont.startDate || '---'} | {cont.endDate || '---'}
                         </p>
                       </div>
                     </div>
                     {cont.pdfUrl && (
                       <a 
                         href={getFullFileUrl(cont.pdfUrl)}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="p-2.5 bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/10 hover:scale-110 active:scale-95 transition-all flex-shrink-0"
                       >
                         <Download size={16} />
                       </a>
                     )}
                   </div>
                 ))
               )}
             </div>

             <Link to={`/admin/contracts?clientId=${id}`} className="mt-6 w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-brand-500 hover:text-white transition-all group">
               <Shield size={16} className="group-hover:rotate-12 transition-transform" />
               {t('open_contracts') || 'إدارة العقود'}
             </Link>
          </div>

          {/* Audit Log / Recent Activity */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 flex flex-col min-h-[400px] shadow-sm">
             <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-3">
               <Activity size={18} className="text-brand-500 animate-pulse" />
               {t('partner_activity_title')}
             </h3>
             <div className="flex-1 space-y-5 overflow-y-auto pr-1">
               {activities.length === 0 ? (
                 <p className="text-center text-slate-400 text-[10px] py-10 font-bold uppercase tracking-widest">{t('no_activity_found')}</p>
               ) : (
                activities.map(log => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 pb-6 last:pb-0">
                    <div className="absolute left-[-5.5px] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(124,58,237,0.5)] border-2 border-white dark:border-[#0a0a0c]" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                       {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">
                      {log.action} {log.entityType}
                    </p>
                  </div>
                ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
