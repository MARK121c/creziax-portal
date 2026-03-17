import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserAPI, getProjectsAPI, getRecentActivityAPI, updateUserAPI, uploadImageAPI } from '../../store/api';
import { 
  Building2, Mail, Phone, Calendar, Star, ExternalLink, 
  ChevronLeft, FileText, Receipt, Briefcase, Activity,
  Download, Plus, Search, Filter, ArrowUpRight, Wallet, Shield,
  FolderKanban, FileBadge, Building, Send, MessageCircle, SendHorizontal, 
  MoreVertical, Loader2, StarHalf, Trash2, X, CreditCard, DollarSign,
  Briefcase as JobIcon, User, Camera, ShieldCheck, ShieldAlert, Heart, Layout
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const COUNTRY_FLAGS = {
  '+20': 'eg', '+966': 'sa', '+971': 'ae', '+974': 'qa', '+965': 'kw',
  '+968': 'om', '+973': 'bh', '+961': 'lb', '+962': 'jo', '+1': 'us',
  '+39': 'it', '+7': 'ru', '+33': 'fr', '+49': 'de', '+90': 'tr',
  '+212': 'ma', '+213': 'dz', '+216': 'tn', '+249': 'sd',
};

const getCountryFlagUrl = (phone) => {
  if (!phone) return null;
  const match = Object.keys(COUNTRY_FLAGS).find(code => phone.startsWith(code));
  return match ? `https://flagcdn.com/w40/${COUNTRY_FLAGS[match]}.png` : null;
};

const getFormattedAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const TeamMemberProfilePage = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      try {
        const { data: memberData } = await getUserAPI(id);
        setMember(memberData);

        const [projectsRes, activityRes] = await Promise.all([
          getProjectsAPI(),
          getRecentActivityAPI(10)
        ]);
        
        setProjects(projectsRes.data.filter(proj => proj.team?.some(tm => String(tm.id) === String(id))));
        setActivities(activityRes.data.filter(log => String(log.userId) === String(memberData?.id)));
      } catch (err) {
        toast.error("فشل تحميل بيانات العضو");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">{t('loading')}</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Member not found</h2>
        <button onClick={() => navigate('/admin/team')} className="mt-4 text-brand-500 font-bold uppercase tracking-widest text-sm flex items-center gap-2 mx-auto hover:gap-3 transition-all">
          <ChevronLeft size={16} />
          Back to Team
        </button>
      </div>
    );
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجا");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await uploadImageAPI(fd);
      if (data.url) {
        await updateUserAPI(id, { avatarUrl: data.url });
        setMember({ ...member, avatarUrl: data.url });
        toast.success("تم تحديث الصورة بنجاح");
      }
    } catch (err) {
      toast.error("فشل تحديث الصورة");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleContactAction = (type) => {
    const email = member?.email || '';
    const phone = member?.phone || '';
    const telegram = member?.telegram || '';

    switch (type) {
      case 'EMAIL':
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
        break;
      case 'WHATSAPP':
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '');
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else {
          toast.error("Phone number missing");
        }
        break;
      case 'TELEGRAM':
        if (telegram) {
          const username = telegram.replace('@', '').trim();
          window.open(`https://t.me/${username}`, '_blank');
        } else {
          toast.error("Telegram handle missing");
        }
        break;
      case 'NOTION':
        if (member?.notionLink) {
           window.open(member.notionLink, '_blank');
        } else {
           toast.error("Notion link missing");
        }
        break;
      default: break;
    }
  };

  const stats = [
    { label: 'Proposed Salary', value: `$${(member?.finance?.totalSalary || 0).toLocaleString()}`, icon: CreditCard, color: 'bg-brand-500' },
    { label: 'Total Paid', value: `$${(member?.finance?.paid || 0).toLocaleString()}`, icon: Wallet, color: 'bg-emerald-500' },
    { label: 'Remaining', value: `$${(member?.finance?.remaining || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-indigo-500' },
  ];

  const getHealthEmoji = (score) => {
    switch(score) {
      case 'GOOD': return '🟢';
      case 'MONITOR': return '🟡';
      case 'AT_RISK': return '🔴';
      default: return '🟢';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Main Info Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
           <button 
             onClick={() => navigate('/admin/team')}
             className={`p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-brand-500 transition-all hover:-translate-x-1 ${i18n.language === 'ar' ? 'rotate-180' : ''}`}
           >
             <ChevronLeft size={20} />
           </button>

           <div className="relative group">
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-white dark:bg-white/10 flex items-center justify-center text-4xl font-black text-slate-300 border-4 border-white dark:border-[#0a0a0c] shadow-2xl overflow-hidden ${
                member?.role === 'OWNER' ? 'border-amber-500' : ''
              }`}>
                {uploadingAvatar ? (
                  <Loader2 size={32} className="animate-spin text-brand-500" />
                ) : member?.avatarUrl ? (
                  <img src={getFormattedAvatarUrl(member.avatarUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-200" />
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                   <Camera size={32} className="text-white" />
                   <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              {member?.role === 'OWNER' && (
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#0a0a0c]">
                  <ShieldAlert size={20} />
                </div>
              )}
           </div>

           <div className="text-center md:text-left pt-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                 {getCountryFlagUrl(member?.phone) && (
                   <img src={getCountryFlagUrl(member.phone)} alt="flag" className="w-8 h-auto rounded-sm shadow-md" />
                 )}
                 <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                   {(member?.firstName || '')} {(member?.lastName || '')}
                 </h1>
                 <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                   member?.isActive === false ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                 }`}>
                   {member?.isActive === false ? 'Inactive Account' : 'Active Member'}
                 </div>
                 <div className="text-xl" title="Health Status">
                    {getHealthEmoji(member?.healthScore)}
                 </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-xs">
                {member?.position || 'Creative Specialist'} • {member?.role} • {member?.company}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                 {member?.notionLink && (
                   <button 
                     onClick={() => handleContactAction('NOTION')}
                     className="px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 active:scale-95"
                   >
                     <Layout size={16} /> Notion
                   </button>
                 )}
                 <button 
                   onClick={() => handleContactAction('WHATSAPP')}
                   className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
                 >
                   <SendHorizontal size={16} /> WhatsApp
                 </button>
                 <button 
                   onClick={() => handleContactAction('TELEGRAM')}
                   className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-95"
                 >
                   <Send size={16} /> Telegram
                 </button>
                 <button 
                   onClick={() => handleContactAction('EMAIL')}
                   className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-600/20 transition-all flex items-center gap-2 active:scale-95"
                 >
                   <Mail size={16} /> Email
                 </button>
              </div>
           </div>
        </div>

        <div className="hidden xl:block">
           <div className="p-6 bg-brand-500/5 border border-brand-500/10 rounded-[2rem] flex flex-col items-center gap-2 text-center">
              <JobIcon className="text-brand-500" size={24} />
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Team Performance v1.6.3</p>
           </div>
        </div>
      </div>

      {/* Financial Hassala Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm group hover:border-brand-500/20 transition-all">
            <div className={`w-16 h-16 rounded-[1.5rem] ${s.color} bg-opacity-10 flex items-center justify-center`}>
              <div className={`p-4 rounded-xl ${s.color} shadow-lg shadow-${s.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                <s.icon size={24} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">{s.label}</p>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section: Profile & Projects */}
        <div className="lg:col-span-2 space-y-8">
           {/* Detailed Information Card */}
           <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider mb-10 flex items-center gap-3 relative z-10">
                <ShieldCheck size={24} className="text-brand-500" />
                Partner Verification Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                 <div className="space-y-8">
                    <div className="flex items-center gap-5 group">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          <User size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Legal Name</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{member?.firstName} {member?.lastName}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          <Mail size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Portal Email</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{member?.email || 'N/A'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          <Phone size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp Primary</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{member?.phone || 'N/A'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="flex items-center gap-5 group">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          <JobIcon size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Production Position</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{member?.position || 'Creative Specialist'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          <Building2 size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Company / Entity</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{member?.company || 'Internal Team'}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 group">
                       <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                          <Calendar size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarding Date</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{member?.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Status Note Box */}
              <div className="mt-12 p-8 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2rem] relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Associate Notes</p>
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                 </div>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                   {member?.internalNotes || 'No internal notes documented for this partner.'}
                 </p>
              </div>
           </div>

           {/* Active Involvements / Projects */}
           <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 shadow-sm">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3">
                 <Activity size={24} className="text-indigo-500" />
                 Managed Channels & Projects
               </h3>
               <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black rounded-full border border-indigo-500/20">
                 {member?.managedChannels || 0} CHANNELS
               </span>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {projects.length === 0 ? (
                 <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem]">
                   <FolderKanban className="text-slate-200 mx-auto mb-4" size={40} />
                   <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No project assignments active</p>
                 </div>
               ) : (
                 projects.map(proj => (
                   <div key={proj.id} className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl flex items-center justify-between group hover:border-brand-500/30 transition-all cursor-pointer">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-brand-500 border border-slate-100 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all">
                           <Layout size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-slate-800 dark:text-white group-hover:text-brand-500 transition-colors uppercase tracking-tight">{proj.name}</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{proj.status}</p>
                        </div>
                     </div>
                     <ArrowUpRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-all" />
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>

        {/* Sidebar: Activity Log */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10 flex flex-col min-h-[500px] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500" />
              
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-3">
                <Activity size={20} className="text-brand-500 animate-pulse" />
                Audit Trail History
              </h3>
              
              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {activities.length === 0 ? (
                  <div className="py-20 text-center">
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No recent audit logs</p>
                  </div>
                ) : (
                 activities.map(log => (
                   <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 dark:border-white/5 pb-8 last:pb-0 group">
                     <div className="absolute left-[-5.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-white/10 group-hover:bg-brand-500 transition-all border-2 border-white dark:border-[#0a0a0c] shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                     </p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                       {log.action} {log.entityType}
                     </p>
                   </div>
                 ))
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Portal Access Privileges</p>
                    <Shield size={14} className="text-brand-500" />
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {(member?.permissions || []).length > 0 ? member.permissions.map(p => (
                      <span key={p} className="px-3 py-1.5 bg-brand-500/5 border border-brand-500/10 rounded-lg text-[9px] font-black uppercase text-brand-500 tracking-wider">
                        {p}
                      </span>
                    )) : (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Standard Associate Access</span>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberProfilePage;
