import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Camera, CheckCircle2, ShieldCheck, 
  Trash2, UploadCloud, Loader2, Key, Shield, Wallet
} from 'lucide-react';

const getFormattedAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    // Payment Settings
    paypal: localStorage.getItem('creziax_pay_paypal') || '',
    vodafone: localStorage.getItem('creziax_pay_vodafone') || '',
    instapay: localStorage.getItem('creziax_pay_instapay') || '',
    bank: localStorage.getItem('creziax_pay_bank') || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Security Validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error(t('current_password_required', 'كلمة المرور الحالية مطلوبة لتغييرها'));
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error(t('passwords_not_match', 'كلمات المرور الجديدة غير متطابقة'));
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error(t('password_too_short', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'));
        return;
      }
    }

    setLoading(true);
    const loadingToast = toast.loading(t('saving_changes', 'جاري حفظ التعديلات...'));
    try {
      if (formData.paypal) localStorage.setItem('creziax_pay_paypal', formData.paypal);
      if (formData.vodafone) localStorage.setItem('creziax_pay_vodafone', formData.vodafone);
      if (formData.instapay) localStorage.setItem('creziax_pay_instapay', formData.instapay);
      if (formData.bank) localStorage.setItem('creziax_pay_bank', formData.bank);
      
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t('profile_updated_success', 'تم تحديث الملف الشخصي بنجاح'), { id: loadingToast });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      toast.error(error.message || t('update_failed', 'فشل التحديث'), { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('image_too_large', "حجم الصورة يجب أن يكون أقل من 5 ميجا"));
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading(t('uploading_image', 'جاري رفع الصورة...'));
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const { uploadImageAPI } = await import('../../store/api');
      const { data } = await uploadImageAPI(uploadFormData);
      await updateProfile({ avatarUrl: data.url });
      toast.success(t('image_updated_success', "تم تحديث الصورة بنجاح"), { id: loadingToast });
    } catch (err) {
      toast.error(t('image_upload_failed', "فشل رفع الصورة"), { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm(t('confirm_delete_avatar', 'هل أنت متأكد من حذف الصورة الشخصية؟'))) return;
    
    setUploading(true);
    const loadingToast = toast.loading(t('deleting_image', 'جاري حذف الصورة...'));
    try {
      await updateProfile({ avatarUrl: null });
      toast.success(t('image_deleted_success', "تم حذف الصورة بنجاح"), { id: loadingToast });
    } catch (err) {
      toast.error(t('image_delete_failed', "فشل حذف الصورة"), { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 selection:bg-brand-500/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {t('profile_title', 'الملف الشخصي')}
            <span className="px-3 py-1 bg-brand-500/10 text-brand-500 text-[10px] rounded-full border border-brand-500/20 uppercase tracking-widest">
              {t('admin_profile', 'Admin Profile')}
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg">{t('control_your_data', 'تحكم في بياناتك الشخصية وإعدادات الأمان الخاصة بك')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col - Avatar Management */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl group-hover:bg-brand-500/10 transition-colors duration-500"></div>
            
            <div className="relative mb-6">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-slate-50 dark:bg-white/5 border-4 border-white dark:border-[#121214] shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                {user?.avatarUrl ? (
                  <img src={getFormattedAvatarUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/[0.02] flex items-center justify-center">
                    <User size={64} className="text-slate-300 dark:text-slate-700" />
                  </div>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 size={32} className="text-white animate-spin" />
                  </div>
                )}
              </div>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl shadow-xl shadow-brand-500/30 transition-all active:scale-95"
                title={t('change_image', 'تغيير الصورة')}
              >
                <Camera size={20} />
              </button>
            </div>
            
            <div className="space-y-1">
              <h1 className="font-black text-2xl text-slate-900 dark:text-white uppercase tracking-tight">
                {user?.firstName} {user?.lastName}
              </h1>
              <div className="flex items-center justify-center gap-2">
                 <Shield size={14} className="text-brand-500" />
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                   {user?.role === 'OWNER' ? t('owner_role_desc', 'المالك العام - SYSTEM CEO') : `${t('admin_role_fixed', 'مسؤول')} - ${user?.role}`}
                 </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-8">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-50 dark:bg-white/5 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 rounded-2xl font-black text-xs transition-all border border-slate-100 dark:border-white/5"
              >
                <UploadCloud size={16} />
                {t('upload_photo', 'رفع صورة')}
              </button>
              <button 
                onClick={handleDeleteAvatar}
                disabled={uploading || !user?.avatarUrl}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-50 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-2xl font-black text-xs transition-all border border-slate-100 dark:border-white/5"
              >
                <Trash2 size={16} />
                {t('delete', 'حذف')}
              </button>
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Quick Info Card */}
          <div className="bg-brand-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-brand-600/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <ShieldCheck size={120} />
             </div>
             <h3 className="text-lg font-black uppercase tracking-tight mb-2">{t('account_status', 'حالة الحساب')}</h3>
             <p className="text-white/70 text-sm font-bold leading-relaxed">{t('account_status_desc', 'أنت الآن تستخدم لوحة التحكم بصلاحيات كاملة. تأكد دائماً من تأمين حسابك بكلمة مرور قوية.')}</p>
             <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">متصل الآن - SECURE SESSION</span>
             </div>
          </div>
        </div>

        {/* Right Col - Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-100 dark:border-white/5 p-8 md:p-10 rounded-[2.5rem] space-y-12 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            
            {/* Personal Info Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/10">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">البيانات الأساسية</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Basic Profile Information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('first_name_label', 'الاسم الأول')}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('last_name_label', 'الاسم الأخير')}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center justify-between">
                    {t('email_label_profile', 'البريد الإلكتروني')}
                    {user?.role !== 'OWNER' && (
                       <span className="text-[9px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md">{t('contact_admin_to_change', 'تواصل مع الإدارة للتغيير')}</span>
                    )}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={user?.role === 'OWNER' ? handleChange : undefined}
                      className={`w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white ${user?.role !== 'OWNER' ? 'cursor-not-allowed opacity-60' : ''}`}
                      readOnly={user?.role !== 'OWNER'}
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/5 w-full"></div>

            {/* Payment Details Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('finance_settings_title', 'الإعدادات المالية')}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('finance_settings_desc')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('paypal_email')}</label>
                  <input
                    type="text"
                    name="paypal"
                    value={formData.paypal}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('vodafone_number')}</label>
                  <input
                    type="text"
                    name="vodafone"
                    value={formData.vodafone}
                    onChange={handleChange}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('instapay_address')}</label>
                  <input
                    type="text"
                    name="instapay"
                    value={formData.instapay}
                    onChange={handleChange}
                    placeholder="username@instapay"
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('bank_details')}</label>
                  <textarea
                    name="bank"
                    value={formData.bank}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Bank Name | Account Number | IBAN"
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-brand-500/50 outline-none transition-all dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-white/5 w-full"></div>

            {/* Security Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t('security_settings_title', 'إعدادات الأمان')}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Change Account Password</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('current_password_label', 'كلمة المرور الحالية')}</label>
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('new_password_label', 'كلمة المرور الجديدة')}</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">{t('confirm_password_label', 'تأكيد كلمة المرور')}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="group flex items-center justify-center gap-3 px-10 py-5 bg-brand-600 hover:bg-brand-500 text-white rounded-[1.5rem] font-black transition-all shadow-2xl shadow-brand-600/30 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    {t('save_final_changes', 'حفظ التغييرات النهائية')}
                  </>
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

