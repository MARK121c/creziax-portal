import React from 'react';

const InvoicePDFTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

  const colors = {
    black: '#000000',
    white: '#ffffff',
    slate950: '#020617',
    slate900: '#111827',
    slate700: '#374151',
    slate600: '#4b5563',
    slate400: '#9ca3af',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    emerald600: '#059669',
    amber600: '#d97706',
  };

  return (
    <div 
      style={{ 
        width: '794px', 
        height: '1122px', 
        padding: '80px 100px', // More breathing room
        backgroundColor: colors.white,
        color: colors.slate900,
        fontFamily: "'Outfit', sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Background Watermark */}
      <div style={{ 
        position: 'absolute', 
        bottom: '150px', 
        left: '-50px', 
        fontSize: '180px', 
        fontWeight: '900', 
        color: colors.black, 
        opacity: 0.02, 
        transform: 'rotate(-25deg)', 
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 0
      }}>
        CREZIAX
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '100px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '950', margin: '0 0 -4px 0', letterSpacing: '-0.05em', color: colors.slate950 }}>CREZIAX</h1>
          <p style={{ 
            fontSize: '8px', 
            fontWeight: '900', 
            margin: 0, 
            letterSpacing: '0.6em', 
            textTransform: 'uppercase', 
            opacity: 0.6,
            textAlign: 'left'
          }}>
            CREATIVE AGENCY
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '950', margin: '0 0 16px 0', textTransform: 'uppercase', color: colors.slate900, opacity: 0.05 }}>INVOICE</h2>
          <div style={{ lineHeight: 1.6 }}>
            <p style={{ fontSize: '14px', fontWeight: '900', margin: 0, color: colors.slate950 }}>{invoice.invoiceNumber}</p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0', fontWeight: '600', color: colors.slate400 }}>
              {new Date(invoice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: '2px', backgroundColor: colors.slate950, marginBottom: '60px', position: 'relative', zIndex: 1 }}></div>

      {/* Info Grid */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '80px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: '12px', color: colors.slate400 }}>Billed To</p>
          <p style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-0.02em', margin: 0, color: colors.slate950 }}>
            {invoice.client?.user?.firstName} {invoice.client?.user?.lastName}
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ flexGrow: 1, position: 'relative', zIndex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ 
                width: '65%',
                fontSize: '11px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.3em', 
                paddingBottom: '20px', 
                borderBottom: `2px solid ${colors.slate950}`, 
                textAlign: 'left',
                color: colors.slate400
              }}>
                Service Description
              </th>
              <th style={{ 
                width: '35%',
                fontSize: '11px', 
                fontWeight: '900', 
                textTransform: 'uppercase', 
                letterSpacing: '0.3em', 
                paddingBottom: '20px', 
                borderBottom: `2px solid ${colors.slate950}`, 
                textAlign: 'right',
                color: colors.slate400
              }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '40px 0', verticalAlign: 'top' }}>
                <p style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0', color: colors.slate950, lineHeight: 1.4 }}>
                   {invoice.service === 'Other' || invoice.service === 'Other / أخرى' || invoice.service === 'Online Service' ? 'Online Service' : (invoice.service || 'CREZIAX PREMIUM SERVICES')}
                </p>
                {invoice.type && (
                  <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{invoice.type}</p>
                )}
              </td>
              <td style={{ padding: '40px 0', fontSize: '22px', fontWeight: '900', textAlign: 'right', verticalAlign: 'top', color: colors.slate950 }}>
                ${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '0 10px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Subtotal</span>
              <span style={{ fontSize: '14px', fontWeight: '800' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '24px 30px', 
              backgroundColor: colors.slate950, 
              borderRadius: '20px', 
              color: colors.white,
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Final Amount</span>
              <span style={{ fontSize: '24px', fontWeight: '950' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section - Enhanced Visibility & Status */}
      <div style={{ marginTop: 'auto', paddingTop: '60px', position: 'relative', zIndex: 1 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
          <div style={{ maxWidth: '440px' }}>
            <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '16px', color: colors.slate400 }}>
              {isPaid ? 'Verification' : 'Payment Details'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {isPaid ? (
                <div style={{ padding: '16px 20px', backgroundColor: colors.slate50, border: `1px solid ${colors.slate100}`, borderRadius: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', lineHeight: 1.5, margin: 0, color: colors.slate700 }}>
                    Thank you for your payment! This document serves as an official confirmation of receipt for the professional services invoiced above.
                  </p>
                </div>
              ) : (
                (invoice.paymentDetails || `Professional Fee Settlement via ${invoice.paymentMethod || 'Wire Transfer'}.`).split('\n').filter(line => line.trim() !== '').map((line, idx) => (
                  <div key={idx} style={{ padding: '12px 20px', backgroundColor: colors.white, border: `1px solid ${colors.slate100}`, borderRadius: '12px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', margin: 0, color: colors.slate700 }}>{line}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Centered Better Stamp */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '120px',
            height: '60px',
            border: `4px solid ${isPaid ? colors.emerald600 : colors.amber600}`, 
            borderRadius: '16px', 
            transform: 'rotate(-5deg)',
            backgroundColor: 'transparent'
          }}>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: '1000', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              color: isPaid ? colors.emerald600 : colors.amber600 
            }}>
              {isPaid ? 'PAID' : 'PENDING'}
            </span>
          </div>
        </div>

        {/* Final Document Footer */}
        <div style={{ borderTop: `1px solid ${colors.slate100}`, paddingTop: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: '800', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.25em', margin: 0 }}>
            Official Digital Record. Creziax Digital Systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFTemplate;
