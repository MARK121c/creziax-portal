import React from 'react';

const InvoicePDFTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

  return (
    <div 
      dir="rtl" 
      className="bg-white p-12 w-[794px] min-h-[1123px] mx-auto font-['Cairo'] relative text-slate-900 border"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-4xl font-[900] text-indigo-600 tracking-tighter mb-1">CREZIAX</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Creative Agency</p>
        </div>
        <div className="text-left" dir="ltr">
          <h2 className="text-5xl font-[900] text-slate-100 uppercase leading-none mb-4">INVOICE</h2>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice No.</p>
            <p className="text-sm font-black text-slate-800">{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Billed To / العميل</h3>
          <p className="text-xl font-black text-slate-800">
            {invoice.client?.user?.firstName} {invoice.client?.user?.lastName}
          </p>
        </div>
        <div className="text-left" dir="ltr">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Date / التاريخ</h3>
          <p className="text-lg font-bold text-slate-800">
            {new Date(invoice.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>

      {/* Status Stamp */}
      <div className="absolute top-[20%] left-[10%] rotate-[-15deg] opacity-20 pointer-events-none">
        {isPaid ? (
          <div className="border-8 border-emerald-500 rounded-3xl p-6">
            <span className="text-7xl font-black text-emerald-500 uppercase">PAID</span>
          </div>
        ) : (
          <div className="border-8 border-amber-500 rounded-3xl p-6">
            <span className="text-7xl font-black text-amber-500 uppercase tracking-tighter">PENDING</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-16">
        <div className="border-b-2 border-slate-100 pb-4 flex justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Description / وصف الخدمة</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount / المبلغ</span>
        </div>
        <div className="py-8 flex justify-between items-center border-b border-slate-50">
          <p className="text-xl font-black text-slate-800">{invoice.service}</p>
          <p className="text-2xl font-black text-slate-800">${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Total Section */}
      <div className="flex justify-end mb-24">
        <div className="w-64">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400">Subtotal</span>
            <span className="text-lg font-bold text-slate-800">${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
            <span className="text-sm font-black text-slate-800 uppercase">Total Amount</span>
            <span className="text-2xl font-black text-indigo-600">${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Payment Footer */}
      {(invoice.paymentMethod || invoice.paymentDetails) && (
        <div className="mt-auto pt-16 border-t-2 border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Payment Instructions / تعليمات الدفع</h4>
          <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
            <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
              {invoice.paymentDetails ? invoice.paymentDetails : `يرجى الدفع عبر ${invoice.paymentMethod}`}
            </p>
          </div>
        </div>
      )}

      {/* Absolute Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[10px] font-medium text-slate-300">
          Thank you for choosing Creziax Agency. This is an electronic document generated on {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default InvoicePDFTemplate;
