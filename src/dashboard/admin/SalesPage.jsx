import { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Phone, Calendar, Clock, DollarSign, ExternalLink, 
  Search, Filter, Settings, Send, CheckCircle, AlertCircle, Trash2, 
  Edit, MessageSquare, Video, Globe, Briefcase, Eye, BarChart3, 
  Sparkles, Check, X, ShieldAlert, ArrowUpRight, ChevronDown, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  getLeadsAPI, 
  createLeadAPI, 
  updateLeadAPI, 
  deleteLeadAPI,
  getNotificationSettingsAPI,
  updateNotificationSettingsAPI,
  testNotificationAPI,
  getUsersAPI
} from '../../store/api';
import useAuthStore from '../../store/authStore';

const STATUS_CONFIG = {
  NEW: { label: 'جديد', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  MEETING_SCHEDULED: { label: 'ميتنج محجوز', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  QUALIFIED: { label: 'مؤهل', bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  WON: { label: 'تم التعاقد', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  LOST: { label: 'ملغي / خسر', bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
};

const initialLeadForm = {
  name: '',
  niche: '',
  nationality: '',
  hasOtherBusiness: 'لا',
  followersCount: '',
  videosCount: '',
  startDate: '',
  avgViews: '',
  proposedPrice: '',
  meetingDate: '',
  meetingTime: '',
  meetingLink: '',
  phone: '',
  email: '',
  channelUrl: '',
  notes: '',
  status: 'NEW',
  assignedToId: ''
};

export default function SalesPage() {
  const user = useAuthStore(state => state.user);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    totalLeads: 0,
    wonLeads: 0,
    meetingsScheduled: 0,
    totalPipelineValue: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamMembers, setTeamMembers] = useState([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(initialLeadForm);
  const [submitting, setSubmitting] = useState(false);

  // Settings state
  const [settingsData, setSettingsData] = useState({
    channel: 'TELEGRAM',
    telegram: { enabled: false, botToken: '', chatId: '' },
    whatsapp: { enabled: false, apiUrl: '', apiKey: '', phoneNumber: '' }
  });
  const [testingNotification, setTestingNotification] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await getLeadsAPI({ status: statusFilter, search });
      setLeads(res.data.leads || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('فشل تحميل بيانات العملاء المحتملين');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await getNotificationSettingsAPI();
      if (res.data) setSettingsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await getUsersAPI();
      setTeamMembers(res.data.filter(u => u.role === 'TEAM' || u.role === 'ADMIN' || u.role === 'OWNER'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchSettings();
    fetchTeam();
  }, []);

  const handleOpenAdd = () => {
    setEditingLead(null);
    setFormData(initialLeadForm);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      niche: lead.niche || '',
      nationality: lead.nationality || '',
      hasOtherBusiness: lead.hasOtherBusiness || 'لا',
      followersCount: lead.followersCount || '',
      videosCount: lead.videosCount || '',
      startDate: lead.startDate ? lead.startDate.split('T')[0] : '',
      avgViews: lead.avgViews || '',
      proposedPrice: lead.proposedPrice != null ? lead.proposedPrice : '',
      meetingDate: lead.meetingDate ? lead.meetingDate.split('T')[0] : '',
      meetingTime: lead.meetingTime || '',
      meetingLink: lead.meetingLink || '',
      phone: lead.phone || '',
      email: lead.email || '',
      channelUrl: lead.channelUrl || '',
      notes: lead.notes || '',
      status: lead.status || 'NEW',
      assignedToId: lead.assignedToId || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning('يرجى إدخال اسم العميل');
      return;
    }

    try {
      setSubmitting(true);
      if (editingLead) {
        await updateLeadAPI(editingLead.id, formData);
        toast.success('تم تحديث بيانات العميل بنجاح');
      } else {
        await createLeadAPI(formData);
        toast.success('تم إضافة العميل وإرسال الإشعار التلقائي بنجاح! 🚀');
      }
      setIsFormOpen(false);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا العميل المحتمل؟')) return;
    try {
      await deleteLeadAPI(id);
      toast.success('تم حذف العميل');
      fetchLeads();
    } catch (err) {
      toast.error('فشل حذف العميل');
    }
  };

  const handleQuickStatusChange = async (leadId, newStatus) => {
    try {
      await updateLeadAPI(leadId, { status: newStatus });
      toast.success('تم تحديث حالة العميل');
      fetchLeads();
    } catch (err) {
      toast.error('فشل تحديث الحالة');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateNotificationSettingsAPI(settingsData);
      toast.success('تم حفظ إعدادات الإشعارات التلقائية بنجاح');
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error('فشل حفظ الإعدادات');
    }
  };

  const handleTestNotification = async (type) => {
    try {
      setTestingNotification(true);
      const payload = type === 'TELEGRAM' 
        ? { type: 'TELEGRAM', botToken: settingsData.telegram.botToken, chatId: settingsData.telegram.chatId }
        : { type: 'WHATSAPP', ...settingsData.whatsapp };
      
      const res = await testNotificationAPI(payload);
      toast.success(res.data.message || 'تم إرسال الرسالة التجريبية بنجاح!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إرسال الرسالة التجريبية');
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <BarChart3 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                لوحة المبيعات وإدارة العملاء المحتملين (CRM)
              </h1>
              <p className="text-xs md:text-sm font-bold text-slate-400">
                تسجيل ومتابعة العملاء، مواعيد الميتنج، والربط التلقائي للإشعارات عبر Telegram & WhatsApp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 font-black text-xs transition-all active:scale-95"
          >
            <Settings size={16} className="text-brand-400" />
            <span>إعدادات الإشعارات</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-brand-600/30 transition-all active:scale-95"
          >
            <UserPlus size={16} />
            <span>إضافة عميل محتمل</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/5 dark:bg-[#0d0d12] p-5 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي العملاء</span>
            <Users size={18} className="text-blue-400" />
          </div>
          <h3 className="text-2xl font-black text-white">{stats.totalLeads}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">في قاعدة البيانات</p>
        </div>

        <div className="bg-white/5 dark:bg-[#0d0d12] p-5 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">مواعيد ميتنج</span>
            <Calendar size={18} className="text-amber-400" />
          </div>
          <h3 className="text-2xl font-black text-amber-400">{stats.meetingsScheduled}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">اجتماعات محجوزة</p>
        </div>

        <div className="bg-white/5 dark:bg-[#0d0d12] p-5 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">تم التعاقد (فوز)</span>
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{stats.wonLeads}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">عملاء تم تحويلهم</p>
        </div>

        <div className="bg-white/5 dark:bg-[#0d0d12] p-5 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">قيمة العقود المقترحة</span>
            <DollarSign size={18} className="text-brand-400" />
          </div>
          <h3 className="text-2xl font-black text-brand-400">${Number(stats.totalPipelineValue).toLocaleString()}</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">إجمالي المبالغ المتوقعة</p>
        </div>

        <div className="bg-white/5 dark:bg-[#0d0d12] p-5 rounded-3xl border border-white/5 col-span-2 lg:col-span-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">معدل التحويل</span>
            <Sparkles size={18} className="text-purple-400" />
          </div>
          <h3 className="text-2xl font-black text-purple-400">{stats.conversionRate}%</h3>
          <p className="text-[10px] text-slate-500 font-bold mt-1">نسبة النجاح الإجمالية</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto custom-scrollbar">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'NEW', label: 'جديد' },
            { id: 'MEETING_SCHEDULED', label: 'ميتنج محجوز' },
            { id: 'QUALIFIED', label: 'مؤهل' },
            { id: 'WON', label: 'تم التعاقد' },
            { id: 'LOST', label: 'ملغي' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، النيش، الجنسية، الهاتف..."
            className="w-full pl-4 pr-11 py-3 bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري تحميل بيانات العملاء...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="py-20 bg-white dark:bg-[#0d0d12] rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center p-8">
          <Users size={48} className="text-slate-500 mb-4 opacity-40" />
          <h3 className="text-lg font-black text-slate-300">لا يوجد عملاء محتملين حالياً</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            قم بالضغط على زر "إضافة عميل محتمل" لإدخال بيانات أول عميل وإرسال تفاصيله تلقائياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {leads.map(lead => {
            const statusInfo = STATUS_CONFIG[lead.status] || STATUS_CONFIG.NEW;
            return (
              <div
                key={lead.id}
                className="bg-white dark:bg-[#0e0e14] rounded-3xl p-6 border border-slate-200 dark:border-white/5 hover:border-brand-500/30 transition-all duration-300 flex flex-col justify-between group shadow-xl shadow-black/5"
              >
                <div>
                  {/* Top: Name, Niche, Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-brand-400 transition-colors">
                        {lead.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {lead.niche && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">
                            {lead.niche}
                          </span>
                        )}
                        {lead.nationality && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-500/10 text-slate-400 text-[10px] font-bold">
                            🌍 {lead.nationality}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={lead.status}
                        onChange={(e) => handleQuickStatusChange(lead.id, e.target.value)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl border appearance-none outline-none cursor-pointer pr-6 ${statusInfo.bg}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                          <option key={key} value={key} className="bg-slate-900 text-white">
                            {val.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </div>

                  {/* Meeting Alert Box */}
                  {lead.meetingDate && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Calendar size={16} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">موعد الاجتماع (Meeting)</p>
                          <p className="text-xs font-bold text-slate-200">
                            {new Date(lead.meetingDate).toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {lead.meetingTime ? ` - ${lead.meetingTime}` : ''}
                          </p>
                        </div>
                      </div>
                      {lead.meetingLink && (
                        <a
                          href={lead.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-[10px] font-black flex items-center gap-1 hover:bg-amber-400 transition-colors"
                        >
                          <span>دخول</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Metrics & Details Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-100 dark:border-white/5 mb-4 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">المبلغ المقترح:</span>
                      <span className="font-black text-emerald-400">
                        {lead.proposedPrice != null ? `$${lead.proposedPrice}` : 'غير محدد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">المتابعون:</span>
                      <span className="font-bold text-slate-200">{lead.followersCount || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الفيديوهات:</span>
                      <span className="font-bold text-slate-200">{lead.videosCount || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">متوسط المشاهدات:</span>
                      <span className="font-bold text-slate-200">{lead.avgViews || '-'}</span>
                    </div>
                    {lead.hasOtherBusiness && lead.hasOtherBusiness !== 'لا' && (
                      <div className="col-span-2 pt-1 border-t border-white/5">
                        <span className="text-slate-400 block text-[10px]">بزنس آخر:</span>
                        <span className="font-bold text-indigo-300">{lead.hasOtherBusiness}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes Preview */}
                  {lead.notes && (
                    <p className="text-xs text-slate-400 bg-slate-100 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200 dark:border-white/5 mb-4 line-clamp-2">
                      📝 {lead.notes}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  {/* Contact Links */}
                  <div className="flex items-center gap-1.5">
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 transition-all"
                        title="محادثة واتساب"
                      >
                        <MessageSquare size={14} />
                      </a>
                    )}
                    {lead.channelUrl && (
                      <a
                        href={lead.channelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 transition-all"
                        title="رابط القناة"
                      >
                        <Video size={14} />
                      </a>
                    )}
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(lead)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
                      title="تعديل"
                    >
                      <Edit size={14} />
                    </button>
                    {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition-all"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Lead Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0d0d12] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    {editingLead ? 'تعديل بيانات العميل المحتمل' : 'إضافة عميل محتمل جديد'}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    سيتم إرسال التفاصيل تلقائياً عبر Telegram / WhatsApp فور الحفظ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: أحمد محمد"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">النيش / المجال</label>
                  <input
                    type="text"
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    placeholder="مثال: بودكاست تقني، تجارة إلكترونية"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">جنسية العميل</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="مثال: سعودي، مصري، إماراتي"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">هل لديه بزنس آخر؟</label>
                  <input
                    type="text"
                    value={formData.hasOtherBusiness}
                    onChange={(e) => setFormData({ ...formData, hasOtherBusiness: e.target.value })}
                    placeholder="مثال: نعم (متجر إلكتروني) أو لا"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">عدد المتابعين</label>
                  <input
                    type="text"
                    value={formData.followersCount}
                    onChange={(e) => setFormData({ ...formData, followersCount: e.target.value })}
                    placeholder="مثال: 150K أو 50000"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">عدد الفيديوهات</label>
                  <input
                    type="text"
                    value={formData.videosCount}
                    onChange={(e) => setFormData({ ...formData, videosCount: e.target.value })}
                    placeholder="مثال: 45 فيديو"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">متوسط المشاهدات</label>
                  <input
                    type="text"
                    value={formData.avgViews}
                    onChange={(e) => setFormData({ ...formData, avgViews: e.target.value })}
                    placeholder="مثال: 30K - 50K"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">السعر / المبلغ المقترح ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.proposedPrice}
                    onChange={(e) => setFormData({ ...formData, proposedPrice: e.target.value })}
                    placeholder="مثال: 1500"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">تاريخ الميتنج المحجوز</label>
                  <input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">وقت الميتنج</label>
                  <input
                    type="time"
                    value={formData.meetingTime}
                    onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">رابط الميتنج (Meet/Zoom)</label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">الهاتف / واتساب</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="مثال: +966501234567"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">رابط القناة / الحساب</label>
                  <input
                    type="url"
                    value={formData.channelUrl}
                    onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
                    placeholder="https://youtube.com/@..."
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <option key={key} value={key} className="bg-slate-900 text-white">
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي تفاصيل أخرى تم الاتفاق عليها مع العميل..."
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none focus:border-brand-500 text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs shadow-xl shadow-brand-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : editingLead ? 'حفظ التعديلات' : 'إضافة وإرسال الإشعار 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification / Automation Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#0d0d12] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    إعدادات الإشعارات التلقائية (Automation)
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    إرسال بيانات العملاء تلقائياً عبر Telegram Bot أو WhatsApp فور إدخالها
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-black text-slate-300 mb-2">قناة الإرسال المفضلة</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'TELEGRAM', label: 'Telegram' },
                    { id: 'WHATSAPP', label: 'WhatsApp' },
                    { id: 'BOTH', label: 'الاثنان معاً' },
                    { id: 'NONE', label: 'تعطيل' },
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSettingsData({ ...settingsData, channel: ch.id })}
                      className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                        settingsData.channel === ch.id
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telegram Config Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-200">🤖 إعدادات Telegram Bot</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.telegram?.enabled || false}
                      onChange={(e) => setSettingsData({
                        ...settingsData,
                        telegram: { ...settingsData.telegram, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                  </label>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={settingsData.telegram?.botToken || ''}
                    onChange={(e) => setSettingsData({
                      ...settingsData,
                      telegram: { ...settingsData.telegram, botToken: e.target.value }
                    })}
                    placeholder="Telegram Bot Token (مثال: 712345678:AAHkd...)"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    value={settingsData.telegram?.chatId || ''}
                    onChange={(e) => setSettingsData({
                      ...settingsData,
                      telegram: { ...settingsData.telegram, chatId: e.target.value }
                    })}
                    placeholder="Telegram Chat ID أو Group ID (مثال: -100123456789)"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleTestNotification('TELEGRAM')}
                  disabled={testingNotification || !settingsData.telegram?.botToken || !settingsData.telegram?.chatId}
                  className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 text-xs font-black transition-all disabled:opacity-40"
                >
                  {testingNotification ? 'جاري الاختبار...' : '🧪 إرسال رسالة تجريبية لـ Telegram'}
                </button>
              </div>

              {/* WhatsApp Config Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-200">📱 إعدادات WhatsApp Webhook / API</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsData.whatsapp?.enabled || false}
                      onChange={(e) => setSettingsData({
                        ...settingsData,
                        whatsapp: { ...settingsData.whatsapp, enabled: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                <div className="space-y-2">
                  <input
                    type="url"
                    value={settingsData.whatsapp?.apiUrl || ''}
                    onChange={(e) => setSettingsData({
                      ...settingsData,
                      whatsapp: { ...settingsData.whatsapp, apiUrl: e.target.value }
                    })}
                    placeholder="WhatsApp API / Webhook URL (UltraMsg, Green API, etc.)"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    value={settingsData.whatsapp?.phoneNumber || ''}
                    onChange={(e) => setSettingsData({
                      ...settingsData,
                      whatsapp: { ...settingsData.whatsapp, phoneNumber: e.target.value }
                    })}
                    placeholder="رقم المستلم (مثال: 966501234567)"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                  <input
                    type="password"
                    value={settingsData.whatsapp?.apiKey || ''}
                    onChange={(e) => setSettingsData({
                      ...settingsData,
                      whatsapp: { ...settingsData.whatsapp, apiKey: e.target.value }
                    })}
                    placeholder="API Token / Key (اختياري)"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleTestNotification('WHATSAPP')}
                  disabled={testingNotification || (!settingsData.whatsapp?.apiUrl && !settingsData.whatsapp?.phoneNumber)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 text-xs font-black transition-all disabled:opacity-40"
                >
                  {testingNotification ? 'جاري الاختبار...' : '🧪 إرسال رسالة تجريبية لـ WhatsApp'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs shadow-xl shadow-brand-600/30 transition-all"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
