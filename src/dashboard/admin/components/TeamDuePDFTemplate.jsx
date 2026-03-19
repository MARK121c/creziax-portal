import React from 'react';

const TeamDuePDFTemplate = ({ due }) => {
  if (!due) return null;

  const isSent = due.status === 'SENT';

  // Safe Hex Colors for html2canvas compatibility (avoiding oklch)
  const colors = {
    amber500: '#f59e0b',
    amber600: '#d97706',
    amber100: '#fef3c7',
    amber50: '#fffbeb',
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate600: '#475569',
    slate400: '#94a3b8',
    slate300: '#cbd5e1',
    slate100: '#f1f5f9',
    slate50: '#f8fafc',
    emerald500: '#10b981',
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
          <h1 className="text-4xl font-[900] tracking-tighter mb-1" style={{ color: colors.amber500 }}>CREZIAX</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: colors.slate400 }}>Internal Financial Voucher</p>
        </div>
        <div className="text-left" dir="ltr">
          <h2 className="text-4xl font-[900] uppercase leading-none mb-4" style={{ color: colors.slate100 }}>PAYMENT VOUCHER</h2>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.slate400 }}>Voucher ID</p>
            <p className="text-sm font-black" style={{ color: colors.slate800 }}>#V-{due.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: colors.slate400 }}>Paid To (Beneficiary) / المستلم</h3>
          <p className="text-xl font-black" style={{ color: colors.slate800 }}>
             {due.user ? `${due.user.firstName} ${due.user.lastName}` : 'N/A'}
          </p>
        </div>
        <div className="text-left" dir="ltr">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: colors.slate400 }}>Issued Date / التاريخ</h3>
          <p className="text-lg font-bold" style={{ color: colors.slate800 }}>
            {new Date(due.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>

      {/* Status Stamp */}
      <div className="absolute top-[20%] left-[10%] rotate-[-15deg] opacity-20 pointer-events-none">
        {isSent ? (
          <div className="border-8 rounded-3xl p-6" style={{ borderColor: colors.emerald500 }}>
            <span className="text-7xl font-black uppercase" style={{ color: colors.emerald500 }}>SENT</span>
          </div>
        ) : (
          <div className="border-8 rounded-3xl p-6" style={{ borderColor: colors.amber500 }}>
            <span className="text-7xl font-black uppercase tracking-tighter" style={{ color: colors.amber500 }}>PENDING</span>
          </div>
        )}
      </div>

      {/* Details Table */}
      <div className="mb-16">
        <div className="border-b-2 pb-4 flex justify-between" style={{ borderColor: colors.slate100 }}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.slate400 }}>Description / بيان الصرف</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: colors.slate400 }}>Transfer Method / طريقة التحويل</span>
        </div>
        <div className="py-8 flex justify-between items-start border-b" style={{ borderColor: colors.slate50 }}>
          <div className="max-w-md">
            <p className="text-xl font-black leading-relaxed" style={{ color: colors.slate800 }}>{due.description}</p>
          </div>
          <div className="text-left" dir="ltr">
            <p className="text-lg font-black uppercase" style={{ color: colors.slate800 }}>{due.transferMethod || 'Manual'}</p>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="flex justify-end mb-24">
        <div className="w-64">
          <div className="flex justify-between items-center p-4 rounded-2xl border" style={{ backgroundColor: colors.amber50, borderColor: colors.amber100 }}>
            <span className="text-sm font-black uppercase" style={{ color: colors.slate800 }}>Voucher Amount</span>
            <span className="text-2xl font-black" style={{ color: colors.amber600 }}>${due.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Transfer Details */}
      {due.transferDetails && (
        <div className="mt-auto pt-16 border-t-2" style={{ borderColor: colors.slate100 }}>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: colors.slate400 }}>Transfer Confirmation / تأكيد التحويل</h4>
          <div className="p-6 rounded-3xl border" style={{ backgroundColor: colors.slate50, borderColor: colors.slate100 }}>
            <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap" style={{ color: colors.slate600 }}>
              {due.transferDetails}
            </p>
          </div>
        </div>
      )}

      {/* Absolute Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[10px] font-medium" style={{ color: colors.slate300 }}>
          Confidential Internal Document. Creziax Digital Systems. Generated on {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default TeamDuePDFTemplate;
