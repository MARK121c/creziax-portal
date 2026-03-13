import { useEffect, useState } from 'react';
import { getInvoicesAPI, createInvoiceAPI, updateInvoiceAPI, deleteInvoiceAPI, getClientsAPI } from '../../store/api';
import { Plus, X, Trash2 } from 'lucide-react';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ invoiceNumber: '', clientId: '', service: '', amount: '', dueDate: '' });

  const fetchData = async () => {
    try {
      const [iRes, cRes] = await Promise.all([getInvoicesAPI(), getClientsAPI()]);
      setInvoices(iRes.data);
      setClients(cRes.data);
    } catch {}
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createInvoiceAPI({ ...form, dueDate: form.dueDate || null });
      setShowModal(false);
      setForm({ invoiceNumber: '', clientId: '', service: '', amount: '', dueDate: '' });
      fetchData();
    } catch {}
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    try { await updateInvoiceAPI(id, { status: newStatus }); fetchData(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try { await deleteInvoiceAPI(id); fetchData(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-white">Invoices</h1><p className="text-gray-500 text-sm">Manage billing</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20"><Plus size={16} /> New Invoice</button>
      </div>

      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Invoice #</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Client</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Service</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Amount</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Status</th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-4">Actions</th>
          </tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-white font-mono">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{inv.client?.user?.firstName} {inv.client?.user?.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{inv.service}</td>
                <td className="px-6 py-4 text-sm text-white font-semibold">${inv.amount}</td>
                <td className="px-6 py-4">
                  <button onClick={() => toggleStatus(inv.id, inv.status)} className={`px-3 py-1 rounded-lg text-xs font-medium border ${inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {inv.status}
                  </button>
                </td>
                <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(inv.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500 py-10">No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-white">New Invoice</h2><button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={18} /></button></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} placeholder="Invoice Number (e.g. INV-001)" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50">
                <option value="">Select Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.user?.firstName} {c.user?.lastName}</option>)}
              </select>
              <input value={form.service} onChange={e => setForm({...form, service: e.target.value})} placeholder="Service" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
              <input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} type="number" placeholder="Amount" required className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
              <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-violet-500/50" />
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium text-sm">Create Invoice</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
