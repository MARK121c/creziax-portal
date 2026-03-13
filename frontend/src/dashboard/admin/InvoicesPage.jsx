import { useEffect, useState } from 'react';
import { getInvoicesAPI, createInvoiceAPI, updateInvoiceAPI, deleteInvoiceAPI, getClientsAPI } from '../../store/api';
import { Plus, X, Trash2, Receipt, Search, CalendarDays, Loader2, DollarSign, ArrowUpRight } from 'lucide-react';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createInvoiceAPI({ 
        ...form, 
        amount: parseFloat(form.amount),
        dueDate: form.dueDate || undefined 
      });
      setShowModal(false);
      setForm({ invoiceNumber: '', clientId: '', service: '', amount: '', dueDate: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try { 
      await updateInvoiceAPI(id, { status: newStatus }); 
      fetchData(); 
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try { 
      await deleteInvoiceAPI(id); 
      fetchData(); 
    } catch (err) {
      alert('Failed to delete invoice');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Financials & Invoices</h1>
          <p className="text-slate-500 font-medium mt-1">Manage billing, payments, and client invoices</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-violet-600/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
        >
          <Plus size={18} /> Create Invoice
        </button>
      </div>

      {/* Content */}
      <div className="glass-panel border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
            <p className="font-medium tracking-widest uppercase text-xs">Loading Financials...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-6">
              <Receipt size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Invoices Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Create your first invoice to start billing your clients and tracking revenue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Details</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                          <Receipt size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white font-mono">{inv.invoiceNumber}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{inv.service}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-300">
                        {inv.client?.user?.firstName} {inv.client?.user?.lastName}
                      </p>
                      {inv.client?.company && (
                        <p className="text-xs text-slate-500">{inv.client.company}</p>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-lg font-bold text-white flex items-center">
                        <DollarSign size={16} className="text-slate-500 mr-0.5" />
                        {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => toggleStatus(inv.id, inv.status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors border ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}
                      >
                        {inv.status}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2">
                       <button 
                        className="p-2 text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="View Details"
                      >
                        <ArrowUpRight size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(inv.id)} 
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Invoice"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0a0c]/80 backdrop-blur-md p-4">
          <div className="glass-panel border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white tracking-tight">Draft New Invoice</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Invoice Number</label>
                    <input 
                      value={form.invoiceNumber} 
                      onChange={e => setForm({...form, invoiceNumber: e.target.value})} 
                      required 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all font-mono" 
                      placeholder="INV-2026-001" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Due Date (Optional)</label>
                    <input 
                      type="date"
                      value={form.dueDate} 
                      onChange={e => setForm({...form, dueDate: e.target.value})} 
                      className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Client</label>
                  <select 
                    value={form.clientId} 
                    onChange={e => setForm({...form, clientId: e.target.value})} 
                    required 
                    className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">Choose a client...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-gray-900">
                        {c.user?.firstName} {c.user?.lastName} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Service / Description</label>
                  <input 
                    value={form.service} 
                    onChange={e => setForm({...form, service: e.target.value})} 
                    required 
                    className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                    placeholder="e.g. Website Redesign & Branding" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Total Amount ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-slate-500" />
                    </div>
                    <input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.amount} 
                      onChange={e => setForm({...form, amount: e.target.value})} 
                      required 
                      className="w-full pl-12 pr-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 flex gap-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 transition-all duration-300 disabled:opacity-50"
                  >
                    {submitting ? 'Generating...' : 'Issue Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
