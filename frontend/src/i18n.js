import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "clients": "Clients",
      "team": "Team",
      "projects": "Projects",
      "tasks": "Tasks",
      "files": "Files",
      "messages": "Messages",
      "invoices": "Invoices",
      "payments": "Payments",
      "my_tasks": "My Tasks",
      "agency_portal": "Agency Portal",
      "sign_out": "Sign Out",
      "overview": "Overview",
      "welcome_back": "Welcome back, here's what's happening today.",
      "total_users": "Total Users",
      "active_projects": "Active Projects",
      "pending_tasks": "Pending Tasks",
      "total_invoices": "Total Invoices",
      "activity_chart": "Activity Chart Placeholder",
      "quick_actions": "Quick Actions",
      "clients_directory": "Clients Directory",
      "manage_clients": "Manage your agency's client relationships",
      "add_client": "Add New Client",
      "client_name": "Client Name",
      "contact_info": "Contact Info",
      "joined_date": "Joined Date",
      "actions": "Actions",
      "no_clients": "No Clients Yet",
      "financials": "Financials & Invoices",
      "manage_billing": "Manage billing, payments, and client invoices",
      "create_invoice": "Create Invoice",
      "invoice_details": "Invoice Details",
      "client": "Client",
      "amount": "Amount",
      "status": "Status",
      "no_invoices": "No Invoices Yet",
    }
  },
  ar: {
    translation: {
      "dashboard": "لوحة التحكم",
      "clients": "العملاء",
      "team": "الفريق",
      "projects": "المشاريع",
      "tasks": "المهام",
      "files": "الملفات",
      "messages": "الرسائل",
      "invoices": "الفواتير",
      "payments": "المدفوعات",
      "my_tasks": "مهامي",
      "agency_portal": "بوابة الوكالة",
      "sign_out": "تسجيل الخروج",
      "overview": "نظرة عامة",
      "welcome_back": "أهلاً بك، إليك ما يحدث اليوم.",
      "total_users": "إجمالي المستخدمين",
      "active_projects": "المشاريع النشطة",
      "pending_tasks": "المهام المعلقة",
      "total_invoices": "إجمالي الفواتير",
      "activity_chart": "مخطط النشاط",
      "quick_actions": "إجراءات سريعة",
      "clients_directory": "دليل العملاء",
      "manage_clients": "إدارة علاقات عملاء الوكالة",
      "add_client": "إضافة عميل جديد",
      "client_name": "اسم العميل",
      "contact_info": "معلومات الاتصال",
      "joined_date": "تاريخ الانضمام",
      "actions": "إجراءات",
      "no_clients": "لا يوجد عملاء بعد",
      "financials": "المالية والفواتير",
      "manage_billing": "إدارة المدفوعات وفواتير العملاء",
      "create_invoice": "إنشاء فاتورة",
      "invoice_details": "تفاصيل الفاتورة",
      "client": "العميل",
      "amount": "المبلغ",
      "status": "الحالة",
      "no_invoices": "لا توجد فواتير بعد",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
