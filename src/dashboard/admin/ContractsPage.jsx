import { useEffect, useState, useRef } from 'react';
import { getContractsAPI, createContractAPI, updateContractAPI, deleteContractAPI, getClientsAPI } from '../../store/api';
import { Plus, X, Trash2, FileText, Search, Loader2, ShieldCheck, AlertCircle, ChevronRight, History, Edit2, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import ContractPDFTemplate from './components/ContractPDFTemplate';
import ReactDOM from 'react-dom/client';

const defaultPreamble = `اتفق الطرفان المبينان أدناه على إبرام هذه الاتفاقية وفقاً للشروط والبنود الواردة في هذا العقد، وذلك بعد الاطلاع الكامل على بنوده والموافقة عليها.`;
const defaultPenalty = `في حالة إخلال أيٍّ من الطرفين بأيٍّ من بنود هذه الاتفاقية، يحق للطرف الآخر المطالبة بالتعويض عن الأضرار المباشرة وغير المباشرة الناتجة عن هذا الإخلال، مع الحق في إنهاء عقد التعاون بشكل فوري.`;

const emptyForm = {
  title: '',
  language: 'ar',
  date: new Date().toLocaleDateString('ar-EG'),
  status: 'DRAFT',
  clientId: '',
  clientName: '',
  clientPhone: '',
  clientYoutube: '',
  extraFields: [],
  preamble: defaultPreamble,
  penaltyClause: defaultPenalty,
  clauses: [{ title: '', content: '' }],
  templateId: 'DEFAULT_TEMPLATE', // Placeholder for user's mentioned requirement
};

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [printingContract, setPrintingContract] = useState(null);
  const pdfRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Clients independently to ensure form works even if Contracts API fails
    try {
      const clRes = await getClientsAPI();
      setClients(clRes.data);
    } catch (err) {
      console.error('Failed to load clients:', err);
      toast.error('فشل تحميل قائمة العملاء');
    }

    // Fetch Contracts
    try {
      const cRes = await getContractsAPI();
      setContracts(cRes.data);
    } catch (err) {
      console.error('Failed to load contracts:', err);
      // Only toast error for contracts if it's a real failure
      if (err.response?.status !== 404) {
        toast.error('فشل تحميل العقود');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-fill removed per user request for manual control
  // Selecting a client now ONLY links the ID for the DB, doesn't overwrite form fields

  const openCreateModal = () => {
    setEditingContract(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (contract) => {
    setEditingContract(contract);
    setForm({
      title: contract.title,
      language: contract.language,
      date: contract.date,
      status: contract.status,
      clientId: contract.clientId || '',
      clientName: contract.clientName,
      clientPhone: contract.clientPhone || '',
      clientYoutube: contract.clientYoutube || '',
      extraFields: contract.extraFields || [],
      preamble: contract.preamble || '',
      penaltyClause: contract.penaltyClause || '',
      clauses: contract.clauses || [{ title: '', content: '' }],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    setSubmitting(true);
    const loadingToast = toast.loading(editingContract ? 'جاري تحديث العقد...' : 'جاري إنشاء العقد...');
    const payload = {
      ...form,
      clientId: form.clientId || null,
      clientPhone: form.clientPhone || null,
      clientYoutube: form.clientYoutube || null,
      extraFields: form.extraFields.filter(f => f.label || f.value),
    };

    try {
      if (editingContract) {
        await updateContractAPI(editingContract.id, payload);
        toast.success('تم تحديث العقد بنجاح', { id: loadingToast });
      } else {
        await createContractAPI(payload);
        toast.success('تم إنشاء العقد بنجاح', { id: loadingToast });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقد؟')) return;
    const loadingToast = toast.loading('جاري الحذف...');
    try {
      await deleteContractAPI(id);
      toast.success('تم الحذف', { id: loadingToast });
      fetchData();
    } catch (err) {
      toast.error('فشل الحذف', { id: loadingToast });
    }
  };

  const handleDownloadPDF = (contract) => {
    const loadingToast = toast.loading('جاري توليد ملف PDF...');
    setPrintingContract(contract);
    setTimeout(() => {
      const element = pdfRef.current;
      if (!element) {
        toast.error('خطأ في توليد الـ PDF', { id: loadingToast });
        return;
      }
      const opt = {
        margin: 0,
        filename: `Contract-${contract.title.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff', windowWidth: 800, width: 800 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], before: '.page-break' },
      };
      html2pdf().from(element).set(opt).save().then(() => {
        toast.success('تم تنزيل ملف PDF!', { id: loadingToast });
        setPrintingContract(null);
      }).catch(err => {
        toast.error('فشل التوليد', { id: loadingToast });
        setPrintingContract(null);
      });
    }, 800);
  };

  // ─── Clause Helpers ───────────────────────────────────────────────────────────
  const addClause = () => setForm(p => ({ ...p, clauses: [...p.clauses, { title: '', content: '' }] }));
  const removeClause = (i) => setForm(p => ({ ...p, clauses: p.clauses.filter((_, idx) => idx !== i) }));
  const updateClause = (i, key, val) => setForm(p => {
    const clauses = [...p.clauses];
    clauses[i] = { ...clauses[i], [key]: val };
    return { ...p, clauses };
  });

  // ─── Extra Field Helpers ──────────────────────────────────────────────────────
  const addExtraField = () => setForm(p => ({ ...p, extraFields: [...p.extraFields, { label: '', value: '' }] }));
  const removeExtraField = (i) => setForm(p => ({ ...p, extraFields: p.extraFields.filter((_, idx) => idx !== i) }));
  const updateExtraField = (i, key, val) => setForm(p => {
    const ex = [...p.extraFields];
    ex[i] = { ...ex[i], [key]: val };
    return { ...p, extraFields: ex };
  });

  const filtered = contracts.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor = (s) => ({
    SIGNED: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20',
    SENT: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20',
    DRAFT: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  }[s] || '');

  const statusLabel = { SIGNED: '✓ موقّع', SENT: '⌛ مُرسَل', DRAFT: '✎ مسودة' };

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">العقود القانونية</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">إنشاء وإدارة العقود مع العملاء</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="البحث في العقود..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 shadow-sm font-bold"
            />
          </div>
          <button onClick={openCreateModal} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
            <Plus size={18} />
            <span>إنشاء عقد جديد</span>
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-xs text-slate-400">جاري التحميل...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 md:py-32">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
              <FileText size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">لا توجد عقود</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">أنشئ أول عقد لك من خلال الزر أعلاه.</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-bold">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">عنوان العقد</th>
                  <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الطرف الثاني</th>
                  <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">اللغة</th>
                  <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">التاريخ</th>
                  <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الحالة</th>
                  <th className="px-6 md:px-10 py-5 text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filtered.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                          <FileText size={18} />
                        </div>
                        <p className="text-sm md:text-base font-black text-slate-800 dark:text-white">{contract.title}</p>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{contract.clientName}</p>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold font-mono">
                        {contract.language === 'ar' ? '🇸🇦 عربي' : '🇬🇧 English'}
                      </span>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{contract.date}</p>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] border ${statusColor(contract.status)}`}>
                        {statusLabel[contract.status] || contract.status}
                      </span>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 text-left">
                      <div className="flex items-center justify-start gap-2">
                        <button onClick={() => handleDownloadPDF(contract)} className="p-3 text-brand-500 bg-brand-500/10 hover:bg-brand-500/20 rounded-2xl transition-all" title="تحميل PDF">
                          <Download size={18} />
                        </button>
                        <button onClick={() => openEditModal(contract)} className="p-3 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-2xl transition-all" title="تعديل">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(contract.id)} className="p-3 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl transition-all" title="حذف">
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

      {/* ─── Create/Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-3xl shadow-2xl relative z-10 overflow-hidden max-h-[92vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01] sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white">{editingContract ? 'تعديل العقد' : 'إنشاء عقد جديد'}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">أدخل بيانات العقد والبنود القانونية</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">

              {/* === Section 1: Basic Info === */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">بيانات العقد الأساسية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">عنوان العقد</label>
                    <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" placeholder="مثال: عقد التزام بخدمات إدارة القناة" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">اللغة</label>
                    <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold appearance-none">
                      <option value="ar">🇸🇦 عربي (Arabic)</option>
                      <option value="en">🇬🇧 إنجليزي (English)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">تاريخ العقد</label>
                    <input required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">حالة العقد</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold appearance-none">
                      <option value="DRAFT">✎ مسودة (Draft)</option>
                      <option value="SENT">⌛ مُرسَل (Sent)</option>
                      <option value="SIGNED">✓ موقّع (Signed)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* === Section 2: Second Party === */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">بيانات الطرف الثاني</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">اختر من قائمة العملاء (اختياري)</label>
                    <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold appearance-none">
                      <option value="">إدخال يدوي / بدون ربط...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">الاسم الكامل *</label>
                      <input required value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" placeholder="الاسم الكامل للطرف الثاني" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">رقم الهاتف (اختياري)</label>
                      <input value={form.clientPhone} onChange={e => setForm(p => ({ ...p, clientPhone: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold" placeholder="010xxxxxxxx" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">رابط قناة يوتيوب (اختياري)</label>
                    <input value={form.clientYoutube} onChange={e => setForm(p => ({ ...p, clientYoutube: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold font-mono" placeholder="https://youtube.com/@channel" />
                  </div>

                  {/* Extra Fields */}
                  {form.extraFields.map((ef, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input value={ef.label} onChange={e => updateExtraField(i, 'label', e.target.value)} placeholder="اسم الحقل (مثال: المنصة)" className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-white focus:outline-none font-bold text-sm" />
                        <input value={ef.value} onChange={e => updateExtraField(i, 'value', e.target.value)} placeholder="القيمة" className="px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-white focus:outline-none font-bold text-sm" />
                      </div>
                      <button type="button" onClick={() => removeExtraField(i)} className="mt-1 p-2 text-rose-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/5 rounded-xl"><X size={16} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addExtraField} className="text-brand-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    <Plus size={14} /> إضافة حقل إضافي
                  </button>
                </div>
              </div>

              {/* === Section 3: Preamble === */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">التمهيد (اختياري)</h3>
                <textarea value={form.preamble} onChange={e => setForm(p => ({ ...p, preamble: e.target.value }))} rows={3} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium resize-none" placeholder="النص التمهيدي للعقد..." />
              </div>

              {/* === Section 4: Clauses === */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">البنود القانونية ({form.clauses.length} بند)</h3>
                <div className="space-y-4">
                  {form.clauses.map((clause, i) => (
                    <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 bg-slate-50/30 dark:bg-white/[0.01]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">البند {i + 1}</span>
                        {form.clauses.length > 1 && (
                          <button type="button" onClick={() => removeClause(i)} className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 dark:bg-rose-500/5 rounded-lg"><X size={14} /></button>
                        )}
                      </div>
                      <input required value={clause.title} onChange={e => updateClause(i, 'title', e.target.value)} placeholder="عنوان البند" className="w-full px-4 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-bold text-sm" />
                      <textarea required value={clause.content} onChange={e => updateClause(i, 'content', e.target.value)} rows={4} placeholder="محتوى البند..." className="w-full px-4 py-3 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium resize-none text-sm" />
                    </div>
                  ))}
                  <button type="button" onClick={addClause} className="w-full py-3 border-2 border-dashed border-brand-500/30 hover:border-brand-500/60 text-brand-500 hover:bg-brand-500/5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2">
                    <Plus size={16} /> إضافة بند جديد
                  </button>
                </div>
              </div>

              {/* === Section 5: Penalty Clause === */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">الشرط الجزائي (الصفحة الأخيرة)</h3>
                <textarea value={form.penaltyClause} onChange={e => setForm(p => ({ ...p, penaltyClause: e.target.value }))} rows={4} className="w-full px-5 py-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium resize-none" />
              </div>

              {/* Submit */}
              <div className="flex gap-4 border-t border-slate-100 dark:border-white/5 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">
                  إلغاء
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : (editingContract ? 'حفظ التعديلات' : 'إنشاء العقد')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden PDF Render Target */}
      <div className="absolute top-[100%] left-[-9999px] opacity-0 pointer-events-none" style={{ width: '800px', backgroundColor: '#fff', margin: 0, padding: 0 }}>
        <div ref={pdfRef} style={{ width: '800px', backgroundColor: '#fff', margin: 0, padding: 0 }}>
          {printingContract && <ContractPDFTemplate contract={printingContract} />}
        </div>
      </div>
    </div>
  );
};

export default ContractsPage;
