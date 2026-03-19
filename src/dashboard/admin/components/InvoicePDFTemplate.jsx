import React from 'react';

const InvoicePDFTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

  const colors = {
    black: '#000000',
    white: '#ffffff',
    slate900: '#111827',
    slate700: '#374151',
    slate600: '#4b5563',
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
        height: '1122px', 
        padding: '60px 80px', // More breathing room
        backgroundColor: colors.white,
        color: colors.slate900,
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header - Professional Clean Design */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.05em', color: colors.black }}>CREZIAX</h1>
          <p style={{ fontSize: '10px', fontWeight: '600', margin: 0, letterSpacing: '0.4em', textTransform: 'uppercase', opacity: 0.4 }}>Creative Agency</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 12px 0', textTransform: 'uppercase', opacity: 0.1 }}>INVOICE</h2>
          <div style={{ lineHeight: 1.4 }}>
            <p style={{ fontSize: '12px', fontWeight: '800', margin: 0 }}>{invoice.invoiceNumber}</p>
            <p style={{ fontSize: '11px', margin: '4px 0 0 0', fontWeight: '500', color: colors.slate500 }}>
              {new Date(invoice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: '1px', backgroundColor: colors.slate100, marginBottom: '40px' }}></div>

      {/* Bill To Info */}
      <div style={{ marginBottom: '60px' }}>
        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', color: colors.slate400 }}>Billed To</p>
        <p style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.02em', margin: 0 }}>
          {invoice.client?.user?.firstName} {invoice.client?.user?.lastName}
        </p>
      </div>

      {/* Table Section - Improved Spacing & Alignment */}
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
                Service Description
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
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '32px 0', verticalAlign: 'top' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: colors.slate900 }}>
                   {invoice.service === 'Other' || invoice.service === 'Other / أخرى' || invoice.service === 'Online Service' ? 'Online Service' : (invoice.service || 'Creative Projects')}
                </p>
                {invoice.type && (
                  <p style={{ fontSize: '12px', fontWeight: '500', margin: 0, color: colors.slate400 }}>{invoice.type}</p>
                )}
              </td>
              <td style={{ padding: '32px 0', fontSize: '18px', fontWeight: '900', textAlign: 'right', verticalAlign: 'top' }}>
                ${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px' }}>
          <div style={{ width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', padding: '0 8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: colors.slate400 }}>Subtotal</span>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              backgroundColor: colors.slate900, 
              borderRadius: '12px', 
              color: colors.white 
            }}>
              <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Amount</span>
              <span style={{ fontSize: '20px', fontWeight: '900' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Footer Section - Intelligence applied here */}
      <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
        
        {/* Dynamic Status Display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div style={{ maxWidth: '480px' }}>
            <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px', color: colors.slate400 }}>
              {isPaid ? 'Payment Confirmation' : 'Payment Instructions'}
            </p>
            <div style={{ 
              padding: '24px', 
              backgroundColor: isPaid ? colors.slate50 : colors.white, 
              border: `1px solid ${colors.slate100}`, 
              borderRadius: '16px' 
            }}>
              <p style={{ fontSize: '12px', fontWeight: '600', lineHeight: 1.6, margin: 0, color: colors.slate700 }}>
                {isPaid ? (
                   "Thank you for your payment! This is an official receipt for the services rendered. We appreciate your prompt business."
                ) : (
                  invoice.paymentDetails ? invoice.paymentDetails : `Please settle this invoice via Bank Transfer or ${invoice.paymentMethod || 'the agreed method'}. Details included below.`
                )}
              </p>
            </div>
          </div>

          {/* Clean Small Status Stamp */}
          <div style={{ 
            border: `3px solid ${isPaid ? colors.emerald600 : colors.amber600}`, 
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
              color: isPaid ? colors.emerald600 : colors.amber600 
            }}>
              {isPaid ? 'PAID' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Static Professional Footer */}
        <div style={{ borderTop: `1px solid ${colors.slate100}`, paddingTop: '32px', textAlign: 'center' }}>
          <p style={{ fontSize: '9px', fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            Generated electronically by Creziax Digital Systems. Confidentially secured. No physical signature required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFTemplate;
