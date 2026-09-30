const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'src', 'i18n.js');
if (fs.existsSync(i18nPath)) {
  let code = fs.readFileSync(i18nPath, 'utf8');

  if (!code.includes('sales_crm')) {
    // Add to ar translations
    code = code.replace(
      /finance_hub:\s*['"][^'"]+['"],/,
      `finance_hub: 'المركز المالي',\n      sales_crm: 'المبيعات و CRM',`
    );

    // Add to en translations
    code = code.replace(
      /finance_hub:\s*['"][^'"]+['"],/,
      `finance_hub: 'Finance Hub',\n      sales_crm: 'Sales & CRM',`
    );

    fs.writeFileSync(i18nPath, code, 'utf8');
    console.log('[+] i18n.js updated with sales_crm translations!');
  } else {
    console.log('[+] sales_crm already present in i18n.js');
  }
}
