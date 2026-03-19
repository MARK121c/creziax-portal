import React from 'react';

const InvoicePDFTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

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
          <p style={{ fontSize: '9px', fontWeight: '700', margin: 0, letterSpacing: '0.2em', opacity: 0.6 }}>CREATIVE STUDIO</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 8px 0', textTransform: 'uppercase' }}>INVOICE</h2>
          <p style={{ fontSize: '11px', margin: 0, fontWeight: '700' }}>{invoice.invoiceNumber}</p>
          <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: colors.slate400 }}>
            {new Date(invoice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${colors.slate100}`, marginBottom: '30px' }}></div>

      {/* Bill To */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', opacity: 0.5 }}>Billed To</p>
        <p style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>
          {invoice.client?.user?.firstName} {invoice.client?.user?.lastName}
        </p>
      </div>

      {/* Modern Table Layout */}
      <div style={{ flexGrow: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '12px', borderBottom: `1px solid ${colors.black}`, opacity: 0.5 }}>Service Description</th>
              <th style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '12px', borderBottom: `1px solid ${colors.black}`, textAlign: 'right', opacity: 0.5 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
          <td style={{ padding: '24px 0', fontSize: '15px', fontWeight: '700' }}>
            {(invoice.service === 'Other' || invoice.service === 'Other / أخرى' || invoice.service === 'Online Service') ? 'Online Service' : (invoice.service || 'Creative Services')}
            {invoice.type && <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', marginTop: '4px', color: colors.slate400 }}>{invoice.type}</span>}
          </td>
              <td style={{ padding: '24px 0', fontSize: '15px', fontWeight: '900', textAlign: 'right' }}>
                ${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ width: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${colors.slate100}` }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: colors.slate400 }}>Subtotal</span>
              <span style={{ fontSize: '12px', fontWeight: '700' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>Total Amount</span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: colors.black }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Footer Section (Always at bottom of page) */}
      <div style={{ marginTop: 'auto' }}>
        {/* Shrunken Status Stamp - Placed here above instructions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div style={{ 
            border: `2px solid ${isPaid ? colors.emerald600 : colors.amber600}`, 
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
              color: isPaid ? colors.emerald600 : colors.amber600 
            }}>
              {isPaid ? 'PAID' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Payment Instructions */}
        {(invoice.paymentMethod || invoice.paymentDetails) && (
          <div style={{ padding: '20px', border: `1px solid ${colors.slate100}`, borderRadius: '8px', marginBottom: '30px' }}>
            <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0', opacity: 0.5 }}>Payment Instructions</p>
            <p style={{ fontSize: '11px', fontWeight: '500', margin: 0, color: colors.slate600, lineHeight: 1.5 }}>
              {invoice.paymentDetails ? invoice.paymentDetails : `Please settle this invoice via ${invoice.paymentMethod}.`}
            </p>
          </div>
        )}

        <div style={{ borderTop: `1px solid ${colors.slate100}`, paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            This is an electronic receipt. No signature required. Thank you for your business.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFTemplate;
