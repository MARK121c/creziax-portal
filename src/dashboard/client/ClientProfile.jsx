import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Camera, CheckCircle2, 
  Trash2, UploadCloud, Loader2, Key, Building2, Phone, UserCircle
} from 'lucide-react';
import { uploadImageAPI, updateProfileAPI } from '../../store/api'; // Ensure API imports for upload

const getFormattedUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  // Branding Guard: Filter out any legacy image URLs that are not from Creziax
  if (url.toLowerCase().includes('shahwa')) return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const ClientProfile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  
  const fileInputRefAvatar = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.clientInfo?.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword) {
      if (!formData.currentPassword) { toast.error(t('current_password_required')); return; }
      if (formData.newPassword !== formData.confirmPassword) { toast.error(t('passwords_not_match')); return; }
      if (formData.newPassword.length < 6) { toast.error(t('password_too_short')); return; }
    }

    setLoading(true);
    const loadingToast = toast.loading(t('saving_changes'));
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t('profile_updated_success'), { id: loadingToast });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      toast.error(error.message || t('update_failed'), { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };


  // Avatar Handlers
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t('image_too_large')); return; }
    setUploadingAvatar(true);
    const loadingToast = toast.loading('جاري رفع الصورة الشخصية...');
    const uploadData = new FormData(); uploadData.append('image', file);
    try {
      const { data } = await uploadImageAPI(uploadData);
      await updateProfileAPI({ avatarUrl: data.url });
      // Call updateProfile locally to sync Zustand state
      await updateProfile({ avatarUrl: data.url });
      toast.success('تم تحديث الصورة الشخصية بنجاح', { id: loadingToast });
    } catch (err) {
      toast.error('فشل رفع الصورة', { id: loadingToast });
    } finally { setUploadingAvatar(false); }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('هل أنت متأكد من حذف صورتك الشخصية؟')) return;
    setUploadingAvatar(true);
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      await updateProfileAPI({ avatarUrl: null });
      await updateProfile({ avatarUrl: null });
      toast.success(t('image_deleted_success'), { id: loadingToast });
    } catch (err) {
      toast.error(t('image_delete_failed'), { id: loadingToast });
    } finally { setUploadingAvatar(false); }
  };

  const avatarUrl = user?.avatarUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
            {t('my_profile', 'إعدادات الحساب')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-6 md:mt-8 font-bold text-sm md:text-lg flex items-center gap-3 opacity-80">
            <span className="w-8 md:w-12 h-[2px] bg-brand-500 rounded-full" />
            {t('manage_account_desc', 'إدارة بيانات الشركة وإعدادات الأمان')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Cards */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Personal Avatar Card */}
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-sm relative overflow-hidden group backdrop-blur-3xl">
            <div className="absolute top-4 left-4 bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-widest">
              الصورة الشخصية
            </div>
            <div className="relative mb-6 mt-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-50 dark:bg-white/5 border-4 border-white dark:border-[#121214] shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                {avatarUrl ? (
                  <img src={getFormattedUrl(avatarUrl)} alt="Personal Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-indigo-500/5 dark:to-white/5 flex items-center justify-center">
                    <UserCircle size={40} className="text-indigo-300 dark:text-indigo-500/50" />
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRefAvatar.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                <Camera size={14} />
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                {user?.firstName} {user?.lastName}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button 
                onClick={() => fileInputRefAvatar.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-100 dark:border-white/5"
              >
                <UploadCloud size={14} /> {t('upload', 'رفع')}
              </button>
              <button 
                onClick={handleDeleteAvatar}
                disabled={uploadingAvatar || !avatarUrl}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-slate-100 dark:border-white/5"
              >
                <Trash2 size={14} /> {t('delete', 'حذف')}
              </button>
            </div>
            <input type="file" ref={fileInputRefAvatar} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

        </div>

        {/* Main Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-10 shadow-sm backdrop-blur-3xl">
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">{t('core_profile', 'البيانات الأساسية')}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('first_name_label', 'الاسم الأول')}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('last_name_label', 'الاسم الأخير')}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                    {t('email_label_profile', 'البريد الإلكتروني')}
                    <span className="text-[9px] text-brand-500/60 bg-brand-500/10 px-2 rounded-md">{t('read_only', 'للقراءة فقط')}</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                      dir="ltr"
                    />
                  </div>
                </div>


                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('phone_number', 'رقم الهاتف')}</label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pr-12 pl-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>

                {user?.clientInfo?.notionLink && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                      {t('notion_workspace', 'مساحة العمل (Notion)')}
                    </label>
                    <a
                      href={user.clientInfo.notionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline transition-all"
                      dir="ltr"
                    >
                      <span className="truncate">{user.clientInfo.notionLink}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">{t('security_settings', 'إعدادات الأمان')}</h3>
                </div>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('current_password_label', 'كلمة المرور الحالية')}</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('new_password_label', 'كلمة المرور الجديدة')}</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('confirm_password_label', 'تأكيد كلمة المرور')}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-4 border-t border-slate-100 dark:border-white/5">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.25rem] font-black transition-all shadow-xl shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-widest"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {t('save_final_changes', 'حفظ التغييرات')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;
