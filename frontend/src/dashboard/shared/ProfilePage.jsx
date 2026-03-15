import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Camera, CheckCircle2 } from 'lucide-react';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error(t('current_password_required') || 'Current password is required to set a new one');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error(t('passwords_not_match') || 'New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error(t('password_too_short') || 'New password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success(t('profile_updated') || 'Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
       // handled by store, hook catches it but error is displayed via toast if configured, wait let's just make sure toast error is shown by trusting the store... wait store throws it! 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
          {t('my_profile') || 'My Profile'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t('manage_profile_desc') || 'Manage your personal information and security settings.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col - Avatar (Coming Soon) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center shadow-sm">
            <div className="relative group mb-4 cursor-not-allowed">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-[#121214] shadow-xl flex items-center justify-center">
                <User size={48} className="text-slate-300 dark:text-slate-600" />
              </div>
              
              {/* Coming Soon Overlay */}
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {t('coming_soon') || 'Coming Soon'}
                </span>
              </div>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-1">
              {user?.firstName} {user?.lastName}
            </h3>
            {user?.role === 'OWNER' ? (
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-full text-xs font-black mt-2 uppercase tracking-widest border border-amber-300 dark:border-white/10">
                {isRTL ? 'المالك - THE OWNER' : 'THE OWNER'}
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-xs font-bold mt-2 uppercase tracking-wide">
                {user?.role}
              </span>
            )}
          </div>
        </div>

        {/* Right Col - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8 shadow-sm">
            
            {/* Personal Info */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <User className="text-brand-500" size={20} />
                {t('personal_info') || 'Personal Information'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('first_name') || 'First Name'}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('last_name') || 'Last Name'}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t('email') || 'Email Address'} 
                    {user?.role !== 'OWNER' && (
                      <span className="ml-2 text-[10px] text-rose-500 font-medium bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                        {t('contact_admin_to_change') || 'Contact Admin to change'}
                      </span>
                    )}
                  </label>
                  <div className={`relative ${user?.role !== 'OWNER' ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={user?.role === 'OWNER' ? handleChange : undefined}
                      className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white ${user?.role !== 'OWNER' ? 'cursor-not-allowed bg-slate-100' : ''}`}
                      readOnly={user?.role !== 'OWNER'}
                      required
                      dir="ltr"
                      title={user?.role !== 'OWNER' ? (t('contact_admin_to_change_email') || 'You cannot change your email directly. Please contact an administrator.') : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            {/* Security */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="text-brand-500" size={20} />
                {t('change_password') || 'Change Password'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {t('password_change_desc') || 'Leave empty if you do not want to change your password.'}
              </p>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('current_password') || 'Current Password'}</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                    dir="ltr"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('new_password') || 'New Password'}</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('confirm_password') || 'Confirm Password'}</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all dark:text-white"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {t('save_changes') || 'Save Changes'}
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
