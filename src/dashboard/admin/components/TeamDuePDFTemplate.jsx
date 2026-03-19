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
    slate100: '#f3f4f6',
    slate50: '#f9fafb',
    emerald600: '#059669',
    amber600: '#d97706',
  };

  return (
    <div 
      style={{ 
        width: '794px', 
        height: '1122px', 
        padding: '60px 80px',
        backgroundColor: colors.white,
        color: colors.slate900,
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header - Matching Invoice Style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.05em', color: colors.black }}>CREZIAX</h1>
          <p style={{ fontSize: '10px', fontWeight: '600', margin: 0, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.4 }}>Internal Voucher</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 12px 0', textTransform: 'uppercase', opacity: 0.1 }}>PAYMENT RECEIPT</h2>
          <div style={{ lineHeight: 1.4 }}>
            <p style={{ fontSize: '12px', fontWeight: '800', margin: 0 }}>#V-{due.id?.slice(0, 8).toUpperCase()}</p>
            <p style={{ fontSize: '11px', margin: '4px 0 0 0', fontWeight: '500', color: colors.slate500 }}>
              {new Date(due.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: colors.slate100, marginBottom: '40px' }}></div>

      {/* Payee Info */}
      <div style={{ marginBottom: '60px' }}>
        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', color: colors.slate400 }}>Paid To (Beneficiary)</p>
        <p style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', margin: 0 }}>
          {due.user ? `${due.user.firstName} ${due.user.lastName}` : 'System Registered User'}
        </p>
      </div>

      {/* Table Section */}
      <div style={{ flexGrow: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ 
                width: '70%',
                fontSize: '10px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.2em', 
                paddingBottom: '16px', 
                borderBottom: `2px solid ${colors.black}`, 
                textAlign: 'left',
                color: colors.slate400
              }}>
                Description & Purpose
              </th>
              <th style={{ 
                width: '30%',
                fontSize: '10px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.2em', 
                paddingBottom: '16px', 
                borderBottom: `2px solid ${colors.black}`, 
                textAlign: 'right',
                color: colors.slate400
              }}>
                Payment Type
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '32px 0', verticalAlign: 'top' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', margin: '0', color: colors.slate900, lineHeight: 1.5 }}>
                   {due.description || 'Professional Service Reimbursement'}
                </p>
              </td>
              <td style={{ padding: '32px 0', textAlign: 'right', verticalAlign: 'top' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', padding: '6px 12px', backgroundColor: colors.slate100, borderRadius: '6px' }}>
                  {due.transferMethod || 'BANK'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
          <div style={{ width: '240px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              backgroundColor: colors.slate100, 
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Receipt Total</span>
              <span style={{ fontSize: '20px', fontWeight: '900' }}>${due.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section - Dynamic Logic */}
      <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div style={{ maxWidth: '480px' }}>
            <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', color: colors.slate400 }}>
              Transaction Summary
            </p>
            <div style={{ 
              padding: '24px', 
              backgroundColor: colors.slate50, 
              border: `1px solid ${colors.slate100}`, 
              borderRadius: '16px' 
            }}>
              <p style={{ fontSize: '12px', fontWeight: '600', lineHeight: 1.6, margin: 0, color: colors.slate700 }}>
                {isSent ? (
                   "This receipt confirms that the funds have been successfully transferred to the designated account. Thank you for your continued cooperation."
                ) : (
                   due.transferDetails ? due.transferDetails : "Payment is scheduled for processing. Funds will be released via the selected transfer method shortly."
                )}
              </p>
            </div>
          </div>

          {/* Clean Small Status Stamp */}
          <div style={{ 
            border: `3px solid ${isSent ? colors.emerald600 : colors.amber600}`, 
            borderRadius: '8px', 
            padding: '6px 12px',
            transform: 'rotate(-5deg)',
            marginBottom: '10px'
          }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '900', 
              textTransform: 'uppercase', 
              letterSpacing: '0.2em', 
              color: isSent ? colors.emerald600 : colors.amber600 
            }}>
              {isSent ? 'SENT' : 'PENDING'}
            </span>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${colors.slate100}`, paddingTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            Official Internal Financial Record — Creziax Corporate Systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamDuePDFTemplate;
