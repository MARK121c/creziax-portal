import React from 'react';

const TeamDuePDFTemplate = ({ due }) => {
  if (!due) return null;

  const isSent = due.status === 'SENT';

  const colors = {
    black: '#000000',
    white: '#ffffff',
    slate900: '#111827',
    slate600: '#4b5563',
    slate400: '#9ca3af',
    slate100: '#f3f4f6',
    emerald600: '#059669',
    amber600: '#d97706',
  };

  // STRICT A4 ONE-PAGE MINIMALIST (ENGLISH ONLY)
  return (
    <div 
      style={{ 
        width: '794px', 
        height: '1122px', // Strict A4 Height
        padding: '40px 60px',
        backgroundColor: colors.white,
        color: colors.slate900,
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 2px 0', letterSpacing: '-0.05em', color: colors.black }}>CREZIAX</h1>
          <p style={{ fontSize: '9px', fontWeight: '700', margin: 0, letterSpacing: '0.2em', opacity: 0.6 }}>INTERNAL VOUCHER</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', textTransform: 'uppercase' }}>PAYMENT RECEIPT</h2>
          <p style={{ fontSize: '11px', margin: 0, fontWeight: '700' }}>#{due.id?.slice(0, 8).toUpperCase()}</p>
          <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: colors.slate400 }}>
            {new Date(due.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${colors.slate100}`, marginBottom: '30px' }}></div>

      {/* Paid To */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', opacity: 0.5 }}>Beneficiary Name</p>
        <p style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>
          {due.user ? `${due.user.firstName} ${due.user.lastName}` : 'System Registered User'}
        </p>
      </div>

      {/* Modern Table Layout */}
      <div style={{ flexGrow: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '12px', borderBottom: `1px solid ${colors.black}`, opacity: 0.5 }}>Description & Purpose</th>
              <th style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '12px', borderBottom: `1px solid ${colors.black}`, textAlign: 'right', opacity: 0.5 }}>Payment Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '24px 0', fontSize: '15px', fontWeight: '700', maxWidth: '400px', lineHeight: 1.4 }}>
                {due.description || 'Service Reimbursement / Performance Fee'}
              </td>
              <td style={{ padding: '24px 0', fontSize: '15px', fontWeight: '900', textAlign: 'right' }}>
                {due.transferMethod || 'INTERNAL'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', backgroundColor: colors.slate100, borderRadius: '8px', padding: '10px 16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', opacity: 0.6 }}>Receipt Total</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: colors.black }}>${due.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Footer Section (Always at bottom of page) */}
      <div style={{ marginTop: 'auto' }}>
        {/* Shrunken Status Stamp */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ 
            border: `2px solid ${isSent ? colors.emerald600 : colors.amber600}`, 
            borderRadius: '6px', 
            padding: '4px 10px',
            transform: 'rotate(-5deg)',
            opacity: 0.8
          }}>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: '900', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: isSent ? colors.emerald600 : colors.amber600 
            }}>
              {isSent ? 'SENT' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Confirmation Details */}
        {due.transferDetails && (
          <div style={{ padding: '20px', border: `1px solid ${colors.slate100}`, borderRadius: '8px', marginBottom: '30px' }}>
            <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0', opacity: 0.5 }}>Transfer Details / Notes</p>
            <p style={{ fontSize: '11px', fontWeight: '500', margin: 0, color: colors.slate600, lineHeight: 1.5 }}>
              {due.transferDetails}
            </p>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${colors.slate100}`, paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Internal Financial Document. Creziax Digital Systems. Confirmed & Secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamDuePDFTemplate;
