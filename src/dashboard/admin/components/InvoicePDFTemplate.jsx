import React from 'react';

const InvoicePDFTemplate = ({ invoice }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'PAID';

  const colors = {
    black: '#000000',
    white: '#ffffff',
    slate900: '#111827',
    slate700: '#374151',
    slate500: '#6b7280',
    slate400: '#9ca3af',
    slate200: '#e5e7eb',
    slate100: '#f3f4f6',
    slate50: '#f9fafb',
    emerald600: '#059669',
    amber600: '#d97706',
  };

  // Minimalist English-only design, no Tailwind classes to avoid oklch errors
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
          <p style={{ fontSize: '10px', fontWeight: '700', margin: 0, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.5 }}>STUDIO & AGENCY</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', color: colors.slate100, margin: '0 0 24px 0', textTransform: 'uppercase', lineHeight: 1 }}>INVOICE</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: colors.slate400 }}>Reference</p>
            <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginBottom: '80px' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', margin: '0 0 16px 0', opacity: 0.5 }}>Billed To</p>
          <p style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.025em', margin: 0 }}>
            {invoice.client?.user?.firstName} {invoice.client?.user?.lastName}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', margin: '0 0 16px 0', opacity: 0.5 }}>Date Issued</p>
          <p style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {new Date(invoice.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Line Item */}
      <div style={{ marginBottom: '80px' }}>
        <div style={{ borderBottom: `2px solid ${colors.black}`, paddingBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.5 }}>Description</span>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3em', opacity: 0.5 }}>Amount</span>
        </div>
        <div style={{ padding: '40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.025em', margin: 0 }}>{invoice.service || 'Creative Services'}</p>
          <p style={{ fontSize: '30px', fontWeight: '900', margin: 0 }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ borderTop: `1px solid ${colors.slate100}`, marginTop: '8px' }}></div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '120px' }}>
        <div style={{ width: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', opacity: 0.5 }}>Subtotal</span>
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.025em' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', backgroundColor: colors.slate900, borderRadius: '8px', color: colors.white }}>
            <span style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
            <span style={{ fontSize: '30px', fontWeight: '900' }}>${invoice.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      {(invoice.paymentMethod || invoice.paymentDetails) && (
        <div style={{ maxWidth: '448px', borderTop: `1px solid ${colors.slate100}`, paddingTop: '40px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '16px', opacity: 0.5 }}>Payment Instructions</p>
          <p style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: colors.slate700, margin: 0 }}>
            {invoice.paymentDetails ? invoice.paymentDetails : `Please settle via ${invoice.paymentMethod}`}
          </p>
        </div>
      )}

      {/* Minimalist Corner Stamp */}
      <div style={{ position: 'absolute', bottom: '96px', right: '64px', pointerEvents: 'none', opacity: 0.8 }}>
        {isPaid ? (
          <div style={{ border: `4px solid ${colors.emerald600}`, borderRadius: '12px', padding: '8px 16px', transform: 'rotate(-5deg)' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.emerald600 }}>PAID</span>
          </div>
        ) : (
          <div style={{ border: `4px solid ${colors.amber600}`, borderRadius: '12px', padding: '8px 16px', transform: 'rotate(-5deg)' }}>
            <span style={{ fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.amber600 }}>PENDING</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '48px', left: '64px', right: '64px', borderTop: `1px solid ${colors.slate50}`, paddingTop: '32px' }}>
        <p style={{ fontSize: '9px', fontWeight: '700', color: '#cbd5e1', letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase', margin: 0 }}>
          Generated via Creziax Internal Portal. Electronic Document. No signature required.
        </p>
      </div>
    </div>
  );
};

export default InvoicePDFTemplate;
