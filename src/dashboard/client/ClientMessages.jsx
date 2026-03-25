import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  getMessagesAPI, 
  sendMessageAPI,
  getClientContactsAPI,
  getProjectsAPI,
  createTicketAPI,
  markAsReadAPI,
  markAllAsReadAPI,
  togglePinAPI,
  deleteSpecificMessageAPI
} from '../../store/api';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { useTranslation } from 'react-i18next';
import { toast as rToast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';
import {
  CheckCircle2,
  Clock,
  Pin,
  MessageSquareReply,
  Trash2,
  ExternalLink,
  Calendar,
  X,
  ShieldAlert,
  Headset,
  Briefcase,
  Send,
  MessageSquare,
  Loader2,
  UserCircle,
  CalendarPlus2,
  Link as LinkIcon
} from 'lucide-react';

// ──────────────────────────────────────────────
// Meeting Scheduler Pop-up
// ──────────────────────────────────────────────
const MeetingModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ subject: '', date: '', time: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.date || !form.time) {
      rToast.error('يرجى تعبئة جميع الحقول');
      return;
    }
    setSending(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <CalendarPlus2 size={20} className="text-brand-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white">جدولة موعد جديد</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">سيتم إرسال الطلب للإدارة للموافقة</p>
          </div>
          <button onClick={onClose} className="mr-auto p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">موضوع الاجتماع</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="مثال: مراجعة تقدم المشروع، نقاش خطة المحتوى..."
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12} /> التاريخ
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} /> الوقت
              </label>
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus2 size={16} />}
            إرسال طلب الموعد
          </button>
        </form>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Drive Link Panel
// ──────────────────────────────────────────────
const DriveLinkPanel = ({ activeThread, user, onClose, onSend }) => {
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!link.trim()) { rToast.error('الرجاء لصق رابط Google Drive أولاً'); return; }
    if (!link.includes('drive.google.com') && !link.startsWith('http')) {
      rToast.error('الرجاء إدخال رابط صحيح');
      return;
    }
    setSending(true);
    try {
      await onSend(`[DRIVE_LINK]${link.trim()}`);
      setLink('');
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute bottom-full mb-3 left-0 right-0 mx-4 z-20 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon size={16} className="text-brand-500" />
        <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">إرسال رابط ملف (Google Drive)</span>
        <button onClick={onClose} className="mr-auto text-slate-400 hover:text-slate-600 dark:hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none dark:text-white"
          dir="ltr"
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending || !link.trim()}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-xs transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          إرسال
        </button>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
