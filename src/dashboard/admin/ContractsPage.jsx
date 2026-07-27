import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContractsAPI, createContractAPI, updateContractAPI, deleteContractAPI, getClientsAPI, getUsersAPI } from '../../store/api';
import { Plus, X, Trash2, FileText, Search, Loader2, Link as LinkIcon, ExternalLink, Calendar, User as UserIcon, ShieldAlert, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CANVA_LINK = "https://www.canva.com/design/DAG-3cp5x9g/VsK4i4NViBIoYk-0Uij5Vw/edit?utm_content=DAG-3cp5x9g&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";

const emptyForm = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  startDate: '',
  endDate: '',
  clientId: '',
  memberId: '',
  pdfUrl: '', // stores Google Drive link
};

// Helper: convert Google Drive share link → direct preview link
const getDrivePreviewUrl = (url) => {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return url;
};

const calculateRemainingDays = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';

const ContractsPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId');

  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Separate fetches for resilience
      const fetchContracts = async () => {
        try {
          const res = await getContractsAPI();
          setContracts(res.data?.data || res.data || []);
        } catch (err) {
          console.error('Contracts fail:', err);
          if (err.response?.status === 500) {
            toast.error(t('server_error_contracts_missing', 'خطأ في السيرفر: جدول العقود مفقود'));
          }
        }
      };

      const fetchClients = async () => {
        try {
          const res = await getClientsAPI();
          setClients(res.data?.data || res.data || []);
        } catch (err) {
          console.error('Clients fail:', err);
          toast.error(t('failed_load_clients', 'فشل تحميل قائمة العملاء'));
        }
      };

      const fetchStaff = async () => {
        try {
          const res = await getUsersAPI();
          const rawU = res.data?.data || res.data || [];
          // Filter for Team/Admin/Owner roles
          const staffMembers = rawU.filter(u => ['ADMIN', 'OWNER', 'TEAM'].includes(u.role));
          setStaff(staffMembers);
        } catch (err) {
          console.error('Staff fail:', err);
        }
      };

      const calls = [fetchContracts()];
      if (isAdmin) {
        calls.push(fetchClients());
        calls.push(fetchStaff());
      }

      await Promise.all(calls);

      if (initialClientId) {
        setForm(prev => ({ ...prev, clientId: initialClientId }));
      }
    } catch (err) {
      console.error('General load fail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const id = toast.loading(editingContract ? t('updating_ellipsis', 'جاري التحديث...') : t('saving_ellipsis', 'جاري الحفظ...'));

    try {
      if (editingContract) {
        await updateContractAPI(editingContract.id, form);
        toast.success(t('updated_successfully', 'تم التحديث بنجاح'), { id });
      } else {
        await createContractAPI(form);
        toast.success(t('contract_archived_success', 'تم أرشفة العقد بنجاح'), { id });
      }
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      toast.error(t('error_saving', 'حدث خطأ أثناء الحفظ'), { id });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirm_delete_record', 'هل أنت متأكد من حذف هذا السجل؟'))) return;
    try {
      await deleteContractAPI(id);
      toast.success(t('deleted_successfully', 'تم الحذف بنجاح'));
      fetchData();
    } catch (err) {
      toast.error(t('delete_failed', 'فشل الحذف'));
    }
  };

  // Open Google Drive link directly — no auth, no headers needed
  const handleViewContract = (contract) => {
    const url = contract.pdfUrl;
    if (!url) {
      toast.error(t('no_link_attached', 'لا يوجد رابط مرفق بهذا العقد'));
      return;
    }
    const previewUrl = getDrivePreviewUrl(url);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const filtered = (contracts || []).filter(c => 
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.client?.user?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.member?.firstName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header with Canva Link */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{t('contracts_archive')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-bold text-lg uppercase tracking-widest flex items-center gap-3 italic">
            <span className="w-12 h-[2px] bg-brand-500 rounded-full" />
            {t('contracts_archive_desc')}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-4">
            <a 
              href={CANVA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-5 rounded-[2rem] font-black text-sm shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95"
            >
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform">
                <Plus size={24} />
              </div>
              <div className="text-right">
                <span className="block text-[10px] opacity-70 uppercase tracking-widest font-bold">{t('integrated_design_studio')}</span>
                <span className="text-lg">{t('create_new_contract_canva')}</span>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-sm overflow-hidden backdrop-blur-3xl">
        <div className="p-10 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={t('search_archive_placeholder', "البحث في الأرشيف باسم العميل أو الموظف...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl py-4 pr-14 pl-6 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
            />
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { setEditingContract(null); setForm(emptyForm); setShowModal(true); }}
              className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/10 dark:shadow-white/5"
            >
              <LinkIcon size={20} />
              {t('add_to_archive', 'إضافة للأرشيف')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-brand-500" size={48} />
            <p className="text-slate-400 font-bold animate-pulse">{t('loading_archive', 'جاري تحميل الأرشيف...')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-200 dark:border-white/10">
              <LinkIcon size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t('archive_empty', 'الأرشيف فارغ حالياً')}</h3>
            <p className="text-sm text-slate-500 mt-2">{t('start_adding_drive_link', 'ابدأ بإضافة رابط عقد من Google Drive')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t('contractor_label', 'المتعاقد (عميل/موظف)')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t('contract_status', 'حالة العقد')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t('contract_duration', 'مدة العقد')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">{t('archive_date', 'تاريخ الأرشفة')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-left">{t('file_label', 'الملف')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${contract.member ? 'bg-indigo-500/10 text-indigo-500' : 'bg-brand-500/10 text-brand-500'} rounded-xl flex items-center justify-center`}>
                          {contract.member ? <UserIcon size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white">{contract.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {contract.client ? (
                              <>{t('client')}: {contract.client?.user?.firstName} {contract.client?.user?.lastName} {(contract.client?.company && `(${contract.client.company})`)}</>
                            ) : contract.member ? (
                              <>{t('employee', 'موظف')}: {contract.member?.firstName} {contract.member?.lastName}</>
                            ) : '---'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      {(() => {
                        const days = calculateRemainingDays(contract.endDate);
                        if (days === null) return <span className="text-slate-300 font-bold">---</span>;
                        if (days <= 0) return <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">{t('expired', 'منتهي')}</span>;
                        const isCritical = days <= 7;
                        return (
                          <div className={`flex items-center gap-2 ${isCritical ? 'text-rose-500 animate-pulse' : 'text-slate-500 dark:text-slate-400'} font-black text-xs uppercase`}>
                            {isCritical ? <ShieldAlert size={14} /> : <Clock size={14} />}
                            {t(isCritical ? 'days_remaining_critical' : 'days_remaining_label', { days })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                          {contract.startDate || '---'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('to_label', 'إلى')}: {contract.endDate || '---'}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                        <Calendar size={14} className="text-slate-300" />
                        {contract.date}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-left">
                      <div className="flex items-center justify-start gap-4">
                        {contract.pdfUrl && (
                          <button 
                            onClick={() => handleViewContract(contract)}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-xs hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                          >
                            <ExternalLink size={14} />
                            <span>{t('open_contract_btn', 'فتح العقد')}</span>
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(contract.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload/Archive Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('archive_contract_new', 'أرشفة عقد جديد')}</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{t('add_contract_data', 'إضافة بيانات العقد المرفوع')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contract_name_title', 'اسم العقد / العنوان')}</label>
                <input 
                  required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  placeholder={t('contract_name_hint', "مثال: عقد إدارة قناة أو عقد موظف")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('start_date', 'تاريخ البداية')}</label>
                  <input 
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('end_date', 'تاريخ الانتهاء')}</label>
                  <input 
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-brand-500">{t('link_to_client', 'ربط بعميل (أفراد/شركات)')}</label>
                  <select 
                    value={form.clientId}
                    onChange={e => setForm({...form, clientId: e.target.value, memberId: ''})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  >
                    <option value="">{t('optional', '(اختياري)')}</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.user?.firstName} {c.user?.lastName} ({c.company || 'Private'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-indigo-500">{t('link_to_employee', 'ربط بموظف (تيم)')}</label>
                  <select 
                    value={form.memberId}
                    onChange={e => setForm({...form, memberId: e.target.value, clientId: ''})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  >
                    <option value="">{t('optional', '(اختياري)')}</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.firstName} {s.lastName} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <LinkIcon size={12} className="text-emerald-500" />
                  {t('drive_link_label', 'رابط العقد من Google Drive')}
                </label>
                <input
                  type="url"
                  required
                  value={form.pdfUrl}
                  onChange={e => setForm({...form, pdfUrl: e.target.value})}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border rounded-2xl text-sm focus:outline-none focus:ring-2 font-mono transition-all ${
                    form.pdfUrl
                      ? 'border-emerald-500/40 focus:ring-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-white/10 focus:ring-brand-500/20'
                  }`}
                />
                <p className="text-[10px] text-slate-400 font-bold pr-1">
                  {t('drive_link_hint', '● اذهب للملف في Drive ← Share ← Copy Link ← الصق هنا')}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !form.pdfUrl}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-600/20 disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : t('add_to_archive', 'إضافة للأرشيف')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 font-black rounded-2xl"
                >
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

export default ContractsPage;
