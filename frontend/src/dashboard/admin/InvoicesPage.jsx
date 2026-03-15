import { useEffect, useState } from 'react';
import { getInvoicesAPI, createInvoiceAPI, updateInvoiceAPI, deleteInvoiceAPI, getClientsAPI, downloadInvoicePDFAPI } from '../../store/api';
import { Plus, X, Trash2, Receipt, Search, Loader2, DollarSign, FileText, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import useNotificationStore from '../../store/notificationStore';

const InvoicesPage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [form, setForm] = useState({ 
    invoiceNumber: '', clientId: '', service: '', amount: '', dueDate: '' 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([getInvoicesAPI(), getClientsAPI()]);
      setInvoices(iRes.data);
      setClients(cRes.data);
    } catch (err) {
      toast.error(t('loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const loadingToast = toast.loading(t('syncing'));
    try {
      await createInvoiceAPI({ ...form, amount: parseFloat(form.amount), dueDate: form.dueDate || undefined });
      toast.success(t('confirm_issue'), { id: loadingToast });
      addNotification(`${t('confirm_issue')}: ${form.invoiceNumber}`, 'success');
      setShowModal(false);
      setForm({ invoiceNumber: '', clientId: '', service: '', amount: '', dueDate: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || t('loading');
      setError(msg);
      toast.error(msg, { id: loadingToast });
      addNotification(`${t('loading')}: ${msg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await updateInvoiceAPI(id, { status: newStatus }); 
      toast.success(t('status'), { id: loadingToast });
      addNotification(`${t('status')}: ${newStatus}`, 'success');
      fetchData(); 
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
      addNotification(`${t('loading')}`, 'error');
    }
  };

  const handleDelete = async (id, num) => {
    if (!confirm(`${t('delete_invoice_confirm')} ${num}?`)) return;
    const loadingToast = toast.loading(t('syncing'));
    try { 
      await deleteInvoiceAPI(id); 
      toast.success(t('client_removed'), { id: loadingToast });
      addNotification(`${t('client_removed')}: ${num}`, 'success');
      fetchData(); 
    } catch (err) {
      toast.error(t('failed_remove_client'), { id: loadingToast });
      addNotification(`${t('failed_remove_client')}: ${num}`, 'error');
    }
  };

  const handleDownloadPDF = async (id, invoiceNumber) => {
    const loadingToast = toast.loading(t('syncing'));
    try {
      const response = await downloadInvoicePDFAPI(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success(t('confirm_issue'), { id: loadingToast });
    } catch (err) {
      toast.error(t('loading'), { id: loadingToast });
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${inv.client?.user?.firstName} ${inv.client?.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('financials_invoices')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base md:text-lg">{t('manage_billing')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder={t('search_invoices')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-72 md:w-80 shadow-sm font-bold"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
            <Plus size={18} />
            <span>{t('create_invoice')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-xs text-slate-400">{t('invoices_loading')}</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-24 md:py-32">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/5">
              <Receipt size={36} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_invoices')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium px-6">{t('invoices_empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-bold">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('invoice_details')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">{t('client')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('amount')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('status')}</th>
                  <th className="px-6 md:px-10 py-5 md:py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <Receipt size={18} />
                        </div>
                        <div>
                          <p className="text-sm md:text-base font-black text-slate-800 dark:text-white font-mono leading-tight">{inv.invoiceNumber}</p>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">{inv.service}</p>
                          <p className="text-xs font-bold text-slate-400 mt-1 md:hidden">{inv.client?.user?.firstName} {inv.client?.user?.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 hidden md:table-cell">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{inv.client?.user?.firstName} {inv.client?.user?.lastName}</p>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <div className="inline-flex items-center gap-1 text-lg md:text-xl font-black text-slate-800 dark:text-white">
                        <span className="text-brand-500 text-sm">$</span>
                        {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7">
                      <button 
                        onClick={() => toggleStatus(inv.id, inv.status)}
                        className={`inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20' 
                            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        {inv.status === 'PAID' ? t('status_completed') : t('status_pending')}
                      </button>
                    </td>
                    <td className="px-6 md:px-10 py-5 md:py-7 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownloadPDF(inv.id, inv.invoiceNumber)}
                          className="p-3 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-2xl transition-all border border-transparent hover:border-brand-500/20"
                          title="تحميل PDF"
                        >
                          <FileText size={18} />
                        </button>
                        <button onClick={() => handleDelete(inv.id, inv.invoiceNumber)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-500/20">
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

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 max-h-[90vh] overflow-y-auto">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01] sticky top-0 z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('issue_invoice')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{t('issue_invoice_desc')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 md:p-10 space-y-6 md:space-y-7">
              {error && <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_invoice_number')}</label>
                  <input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-mono font-bold" placeholder="INV-2026-001" />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_due_date')}</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_assoc_client')}</label>
                <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all appearance-none font-bold">
                  <option value="" className="dark:bg-slate-900">{t('select_client_invoice')}</option>
                  {clients.map(c => (<option key={c.id} value={c.id} className="dark:bg-slate-900">{c.user?.firstName} {c.user?.lastName}</option>))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_service')}</label>
                <textarea value={form.service} onChange={e => setForm({...form, service: e.target.value})} required rows={2} className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold resize-none" />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t('label_amount')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <DollarSign size={18} className="text-brand-500" />
                  </div>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-black" placeholder="0.00" />
                </div>
              </div>

              <div className="pt-6 flex gap-5 border-t border-slate-100 dark:border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-4 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95">
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : t('confirm_issue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
