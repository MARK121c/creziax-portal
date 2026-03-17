import { useEffect, useState, useRef } from 'react';
import { getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI, uploadImageAPI, resetPasswordAPI, createExpenseAPI } from '../../store/api';
import { 
  Trash2, Plus, X, User, Mail, Calendar, Search, Loader2, UserPlus, 
  ShieldAlert, ShieldCheck, Camera, UploadCloud, ExternalLink, 
  MessageCircle, SendHorizontal, DollarSign, Wallet, ArrowUpRight, 
  Key, RefreshCw, Power, Heart, Briefcase, ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const jobTitles = [
  { value: 'Video Editor', label: 'Video Editor' },
  { value: 'Media Buyer', label: 'Media Buyer' },
  { value: 'Graphic Designer', label: 'Graphic Designer' },
  { value: 'Account Manager', label: 'Account Manager' },
  { value: 'Copywriter', label: 'Copywriter' },
  { value: 'Custom', label: 'أخرى (Custom)' },
];

const getFormattedAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const TeamPage = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [form, setForm] = useState({ 
    firstName: '', lastName: '', email: '', password: '', 
    position: 'Video Editor', customJobTitle: '', monthlySalary: '',
    role: 'TEAM', avatarUrl: '', permissions: [], isActive: true 
  });
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const availablePermissions = [
    { id: 'CLIENTS', label: 'إدارة العملاء', icon: ShieldCheck },
    { id: 'TEAM', label: 'إدارة الفريق', icon: ShieldAlert },
    { id: 'PROJECTS', label: 'إدارة المشاريع', icon: ShieldCheck },
    { id: 'FINANCES', label: 'المالية والفواتير', icon: ShieldAlert },
    { id: 'MESSAGES', label: 'الرسائل والتواصل', icon: Mail },
    { id: 'FILES', label: 'إدارة الملفات', icon: ShieldCheck },
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
      const payload = { ...form, position: finalPosition };
      
      if (isEditing) {
        await updateUserAPI(editId, payload);
        toast.success(t('saved_successfully'), { id: loadingToast });
      } else {
        await createUserAPI(payload);
        toast.success(t('onboard_specialist'), { id: loadingToast });
      }
      
      setShowModal(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || t('loading'), { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      firstName: '', lastName: '', email: '', password: '', 
      position: 'Video Editor', customJobTitle: '', monthlySalary: '',
      role: 'TEAM', avatarUrl: '', permissions: [], isActive: true 
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleEdit = (member) => {
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      password: '',
      position: jobTitles.some(jt => jt.value === member.teamMemberInfo?.position) ? member.teamMemberInfo?.position : 'Custom',
      customJobTitle: jobTitles.some(jt => jt.value === member.teamMemberInfo?.position) ? '' : member.teamMemberInfo?.position,
      monthlySalary: member.teamMemberInfo?.monthlySalary || '',
      role: member.role,
      avatarUrl: member.avatarUrl || '',
      permissions: member.permissions || [],
      isActive: member.isActive ?? true
    });
    setEditId(member.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`${t('delete_client_confirm')} ${name}?`)) return;
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteUserAPI(id); 
      toast.success(t('client_removed'), { id: loadingToast });
      fetchMembers(); 
    } catch (err) {
      toast.error(t('failed_remove_client'), { id: loadingToast });
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجا");
      return;
    }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const { data } = await uploadImageAPI(formData);
      setForm({ ...form, avatarUrl: data.url });
      toast.success("تم رفع الصورة بنجاح");
    } catch (err) {
      toast.error("فشل رفع الصورة");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) return toast.error("أدخل كلمة المرور الجديدة");
    const loadingToast = toast.loading("جاري التحديث...");
    try {
      await resetPasswordAPI(selectedMember.id, newPassword);
      toast.success("تم تغيير كلمة المرور بنجاح", { id: loadingToast });
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error("فشل التغيير", { id: loadingToast });
    }
  };

  const handleContactAction = (type, member) => {
    const email = member.email;
    const phone = member.teamMemberInfo?.phone || ''; // Assuming we add phone soon or use user phone
    
    switch(type) {
      case 'WHATSAPP':
        if(!phone) return toast.error("رقم الهاتف غير مسجل");
        window.open(`https://wa.me/${phone.replace('+', '')}`, '_blank');
        break;
      case 'TELEGRAM':
        toast.info("تواصل عبر التليجرام قريباً");
        break;
      case 'EMAIL':
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`, '_blank');
        break;
    }
  };

  const filteredMembers = members.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.teamMemberInfo?.position?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            {t('team_management')}
            <span className="px-3 py-1 bg-brand-500/10 text-brand-500 text-xs rounded-full border border-brand-500/20">v1.6.0</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg">إدارة القوى العاملة والنظام المالي للفريق</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_team')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.25rem] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-80 shadow-sm font-bold"
            />
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
            <div key={i} className="h-80 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] animate-pulse"></div>
          ))
        ) : filteredMembers.map(m => (
          <div key={m.id} className={`group relative bg-white dark:bg-[#0a0a0c]/40 border rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 ${
            m.isActive === false ? 'border-rose-500/30 opacity-75' : 'border-slate-100 dark:border-white/5 hover:border-brand-500/30'
          }`}>
            {/* Status Badge */}
            <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              m.isActive === false ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            }`}>
              {m.isActive === false ? 'Inactive' : 'Active'}
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className={`w-24 h-24 rounded-[2rem] overflow-hidden border-4 shadow-2xl transition-transform duration-500 group-hover:scale-105 ${
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
                {m.role === 'OWNER' && (
                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-[#0a0a0c]">
                    <ShieldAlert size={16} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">{m.firstName} {m.lastName}</h3>
              <div className="px-4 py-1.5 bg-brand-500/5 text-brand-500 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border border-brand-500/10 mb-4">
                {m.teamMemberInfo?.position || 'Specialist'}
              </div>

              {/* Contact Icons */}
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => handleContactAction('EMAIL', m)}
                  className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                  title="Gmail Compose"
                >
                  <Mail size={18} />
                </button>
                <button 
                  onClick={() => handleContactAction('WHATSAPP', m)}
                  className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                >
                  <SendHorizontal size={18} />
                </button>
                <button 
                  onClick={() => handleContactAction('TELEGRAM', m)}
                  className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                >
                  <MessageCircle size={18} />
                </button>
              </div>

              {/* Finance Tracker (The "Hassala") */}
              <div className="w-full grid grid-cols-3 gap-2 p-5 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2rem] mb-6">
                <div className="text-center border-r border-slate-200 dark:border-white/5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Due</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white">${m.finance?.totalSalary || 0}</p>
                </div>
                <div className="text-center border-r border-slate-200 dark:border-white/5">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter mb-1">Paid</p>
                  <p className="text-xs font-black text-emerald-500">${m.finance?.paid || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-black text-brand-500 uppercase tracking-tighter mb-1">Rest</p>
                  <p className="text-xs font-black text-brand-500">${m.finance?.remaining || 0}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full mt-auto">
                <button 
                  onClick={() => handleEdit(m)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-brand-500 hover:text-white text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <RefreshCw size={14} />
                  إدارة
                </button>
                <button 
                  onClick={() => { setSelectedMember(m); setShowPasswordModal(true); }}
                  className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all"
                  title="Reset Password"
                >
                  <Key size={16} />
                </button>
                {m.role !== 'OWNER' && (
                  <button 
                    onClick={() => handleDelete(m.id, `${m.firstName} ${m.lastName}`)}
                    className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 max-h-[90vh] overflow-y-auto">
            <div className="px-8 md:px-10 py-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {isEditing ? 'تعديل بيانات العضو' : 'إضافة عضو جديد للفريق'}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">ضبط الصلاحيات والبيانات الوظيفية والمالية</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAction} className="p-8 md:p-10 space-y-8">
              {/* Avatar Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 border border-slate-200 dark:border-white/10 rounded-[2rem] bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="relative w-28 h-28 rounded-[2rem] bg-white dark:bg-white/5 shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {form.avatarUrl ? (
                    <img src={getFormattedAvatarUrl(form.avatarUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-slate-300" />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <p className="text-base font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">الصورة الشخصية</p>
                  <p className="text-xs text-slate-400 font-bold mb-4">يُنصح بصور مربعة عالية الجودة (بحد أقصى 5MB)</p>
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-black rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                      <Camera size={16} />
                      {form.avatarUrl ? 'تغيير' : 'رفع صورة'}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    {form.avatarUrl && (
                      <button type="button" onClick={() => setForm({...form, avatarUrl: ''})} className="px-5 py-3 bg-rose-500/10 text-rose-500 text-xs font-black rounded-xl border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">الاسم الأول</label>
                  <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">الاسم الأخير</label>
                  <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">البريد الإلكتروني</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all" />
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">كلمة المرور</label>
                  <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">نوع المستخدم</label>
                  <select 
                    value={form.role} 
                    onChange={e => setForm({...form, role: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold appearance-none cursor-pointer"
                  >
                    <option value="TEAM">Team Member</option>
                    {currentUser?.role === 'OWNER' && <option value="ADMIN">Administrator</option>}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">المسمى الوظيفي</label>
                  <select 
                    value={form.position} 
                    onChange={e => setForm({...form, position: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold appearance-none cursor-pointer"
                  >
                    {jobTitles.map(jt => <option key={jt.value} value={jt.value}>{jt.label}</option>)}
                  </select>
                </div>
              </div>

              {form.position === 'Custom' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">أدخل المسمى الوظيفي يدوياً</label>
                  <input value={form.customJobTitle} onChange={e => setForm({...form, customJobTitle: e.target.value})} required className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all" placeholder="e.g. Creative Lead" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">الراتب الشهري ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="number" value={form.monthlySalary} onChange={e => setForm({...form, monthlySalary: e.target.value})} className="w-full pl-11 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">حالة الحساب</label>
                  <button 
                    type="button"
                    onClick={() => setForm({...form, isActive: !form.isActive})}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border font-black transition-all ${
                      form.isActive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 uppercase tracking-widest text-[10px]">
                      <Power size={16} />
                      {form.isActive ? 'Active Member' : 'Inactive Account'}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${form.isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'}`}></div>
                  </button>
                </div>
              </div>

              {/* Permissions for Admin */}
              {form.role === 'ADMIN' && (
                <div className="space-y-6 p-8 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-[2.5rem]">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldAlert size={20} className="text-amber-500" />
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">صلاحيات المدير (Admin Security Privileges)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availablePermissions.map(perm => {
                      const isActive = form.permissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          type="button"
                          onClick={() => {
                            const newPerms = isActive ? form.permissions.filter(p => p !== perm.id) : [...form.permissions, perm.id];
                            setForm({...form, permissions: newPerms});
                          }}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                            isActive ? 'bg-brand-500/10 border-brand-500/30 text-brand-600 dark:text-brand-400' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <perm.icon size={16} />
                            <span className="text-xs font-bold uppercase tracking-tight">{perm.label}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isActive ? 'border-brand-500 bg-brand-500' : 'border-slate-200 dark:border-white/10'
                          }`}>
                            {isActive && <CheckIcon size={12} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 sticky bottom-0 bg-white dark:bg-[#0a0a0c] pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                  إلغاء
                </button>
                <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 active:scale-95 transition-all">
                  {submitting ? <Loader2 className="animate-spin mx-auto" /> : (isEditing ? 'تحديث البيانات' : 'إضافة للفريق')}
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
                <div className="w-16 h-16 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <Key size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">إعادة تعيين كلمة المرور</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">للعضو: {selectedMember?.firstName} {selectedMember?.lastName}</p>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">كلمة المرور الجديدة</label>
                   <input 
                     type="password" 
                     value={newPassword} 
                     onChange={e => setNewPassword(e.target.value)} 
                     className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-brand-500/20"
                     placeholder="••••••••"
                   />
                </div>
                <button 
                  onClick={handleResetPassword}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-lg shadow-brand-600/20 transition-all"
                >
                  تغيير كلمة المرور فوراً
                </button>
                <button onClick={() => setShowPasswordModal(false)} className="w-full py-4 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors">إغلاق</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon = ({size, className}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>;

export default TeamPage;
