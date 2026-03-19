import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContractsAPI, createContractAPI, updateContractAPI, deleteContractAPI, getClientsAPI, uploadAttachmentAPI } from '../../store/api';
import { Plus, X, Trash2, FileText, Search, Loader2, Link as LinkIcon, Download, ExternalLink, UploadCloud, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CANVA_LINK = "https://www.canva.com/design/DAG-3cp5x9g/VsK4i4NViBIoYk-0Uij5Vw/edit?utm_content=DAG-3cp5x9g&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton";

const emptyForm = {
  title: '',
  date: new Date().toLocaleDateString('ar-EG'),
  startDate: '',
  endDate: '',
  clientId: '',
  pdfUrl: '',
};

const ContractsPage = () => {
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId');

  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contRes, clRes] = await Promise.all([
        getContractsAPI(),
        getClientsAPI()
      ]);
      setContracts(contRes.data);
      setClients(clRes.data);
      
      // If we have an initialClientId, pre-select it in the form if modal opens
      if (initialClientId) {
        setForm(prev => ({ ...prev, clientId: initialClientId }));
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('يرجى رفع ملف PDF فقط');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await uploadAttachmentAPI(formData);
      setForm(prev => ({ ...prev, pdfUrl: data.url }));
      toast.success('تم رفع الملف بنجاح');
    } catch (err) {
      toast.error('فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading(editingContract ? 'جاري التحديث...' : 'جاري الحفظ...');

    try {
      if (editingContract) {
        await updateContractAPI(editingContract.id, form);
        toast.success('تم التحديث بنجاح', { id: loadingToast });
      } else {
        await createContractAPI(form);
        toast.success('تم أرشفة العقد بنجاح', { id: loadingToast });
      }
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      toast.error('حدث خطأ أثناء الحفظ', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقد من الأرشيف؟')) return;
    try {
      await deleteContractAPI(id);
      toast.success('تم الحذف');
      fetchData();
    } catch (err) {
      toast.error('فشل الحذف');
    }
  };

  // Filter logic including query param
  const filtered = (contracts || []).filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.client?.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (initialClientId) {
       return matchesSearch && String(c.clientId) === String(initialClientId);
    }
    return matchesSearch;
  });

  const getFullFileUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '');
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  };

  return (
    <div className="space-y-8">
      {/* Header with Magic Canva Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">أرشيف العقود</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium font-arabic">
            {initialClientId ? `عرض عقود العميل المختار` : `صمم عقدك على كانفا وأرشفه هنا للوصول السريع`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <a 
            href={CANVA_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 bg-[#00C4CC] hover:bg-[#00B4BC] text-white rounded-2xl font-black shadow-lg shadow-cyan-500/20 hover:-translate-y-1 transition-all group"
          >
            <ExternalLink size={20} className="group-hover:rotate-12 transition-transform" />
            <span>إنشاء عقد جديد - Canva</span>
          </a>
          
          <button 
            onClick={() => { 
              setEditingContract(null); 
              setForm({ ...emptyForm, clientId: initialClientId || '' }); 
              setShowModal(true); 
            }}
            className="flex items-center gap-3 px-8 py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:-translate-y-1 transition-all"
          >
            <Plus size={20} />
            <span>إضافة إلى الأرشيف</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="relative group w-full max-md:max-w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="البحث في الأرشيف..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
            />
          </div>
          {initialClientId && (
            <button 
              onClick={() => {
                const url = new URL(window.location);
                url.searchParams.delete('clientId');
                window.history.pushState({}, '', url);
                window.location.reload(); // Quick way to clear filter
              }}
              className="text-xs font-black text-rose-500 uppercase tracking-widest hover:underline"
            >
              عرض كل العقود
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-50">
            <Loader2 size={40} className="animate-spin text-brand-500 mb-4" />
            <span className="text-xs font-black uppercase tracking-widest">جاري جلب الأرشيف...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-200 dark:border-white/10">
              <UploadCloud size={32} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">الأرشيف فارغ حالياً</h3>
            <p className="text-sm text-slate-500 mt-2">ابدأ برفع أول عقد PDF قمت بتصميمه</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest font-arabic text-right">اسم العقد / العميل</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest font-arabic text-right">مدة العقد</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest font-arabic text-right">تاريخ الأرشفة</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 uppercase tracking-widest font-arabic text-left">الملف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 dark:text-white">{contract.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {contract.client?.user?.firstName} {contract.client?.user?.lastName} {(contract.client?.company && `(${contract.client.company})`)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                          {contract.startDate || '---'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">إلى: {contract.endDate || '---'}</p>
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
                          <a 
                            href={getFullFileUrl(contract.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-xs hover:bg-emerald-500 hover:text-white shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                          >
                            <Download size={14} />
                            <span>عرض / تحميل</span>
                          </a>
                        )}
                        <button 
                          onClick={() => handleDelete(contract.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
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
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">أرشفة عقد جديد</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">إضافة بيانات العقد المرفوع</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">اسم العقد / العميل</label>
                <input 
                  required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  placeholder="مثال: عقد إدارة قناة (أحمد علي)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">تاريخ البداية</label>
                  <input 
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">تاريخ الانتهاء</label>
                  <input 
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ربط بالعميل</label>
                <select 
                  value={form.clientId}
                  onChange={e => setForm({...form, clientId: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold"
                >
                  <option value="">غير مرتبط بعميل معين</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.user?.firstName || 'Client'} {c.user?.lastName || ''} ({c.company || 'Private'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ملف العقد (PDF)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                  />
                  <div className={`w-full py-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all ${form.pdfUrl ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 group-hover:border-brand-500/50'}`}>
                    {uploading ? (
                      <Loader2 size={32} className="animate-spin text-brand-500" />
                    ) : form.pdfUrl ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-in zoom-in">
                          <Download size={24} />
                        </div>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">تـم رفـع الـمـلـف</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={32} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">اضـغـط لـرفـع مـلـف PDF</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting || uploading || !form.pdfUrl}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-600/20 disabled:opacity-50 disabled:translate-y-0 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'إضافة للأرشيف'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-500 font-black rounded-2xl"
                >
                  إلغاء
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
