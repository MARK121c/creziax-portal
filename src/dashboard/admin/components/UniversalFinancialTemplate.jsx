import React from 'react';

const UniversalFinancialTemplate = ({ data }) => {
  const {
    document_type,
    transaction_id,
    date,
    party_name,
    status_bg,
    status_color,
    status_label,
    service_name,
    amount,
    payment_method,
    payment_details,
    party_label,
    local_amount,
    currency,
  } = data || {};

  return (
    <div style={{ 
      direction: 'ltr',
      fontFamily: "'Inter', Arial, sans-serif", 
      padding: '40px', 
      background: '#fff', 
      color: '#111', 
      height: '1123px', // strictly A4 proportion for 800px width
      width: '800px',
      boxSizing: 'border-box',
      margin: 0,
      position: 'relative',
      textAlign: 'left',
      lineHeight: 'normal'
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '4px solid #111', paddingBottom: '25px', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-1px' }}>CREZIAX</h1>
          <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#666', letterSpacing: '2px', textTransform: 'uppercase' }}>Official Financial Document</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', color: '#111' }}>{document_type}</h2>
          <p style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: 'bold' }}>Ref: #{transaction_id}</p>
          <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 700, color: '#666' }}>Date: {date}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: '#f9f9f9', padding: '25px', borderRadius: '12px' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', marginBottom: '5px', margin: 0 }}>{party_label || 'Recipient / Party'}</p>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{party_name}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '15px',
            fontWeight: '900',
            color: status_color,
            textTransform: 'uppercase',
            textAlign: 'right'
          }}>
            {status_label}
          </span>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #111' }}>
            <th style={{ textAlign: 'left', padding: '15px 0 15px 20px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Description of Service/Task</th>
            <th style={{ textAlign: 'right', padding: '15px 20px 15px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ textAlign: 'left', padding: '30px 0 30px 20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700 }}>{service_name}</div>
              <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>Transaction processed via Creziax Internal Financial System.</p>
            </td>
            <td style={{ textAlign: 'right', paddingRight: '20px', fontSize: '20px', fontWeight: 900 }}>
              {amount} {currency || 'USD'}
              {local_amount && currency && currency !== 'USD' && (
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#666', marginTop: '6px' }}>
                  ≈ {local_amount} {currency}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '50px' }}>
        <div style={{ width: '280px', background: '#111', color: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '15px' }}>
            <span>Final Balance</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '10px', paddingLeft: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '28px', fontWeight: 900 }}>
              <span>Total</span>
              <span>{amount} {currency || 'USD'}</span>
            </div>
            {local_amount && currency && currency !== 'USD' && (
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#aaa', marginTop: '4px' }}>
                Equivalent of {local_amount} {currency}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888', marginBottom: '12px', margin: 0, textAlign: 'left' }}>Payment Method & Settlement Details</p>
        <div style={{ border: '2px dashed #e2e8f0', padding: '25px', borderRadius: '12px', background: '#fff', marginTop: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ textAlign: 'left', marginLeft: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#999', textAlign: 'left' }}>Method:</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#111', textAlign: 'left' }}>{payment_method || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'left', marginLeft: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#999', textAlign: 'left' }}>Transfer Details:</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600, color: '#111', textAlign: 'left' }}>{payment_details || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>This is a computer-generated document. No signature is required.</p>
        <p style={{ fontSize: '10px', color: '#ccc', marginTop: '5px', margin: '5px 0 0 0' }}>Creziax Agency | Financial Department</p>
      </div>

    </div>
  );
};

export default UniversalFinancialTemplate;
