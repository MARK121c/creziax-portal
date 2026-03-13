import { useEffect, useState } from 'react';
import { getPaymentsAPI } from '../../store/api';
import { CreditCard } from 'lucide-react';

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try { const { data } = await getPaymentsAPI(''); setPayments(data); } catch {}
    };
    fetchPayments();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-gray-500 text-sm">Transaction history</p>
      </div>

      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Invoice #</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Method</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Amount</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Date</th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-4">Status</th>
          </tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-white font-mono">{p.invoice?.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{p.method}</td>
                <td className="px-6 py-4 text-sm text-white font-semibold">${p.amount}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SUCCESS</span></td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-10">No payments recorded yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsPage;
