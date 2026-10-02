import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI, uploadImageAPI, resetPasswordAPI, createExpenseAPI } from '../../store/api';
import { 
  Trash2, Plus, X, User, Mail, Calendar, Search, Loader2, UserPlus, 
  ShieldAlert, ShieldCheck, Camera, UploadCloud, ExternalLink, 
  MessageCircle, SendHorizontal, DollarSign, Wallet, ArrowUpRight, 
  Key, RefreshCw, Power, Heart, Briefcase, ChevronRight, Filter, 
  Settings, UserCheck, UserX, CreditCard, Layout, TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';
import UserPresenceBadge from '../../components/UserPresenceBadge';
import useNotificationStore from '../../store/notificationStore';
import { getBonusesAPI, createBonusAPI, deleteBonusAPI } from '../../store/api';
import { Coins } from 'lucide-react';

const jobTitles = [
  { value: 'ALL', label: 'all_roles' },
  { value: 'Sales', label: 'job_sales' },
  { value: 'Strategist', label: 'Strategist (استراتيجي)' },
  { value: 'Manager', label: 'Manager (مدير)' },
  { value: 'Scriptwriter', label: 'Scriptwriter (كاتب سكريبت)' },
  { value: 'Video Editor', label: 'Video Editor (مونتير)' },
  { value: 'Graphic Designer', label: 'Graphic Designer (مصمم جرافيك)' },
];

const healthScores = [
  { value: 'GOOD', label: 'health_good', emoji: '🟢', color: 'text-emerald-500' },
  { value: 'MONITOR', label: 'health_monitor', emoji: '🟡', color: 'text-amber-500' },
  { value: 'AT_RISK', label: 'health_risk', emoji: '🔴', color: 'text-rose-500' },
];

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

const TeamPage = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState({ position: 'ALL', status: 'ALL' });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', 
    position: 'Strategist', customJobTitle: '', monthlySalary: '',
    company: '', phone: '', notionLink: '', telegram: '', managedChannels: '',
    role: 'TEAM', avatarUrl: '', permissions: [], isActive: true,
    healthScore: 'GOOD', internalNotes: ''
  });
  
  const [countryCode, setCountryCode] = useState('+20');
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusForm, setBonusForm] = useState({ amount: '', reason: '' });

  const addNotification = useNotificationStore(state => state.addNotification);
  
  const availablePermissions = [
    { id: 'CLIENTS', label: 'manage_clients_perm', icon: ShieldCheck },
    { id: 'TEAM', label: 'manage_team_perm', icon: ShieldAlert },
    { id: 'PROJECTS', label: 'manage_projects_perm', icon: ShieldCheck },
    { id: 'SALES', label: 'manage_sales_perm', icon: TrendingUp },
    { id: 'FINANCES', label: 'finances_invoices_perm', icon: ShieldAlert },
    { id: 'MESSAGES', label: 'messages_comm_perm', icon: Mail },
    { id: 'FILES', label: 'manage_files_perm', icon: ShieldCheck },
  ];

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data } = await getUsersAPI();
      setMembers(data.filter(u => {
        if (u.role === 'OWNER' && currentUser?.role !== 'OWNER') return false;
        return u.role === 'TEAM' || u.role === 'ADMIN' || u.role === 'OWNER';
      }));
    } catch (err) {
      toast.error(t('loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading(t('syncing'));
    try {
      const finalPosition = form.position === 'Custom' ? form.customJobTitle : form.position;
      const fullPhone = form.phone.startsWith('+') ? form.phone : `${countryCode}${form.phone}`;
      
      const payload = { 
        ...form, 
        position: finalPosition,
        phone: fullPhone,
        managedChannels: form.managedChannels ? parseInt(form.managedChannels) : 0,
        monthlySalary: form.monthlySalary ? parseFloat(form.monthlySalary) : 0
      };
      
      if (isEditing) {
        const res = await updateUserAPI(editId, payload);
        console.log("TeamPage: Update Member Success", res.data);
        toast.success(t('saved_successfully'), { id: loadingToast });
      } else {
        const res = await createUserAPI(payload);
        console.log("TeamPage: Create Member Success", res.data);
        toast.success(t('onboard_specialist'), { id: loadingToast });
      }
      
      setShowModal(false);
      resetForm();
      console.log("TeamPage: Re-fetching members list...");
      await fetchMembers();
    } catch (err) {
      console.error("TeamPage: Member Action Error", err);
      toast.error(err.response?.data?.message || t('loading'), { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      firstName: '', lastName: '', email: '', password: '', 
      position: 'Strategist', customJobTitle: '', monthlySalary: '',
      company: '', phone: '', notionLink: '', telegram: '', managedChannels: '',
      role: 'TEAM', avatarUrl: '', permissions: [], isActive: true,
      healthScore: 'GOOD', internalNotes: ''
    });
    setCountryCode('+20');
    setIsEditing(false);
    setEditId(null);
  };

  const openEditModal = (member) => {
    const isCustom = !jobTitles.some(jt => jt.value !== 'ALL' && jt.value !== 'Custom' && jt.value === member.teamMemberInfo?.position);
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      password: '',
      position: isCustom ? 'Custom' : member.teamMemberInfo?.position,
      customJobTitle: isCustom ? member.teamMemberInfo?.position : '',
      monthlySalary: member.teamMemberInfo?.monthlySalary || '',
      company: member.teamMemberInfo?.company || '',
      phone: member.teamMemberInfo?.phone || '',
      notionLink: member.teamMemberInfo?.notionLink || '',
      telegram: member.teamMemberInfo?.telegram || '',
      managedChannels: member.teamMemberInfo?.managedChannels || '',
      role: member.role,
      avatarUrl: member.avatarUrl || '',
      permissions: member.permissions || [],
      isActive: member.isActive ?? true,
      healthScore: member.teamMemberInfo?.healthScore || 'GOOD',
      internalNotes: member.teamMemberInfo?.internalNotes || ''
    });
    
    if (member.teamMemberInfo?.phone?.startsWith('+')) {
      const match = Object.keys(COUNTRY_FLAGS).find(code => member.teamMemberInfo.phone.startsWith(code));
      if (match) setCountryCode(match);
    }

    setEditId(member.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`${t('delete_client_confirm')} ${name}?`)) return;
    // Optimistic update — remove immediately from UI
    setMembers(prev => prev.filter(m => m.id !== id));
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteUserAPI(id); 
      toast.success(t('client_removed'), { id: loadingToast });
      await fetchMembers();
    } catch (err) {
      toast.error(t('failed_remove_client'), { id: loadingToast });
      // Rollback on failure
      await fetchMembers();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('image_size_limit', "حجم الصورة يجب أن يكون أقل من 5 ميجا"));
      return;
    }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadImageAPI(formData);
      setForm({ ...form, avatarUrl: data.url });
      toast.success(t('image_upload_success', "تم رفع الصورة بنجاح"));
    } catch (err) {
      toast.error(t('image_upload_failed', "فشل رفع الصورة"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) return toast.error(t('enter_new_password', "أدخل كلمة المرور الجديدة"));
    const loadingToast = toast.loading(t('updating_ellipsis', "جاري التحديث..."));
    try {
      await resetPasswordAPI(selectedMember.id, newPassword);
      toast.success(t('password_changed_success', "تم تغيير كلمة المرور بنجاح"), { id: loadingToast });
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(t('password_change_failed', "فشل التغيير"), { id: loadingToast });
    }
  };

  const handleBonusSubmit = async (e) => {
    e.preventDefault();
    if (!bonusForm.amount) return toast.error("أدخل المبلغ");
    const loadingToast = toast.loading("جاري تنفيذ المكافأة/الخصم...");
    try {
      await createBonusAPI({
        userId: selectedMember.id,
        amount: parseFloat(bonusForm.amount),
        reason: bonusForm.reason
      });
      toast.success("تم بنجاح! سيصل إشعار 'تن' للعضو الآن.", { id: loadingToast });
      setShowBonusModal(false);
      setBonusForm({ amount: '', reason: '' });
      fetchMembers(); // Refresh to see updated financials if any (though bonuses might need a separate model view)
    } catch (err) {
      toast.error("فشل في العملية", { id: loadingToast });
    }
  };

  const handleContactAction = (type, member) => {
    const email = member.email;
    switch(type) {
      case 'EMAIL':
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
        break;
      default: break;
    }
  };

  const filteredMembers = members.filter(m => {
    const query = searchQuery.toLowerCase();
    const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
    const email = m.email.toLowerCase();
    const pos = (m.teamMemberInfo?.position || '').toLowerCase();
    
    const matchesSearch = fullName.includes(query) || email.includes(query) || pos.includes(query);
    const matchesPosition = activeFilter.position === 'ALL' || m.teamMemberInfo?.position === activeFilter.position;
    const matchesStatus = activeFilter.status === 'ALL' || 
                         (activeFilter.status === 'ACTIVE' && m.isActive !== false) || 
                         (activeFilter.status === 'INACTIVE' && m.isActive === false);

    return matchesSearch && matchesPosition && matchesStatus;
  });

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            {t('team_management')}
            <span className="px-3 py-1 bg-brand-500/10 text-brand-500 text-xs rounded-full border border-brand-500/20">v1.6.0</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg">{t('workforce_management')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Advanced Search */}
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_team_placeholder', "بحث بالاسم، البريد، أو الوظيفة...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.25rem] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>

          {/* Filtering Hub */}
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.25rem] p-1.5 shadow-sm">
            <div className="flex items-center gap-2 px-3 text-slate-400 border-r border-slate-100 dark:border-white/10 mr-1">
              <Filter size={16} />
            </div>
            <select 
              value={activeFilter.position}
              onChange={(e) => setActiveFilter({...activeFilter, position: e.target.value})}
              className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-400 focus:outline-none px-2 py-1.5 cursor-pointer appearance-none"
            >
              {jobTitles.map(jt => <option key={jt.value} value={jt.value}>{t(jt.label, jt.label)}</option>)}
            </select>
            <select 
              value={activeFilter.status}
              onChange={(e) => setActiveFilter({...activeFilter, status: e.target.value})}
              className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-400 focus:outline-none px-2 py-1.5 cursor-pointer appearance-none"
            >
              <option value="ALL">Status: {t('all_label', 'الكل')}</option>
              <option value="ACTIVE">{t('active_status', 'نشط')}</option>
              <option value="INACTIVE">{t('inactive_status', 'غير نشط')}</option>
            </select>
          </div>

          <button 
            onClick={() => { resetForm(); setShowModal(true); }} 
            className="flex items-center justify-center gap-2 px-7 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.25rem] font-bold shadow-xl shadow-brand-600/20 hover:-translate-y-1 active:scale-95 transition-all duration-300"
          >
            <UserPlus size={20} />
            <span>{t('add_member')}</span>
          </button>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-96 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] animate-pulse"></div>
          ))
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
               <UserX className="text-slate-300" size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('no_members_found', 'No members found')}</h3>
            <p className="text-slate-500 font-medium mt-2">{t('adjust_filters_search', 'جرب تعديل الفلترة أو البحث باسم آخر')}</p>
          </div>
        ) : filteredMembers.map(m => (
          <div key={m.id} className={`group relative bg-white dark:bg-[#111111] border rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 ${
            m.isActive === false ? 'border-rose-500/30' : 'border-slate-100 dark:border-white/5 hover:border-brand-500/30'
          }`}>
            {/* Direct Link to Profile */}
            <Link to={`/admin/team/${m.id}`} className="absolute top-6 left-6 p-2 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-500 rounded-xl transition-all opacity-0 group-hover:opacity-100">
               <ExternalLink size={16} />
            </Link>

            {/* Real-time WhatsApp-style Presence Badge */}
            <div className="absolute top-6 right-6">
              <UserPresenceBadge userId={m.id} initialOnline={m.isOnline} initialLastActive={m.lastActiveAt} />
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center text-center pt-2">
              <div className="relative mb-5">
                <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
                  m.role === 'OWNER' ? 'border-amber-500' : 'border-slate-100 dark:border-white/10'
                }`}>
                  {m.avatarUrl ? (
                    <img src={getFormattedAvatarUrl(m.avatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-3xl font-black text-slate-300">
                      {m.firstName?.[0]}
                    </div>
                  )}
                </div>
                {/* Live dot on avatar */}
                <UserPresenceBadge userId={m.id} initialOnline={m.isOnline} initialLastActive={m.lastActiveAt} variant="dot" className="absolute bottom-1 right-1" />
                {m.role === 'OWNER' && (
                  <div className="absolute -bottom-2 -left-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#0a0a0c]">
                    <ShieldAlert size={16} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">{m.firstName} {m.lastName}</h3>
              <div className="px-4 py-1.5 bg-brand-500/10 text-brand-500 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-brand-500/20 mb-4">
                {m.teamMemberInfo?.position || 'Team Member'}
              </div>

              {/* Multi-factor Commitment & Engagement Score */}
              {m.performance && (
                <div className="w-full flex flex-col gap-1.5 p-3.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl mb-4 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">{t('commitment_score_label', 'مؤشر الالتزام والتواجد')}:</span>
                    <span className="font-black text-brand-500 text-xs">{m.performance.commitmentScore}% ({m.performance.rating})</span>
                  </div>
                  {m.performance.breakdown && (
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200 dark:border-white/5 text-[9px] font-bold text-slate-500">
                      <div className="text-center" title="إنجاز المهام والتسليمات">
                        <span className="block text-slate-400">📌 المهام</span>
                        <span className="text-slate-700 dark:text-slate-200 font-black">{m.performance.breakdown.taskScore}%</span>
                      </div>
                      <div className="text-center" title="التواجد والنشاط على المنصة">
                        <span className="block text-slate-400">🟢 التواجد</span>
                        <span className="text-emerald-500 font-black">{m.performance.breakdown.presenceScore}%</span>
                      </div>
                      <div className="text-center" title="المتابعة والتفاعل في الشات والعملاء">
                        <span className="block text-slate-400">💬 المتابعة</span>
                        <span className="text-indigo-400 font-black">{m.performance.breakdown.communicationScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Finance Tracker */}
              <div className="w-full grid grid-cols-3 gap-2 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2rem] mb-6">
                <div className="text-center border-r border-slate-200 dark:border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('due_label')}</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white">${m.finance?.totalSalary || 0}</p>
                </div>
                <div className="text-center border-r border-slate-200 dark:border-white/5">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter mb-1">{t('paid_label')}</p>
                  <p className="text-xs font-black text-emerald-500">${m.finance?.paid || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-brand-500 uppercase tracking-tighter mb-1">{t('rest_label')}</p>
                  <p className="text-xs font-black text-brand-500">${m.finance?.remaining || 0}</p>
                </div>
              </div>

              {/* Action Hub */}
              <div className="flex flex-col gap-2 w-full mt-auto">
                <Link 
                  to={`/admin/team/${m.id}`}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-brand-600/20 active:scale-95 group-hover:-translate-y-1"
                >
                  <ExternalLink size={18} />
                  {t('open_freelancer_profile', 'فتح بروفايل العضو المستقل')}
                </Link>
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => openEditModal(m)}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Settings size={14} /> {t('edit_label', 'تعديل')}
                  </button>
                  <button 
                    onClick={() => { setSelectedMember(m); setShowBonusModal(true); }}
                    className="p-2.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl transition-all flex items-center justify-center"
                    title="Give Bonus/Penalty"
                  >
                    <Coins size={16} />
                  </button>
                  <button 
                    onClick={() => { setSelectedMember(m); setShowPasswordModal(true); }}
                    className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Key size={16} />
                  </button>
                  {m.role !== 'OWNER' && (
                    <button 
                      onClick={() => handleDelete(m.id, `${m.firstName} ${m.lastName}`)}
                      className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unified Sectioned Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-4xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 max-h-[95vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="px-8 md:px-10 py-8 border-b border-slate-100 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 shadow-inner">
                   <UserPlus size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                    {isEditing ? t('edit_member_data', 'تعديل بيانات العضو') : t('add_new_team_member', 'إضافة عضو جديد للفريق')}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">{isEditing ? 'UPDATE PARTNER ACCESS' : 'CREATE TEAM MEMBER PROFILE'}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-white/5 rounded-2xl transition-all active:scale-95">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAction} className="p-8 md:p-10 space-y-12">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-500 border border-slate-100 dark:border-white/10">
                    <User size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('basic_info_label', 'البيانات الأساسية (Basic Info)')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('first_name', 'الاسم الأول')}</label>
                    <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('last_name', 'الاسم الأخير')}</label>
                    <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('work_entity', 'اسم الشركة (Work Entity)')}</label>
                    <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" placeholder="Creziax Associate" />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('email_address', 'البريد الإلكتروني')}</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('password', 'كلمة المرور')}</label>
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!isEditing} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all" placeholder={isEditing ? "••••••••" : ""} />
                  </div>
                  <div className="space-y-2 md:col-span-1 border-brand-500/20">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('account_role', 'نوع الحساب (Role)')}</label>
                    <select 
                      value={form.role} 
                      onChange={e => setForm({...form, role: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="TEAM">{t('team_member_role', 'عضو فريق عمل')}</option>
                      <option value="ADMIN">{t('system_admin_role', 'مسؤول نظام (Admin)')}</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-1 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phone_number', 'رقم الهاتف (WhatsApp)')}</label>
                    <div className="flex gap-2">
                      <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-24 px-3 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-brand-500/10">
                        {Object.entries(COUNTRY_FLAGS).map(([code, iso]) => (
                          <option key={code} value={code}>+{code.replace('+', '')} {iso.toUpperCase()}</option>
                        ))}
                      </select>
                      <div className="flex-1 relative">
                        <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10" placeholder="012xxxxxxx" />
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                           {getCountryFlagUrl(form.phone.startsWith('+') ? form.phone : `${countryCode}${form.phone}`) && (
                             <img src={getCountryFlagUrl(form.phone.startsWith('+') ? form.phone : `${countryCode}${form.phone}`)} alt="flag" className="w-6 h-auto rounded-sm shadow-sm" />
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Functional Data — TEAM only */}
              {form.role === 'TEAM' && (
                <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-500 border border-slate-100 dark:border-white/10">
                      <Briefcase size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('job_details_label', 'البيانات الوظيفية (Job Details)')}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('job_position', 'المسمى الوظيفي')}</label>
                      <select value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10">
                        {jobTitles.filter(jt => jt.value !== 'ALL').map(jt => <option key={jt.value} value={jt.value}>{t(jt.label, jt.label)}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('managed_channels_count', 'القنوات المدارة')}</label>
                      <input type="number" value={form.managedChannels} onChange={e => setForm({...form, managedChannels: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('member_notion_link', 'رابط Notion الخاص بالعضو')}</label>
                      <input value={form.notionLink} onChange={e => setForm({...form, notionLink: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10" placeholder="https://notion.so/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('telegram_link', 'رابط Telegram')}</label>
                      <input value={form.telegram} onChange={e => setForm({...form, telegram: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10" placeholder="@username" />
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Financial Data — TEAM only */}
              {form.role === 'TEAM' && (
                <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                      <DollarSign size={16} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('financials_label', 'البيانات المالية (Financials)')}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('total_salary_label', 'إجمالي الراتب ($)')}</label>
                      <input type="number" value={form.monthlySalary} onChange={e => setForm({...form, monthlySalary: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-emerald-600 dark:text-emerald-400 font-black focus:ring-4 focus:ring-emerald-500/10" />
                    </div>
                    {isEditing && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('paid_amount', 'ما تم دفعه')}</label>
                          <div className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 font-bold opacity-60">
                            ${selectedMember?.finance?.paid || 0}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('remaining_amount', 'المتبقي')}</label>
                          <div className="w-full px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-500 font-bold opacity-60">
                            ${selectedMember?.finance?.remaining || 0}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Section 2B: Admin Permissions Matrix — ADMIN only */}
              {form.role === 'ADMIN' && (
                <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('admin_permissions_label', 'صلاحيات لوحة التحكم')}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{t('admin_permissions_desc', 'اختر الأقسام المتاحة لهذا المسؤول')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = availablePermissions.map(p => p.id);
                        const allSelected = allIds.every(id => form.permissions.includes(id));
                        setForm({ ...form, permissions: allSelected ? [] : allIds });
                      }}
                      className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 transition-all"
                    >
                      {availablePermissions.every(p => form.permissions.includes(p.id))
                        ? t('deselect_all', 'إلغاء الكل')
                        : t('select_all', 'تحديد الكل')}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availablePermissions.map(perm => {
                      const isSelected = form.permissions.includes(perm.id);
                      const Icon = perm.icon;
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => {
                            const next = isSelected
                              ? form.permissions.filter(p => p !== perm.id)
                              : [...form.permissions, perm.id];
                            setForm({ ...form, permissions: next });
                          }}
                          className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 active:scale-95 ${
                            isSelected
                              ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10'
                              : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 hover:border-indigo-500/40'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                          }`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black uppercase tracking-widest ${
                              isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                            }`}>{t(perm.label, perm.label)}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{perm.id}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-white/20'
                          }`}>
                            {isSelected && <ShieldCheck size={10} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {form.permissions.length === 0 && (
                    <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <ShieldAlert size={16} className="text-amber-500 flex-shrink-0" />
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {t('no_permissions_warning', 'تحذير: لم تحدد أي صلاحيات. المسؤول لن يرى أي قسم.')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Section 4: Status & Health */}
              <div className="space-y-8 pt-10 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-500 border border-slate-100 dark:border-white/10">
                    <Heart size={16} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">{t('vitals_label', 'حالة الحساب والصحة (Vitals)')}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('account_status_label', 'الحالة (Account Status)')}</label>
                    <button type="button" onClick={() => setForm({...form, isActive: !form.isActive})} className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all font-black text-xs ${form.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}>
                      {form.isActive ? t('active_muaffal', 'ACTIVE / مُفعل') : t('inactive_muattal', 'INACTIVE / مُعطل')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('health_score_label', 'الحالة الصحية (Health Score)')}</label>
                    <div className="flex gap-2">
                      {healthScores.map(score => (
                        <button key={score.value} type="button" onClick={() => setForm({...form, healthScore: score.value})} className={`flex-1 py-4 rounded-2xl border-2 transition-all text-xl ${form.healthScore === score.value ? 'bg-white dark:bg-white/5 border-brand-500 shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-40'}`}>
                          {score.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('internal_notes_hint', 'ملاحظات داخلية')}</label>
                    <textarea value={form.internalNotes} onChange={e => setForm({...form, internalNotes: e.target.value})} rows="3" className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10 transition-all resize-none" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 sticky bottom-0 bg-white dark:bg-[#0a0a0c] z-10 transition-all">
                <button type="submit" disabled={submitting} className="flex-[3] py-5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-[1.5rem] shadow-2xl shadow-brand-600/30 hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3">
                  {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? t('save_member_changes', 'حفظ التعديلات') : t('add_new_member', 'إضافة عضو جديد'))}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black rounded-[1.5rem] hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs uppercase tracking-[0.2em]">
                  {t('cancel', 'إلغاء')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowPasswordModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative z-10 animate-in zoom-in-95">
             <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/10 shadow-inner">
                   <Key size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('reset_password_label', 'إعادة تعيين كلمة المرور')}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-black uppercase tracking-widest">{t('reset_access_for', 'RESET ACCESS FOR')}: {selectedMember?.firstName}</p>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('new_password_label', 'كلمة المرور الجديدة')}</label>
                   <input 
                     type="password" 
                     value={newPassword} 
                     onChange={e => setNewPassword(e.target.value)} 
                     className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-brand-500/10"
                     placeholder="••••••••"
                   />
                </div>
                <button 
                  onClick={handleResetPassword}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
                >
                  {t('change_password_now', 'تغيير كلمة المرور فوراً')}
                </button>
                <button onClick={() => setShowPasswordModal(false)} className="w-full py-4 text-slate-400 font-black text-[10px] hover:text-slate-600 uppercase tracking-widest transition-colors">{t('cancel_operation', 'إلغاء العملية')}</button>
             </div>
          </div>
        </div>
      )}
      {/* Bonus/Penalty Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowBonusModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative z-10 animate-in zoom-in-95">
             <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/10 shadow-inner">
                   <Coins size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">مكافأة أو خصم مالي</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-black uppercase tracking-widest">Team Performance Adjustment: {selectedMember?.firstName}</p>
             </div>
             
             <form onSubmit={handleBonusSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">المبلغ (موجب للمكافأة / سالب للخصم)</label>
                   <input 
                     type="number" 
                     step="0.01"
                     value={bonusForm.amount} 
                     onChange={e => setBonusForm({...bonusForm, amount: e.target.value})} 
                     className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-black text-center text-2xl focus:ring-4 focus:ring-amber-500/10"
                     placeholder="0.00"
                     required
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">السبب (Reason)</label>
                   <textarea 
                     value={bonusForm.reason} 
                     onChange={e => setBonusForm({...bonusForm, reason: e.target.value})} 
                     className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-4 focus:ring-amber-500/10 resize-none"
                     placeholder="Ex: Outstanding Performance"
                     rows="2"
                   />
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-xl shadow-amber-600/30 transition-all active:scale-95"
                >
                  تأكيد وإرسال إشعار
                </button>
                <button onClick={() => setShowBonusModal(false)} type="button" className="w-full py-4 text-slate-400 font-black text-[10px] hover:text-slate-600 uppercase tracking-widest transition-colors">{t('cancel_operation', 'إلغاء العملية')}</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
