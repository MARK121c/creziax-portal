import React from 'react';

// Ordered list of Arabic ordinals for clause numbering
const AR_ORDINALS = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
  'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر',
  'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون',
];

const EN_ORDINALS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth',
  'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth',
  'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
];

const ContractPDFTemplate = ({ contract }) => {
  const isAr = contract.language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const fontFamily = isAr ? "'Cairo', 'Almarai', Arial, sans-serif" : "'Inter', Arial, sans-serif";
  const ordinals = isAr ? AR_ORDINALS : EN_ORDINALS;

  const headingFont = { fontFamily, fontWeight: 900 };
  const bodyFont = { fontFamily, fontWeight: 400, lineHeight: 1.8 };

  const pageStyle = {
    direction: dir,
    fontFamily,
    background: '#fff',
    color: '#111',
    width: '800px',
    boxSizing: 'border-box',
    padding: '60px 70px',
    margin: 0,
  };

  const clauses = Array.isArray(contract.clauses) ? contract.clauses : [];
  const extraFields = Array.isArray(contract.extraFields) ? contract.extraFields : [];

  // ─── Page 1: Cover ───────────────────────────────────────────────────────────
  const CoverPage = () => (
    <div style={{ ...pageStyle, minHeight: '1123px', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <div style={{ borderBottom: '4px solid #111', paddingBottom: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ ...headingFont, fontSize: '36px', margin: 0, letterSpacing: '-1px' }}>CREZIAX</h1>
          <p style={{ ...bodyFont, fontSize: '11px', color: '#888', letterSpacing: '2px', textTransform: 'uppercase', margin: '4px 0 0' }}>
            {isAr ? 'وثيقة قانونية رسمية' : 'Official Legal Document'}
          </p>
        </div>
        <div style={{ textAlign: isAr ? 'left' : 'right' }}>
          <p style={{ ...bodyFont, fontSize: '12px', color: '#666', margin: 0 }}>
            {isAr ? 'التاريخ:' : 'Date:'} {contract.date}
          </p>
          <span style={{
            display: 'inline-block',
            marginTop: '6px',
            padding: '3px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            background: contract.status === 'SIGNED' ? '#dcfce7' : contract.status === 'SENT' ? '#fef3c7' : '#f1f5f9',
            color: contract.status === 'SIGNED' ? '#166534' : contract.status === 'SENT' ? '#92400e' : '#475569',
          }}>
            {contract.status}
          </span>
        </div>
      </div>

      {/* Contract Title */}
      <div style={{ textAlign: 'center', margin: '60px 0 70px' }}>
        <h2 style={{ ...headingFont, fontSize: '26px', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {contract.title}
        </h2>
        <div style={{ width: '60px', height: '4px', background: '#111', margin: '20px auto 0' }} />
      </div>

      {/* Parties */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        {/* First Party */}
        <div style={{ border: '2px solid #111', padding: '28px', borderRadius: '12px' }}>
          <p style={{ ...headingFont, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0 0 14px' }}>
            {isAr ? 'الطرف الأول' : 'First Party'}
          </p>
          <p style={{ ...headingFont, fontSize: '18px', margin: '0 0 10px' }}>Creziax Agency</p>
          <p style={{ ...bodyFont, fontSize: '13px', color: '#444', margin: '4px 0' }}>
            {isAr ? 'الممثل القانوني:' : 'Legal Representative:'} Mark Emad Girgis
          </p>
          <p style={{ ...bodyFont, fontSize: '13px', color: '#444', margin: '2px 0' }}>
            {isAr ? 'البريد الإلكتروني:' : 'Email:'} contact@creziax.cloud
          </p>
        </div>

        {/* Second Party */}
        <div style={{ border: '2px dashed #ccc', padding: '28px', borderRadius: '12px' }}>
          <p style={{ ...headingFont, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0 0 14px' }}>
            {isAr ? 'الطرف الثاني' : 'Second Party'}
          </p>
          <p style={{ ...headingFont, fontSize: '18px', margin: '0 0 10px' }}>{contract.clientName}</p>
          {contract.clientPhone && (
            <p style={{ ...bodyFont, fontSize: '13px', color: '#444', margin: '4px 0' }}>
              {isAr ? 'الهاتف:' : 'Phone:'} {contract.clientPhone}
            </p>
          )}
          {contract.clientYoutube && (
            <p style={{ ...bodyFont, fontSize: '13px', color: '#444', margin: '2px 0', wordBreak: 'break-all' }}>
              {isAr ? 'قناة يوتيوب:' : 'YouTube Channel:'} {contract.clientYoutube}
            </p>
          )}
          {extraFields.map((field, i) => (
            field.value ? (
              <p key={i} style={{ ...bodyFont, fontSize: '13px', color: '#444', margin: '2px 0' }}>
                {field.label}: {field.value}
              </p>
            ) : null
          ))}
        </div>
      </div>

      {/* Preamble */}
      {contract.preamble && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: '30px', marginTop: '10px' }}>
          <p style={{ ...headingFont, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '16px' }}>
            {isAr ? 'تمهيد' : 'Preamble'}
          </p>
          <p style={{ ...bodyFont, fontSize: '14px', color: '#333' }}>{contract.preamble}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '40px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ ...bodyFont, fontSize: '10px', color: '#aaa', margin: 0 }}>
          {isAr ? 'وثيقة معتمدة رقمياً — Creziax Agency' : 'Digitally Authenticated Document — Creziax Agency'}
        </p>
        <p style={{ ...bodyFont, fontSize: '10px', color: '#aaa', margin: 0 }}>1</p>
      </div>
    </div>
  );

  // ─── Pages 2..N: Clauses ─────────────────────────────────────────────────────
  const ClausesPage = () => (
    <div style={{ ...pageStyle, pageBreakBefore: 'always' }} className="page-break">
      {clauses.map((clause, index) => (
        <div
          key={index}
          style={{
            marginBottom: '36px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
          }}
        >
          <h3 style={{ ...headingFont, fontSize: '15px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isAr
              ? `البند ${ordinals[index] || index + 1} — ${clause.title}`
              : `Clause ${ordinals[index] || index + 1} — ${clause.title}`}
          </h3>
          <p style={{ ...bodyFont, fontSize: '14px', color: '#333', margin: 0, whiteSpace: 'pre-line' }}>
            {clause.content}
          </p>
        </div>
      ))}
    </div>
  );

  // ─── Last Page: Signatures ────────────────────────────────────────────────────
  const SignaturePage = () => (
    <div style={{ ...pageStyle, minHeight: '1123px', display: 'flex', flexDirection: 'column', pageBreakBefore: 'always' }} className="page-break">
      {/* Penalty Clause */}
      {contract.penaltyClause && (
        <div style={{ border: '2px solid #111', padding: '28px', borderRadius: '12px', marginBottom: '50px', background: '#fafafa' }}>
          <h3 style={{ ...headingFont, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 14px' }}>
            {isAr ? 'الشرط الجزائي' : 'Penalty Clause'}
          </h3>
          <p style={{ ...bodyFont, fontSize: '14px', color: '#333', margin: 0, whiteSpace: 'pre-line' }}>
            {contract.penaltyClause}
          </p>
        </div>
      )}

      {/* Signatures */}
      <h3 style={{ ...headingFont, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '40px', color: '#444' }}>
        {isAr ? 'التوقيعات والإقرار القانوني' : 'Signatures & Legal Acknowledgment'}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        {/* First Party Sig */}
        <div style={{ border: '2px solid #111', padding: '28px', borderRadius: '12px' }}>
          <p style={{ ...headingFont, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0 0 40px' }}>
            {isAr ? 'الطرف الأول — توقيع' : 'First Party — Signature'}
          </p>
          <div style={{ borderBottom: '2px solid #111', height: '50px', marginBottom: '12px' }} />
          <p style={{ ...bodyFont, fontSize: '13px', margin: '0 0 6px' }}>Mark Emad Girgis</p>
          <p style={{ ...bodyFont, fontSize: '12px', color: '#888', margin: 0 }}>
            {isAr ? 'التاريخ: ........................' : 'Date: ........................'}
          </p>
        </div>

        {/* Second Party Sig */}
        <div style={{ border: '2px dashed #ccc', padding: '28px', borderRadius: '12px' }}>
          <p style={{ ...headingFont, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0 0 40px' }}>
            {isAr ? 'الطرف الثاني — توقيع' : 'Second Party — Signature'}
          </p>
          <div style={{ borderBottom: '2px dashed #ccc', height: '50px', marginBottom: '12px' }} />
          <p style={{ ...bodyFont, fontSize: '13px', margin: '0 0 6px' }}>{contract.clientName}</p>
          {contract.signedAt ? (
            <>
              <p style={{ ...bodyFont, fontSize: '12px', color: '#166534', margin: '0 0 2px' }}>
                {isAr ? '✓ تم التوقيع رقمياً' : '✓ Digitally Signed'}
              </p>
              <p style={{ ...bodyFont, fontSize: '11px', color: '#888', margin: 0 }}>
                {new Date(contract.signedAt).toLocaleString()}
              </p>
              {contract.signedIp && (
                <p style={{ ...bodyFont, fontSize: '10px', color: '#aaa', margin: 0 }}>IP: {contract.signedIp}</p>
              )}
            </>
          ) : (
            <p style={{ ...bodyFont, fontSize: '12px', color: '#888', margin: 0 }}>
              {isAr ? 'التاريخ: ........................' : 'Date: ........................'}
            </p>
          )}
        </div>
      </div>

      {/* Stamp placeholder */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'inline-block', width: '120px', height: '120px', border: '3px dashed #ccc', borderRadius: '50%', lineHeight: '120px' }}>
          <p style={{ ...bodyFont, fontSize: '10px', color: '#ccc', margin: 0, lineHeight: '120px' }}>
            {isAr ? 'ختم الشركة' : 'Company Seal'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '40px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ ...bodyFont, fontSize: '10px', color: '#aaa', margin: 0 }}>
          {isAr ? 'وثيقة معتمدة رقمياً — Creziax Agency' : 'Digitally Authenticated Document — Creziax Agency'}
        </p>
        <p style={{ ...bodyFont, fontSize: '10px', color: '#aaa', margin: 0 }}>
          {clauses.length > 0 ? Math.ceil(clauses.length / 5) + 2 : 2}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#fff', margin: 0, padding: 0 }}>
      <CoverPage />
      <ClausesPage />
      <SignaturePage />
    </div>
  );
};

export default ContractPDFTemplate;
