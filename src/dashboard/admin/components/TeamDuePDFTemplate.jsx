import React from 'react';

const TeamDuePDFTemplate = ({ due }) => {
  if (!due) return null;

  const isSent = due.status === 'SENT';

  return (
    <div 
      dir="rtl" 
      className="bg-white p-12 w-[794px] min-h-[1123px] mx-auto font-['Cairo'] relative text-slate-900 border"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-16">
        <div>
          <h1 className="text-4xl font-[900] text-amber-500 tracking-tighter mb-1">CREZIAX</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Internal Financial Voucher</p>
        </div>
        <div className="text-left" dir="ltr">
          <h2 className="text-4xl font-[900] text-slate-100 uppercase leading-none mb-4">PAYMENT VOUCHER</h2>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Voucher ID</p>
            <p className="text-sm font-black text-slate-800">#V-{due.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Paid To (Beneficiary) / المستلم</h3>
          <p className="text-xl font-black text-slate-800">
             {due.user ? `${due.user.firstName} ${due.user.lastName}` : 'N/A'}
          </p>
        </div>
        <div className="text-left" dir="ltr">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Issued Date / التاريخ</h3>
          <p className="text-lg font-bold text-slate-800">
            {new Date(due.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>

      {/* Status Stamp */}
      <div className="absolute top-[20%] left-[10%] rotate-[-15deg] opacity-20 pointer-events-none">
        {isSent ? (
          <div className="border-8 border-emerald-500 rounded-3xl p-6">
            <span className="text-7xl font-black text-emerald-500 uppercase">SENT</span>
          </div>
        ) : (
          <div className="border-8 border-amber-500 rounded-3xl p-6">
            <span className="text-7xl font-black text-amber-500 uppercase tracking-tighter">PENDING</span>
          </div>
        )}
      </div>

      {/* Details Table */}
      <div className="mb-16">
        <div className="border-b-2 border-slate-100 pb-4 flex justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description / بيان الصرف</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transfer Method / طريقة التحويل</span>
        </div>
        <div className="py-8 flex justify-between items-start border-b border-slate-50">
          <div className="max-w-md">
            <p className="text-xl font-black text-slate-800 leading-relaxed">{due.description}</p>
          </div>
          <div className="text-left" dir="ltr">
            <p className="text-lg font-black text-slate-800 uppercase">{due.transferMethod || 'Manual'}</p>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="flex justify-end mb-24">
        <div className="w-64">
          <div className="flex justify-between items-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <span className="text-sm font-black text-slate-800 uppercase">Voucher Amount</span>
            <span className="text-2xl font-black text-amber-600">${due.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Transfer Details */}
      {due.transferDetails && (
        <div className="mt-auto pt-16 border-t-2 border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Transfer Confirmation / تأكيد التحويل</h4>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
              {due.transferDetails}
            </p>
          </div>
        </div>
      )}

      {/* Absolute Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="text-[10px] font-medium text-slate-300">
          Confidential Internal Document. Creziax Digital Systems. Generated on {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default TeamDuePDFTemplate;
