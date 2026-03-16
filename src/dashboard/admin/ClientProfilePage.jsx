import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getClientAPI, getInvoicesAPI, getProjectsAPI, getRecentActivityAPI } from '../../store/api';
import { 
  Building2, Mail, Phone, Calendar, Star, ExternalLink, 
  ChevronLeft, FileText, Receipt, Briefcase, Activity,
  Download, Plus, Search, Filter, ArrowUpRight, Wallet, Shield,
  FolderKanban, FileBadge, Building
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const ClientProfilePage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        const [clientRes, invoicesRes, projectsRes, activityRes] = await Promise.all([
          getClientAPI(id),
          getInvoicesAPI(),
          getProjectsAPI(),
          getRecentActivityAPI(10)
        ]);
        
        setClient(clientRes.data);
        setInvoices(invoicesRes.data.filter(inv => inv.clientId === parseInt(id)));
        setProjects(projectsRes.data.filter(proj => proj.clientId === parseInt(id)));
        setActivities(activityRes.data.filter(log => log.entityId === parseInt(id) || log.userId === (clientRes.data?.userId)));
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

  const handleContact = () => {
    const phone = client.clientInfo?.phone;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else {
      window.open(`mailto:${client.email}`, '_blank');
    }
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
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-brand-500/10 border-2 border-brand-500/20 flex items-center justify-center overflow-hidden">
               {client.clientInfo?.logoUrl ? (
                 <img src={client.clientInfo.logoUrl} className="w-full h-full object-cover" alt="" />
               ) : <Building size={32} className="text-brand-500 opacity-40" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  {client.firstName} {client.lastName}
                </h1>
                {client.clientInfo?.isVip && (
                  <div className="bg-amber-400/10 text-amber-500 px-3 py-1 rounded-full border border-amber-400/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Star size={12} className="fill-amber-500" />
                    VIP PARTNER
                  </div>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">
                {client.clientInfo?.company || 'Creziax Elite Partner'} • {client.clientInfo?.tier || 'REGULAR'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {client.clientInfo?.notionLink && (
             <a 
              href={client.clientInfo.notionLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-50/10 hover:text-brand-500 transition-all"
             >
               <Briefcase size={18} />
               {t('notion_project')}
             </a>
           )}
           <button 
            onClick={handleContact}
            className="px-6 py-3.5 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-1 transition-all"
           >
             {t('contact_client')}
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
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('mobile_number')}</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">{client.clientInfo?.phone || '--'}</p>
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
                    <p className="font-bold text-slate-700 dark:text-slate-200 mt-1">
                      {client.clientInfo?.contractStartDate ? new Date(client.clientInfo.contractStartDate).toLocaleDateString() : 'N/A'} 
                      - {client.clientInfo?.contractEndDate ? new Date(client.clientInfo.contractEndDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-slate-100 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('internal_notes_title')}</p>
               <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed italic">
                 {client.clientInfo?.internalNotes || 'No internal strategic notes provided for this partner.'}
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
          {/* Contracts Briefing */}
          <div className="bg-gradient-to-br from-slate-900 to-brand-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-brand-900/20">
             <div className="relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/20">
                 <FileBadge size={20} />
               </div>
               <h3 className="text-xl font-black uppercase tracking-wider mb-2">{t('legal_vault')}</h3>
               <p className="text-white/60 text-[10px] font-bold mb-8 uppercase tracking-widest">Digital Agreement Management</p>
               
               <Link to={`/admin/contracts?clientId=${id}`} className="w-full py-4 bg-white text-brand-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-brand-50 transition-all hover:scale-[1.02] active:scale-100">
                 <Shield size={16} />
                 {t('open_contracts')}
               </Link>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
