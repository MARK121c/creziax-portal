import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
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
  Smile,
  Link as LinkIcon,
  ChevronRight,
  Copy,
  Paperclip,
  FileText,
  Download,
  Video as VideoIcon,
  Image as ImageIcon
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.creziax.cloud/api';
const BACKEND_BASE = 'https://api.creziax.cloud';

const resolveVoiceUrl = (raw) => {
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('/storage')) return BACKEND_BASE + raw;
  const idx = raw.indexOf('/storage/');
  if (idx !== -1) return BACKEND_BASE + raw.substring(idx);
  return BACKEND_BASE + '/' + raw.replace(/^\//, '');
};

const VoicePlayer = ({ src, duration, isMine }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveVoiceUrl(src);
  const formatTime = (s) => {
    const sec = Math.floor(s || 0);
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  };
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play().catch(() => setHasError(true)); }
  };
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * totalDuration;
    setProgress(ratio * 100);
  };
  const bars = Array.from({ length: 28 }, (_, i) => [3,5,8,12,9,6,14,10,7,11,15,8,5,10,13,9,6,12,8,5,10,7,14,9,6,11,8,4][i % 28]);
  return (
    <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full xs:w-[220px] md:w-[280px] max-w-full select-none">
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => { setIsLoading(false); setHasError(false); }}
        onError={() => { setIsLoading(false); setHasError(true); }}
        onLoadedMetadata={(e) => { const d = e.target.duration; if (d && isFinite(d)) setTotalDuration(Math.round(d)); }}
        onTimeUpdate={(e) => { const t = e.target.currentTime; const d = e.target.duration || totalDuration || 1; setCurrentTime(t); setProgress((t / d) * 100); }}
      />
      <button onClick={togglePlay} className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg ${ isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white' }`}>
        {isLoading ? (
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="relative flex items-center gap-[2px] h-8 cursor-pointer" onClick={handleSeek}>
          {bars.map((h, i) => {
            const isActive = (i / bars.length) * 100 <= progress;
            return <div key={i} className="rounded-full flex-1 transition-all duration-150" style={{ height: `${h}px`, background: isActive ? (isMine ? 'rgba(255,255,255,0.9)' : '#7c3aed') : (isMine ? 'rgba(255,255,255,0.3)' : 'rgba(100,116,139,0.3)') }} />;
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold tabular-nums ${ isMine ? 'text-white/70' : 'text-slate-400' }`}>{isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}</span>
          {hasError && <span className={`text-[9px] ${ isMine ? 'text-red-300' : 'text-red-400' }`}>⚠ تعذر التشغيل</span>}
        </div>
      </div>
    </div>
  );
};

const PinnedBar = ({ message, onUnpin }) => {
  if (!message) return null;
  return (
    <div className="sticky top-0 z-20 bg-brand-500/10 backdrop-blur-md border-b border-brand-500/20 px-4 md:px-10 py-2 md:py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 -mx-6 md:-mx-10 shadow-lg">
      <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
        <Pin size={14} className="text-brand-500 shrink-0 fill-brand-500/20" />
        <div className="overflow-hidden">
           <p className="text-[8px] md:text-[10px] font-black text-brand-500 uppercase tracking-widest mb-0.5">رسالة مثبتة</p>
           <p className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px] sm:max-w-sm md:max-w-md">{message.content}</p>
        </div>
      </div>
      <button 
        onClick={() => onUnpin(message.id)} 
        className="p-1.5 md:p-2 hover:bg-brand-500/20 rounded-lg md:rounded-xl text-slate-400 hover:text-brand-500 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-1.5 md:gap-2 text-right"
        dir="rtl"
      >
        <X size={14} />
        <span className="hidden sm:inline">إلغاء التثبيت</span>
      </button>
    </div>
  );
};

const MeetingModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ subject: '', date: '', time: '' });
  const [sending, setSending] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.date || !form.time) { rToast.error('يرجى تعبئة جميع الحقول'); return; }
    setSending(true); try { await onSubmit(form); onClose(); } finally { setSending(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-[#0a0a0c]/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/5 rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center"><CalendarPlus2 size={20} className="text-brand-500" /></div>
          <div><h3 className="text-base font-black text-slate-800 dark:text-white">جدولة موعد جديد</h3></div>
          <button onClick={onClose} className="mr-auto p-2 rounded-xl text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" placeholder="موضوع الاجتماع" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none transition-all dark:text-white" />
          <div className="grid grid-cols-2 gap-4">
             <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm dark:text-white" />
             <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm dark:text-white" />
          </div>
          <button type="submit" disabled={sending} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2">
            {sending ? <Loader2 className="animate-spin" /> : <CalendarPlus2 />} إرسال الموعد
          </button>
        </form>
      </div>
    </div>
  );
};

const DriveLinkPanel = ({ onClose, onSend }) => {
  const [link, setLink] = useState('');
  const handleSend = () => { if (!link.trim()) return; onSend(`[DRIVE_LINK]${link.trim()}`); setLink(''); onClose(); };
  return (
    <div className="absolute bottom-full mb-3 left-0 right-0 mx-4 z-20 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <LinkIcon size={16} className="text-brand-500" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white">إضافة رابط (Drive)</span>
        <button onClick={onClose} className="mr-auto"><X size={16} /></button>
      </div>
      <div className="flex gap-2">
        <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 rounded-xl px-4 py-2 text-sm dark:text-white" dir="ltr" />
        <button onClick={handleSend} className="px-5 bg-brand-600 text-white rounded-xl font-bold">إرسال</button>
      </div>
    </div>
  );
};

const ClientMessages = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useAuthStore();
  const setActiveThreadId = useNotificationStore(state => state.setActiveThreadId);
  const resetUnreadMessages = useNotificationStore(state => state.resetUnreadMessages);
  const resetAllGlobalUnread = useNotificationStore(state => state.resetAllGlobalUnread);

  const [supportContact, setSupportContact] = useState(null);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [activeThread, setActiveThread] = useState(null);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showDrivePanel, setShowDrivePanel] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const emojiRef = useRef(null);
  const scrollRef = useRef();
  const socket = useSocket();
  const activeThreadRef = useRef(activeThread);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file || !activeThread) return;
    if (file.size > 1024 * 1024 * 1024) {
      rToast.error("حجم الملف كبير جداً، الحد الأقصى 1 جيجابايت");
      return;
    }
    setIsUploading(true);
    const toastId = rToast.loading("جاري رفع الملف...");
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: up } = await axios.post(`${API_URL}/upload/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const fileUrl = up.url || up.fileUrl;
      const mime = file.type || '';
      let msgContent = `[FILE]${fileUrl}\n${file.name}`;
      if (mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name)) {
        msgContent = `[IMAGE]${fileUrl}`;
      } else if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)) {
        msgContent = `[VIDEO]${fileUrl}`;
      }

      const { data } = await sendMessageAPI({
        content: msgContent,
        type: 'PRIVATE',
        receiverId: activeThread.userId
      });
      socket.emit('send_message', { ...data, type: 'PRIVATE', senderSocketId: socket.id });
      setMessages(p => [...p, { ...data, sender: user }]);
      rToast.update(toastId, { render: "تم إرسال الملف بنجاح", type: "success", isLoading: false, autoClose: 3000 });
    } catch(err) {
      rToast.update(toastId, { render: "فشل الرفع", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          rToast.info("جاري إرسال الصورة المنسوخة...");
          await handleFileUpload(file);
          return;
        }
      }
    }
  };

  activeThreadRef.current = activeThread;

  const fetchData = useCallback(async () => {
    setLoadingSidebar(true);
    try {
      const [contactsRes, projectsRes] = await Promise.all([getClientContactsAPI(), getProjectsAPI()]);
      setSupportContact(contactsRes.data.support);
      setProjects(projectsRes.data || []);
    } finally { setLoadingSidebar(false); }
  }, []);

  useEffect(() => { fetchData(); markAllAsReadAPI(); if (resetAllGlobalUnread) resetAllGlobalUnread(); }, [fetchData]);

  const fetchThreadMessages = async (threadId) => {
    setLoadingMessages(true);
    try {
      const { data } = await getMessagesAPI(threadId);
      setMessages(data || []);
      markAsReadAPI({ threadId });
      resetUnreadMessages(threadId);
    } finally { setLoadingMessages(false); }
  };

  useEffect(() => {
    if (!socket) return;
    const hReceive = (m) => {
      const curr = activeThreadRef.current;
      if (!curr) return;
      const ok = (m.type === 'GROUP' && m.threadId === curr.id) || (m.type === 'PRIVATE' && curr.type !== 'GROUP');
      if (ok && m.senderId !== user?.id) {
        setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        markAsReadAPI({ threadId: curr.id || curr.userId }).catch(() => {});
      }
    };
    socket.on('receive_message', hReceive);
    socket.on('message_deleted', ({ id }) => setMessages(prev => prev.filter(m => m.id !== id)));
    socket.on('message_pinned', ({ id, isPinned }) => setMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned } : (isPinned ? { ...m, isPinned: false } : m))));
    return () => { socket.off('receive_message', hReceive); socket.off('message_deleted'); socket.off('message_pinned'); };
  }, [socket, user?.id]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const doSendMessage = async (msg) => {
    if (!activeThread) return;
    const isGroup = activeThread.type === 'GROUP';
    const msgType = isGroup ? 'GROUP' : 'PRIVATE';
    const body = { content: msg, type: msgType, threadId: isGroup ? activeThread.id : null, receiverId: !isGroup ? activeThread.userId : null, parentId: replyingTo?.id };
    const { data } = await sendMessageAPI(body);
    socket.emit('send_message', { ...data, type: msgType, senderName: `${user.firstName} ${user.lastName}`, parent: replyingTo });
    setMessages(prev => [...prev, { ...data, sender: user, parent: replyingTo }]);
    setReplyingTo(null);
  };

  const handleSend = (e) => { e.preventDefault(); if (!content.trim()) return; doSendMessage(content); setContent(''); };

  const selectThread = (item, type) => {
    const thread = { id: item.id, name: item.name || `${item.firstName} ${item.lastName}`, type, userId: type === 'DM' ? item.id : null };
    setActiveThread(thread);
    fetchThreadMessages(item.id);
  };

  const handleTogglePin = async (id) => {
    try {
      const { data } = await togglePinAPI(id);
      setMessages(prev => prev.map(m => data.isPinned ? (m.id === id ? { ...m, isPinned: true } : { ...m, isPinned: false }) : (m.id === id ? { ...m, isPinned: false } : m)));
    } catch(e) {}
  };

  const handleDeleteMessage = async (id) => {
    // Deprecated for rToast, kept for compatibility if called elsewhere
    if (!window.confirm('حذف الرسالة؟')) return;
    try {
      await deleteSpecificMessageAPI(id, 'everyone');
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch(e) {}
  };

  const renderMessage = (m, i) => {
    const isMine = String(m.senderId) === String(user?.id);
    const isVoice = m.content?.startsWith('[VOICE]');
    const isDrive = m.content?.startsWith('[DRIVE_LINK]');
    
    let voiceUrl = null, voiceDur = 0;
    if (isVoice) {
      const parts = m.content.replace('[VOICE]', '').split('|');
      voiceDur = parseInt(parts[0]) || 0;
      voiceUrl = parts.slice(1).join('|');
    }

    return (
      <div key={m.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
          <div className={`flex items-center gap-2 mb-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {m.sender?.firstName} {m.sender?.lastName || ''} {m.isPinned && <Pin size={8} className="inline ml-1" />}
            </span>
          </div>
          {m.parent && <div className="mb-1 p-2 rounded-t-xl bg-slate-100 dark:bg-white/5 border-r-4 border-brand-500/50 opacity-60 text-[10px]">{m.parent.content}</div>}
          <div className="group relative">
            <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm ${isMine ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'}`}>
              {isVoice ? <VoicePlayer src={voiceUrl} duration={voiceDur} isMine={isMine} /> :
               isDrive ? <a href={m.content.replace('[DRIVE_LINK]','')} target="_blank" rel="noreferrer" className="underline flex items-center gap-2"><ExternalLink size={14}/> Google Drive</a> :
               <p className="whitespace-pre-wrap">{m.content}</p>}
            </div>
            <div className={`absolute -bottom-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 ${isMine ? 'right-0' : 'left-0'} bg-white dark:bg-[#1a1a1e] p-1 rounded-full border border-slate-100 dark:border-white/10 shadow-xl`}>
              <button onClick={() => { navigator.clipboard.writeText(cleanVal); rToast.success("تم نسخ الرسالة"); }} className="p-1.5 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" title="نسخ الرسالة"><Copy size={12}/></button>
              <button onClick={() => setReplyingTo(m)} className="p-1.5 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" title="رد"><MessageSquareReply size={12} /></button>
              <button onClick={() => handleTogglePin(m.id)} className={`p-1.5 rounded-full hover:bg-brand-500/10 transition-colors ${m.isPinned ? 'text-brand-500' : 'text-slate-400 hover:text-brand-500'}`} title="تثبيت"><Pin size={12} className={m.isPinned ? 'fill-current' : ''} /></button>
              <button
                onClick={() => {
                  rToast(({ closeToast }) => (
                    <div dir="rtl" className="flex flex-col gap-2 p-1">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 mb-2">حذف الرسالة؟</p>
                      <button onClick={async () => { closeToast(); try { await deleteSpecificMessageAPI(m.id, 'me'); setMessages(p => p.filter(x => x.id !== m.id)); } catch(e) {} }} className="w-full py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-black transition-all">لدي فقط</button>
                      {(isMine) && (
                        <button onClick={async () => { closeToast(); try { await deleteSpecificMessageAPI(m.id, 'everyone'); setMessages(p => p.filter(x => x.id !== m.id)); } catch(e) {} }} className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all">للجميع</button>
                      )}
                    </div>
                  ), { autoClose: 6000, closeButton: true, style: { minWidth: '200px' } });
                }}
                className="p-1.5 rounded-full hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                title="حذف"
              ><Trash2 size={12}/></button>
            </div>
          </div>
          <span className="text-[7px] text-slate-400 mt-2 uppercase tracking-widest">{new Date(m.createdAt || Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 lg:gap-8 animate-in fade-in duration-700 overflow-hidden">
      {showMeetingModal && <MeetingModal onClose={() => setShowMeetingModal(false)} onSubmit={doSendMessage} />}

      <div className={`${activeThread ? 'hidden' : 'flex'} lg:flex w-full lg:w-96 bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 lg:rounded-[3rem] flex-col overflow-hidden shadow-2xl`}>
        <div className="p-8 bg-brand-600 shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
           <h2 className="text-xl font-black text-white uppercase tracking-tight">{t('support_and_contact')}</h2>
           <p className="text-white/70 text-[10px] font-bold uppercase mt-1">{t('communicate_freely')}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" dir="rtl">
          {loadingSidebar ? <div className="py-20 text-center"><Loader2 className="animate-spin text-brand-500 mx-auto" /></div> : (
            <>
              {supportContact && (
                <button onClick={() => selectThread(supportContact, 'DM')} className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeThread?.userId === supportContact.id ? 'bg-brand-600 text-white shadow-xl' : 'hover:bg-slate-100 dark:hover:bg-white/5 dark:text-white'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center shrink-0"><Headset size={20} /></div>
                  <div className="text-right overflow-hidden"><h4 className="text-sm font-black truncate">{t('support_team_contact')}</h4></div>
                </button>
              )}
              {projects.map(p => (
                <button key={p.id} onClick={() => selectThread(p, 'GROUP')} className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeThread?.id === p.id ? 'bg-brand-600 text-white shadow-xl' : 'hover:bg-slate-100 dark:hover:bg-white/5 dark:text-white'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center shrink-0"><Briefcase size={20} /></div>
                  <div className="text-right overflow-hidden"><h4 className="text-sm font-black truncate">{p.name}</h4></div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-white dark:bg-[#0d0d12] lg:rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden min-h-0 ${!activeThread ? 'hidden lg:flex' : 'flex'}`}>
        {!activeThread ? (
          <div className="h-full flex flex-col items-center justify-center p-10 opacity-30 text-center">
            <MessageSquare size={64} className="mb-6 text-brand-500" />
            <h3 className="text-2xl font-black italic">{isRTL ? 'أهلاً بك في مـركز العملاء' : 'Welcome to Support'}</h3>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0d0d12] flex items-center justify-between gap-4 shrink-0" dir="rtl">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveThread(null)} className="lg:hidden p-2 bg-slate-100 dark:bg-white/10 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-brand-600/20"><UserCircle size={24}/></div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-tight leading-none mb-1 dark:text-white">{activeThread.name}</h2>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">متصل الآن</span></div>
                </div>
              </div>
              <button onClick={() => setShowMeetingModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-brand-600/20 active:scale-95 transition-all">
                <CalendarPlus2 size={14}/> <span className="hidden sm:inline">حجز موعد</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-8 space-y-8 custom-scrollbar bg-slate-50/30 dark:bg-[#0d0d12]">
              <PinnedBar message={messages.find(m => m.isPinned)} onUnpin={handleTogglePin} />
              {loadingMessages ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-brand-500" /></div> : (
                <div className="space-y-8 pb-10">{messages.map((m, i) => renderMessage(m, i))}</div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 md:p-6 bg-white dark:bg-[#0a0a0c] border-t border-white/5 relative z-20 shrink-0">
              {replyingTo && (
                <div className="absolute bottom-full mb-2 left-0 w-full px-4 animate-in slide-in-from-bottom-2">
                  <div className="bg-slate-100 dark:bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between border-r-4 border-brand-500 shadow-xl">
                    <div className="overflow-hidden">
                      <p className="text-[8px] font-black text-brand-500 mb-0.5">رد على {replyingTo.sender?.firstName}</p>
                      <p className="text-[10px] font-bold opacity-60 truncate">{replyingTo.content}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)}><X size={14} /></button>
                  </div>
                </div>
              )}
              {showDrivePanel && <DriveLinkPanel onClose={() => setShowDrivePanel(false)} onSend={doSendMessage} />}
              <form onSubmit={handleSend} className="flex items-center gap-2 relative z-10" dir="rtl">
                <div className="flex-1 min-w-0 bg-slate-100 dark:bg-white/5 border border-white/10 rounded-[1.5rem] px-3 py-2.5 sm:py-3 flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <input value={content} onChange={e => setContent(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 min-w-0 bg-transparent border-none text-xs sm:text-sm font-bold outline-none dark:text-white" />
                  <div className="flex items-center gap-1 sm:gap-2 opacity-50 shrink-0">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-1 text-slate-400 hover:text-brand-500 transition-all" title="إرفاق ملف"><Paperclip size={16} className={isUploading ? 'animate-spin text-brand-500' : ''} /></button>
                         <LinkIcon size={15} className="cursor-pointer hover:text-brand-500 text-slate-400 hover:opacity-100 transition-all shrink-0" onClick={() => setShowDrivePanel(true)} />
                    <button type="button" onClick={async () => {
                        if (isRecording) { mediaRecorderRef.current?.stop(); clearInterval(recordingTimerRef.current); setIsRecording(false); }
                        else {
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            recordingChunksRef.current = [];
                            const mr = new MediaRecorder(stream); mediaRecorderRef.current = mr;
                            mr.ondataavailable = e => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
                            mr.onstop = async () => {
                              const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
                              const fd = new FormData(); fd.append('file', blob, 'voice.webm');
                              const { data: u } = await axios.post(`${API_URL}/upload/file`, fd, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` } });
                              await doSendMessage(`[VOICE]${recordingSeconds}|${u.url || u.fileUrl}`);
                              setRecordingSeconds(0);
                            };
                            mr.start(); setIsRecording(true); setRecordingSeconds(0);
                            recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
                          } catch(err) { rToast.error('الميكروفون مطلوب'); }
                        }
                    }} className={`p-1 rounded-full transition-all ${isRecording ? 'text-rose-500 animate-pulse' : 'hover:text-brand-500'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={!content.trim() && !isRecording} className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/30 active:scale-95 disabled:opacity-50 shrink-0">
                  <Send size={16} className="rotate-180" />
                </button>
              </form>
              {isRecording && <div className="mt-2 flex items-center justify-center gap-2 text-rose-500 animate-pulse text-[10px] font-black uppercase tracking-widest"><span>● تسجيل</span><span className="tabular-nums">{Math.floor(recordingSeconds/60)}:{String(recordingSeconds%60).padStart(2,'0')}</span></div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientMessages;
