import React from 'react';

const InvoicePDFTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

  // Safe Hex Colors for html2canvas compatibility (avoiding oklch)
  const colors = {
    indigo600: '#4f46e5',
    indigo100: '#e0e7ff',
    indigo50: '#eef2ff',
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate400: '#94a3b8',
    slate300: '#cbd5e1',
    slate100: '#f1f5f9',
    slate50: '#f8fafc',
    emerald500: '#10b981',
    amber500: '#f59e0b',
  };

  return (
    <div 
      dir="rtl" 
      className="bg-white p-12 w-[794px] min-h-[1123px] mx-auto relative border"
      style={{ 
        fontFamily: "'Cairo', sans-serif", 
        color: colors.slate900,
        backgroundColor: '#ffffff'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-4xl font-[900] tracking-tighter mb-1" style={{ color: colors.indigo600 }}>CREZIAX</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: colors.slate400 }}>Creative Agency</p>
        </div>
        <div className="text-left" dir="ltr">
          <h2 className="text-5xl font-[900] uppercase leading-none mb-4" style={{ color: colors.slate100 }}>INVOICE</h2>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.slate400 }}>Invoice No.</p>
            <p className="text-sm font-black" style={{ color: colors.slate800 }}>{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: colors.slate400 }}>Billed To / العميل</h3>
          <p className="text-xl font-black" style={{ color: colors.slate800 }}>
            {invoice.client?.user?.firstName} {invoice.client?.user?.lastName}
          </p>
        </div>
        <div className="text-left" dir="ltr">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: colors.slate400 }}>Date / التاريخ</h3>
          <p className="text-lg font-bold" style={{ color: colors.slate800 }}>
            {new Date(invoice.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>

      {/* Status Stamp */}
      <div className="absolute top-[20%] left-[10%] rotate-[-15deg] opacity-20 pointer-events-none">
        {isPaid ? (
          <div className="border-8 rounded-3xl p-6" style={{ borderColor: colors.emerald500 }}>
            <span className="text-7xl font-black uppercase" style={{ color: colors.emerald500 }}>PAID</span>
          </div>
        ) : (
          <div className="border-8 rounded-3xl p-6" style={{ borderColor: colors.amber500 }}>
            <span className="text-7xl font-black uppercase tracking-tighter" style={{ color: colors.amber500 }}>PENDING</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="mb-16">
        <div className="border-b-2 pb-4 flex justify-between" style={{ borderColor: colors.slate100 }}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.slate400 }}>Service Description / وصف الخدمة</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.slate400 }}>Amount / المبلغ</span>
        </div>
        <div className="py-8 flex justify-between items-center border-b" style={{ borderColor: colors.slate50 }}>
          <p className="text-xl font-black" style={{ color: colors.slate800 }}>{invoice.service}</p>
          <p className="text-2xl font-black" style={{ color: colors.slate800 }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Total Section */}
      <div className="flex justify-end mb-24">
        <div className="w-64">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold" style={{ color: colors.slate400 }}>Subtotal</span>
            <span className="text-lg font-bold" style={{ color: colors.slate800 }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-2xl" style={{ backgroundColor: colors.slate50 }}>
            <span className="text-sm font-black uppercase" style={{ color: colors.slate800 }}>Total Amount</span>
            <span className="text-2xl font-black" style={{ color: colors.indigo600 }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Payment Footer */}
      {(invoice.paymentMethod || invoice.paymentDetails) && (
        <div className="mt-auto pt-16 border-t-2" style={{ borderColor: colors.slate100 }}>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: colors.slate400 }}>Payment Instructions / تعليمات الدفع</h4>
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: colors.indigo50, borderColor: colors.indigo100 }}>
            <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap" style={{ color: colors.slate800 }}>
              {invoice.paymentDetails ? invoice.paymentDetails : `يرجى الدفع عبر ${invoice.paymentMethod}`}
            </p>
          </div>
        </div>
      )}

      {/* Absolute Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[10px] font-medium" style={{ color: colors.slate300 }}>
          Thank you for choosing Creziax Agency. This is an electronic document generated on {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default InvoicePDFTemplate;
