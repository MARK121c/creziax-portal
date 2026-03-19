import React from 'react';

const TeamDuePDFTemplate = ({ due }) => {
  if (!due) return null;

  const isSent = due.status === 'SENT';

  const colors = {
    black: '#000000',
    white: '#ffffff',
    slate900: '#111827',
    slate700: '#374151',
    slate500: '#6b7280',
    slate400: '#9ca3af',
    slate100: '#f3f4f6',
    slate50: '#f9fafb',
    emerald600: '#059669',
    amber600: '#d97706',
  };

  return (
    <div 
      style={{ 
        width: '794px', 
        minHeight: '1123px', 
        padding: '64px',
        backgroundColor: colors.white,
        color: colors.slate900,
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        border: `1px solid ${colors.slate100}`
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '80px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.05em', color: colors.black }}>CREZIAX</h1>
          <p style={{ fontSize: '10px', fontWeight: '700', margin: 0, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.5 }}>FINANCIAL VOUCHER</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '42px', fontWeight: '900', color: colors.slate100, margin: '0 0 24px 0', textTransform: 'uppercase', lineHeight: 1 }}>INTERNAL RECEIPT</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: colors.slate400 }}>Reference</p>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>#V-{due.id?.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '80px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', margin: '0 0 16px 0', opacity: 0.5 }}>Paid To (Beneficiary)</p>
          <p style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.025em', margin: 0 }}>
            {due.user ? `${due.user.firstName} ${due.user.lastName}` : 'System User'}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', margin: '0 0 16px 0', opacity: 0.5 }}>Date Issued</p>
          <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {new Date(due.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Details Table */}
      <div style={{ marginBottom: '80px' }}>
        <div style={{ borderBottom: `2px solid ${colors.black}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.5 }}>Description & Purpose</span>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.5 }}>Payment Method</span>
        </div>
        <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ fontSize: '20px', fontWeight: '700', margin: 0, maxWidth: '448px', lineHeight: 1.4 }}>{due.description || 'Service/Expense Reimbursement'}</p>
          <p style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{due.transferMethod || 'BANK'}</p>
        </div>
        <div style={{ borderTop: `1px solid ${colors.slate100}`, marginTop: '8px' }}></div>
      </div>

      {/* Total Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '120px' }}>
        <div style={{ width: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', backgroundColor: colors.slate100, borderRadius: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Voucher Total</span>
            <span style={{ fontSize: '28px', fontWeight: '900' }}>${due.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Transfer Information */}
      {due.transferDetails && (
        <div style={{ maxWidth: '512px', borderTop: `1px solid ${colors.slate100}`, paddingTop: '40px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', opacity: 0.5 }}>Transfer Information</p>
          <div style={{ padding: '24px', backgroundColor: colors.slate50, borderRadius: '12px', border: `1px solid ${colors.slate100}` }}>
            <p style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: colors.slate700, margin: 0 }}>
              {due.transferDetails}
            </p>
          </div>
        </div>
      )}

      {/* Minimalist Corner Stamp */}
      <div style={{ position: 'absolute', bottom: '96px', right: '64px', pointerEvents: 'none', opacity: 0.8 }}>
        {isSent ? (
          <div style={{ border: `4px solid ${colors.emerald600}`, borderRadius: '12px', padding: '8px 16px', transform: 'rotate(-5deg)' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.emerald600 }}>SENT</span>
          </div>
        ) : (
          <div style={{ border: `4px solid ${colors.amber600}`, borderRadius: '12px', padding: '8px 16px', transform: 'rotate(-5deg)' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.amber600 }}>PENDING</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '48px', left: '64px', right: '64px', borderTop: `1px solid ${colors.slate100}`, paddingTop: '32px' }}>
        <p style={{ fontSize: '9px', fontWeight: '700', color: '#cbd5e1', letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase', margin: 0 }}>
          Creziax Internal Financial Document. Confidential. Generated on {new Date().toLocaleDateString()}.
        </p>
      </div>
    </div>
  );
};

export default TeamDuePDFTemplate;
