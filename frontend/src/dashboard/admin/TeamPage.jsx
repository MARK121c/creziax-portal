import { useEffect, useState } from 'react';
import { getUsersAPI, createUserAPI, deleteUserAPI, uploadImageAPI } from '../../store/api';
import { Trash2, X, User, Mail, Calendar, Search, Loader2, UserPlus, MoreHorizontal, ShieldAlert, ShieldCheck, Camera, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const TeamPage = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuthStore();
  const isRTL = i18n.language === 'ar';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', position: '', role: 'TEAM', avatarUrl: '' });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const addNotification = useNotificationStore(state => state.addNotification);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading(t('syncing'));
    try {
      await createUserAPI({ ...form });
      toast.success(t('onboard_specialist'), { id: loadingToast });
      addNotification(`تم إضافة أصل جديد: ${form.firstName} ${form.lastName} بصلاحية ${form.role}`, 'success');
      setShowModal(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', position: '', role: 'TEAM', avatarUrl: '' });
      fetchMembers();
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
      addNotification(`فشل في إضافة العضو الجديد`, 'error');
    } finally {
      setSubmitting(false);
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

  const handleDelete = async (id, name, role) => {
    if (!confirm(`${t('delete_client_confirm')} ${name}?`)) return;
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteUserAPI(id); 
      toast.success(t('client_removed'), { id: loadingToast });
      addNotification(`تم إزالة العضو: ${name}`, 'success');
      fetchMembers(); 
    } catch (err) {
      toast.error(t('failed_remove_client'), { id: loadingToast });
      addNotification(`فشل في إزالة العضو: ${name}`, 'error');
    }
  };

  const filteredMembers = members.filter(m => 
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.teamMemberInfo?.position?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('team_management')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">{t('manage_workforce')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_team')}
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
            <span className="sm:inline">{t('add_member') || 'Add Member/Admin'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('member')}</th>
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6 hidden md:table-cell">{t('position')}</th>
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6 hidden md:table-cell">Role</th>
                <th className="text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6 hidden lg:table-cell">{t('joined')}</th>
                <th className="text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] px-6 md:px-10 py-5 md:py-6">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('syncing_talent')}</p>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-white/5">
                      <User size={32} className="text-slate-200 dark:text-slate-700" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('no_members')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t('team_empty')}</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map(m => (
                  <tr key={m.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors duration-300">
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-base md:text-lg overflow-hidden ${
                          m.role === 'OWNER' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 
                          m.role === 'ADMIN' ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' : 
                          'bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400'
                        }`}>
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{m.firstName?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm md:text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            {m.firstName} {m.lastName}
                            {m.role === 'OWNER' && <ShieldAlert size={14} className="text-amber-600" />}
                            {m.role === 'ADMIN' && <ShieldAlert size={14} className="text-amber-500" />}
                          </div>
                          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-1">
                            <Mail size={11} className="text-slate-300" />
                            {m.email}
                          </div>
                          <div className="text-[10px] font-bold text-violet-500 mt-1 md:hidden">
                            {m.teamMemberInfo?.position || t('label_position')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                      <div className="px-3 py-1 bg-violet-500/10 text-violet-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-violet-500/20 w-fit">
                        {m.teamMemberInfo?.position || t('label_position')}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                      {m.role === 'OWNER' ? (
                        <div className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-500/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-300 w-fit">
                          {isRTL ? 'المالك - THE OWNER' : 'THE OWNER'}
                        </div>
                      ) : (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit flex items-center gap-1 ${
                          m.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 
                          'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20'
                        }`}>
                          {m.role === 'ADMIN' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                          {m.role}
                        </div>
                      )}
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-tighter">
                        <Calendar size={14} className="text-slate-300 dark:text-slate-600" />
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 md:px-10 py-4 md:py-7 text-right">
                      {m.role !== 'OWNER' && (currentUser?.role === 'OWNER' || m.role !== 'ADMIN') && (
                        <button 
                          onClick={() => handleDelete(m.id, `${m.firstName} ${m.lastName}`, m.role)} 
                          className="p-2 md:p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-slate-200 dark:border-white/10 hover:border-rose-500/20"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400 max-h-[90vh] overflow-y-auto">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('add_member')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('add_member_desc')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 md:p-10 space-y-5 md:space-y-7">
              {/* Avatar Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-5 border border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02]">
                {/* Preview */}
                <div className="relative w-24 h-24 rounded-2xl bg-white dark:bg-white/5 shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {form.avatarUrl ? (
                    <img src={form.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center">
                      <User size={28} />
                      <span className="text-[9px] font-black uppercase tracking-tighter mt-1">Photo</span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>
                {/* Info + Button */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-black text-slate-700 dark:text-white mb-1">الصورة الشخصية</p>
                  <p className="text-xs text-slate-400 mb-4">JPG, PNG أو WebP • الحد الأقصى 5MB</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-black rounded-xl shadow-sm shadow-brand-600/20 transition-all active:scale-95">
                    <Camera size={14} />
                    <span>{form.avatarUrl ? 'تغيير الصورة' : 'رفع الصورة'}</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                  {form.avatarUrl && (
                    <button type="button" onClick={() => setForm({...form, avatarUrl: ''})} className="mr-2 text-xs text-rose-400 hover:text-rose-600 font-bold transition-colors">حذف</button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_first_name')}</label>
                  <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_last_name')}</label>
                  <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_email')}</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_password_cred')}</label>
                <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-7">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Role</label>
                  <select 
                    value={form.role} 
                    onChange={e => setForm({...form, role: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold appearance-none"
                  >
                    <option value="TEAM">Team Member</option>
                    {currentUser?.role === 'OWNER' && (
                      <option value="ADMIN">Administrator</option>
                    )}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_position')}</label>
                  <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
              </div>

              <div className="pt-6 md:pt-8 flex gap-4 md:gap-5 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all duration-300 active:scale-95">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('onboard_specialist')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
