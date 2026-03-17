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
      "login_title": "Creziax Business Management System",
      "login_subtitle": "ENTERPRISE ACCESS",
      "email_label": "Email",
      "password_label": "Password",
      "sign_in": "SIGN IN",
      "validating": "VALIDATING...",
      "copyright": "© 2026 CREZIAX DIGITAL SYSTEM"
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
      "login_title": "نظام كريزياكس لإدارة الأعمال",
      "login_subtitle": "وصول المؤسسات",
      "email_label": "البريد الإلكتروني",
      "password_label": "كلمة المرور",
      "sign_in": "تسجيل الدخول",
      "validating": "جاري التحقق...",
      "copyright": "© 2026 نظام كريزياكس الرقمي"
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
      escapeValue: false
    }
  });

export default i18n;