const ClientMessages = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setActiveThreadId, resetUnreadMessages, unreadThreads, setGlobalCountVisible } = useNotificationStore();

  useEffect(() => {
    // v17.5.3 Zero-Out Logic: Mark all as read on mount
    markAllAsReadAPI().catch(() => {});
    resetUnreadMessages();
    setGlobalCountVisible(false);
  }, [resetUnreadMessages, setGlobalCountVisible]);
  
  const [supportContact, setSupportContact] = useState(null);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showDrivePanel, setShowDrivePanel] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState(null);
  
  const socket = useSocket();
  const scrollRef = useRef();
  const activeThreadRef = useRef(activeThread);
  activeThreadRef.current = activeThread;

  const fetchData = useCallback(async () => {
    setLoadingSidebar(true);
    try {
      const [contactsRes, projectsRes] = await Promise.all([
        getClientContactsAPI(),
        getProjectsAPI()
      ]);
      setSupportContact(contactsRes.data.support);
      setProjects(projectsRes.data || []);
    } catch (err) {
      rToast.error("فشل تحميل جهات الاتصال");
    } finally {
      setLoadingSidebar(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchThreadMessages = async (threadId) => {
    if (!threadId) return;
    setLoadingMessages(true);
    try {
      const { data } = await getMessagesAPI(threadId);
      setMessages(data || []);
      markAsReadAPI({ threadId });
      resetUnreadMessages(threadId);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Fetch Messages Error:", err);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!socket || loadingSidebar) return;

    const handleJoinRooms = () => {
      if (user?.id) {
        socket.emit('join_rooms', {
          userId: user.id,
          role: user.role,
          projectIds: projects.map(p => p.id)
        });
      }
    };

    handleJoinRooms();
    socket.on('connect', handleJoinRooms);
    return () => socket.off('connect', handleJoinRooms);
  }, [projects, user, loadingSidebar, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg) => {
      const current = activeThreadRef.current;
      if (!current) return;
      
      const isCorrectThread = 
        (newMsg.type === 'GROUP' && newMsg.threadId === current.id && current.type === 'GROUP') ||
        (newMsg.type === 'PRIVATE' && current.type !== 'GROUP');

      if (isCorrectThread) {
        if (newMsg.senderId !== user?.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { 
              ...newMsg, 
              sender: newMsg.sender || { firstName: newMsg.senderName || 'الدعم الفني', role: 'ADMIN' },
              parent: newMsg.parent
            }];
          });
          const targetResetId = current.type === 'GROUP' ? current.id : user?.id;
          resetUnreadMessages(targetResetId);
          markAsReadAPI({ threadId: targetResetId }).catch(() => {});
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('chat_deleted', ({ threadId }) => {
      const current = activeThreadRef.current;
      if (current?.id === threadId || threadId === user?.id) {
        setMessages([]);
        setActiveThread(null);
        rToast.success("تم مسح هذه المحادثة بالكامل من قبل الإدارة");
      }
    });

    socket.on('message_deleted', ({ id }) => {
      // v17.5.3 Iron Deletion: Filter out deleted messages completely for a clean "disappear" effect
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    socket.on('message_pinned', ({ id, isPinned }) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned } : m));
    });

    return () => {
       socket.off('receive_message', handleReceiveMessage);
       socket.off('chat_deleted');
       socket.off('message_deleted');
       socket.off('message_pinned');
    };
  }, [user?.id, socket, resetUnreadMessages]);

  useEffect(() => {
    if (activeThread) {
      const tid = activeThread.type === 'GROUP' ? activeThread.id : user?.id;
      setActiveThreadId(tid);
      resetUnreadMessages(tid);
    } else {
      setActiveThreadId(null);
    }
  }, [activeThread, user?.id, setActiveThreadId, resetUnreadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateMessage = (text) => {
    const phoneRegex = /(01|\+)[0-9]{8,15}/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const socialRegex = /(t\.me|wa\.me|whatsapp|telegram)/i;
    if (phoneRegex.test(text) || emailRegex.test(text) || socialRegex.test(text)) {
      rToast.error('عذراً، يمنع مشاركة بيانات التواصل الخارجية لضمان خصوصية المنصة.', { duration: 5000 });
      return false;
    }
    return true;
  };

  const doSendMessage = async (msgContent) => {
    if (!activeThread) return;
    const isGroup = activeThread.type === 'GROUP';
    const type = isGroup ? 'GROUP' : 'PRIVATE';
    const threadIdToSend = isGroup ? activeThread.id : null;
    const receiverIdToSend = !isGroup ? activeThread.userId : null;
    
    const { data } = await sendMessageAPI({ 
      content: msgContent, 
      type,
      threadId: threadIdToSend,
      receiverId: receiverIdToSend,
      parentId: replyingTo?.id || null
    });
    
    socket.emit('send_message', { 
      ...data, 
      type,
      threadId: threadIdToSend,
      receiverId: receiverIdToSend,
      senderName: `${user?.firstName} ${user?.lastName}`,
      parent: replyingTo
    });
    setReplyingTo(null);
    setMessages(prev => [...prev, { ...data, sender: user, parent: replyingTo }]);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || !activeThread) return;
    if (!validateMessage(content)) return;
    try {
      await doSendMessage(content);
      setContent('');
    } catch (err) {
      if (err.response?.status === 403) {
        rToast.error(err.response.data.message);
      } else {
        rToast.error("فشل إرسال الرسالة");
      }
    }
  };

  const handleSendDriveLink = async (link) => {
    await doSendMessage(link);
    rToast.success('تم إرسال رابط الملف بنجاح');
  };

  const handleMeetingSubmit = async (form) => {
    const clientName = user?.firstName || 'Valued Client';
    const desc = `طلب ميعاد جديد من العميل: ${clientName}\nالموضوع: ${form.subject}\nالتاريخ: ${form.date}\nالوقت: ${form.time}`;
    await createTicketAPI({
      title: `طلب ميعاد جديد: ${clientName}`,
      description: desc,
      type: 'MEETING',
      status: 'OPEN',
    });

    if (activeThread) {
      const cardContent = `[MEETING_BOOKING]\nTopic: ${form.subject}\nAvailability: ${form.date} ${form.time}`;
      await doSendMessage(cardContent);
    }
    rToast.success('تم إرسال طلب الموعد للإدارة بنجاح ✅');
  };

  const selectThread = (item, type) => {
    const thread = {
      id: item.id,
      name: type === 'DM' ? (item.firstName ? `${item.firstName} ${item.lastName}` : item.name) : item.name,
      type: type,
      userId: type === 'DM' ? item.id : null,
      subtitle: type === 'DM' ? (item.role === 'OWNER' ? 'فريق الدعم' : 'مدير المشروع') : 'مجموعة المشروع',
    };
    setActiveThread(thread);
    const threadIdToFetch = type === 'GROUP' ? item.id : user.id;
    resetUnreadMessages(threadIdToFetch);
    fetchThreadMessages(threadIdToFetch);
    setShowDrivePanel(false);
  };

  const renderMessage = (m, i) => {
    const isDriveLink = m.content?.startsWith('[DRIVE_LINK]');
    const driveUrl = isDriveLink ? m.content.replace('[DRIVE_LINK]', '') : null;
    const isFileCard = m.content?.startsWith('[FILE]');
    const isBookingCard = m.content?.startsWith('[MEETING_BOOKING]');
    
    let fileUrl = null;
    let bookingDetails = null;

    if (isFileCard) {
      const lines = m.content.split('\n');
      fileUrl = lines[0].replace('[FILE]', '');
    } else if (isBookingCard) {
      const lines = m.content.split('\n');
      bookingDetails = {
        topic: lines[1]?.replace('Topic: ', ''),
        dates: lines[2]?.replace('Availability: ', '')
      };
    }
    const isMine = m.senderId === user?.id;

    return (
      <div key={m.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
          <div className={`flex items-center gap-3 mb-2 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {m.sender?.firstName} {m.sender?.lastName} {isMine && '(أنت)'}
            </span>
            {m.isPinned && <Pin size={10} className="text-brand-500 fill-current" />}
          </div>

          {m.parent && (
            <div className={`mb-1 px-4 py-2 rounded-t-2xl bg-slate-100 dark:bg-white/5 border-r-4 border-brand-500/50 max-w-full overflow-hidden opacity-80 ${isMine ? 'mr-2' : 'ml-2'}`}>
              <p className="text-[10px] font-black text-brand-500 mb-1">{m.parent.sender?.firstName} {m.parent.sender?.lastName}</p>
              <p className="text-[11px] font-bold text-slate-500 truncate">{m.parent.content}</p>
            </div>
          )}

          <div className="group relative">
            <div className={`px-6 py-4 rounded-[1.25rem] text-sm font-bold leading-relaxed shadow-sm ${
              isMine 
                ? 'bg-brand-600 text-white rounded-tr-none shadow-brand-600/10' 
                : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'
            } ${isBookingCard ? 'border-2 border-brand-500/30 ring-4 ring-brand-500/10' : ''} ${m.isPinned ? 'ring-2 ring-brand-500/20 bg-brand-50/50 dark:bg-brand-500/5' : ''}`}>
              {isDriveLink ? (
                <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-white/20 bg-black/10 dark:bg-white/5 hover:bg-black/20 transition-all" dir="ltr">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4285F4,#34A853)' }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M4.5 21L9 13.5L13.5 21H4.5ZM13.5 21L18 13.5L22.5 21H13.5ZM9 13.5L13.5 6L18 13.5H9ZM1.5 21L6 13.5L10.5 21H1.5Z"/></svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-widest opacity-70 font-black">Google Drive</span>
                    <span className="text-xs font-bold underline underline-offset-2 truncate max-w-[180px]">{driveUrl}</span>
                  </div>
                  <ExternalLink size={14} className="opacity-60 flex-shrink-0" />
                </a>
              ) : isBookingCard ? (
                <div className="space-y-4 min-w-[200px] text-right" dir="rtl">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/20">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><Calendar size={16} /></div>
                      <span className="text-[12px] uppercase font-black tracking-widest leading-none">طلب اجتماعي</span>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] opacity-70 uppercase font-black tracking-widest">الموضوع</p>
                      <p className="text-xs font-black">{bookingDetails?.topic}</p>
                   </div>
                </div>
              ) : isFileCard ? (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 underline text-sm transition-all hover:text-brand-300">
                  <ExternalLink size={16} /> ملف مرفق
                </a>
              ) : (
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              )}
            </div>

            <div className={`absolute -bottom-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 ${isMine ? 'right-0' : 'left-0'} bg-white dark:bg-[#1a1a1e] p-1 rounded-full border border-slate-100 dark:border-white/10 shadow-xl`}>
              <button onClick={() => setReplyingTo(m)} className="p-2 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" title="رد">
                <MessageSquareReply size={14} />
              </button>
              <button 
                onClick={async () => {
                   try {
                     const { data } = await togglePinAPI(m.id);
                     setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, isPinned: data.isPinned } : msg));
                     rToast.success(data.isPinned ? "تم التثبيت" : "تم إلغاء التثبيت");
                   } catch(e) { rToast.error("فشل"); }
                }}
                className={`p-2 rounded-full hover:bg-brand-500/10 transition-colors ${m.isPinned ? 'text-brand-500' : 'text-slate-400 hover:text-brand-500'}`}
                title="تثبيت"
              >
                <Pin size={14} className={m.isPinned ? 'fill-current' : ''} />
              </button>
              <button 
                onClick={() => {
                   rToast(({ closeToast }) => (
                     <div className="flex flex-col gap-3 p-1 text-right" dir="rtl">
                        <p className="text-[11px] font-black text-slate-300">خيار الحذف:</p>
                        <div className="flex gap-2">
                           <button onClick={async () => { closeToast(); try { await deleteSpecificMessageAPI(m.id, 'me'); setMessages(prev => prev.filter(msg => msg.id !== m.id)); } catch(e) {} }} className="bg-white/10 text-[10px] font-bold px-3 py-1 rounded-md text-white">لدي</button>
                           {isMine && <button onClick={async () => { closeToast(); try { await deleteSpecificMessageAPI(m.id, 'everyone'); setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, content: '🚫 تم حذف هذه الرسالة', isDeleted: true } : msg)); } catch(e) {} }} className="bg-rose-500 text-[10px] font-bold px-3 py-1 rounded-md text-white">للجميع</button>}
                        </div>
                     </div>
                   ), { theme: 'dark', autoClose: 5000 });
                }}
                className="p-2 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                title="حذف"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mt-2 px-2 flex items-center gap-1.5 opacity-60">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
               {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             {isMine && <CheckCircle2 size={10} className={m.isRead ? "text-brand-400" : "text-slate-500"} />}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {showMeetingModal && (
        <MeetingModal onClose={() => setShowMeetingModal(false)} onSubmit={handleMeetingSubmit} />
      )}

      <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 md:gap-8 animate-in fade-in duration-700">
        <div className="w-full lg:w-80 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none max-h-[45vh] lg:max-h-none">
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-brand-600">
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">{t('support_and_contact')}</h2>
            <p className="text-white/70 text-xs font-bold leading-relaxed">{t('communicate_freely')}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-right" dir="rtl">
            {loadingSidebar ? (
              <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-brand-500 mx-auto" /></div>
            ) : (
              <>
                {supportContact && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-2 border-b border-slate-100 dark:border-white/5">{t('support_and_contact')}</h3>
                    <button 
                      onClick={() => selectThread(supportContact, 'DM')}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeThread?.userId === supportContact.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex flex-shrink-0 items-center justify-center">
                        <Headset size={20} className={activeThread?.userId === supportContact.id ? 'text-white' : 'text-brand-500'} />
                      </div>
                      <div className="flex-1 text-right overflow-hidden">
                        <h4 className="text-xs font-black truncate">{t('support_team_contact')}</h4>
                        <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.userId === supportContact.id ? 'text-white' : 'text-slate-400'}`}>{t('support_always_help')}</p>
                      </div>
                      
                      {unreadThreads[user?.id] > 0 && activeThread?.userId !== supportContact.id && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 animate-pulse shrink-0">
                          {unreadThreads[user?.id]}
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {projects.length > 0 && (
                  <div className="space-y-2 pt-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-2 border-b border-slate-100 dark:border-white/5">{t('projects_groups')}</h3>
                    {projects.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => selectThread(p, 'GROUP')}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeThread?.id === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex flex-shrink-0 items-center justify-center">
                          <Briefcase size={18} className={activeThread?.id === p.id ? 'text-white' : 'text-indigo-500'} />
                        </div>
                        <div className="flex-1 text-right overflow-hidden">
                          <h4 className="text-xs font-black truncate">{p.name}</h4>
                          <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === p.id ? 'text-white' : 'text-slate-400'}`}>{t('project_workgroup')}</p>
                        </div>
                        
                        {unreadThreads[p.id] > 0 && activeThread?.id !== p.id && (
                          <span className="min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center px-1 animate-pulse shrink-0">
                            {unreadThreads[p.id]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm dark:shadow-none min-h-0">
          {!activeThread ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 p-10 text-center">
              <div className="w-24 h-24 bg-brand-500/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-brand-500/10">
                <MessageSquare size={44} className="text-brand-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 italic">{t('welcome_msg')}</h3>
              <p className="text-slate-500 max-w-sm font-bold text-sm leading-relaxed">{t('choose_chat_to_start')}</p>
            </div>
          ) : (
            <>
              <div className="px-6 md:px-10 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-3" dir="rtl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0 ${activeThread.type === 'DM' ? 'bg-brand-500/10 text-brand-500 border-brand-500/20' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}>
                      {activeThread.type === 'DM' ? <UserCircle size={24} /> : <Briefcase size={24} />}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-2">
                        {activeThread.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeThread.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowMeetingModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-brand-100 dark:border-brand-500/20 flex-shrink-0"
                  >
                    <CalendarPlus2 size={14} />
                    <span className="hidden sm:inline">جدولة موعد جديد</span>
                    <span className="sm:hidden">موعد</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 custom-scrollbar bg-slate-50/30 dark:bg-[#08080a]">
                {messages.some(m => m.isPinned) && (
                  <div className="sticky top-0 z-10 -mx-10 px-10 py-3 bg-brand-500/10 backdrop-blur-md border-b border-brand-500/20 mb-6 flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/20">
                         <Clock size={16} />
                      </div>
                      <div className="text-right overflow-hidden">
                        <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest leading-none mb-1">رسالة مثبتة من الإدارة</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {messages.find(m => m.isPinned)?.content.substring(0, 100)}...
                        </p>
                      </div>
                      <button 
                        onClick={async () => {
                          try {
                            const pinnedMsg = messages.find(m => m.isPinned);
                            if (pinnedMsg) {
                              const { data } = await togglePinAPI(pinnedMsg.id);
                              setMessages(prev => prev.map(msg => msg.id === pinnedMsg.id ? { ...msg, isPinned: data.isPinned } : msg));
                              rToast.success("تم إلغاء التثبيت");
                            }
                          } catch (err) {}
                        }}
                        className="text-[10px] font-black text-slate-400 hover:text-brand-500 transition-colors uppercase tracking-widest px-3 py-1 bg-white/50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 ml-2"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                    <ShieldAlert size={44} className="mb-4 text-brand-500" />
                    <p className="font-black text-[10px] uppercase tracking-[0.2em] max-w-xs leading-loose italic">{t('start_chat_encrypted')}</p>
                  </div>
                ) : messages.map((m, i) => renderMessage(m, i))}
                <div ref={scrollRef} />
              </div>

              <div className="p-4 md:p-6 bg-white dark:bg-[#0a0a0c] border-t border-slate-100 dark:border-white/5 relative">
                {replyingTo && (
                  <div className="absolute bottom-full mb-2 left-0 w-full px-4 md:px-6 animate-in slide-in-from-bottom-2 duration-300" dir="rtl">
                     <div className="bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between border-r-4 border-brand-500 shadow-xl">
                        <div className="overflow-hidden">
                           <p className="text-[10px] font-black text-brand-500 mb-1 uppercase tracking-widest flex items-center gap-2">
                              <MessageSquareReply size={12} /> رد على {replyingTo.sender?.firstName} {replyingTo.sender?.lastName}
                           </p>
                           <p className="text-xs font-bold text-slate-500 truncate max-w-md">{replyingTo.content}</p>
                        </div>
                        <button 
                          onClick={() => setReplyingTo(null)}
                          className="text-slate-400 hover:text-rose-500 p-2"
                        >
                          <X size={18} />
                        </button>
                     </div>
                  </div>
                )}

                {showDrivePanel && (
                  <DriveLinkPanel
                    activeThread={activeThread}
                    user={user}
                    onClose={() => setShowDrivePanel(false)}
                    onSend={handleSendDriveLink}
                  />
                )}
                <form onSubmit={handleSend} className="relative flex items-end gap-3" dir="rtl">
                  <div className="flex-1 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500/50 transition-all">
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      placeholder={t('write_msg_here')}
                      className="w-full bg-transparent border-none py-4 px-6 text-sm font-bold resize-none max-h-32 min-h-[56px] focus:ring-0 custom-scrollbar dark:text-white"
                      rows={1}
                    />
                    
                    <button 
                      type="button" 
                      onClick={() => setShowDrivePanel(p => !p)}
                      title="إرسال رابط ملف"
                      className={`p-3 mx-2 transition-colors flex-shrink-0 ${showDrivePanel ? 'text-brand-500' : 'text-slate-400 hover:text-brand-500'}`}
                    >
                      <LinkIcon size={20} />
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className="w-[56px] h-[56px] flex-shrink-0 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:active:scale-100 active:scale-90 shadow-xl shadow-brand-600/20 group"
                  >
                    <Send size={20} className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform rotate-180" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientMessages;
