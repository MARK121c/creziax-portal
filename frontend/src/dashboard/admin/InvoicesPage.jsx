import { useEffect, useState } from 'react';
import { getInvoicesAPI, createInvoiceAPI, updateInvoiceAPI, deleteInvoiceAPI, getClientsAPI } from '../../store/api';
import { Plus, X, Trash2, Receipt, Search, CalendarDays, Loader2, DollarSign, ArrowUpRight, Filter, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const InvoicesPage = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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
      toast.error('Financial system synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const loadingToast = toast.loading('Generating financial record...');
    try {
      await createInvoiceAPI({ 
        ...form, 
        amount: parseFloat(form.amount),
        dueDate: form.dueDate || undefined 
      });
      toast.success('Invoice issued successfully!', { id: loadingToast });
      setShowModal(false);
      setForm({ invoiceNumber: '', clientId: '', service: '', amount: '', dueDate: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create invoice.';
      setError(msg);
      toast.error(msg, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    const loadingToast = toast.loading(`Marking as ${newStatus.toLowerCase()}...`);
    try { 
      await updateInvoiceAPI(id, { status: newStatus }); 
      toast.success(`Invoice updated to ${newStatus}.`, { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Status update failed.', { id: loadingToast });
    }
  };

  const handleDelete = async (id, num) => {
    if (!confirm(`Are you sure you want to delete invoice ${num}?`)) return;
    const loadingToast = toast.loading('Deleting permanent record...');
    try { 
      await deleteInvoiceAPI(id); 
      toast.success('Record deleted.', { id: loadingToast });
      fetchData(); 
    } catch (err) {
      toast.error('Deletion failed.', { id: loadingToast });
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${inv.client?.user?.firstName} ${inv.client?.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Header & Quick Action */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{t('financials_invoices')}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-lg">{t('manage_billing')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all w-full sm:w-80 shadow-sm font-bold"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t('create_invoice')}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={44} className="animate-spin text-brand-500 mb-6" />
            <p className="font-bold tracking-widest uppercase text-xs text-slate-400">Loading Financial Ledger...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-32 font-bold">
            <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 transform rotate-12 border border-slate-100 dark:border-white/5">
              <Receipt size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">{t('no_invoices')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">No financial records found match your criteria. Begin by issuing a new invoice.</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-bold">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('invoice_details')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('client')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('amount')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('status')}</th>
                  <th className="px-10 py-6 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <Receipt size={22} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-800 dark:text-white font-mono tracking-tight leading-tight">{inv.invoiceNumber}</p>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-widest">{inv.service}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {inv.client?.user?.firstName} {inv.client?.user?.lastName}
                      </p>
                      {inv.client?.company && (
                        <p className="text-[11px] font-bold text-slate-400/80 mt-1 uppercase tracking-wider">{inv.client.company}</p>
                      )}
                    </td>
                    <td className="px-10 py-7">
                      <div className="inline-flex items-center gap-1 text-xl font-black text-slate-800 dark:text-white">
                        <span className="text-brand-500 text-sm">$</span>
                        {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <button 
                        onClick={() => toggleStatus(inv.id, inv.status)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/10' 
                            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/5 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/10'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        {inv.status}
                      </button>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)} 
                          className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-500/20"
                          title="Delete Permanently"
                        >
                          <Trash2 size={20} />
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

      {/* Creation Modal - Redesigned */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-400">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01]">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('issue_invoice')}</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Create a formal billing record for a client.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-3 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-white/5 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-10 space-y-7">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Invoice Number</label>
                  <input 
                    value={form.invoiceNumber} 
                    onChange={e => setForm({...form, invoiceNumber: e.target.value})} 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-mono font-bold" 
                    placeholder="INV-2026-001" 
                  />
                </div>
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Due Date</label>
                  <input 
                    type="date"
                    value={form.dueDate} 
                    onChange={e => setForm({...form, dueDate: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Associated Client</label>
                <select 
                  value={form.clientId} 
                  onChange={e => setForm({...form, clientId: e.target.value})} 
                  required 
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all appearance-none font-bold"
                >
                  <option value="" className="dark:bg-slate-900">Choose a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} className="dark:bg-slate-900">
                      {c.user?.firstName} {c.user?.lastName} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Service / Description</label>
                <textarea 
                  value={form.service} 
                  onChange={e => setForm({...form, service: e.target.value})} 
                  required 
                  rows={2}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-bold resize-none" 
                  placeholder="e.g. Full-stack development for Q1" 
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Financial Value ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <DollarSign size={18} className="text-brand-500" />
                  </div>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount} 
                    onChange={e => setForm({...form, amount: e.target.value})} 
                    required 
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl text-slate-800 dark:text-white placeholder-0.00 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50 transition-all font-black" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="pt-8 flex gap-5 border-t border-slate-100 dark:border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4.5 px-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-4.5 px-6 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 dark:disabled:bg-white/5 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all duration-300 active:scale-95"
                >
                  {submitting ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Confirm & Issue'}
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
