import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  getClientsAPI, 
  getProjectsAPI, 
  updateProjectAPI,
  getMessagesAPI, 
  sendMessageAPI,
  getUsersAPI,
  getTeamContactsAPI,
  grantChatAccessAPI,
  createTeamGroupAPI,
  getTeamGroupsAPI,
  clearMessagesAPI,
  deleteTeamGroupAPI,
  removeGroupMemberAPI,
  addGroupMemberAPI,
  togglePinAPI,
  deleteSpecificMessageAPI,
  markAllAsReadAPI,
  markAsReadAPI
} from '../../store/api';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { useSocket } from '../../context/SocketContext';
import { useTranslation } from 'react-i18next';
import { toast as rToast } from 'react-toastify';
import { 
  Send, MessageSquare, Search, MoreHorizontal, Smile, Link as LinkIcon,
  Loader2, UserCircle, Plus, Filter, Clock, CheckCircle2, AlertCircle,
  Tag, ChevronRight, Briefcase, Calendar, ExternalLink, ShieldAlert,
  UserPlus, X, Users, Check, Trash2, UserMinus, Paperclip, Pin, MessageSquareReply,
  Copy, Video as VideoIcon, Image as ImageIcon, Download, FileText
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import UserPresenceBadge from '../../components/UserPresenceBadge';

// ──────────────────────────────────────────────
// Pinned Message Bar (V18.1 Supreme)
// ──────────────────────────────────────────────
const PinnedBar = ({ message, onUnpin }) => {
  if (!message) return null;
  return (
    <div className="sticky top-0 z-20 bg-brand-500/10 backdrop-blur-md border-b border-brand-500/20 px-4 md:px-10 py-2 md:py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 -mx-6 md:-mx-10">
      <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
        <Pin size={14} className="text-brand-500 shrink-0 fill-brand-500/20" />
        <div className="overflow-hidden">
           <p className="text-[8px] md:text-[10px] font-black text-brand-500 uppercase tracking-widest mb-0.5">رسالة مثبتة</p>
           <p className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px] sm:max-w-sm md:max-w-md">{message.content}</p>
        </div>
      </div>
      <button 
        onClick={() => onUnpin(message.id)} 
        className="p-1.5 md:p-2 hover:bg-brand-500/20 rounded-lg md:rounded-xl text-slate-400 hover:text-brand-500 transition-all font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-1.5 md:gap-2"
        title="إلغاء التثبيت"
      >
        <span className="hidden sm:inline">إلغاء التثبيت</span>
        <X size={14} />
      </button>
    </div>
  );
};

const API_URL = 'https://api.creziax.cloud/api';
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
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = ratio * totalDuration;
    setProgress(ratio * 100);
  };

  const bars = Array.from({ length: 28 }, (_, i) => {
    const heights = [3,5,8,12,9,6,14,10,7,11,15,8,5,10,13,9,6,12,8,5,10,7,14,9,6,11,8,4];
    return heights[i % heights.length];
  });

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
        onLoadedMetadata={(e) => {
          const d = e.target.duration;
          if (d && isFinite(d)) setTotalDuration(Math.round(d));
        }}
        onTimeUpdate={(e) => {
          const t = e.target.currentTime;
          const d = e.target.duration || totalDuration || 1;
          setCurrentTime(t);
          setProgress((t / d) * 100);
        }}
      />
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg ${isMine ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}
      >
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
            const barProgress = (i / bars.length) * 100;
            const isActive = barProgress <= progress;
            return (
              <div key={i} className="rounded-full flex-1 transition-all duration-150" style={{ height: `${h}px`, background: isActive ? (isMine ? 'rgba(255,255,255,0.9)' : 'var(--color-brand-500, #7c3aed)') : (isMine ? 'rgba(255,255,255,0.3)' : 'rgba(100,116,139,0.3)') }} />
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold tabular-nums ${isMine ? 'text-white/70' : 'text-slate-400'}`}>{isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}</span>
          {hasError && <span className={`text-[9px] ${isMine ? 'text-red-300' : 'text-red-400'}`}>⚠ تعذر التشغيل</span>}
        </div>
      </div>
      <div className={`flex-shrink-0 ${isMine ? 'text-white/50' : 'text-slate-300'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || i18n.language === 'AR';
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'CLIENT') navigate('/client/messages');
  }, [user, navigate]);

  const resetUnreadMessages = useNotificationStore(state => state.resetUnreadMessages);
  const unreadThreads = useNotificationStore(state => state.unreadThreads);
  const setActiveThreadId = useNotificationStore(state => state.setActiveThreadId);

  useEffect(() => {
    markAllAsReadAPI().catch(() => {});
    if (resetUnreadMessages) resetUnreadMessages();
  }, [resetUnreadMessages]);

  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamGroups, setTeamGroups] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [bookingData, setBookingData] = useState({ topic: '', dates: '' });
  const [sendingBooking, setSendingBooking] = useState(false);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ projects: true, groups: true, global: true, team: false, clients: false });
  const [newGroupData, setNewGroupData] = useState({ name: '', memberIds: [] });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const socket = useSocket();
  const scrollRef = useRef();
  const activeThreadRef = useRef(activeThread);

  useEffect(() => { activeThreadRef.current = activeThread; }, [activeThread]);

  const fetchData = useCallback(async () => {
    if (!user?.role) return;
    setLoadingSidebar(true);
    try {
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
      const isTeam = user?.role === 'TEAM';
      const calls = [getProjectsAPI(), getTeamGroupsAPI()];
      if (isAdmin) { calls.push(getClientsAPI(), getUsersAPI()); }
      else if (isTeam) { calls.push(getTeamContactsAPI()); }
      const results = await Promise.all(calls);
      setProjects(results[0].data?.data || results[0].data || []);
      setTeamGroups(results[1].data?.data || results[1].data || []);
      if (isAdmin) {
        setClients(results[2].data?.data || results[2].data || []);
        setTeamMembers((results[3].data?.data || results[3].data || []).filter(u => u.role !== 'CLIENT'));
      } else if (isTeam) {
        const rawU = results[2]?.data?.data || results[2]?.data || [];
        setTeamMembers(rawU.filter(u => u.role === 'ADMIN' || u.role === 'OWNER'));
        setExpandedSections(p => ({ ...p, team: true }));
      }
    } catch (err) { rToast.error("فشل تحميل البيانات"); }
    finally { setLoadingSidebar(false); }
  }, [user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchThreadMessages = async (threadId, isDM, dmUserId) => {
    if (!threadId) return;
    setLoadingMessages(true); setMessages([]);
    try {
      const { data } = await getMessagesAPI(threadId);
      setMessages(data || []);
      const clearId = isDM ? (dmUserId || threadId) : threadId;
      markAsReadAPI({ threadId: clearId });
      resetUnreadMessages(clearId);
    } catch (err) { }
    finally { setLoadingMessages(false); }
  };

  useEffect(() => {
    if (!socket || loadingSidebar) return;
    const handleJoinRooms = () => {
      if (user?.id) {
        socket.emit('join_rooms', { userId: user.id, role: user.role, projectIds: [...projects.map(p => p.id), ...teamGroups.map(g => g.id)] });
      }
    };
    handleJoinRooms(); socket.on('connect', handleJoinRooms);
    return () => socket.off('connect', handleJoinRooms);
  }, [projects, teamGroups, user, loadingSidebar, socket]);

  useEffect(() => {
    if (!socket) return;
    const handleRecv = (newMsg) => {
      const current = activeThreadRef.current; if (!current) return;
      const tid = current.userId || current.id;
      if ((newMsg.type === 'GROUP' && newMsg.threadId === current.id) || (newMsg.type === 'PRIVATE' && (newMsg.senderId === tid || newMsg.receiverId === tid))) {
        if (newMsg.senderSocketId === socket?.id) return;
        useNotificationStore.getState().playTin();
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, { ...newMsg, sender: newMsg.sender || { firstName: newMsg.senderName || 'مستخدم' } }]);
        const clearId = current.type === 'DM' || current.type === 'TEAM' ? current.userId : current.id;
        resetUnreadMessages(clearId); markAsReadAPI({ threadId: clearId }).catch(() => {});
      }
    };
    const handleDelChat = ({ threadId }) => {
      if (activeThreadRef.current?.id === threadId || activeThreadRef.current?.userId === threadId) { setMessages([]); setActiveThread(null); }
      setClients(p => p.filter(c => c.user?.id !== threadId));
    };
    const handleClrMsg = ({ threadId }) => { if (activeThreadRef.current?.id === threadId || activeThreadRef.current?.userId === threadId) setMessages([]); };
    const handleDelMsg = ({ id }) => setMessages(p => p.filter(m => m.id !== id));
    const handlePinMsg = ({ id, isPinned }) => setMessages(p => p.map(m => isPinned ? (m.id === id ? { ...m, isPinned: true } : { ...m, isPinned: false }) : (m.id === id ? { ...m, isPinned: false } : m)));

    socket.on('receive_message', handleRecv); socket.on('chat_deleted', handleDelChat); socket.on('messages_cleared', handleClrMsg); socket.on('message_deleted', handleDelMsg); socket.on('message_pinned', handlePinMsg);
    return () => { socket.off('receive_message', handleRecv); socket.off('chat_deleted', handleDelChat); socket.off('messages_cleared', handleClrMsg); socket.off('message_deleted', handleDelMsg); socket.off('message_pinned', handlePinMsg); };
  }, [socket, resetUnreadMessages]);

  useEffect(() => {
    const clickOutside = (e) => { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojiPicker(false); };
    document.addEventListener("mousedown", clickOutside); return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault(); if (!content.trim() || !activeThread) return;
    const isDM = activeThread.type === 'DM' || activeThread.type === 'TEAM';
    const type = isDM ? 'PRIVATE' : 'GROUP';
    try {
      const { data } = await sendMessageAPI({ content, type, threadId: type === 'GROUP' ? activeThread.id : null, receiverId: type === 'PRIVATE' ? activeThread.userId : null, parentId: replyingTo?.id || null });
      socket.emit('send_message', { ...data, type, senderSocketId: socket.id, parent: replyingTo });
      setContent(''); setReplyingTo(null);
      setMessages(p => [...p, { ...data, sender: user, parent: replyingTo }]);
    } catch (err) { rToast.error(err.response?.status === 403 ? "انتهاك قواعد الخصوصية" : "فشل إرسال الرسالة"); }
  };

  const handleSendDriveLink = async () => {
    if (!driveLink.trim() || !activeThread) return;
    try {
      const msg = `[DRIVE_LINK]${driveLink.trim()}`;
      const { data } = await sendMessageAPI({ content: msg, threadId: activeThread.id, receiverId: activeThread.userId });
      socket.emit('send_message', { ...data, threadId: activeThread.id });
      setMessages(p => [...p, { ...data, sender: user }]); setDriveLink(''); setShowLinkModal(false);
    } catch (err) { rToast.error("فشل الرابط"); }
  };

  const selectThread = (item, type) => {
    const tid = type === 'DM' || type === 'TEAM' ? item.user?.id || item.id : item.id;
    resetUnreadMessages(tid); setActiveThreadId(tid);
    setActiveThread({ 
      id: tid, 
      name: type === 'DM' || type === 'TEAM' ? (item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.firstName ? `${item.firstName} ${item.lastName}` : item.name)) : item.name, 
      type, 
      userId: type === 'DM' || type === 'TEAM' ? (item.user?.id || item.id) : null,
      driveUrl: type === 'GROUP' ? item.driveUrl : null
    });
    fetchThreadMessages(tid, type === 'DM' || type === 'TEAM', item.user?.id || item.id);
  };

  const handleTogglePin = async (id) => {
    try {
      const { data } = await togglePinAPI(id);
      setMessages(p => p.map(m => m.id === id ? { ...m, isPinned: data.isPinned } : m));
      rToast.success(data.isPinned ? "تم التثبيت" : "تم الإلغاء");
    } catch (err) { rToast.error("فشل التعديل"); }
  };

  const handleClearChat = async () => {
    if (!activeThread || !window.confirm("حذف الرسائل نهائياً؟")) return;
    try { await clearMessagesAPI(activeThread.id); setMessages([]); rToast.success("تم المسح"); }
    catch (err) { rToast.error("فشل المسح"); }
  };

  const handleRemoveGroupMember = async (groupId, memberId) => {
    try {
      await removeGroupMemberAPI(groupId, memberId);
      setTeamGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g));
      rToast.success("تم إزالة العضو");
    } catch (err) { rToast.error("فشل الإزالة"); }
  };

  const handleRemoveProjectMember = async (projectId, memberId) => {
    try {
      await removeGroupMemberAPI(projectId, memberId);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, teamMembers: (p.teamMembers || []).filter(m => m.id !== memberId) } : p));
      rToast.success("تم إزالة العضو من المشروع");
    } catch (err) { rToast.error("فشل الإزالة"); }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("حذف الجروب؟")) return;
    try { await deleteTeamGroupAPI(id); setTeamGroups(p => p.filter(g => g.id !== id)); if (activeThread?.id === id) setActiveThread(null); }
    catch (err) { rToast.error("فشل الحذف"); }
  };

  const handleCreateGroup = async (e) => {
    if (e) e.preventDefault(); if (!newGroupData.name || newGroupData.memberIds.length === 0) return;
    setCreatingGroup(true);
    try {
      const { data } = await createTeamGroupAPI(newGroupData);
      setTeamGroups(p => [...p, data]); setIsCreateGroupModalOpen(false); setNewGroupData({ name: '', memberIds: [] });
      selectThread(data, 'TEAM_GROUP');
    } catch (err) { rToast.error("فشل الإنشاء"); }
    finally { setCreatingGroup(false); }
  };

  const handleBooking = async () => {
    if (!bookingData.topic || !bookingData.dates || !activeThread) return;
    setSendingBooking(true);
    try {
      const msg = `[MEETING_BOOKING]\nTopic: ${bookingData.topic}\nAvailability: ${bookingData.dates}`;
      const { data } = await sendMessageAPI({ content: msg, threadId: activeThread.id, receiverId: activeThread.userId });
      socket.emit('send_message', { ...data, threadId: activeThread.id });
      setBookingData({ topic: '', dates: '' }); setIsBookingModalOpen(false); setMessages(p => [...p, { ...data, sender: user }]);
    } catch (err) { rToast.error("فشل الحجز"); }
    finally { setSendingBooking(false); }
  };

  const grantAccess = async () => {
    if (selectedTeamMembers.length === 0 || !activeThread) return;
    setGrantingAccess(true);
    try {
      if (activeThread.type === 'TEAM_GROUP') {
        await Promise.all(selectedTeamMembers.map(id => addGroupMemberAPI(activeThread.id, id)));
        const { data: groups } = await getTeamGroupsAPI(); setTeamGroups(groups);
      } else {
        await Promise.all(selectedTeamMembers.map(id => grantChatAccessAPI(id, activeThread.id)));
      }
      rToast.success("تم منح الصلاحية"); setIsAddMemberModalOpen(false); setSelectedTeamMembers([]);
    } catch (err) { rToast.error("فشل المنح"); }
    finally { setGrantingAccess(false); }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file || !activeThread) return;
    
    // 1GB check
    if (file.size > 1024 * 1024 * 1024) {
      rToast.error("حجم الملف كبير جداً، الحد الأقصى هو 1 جيجابايت");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const toastId = rToast.loading(`جاري رفع الملف (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: up } = await axios.post(`${API_URL}/upload/file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
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

      const isDM = activeThread.type === 'DM' || activeThread.type === 'TEAM';
      const type = isDM ? 'PRIVATE' : 'GROUP';

      const { data } = await sendMessageAPI({
        content: msgContent,
        type,
        threadId: type === 'GROUP' ? activeThread.id : null,
        receiverId: type === 'PRIVATE' ? activeThread.userId : null
      });

      socket.emit('send_message', { ...data, type, senderSocketId: socket.id });
      setMessages(p => [...p, { ...data, sender: user }]);
      rToast.update(toastId, { render: "تم إرسال الملف بنجاح", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err) {
      rToast.update(toastId, { render: "فشل رفع الملف", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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

  const renderMessage = (m, i) => {
    const isBot = m.senderId === 'creziax-bot' || m.content?.startsWith('[BOT]');
    let cleanVal = m.content || ''; 
    if (isBot) cleanVal = cleanVal.replace('[BOT]', '').trim();
    const isDrive = cleanVal.startsWith('[DRIVE_LINK]');
    const isBooking = cleanVal.startsWith('[MEETING_BOOKING]');
    const isImage = cleanVal.startsWith('[IMAGE]') || /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(cleanVal);
    const isVideo = cleanVal.startsWith('[VIDEO]') || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(cleanVal);
    const isFile = cleanVal.startsWith('[FILE]');
    const isVoice = cleanVal.startsWith('[VOICE]');
    const isMine = String(m.senderId) === String(user?.id);

    let driveUrl = isDrive ? cleanVal.replace('[DRIVE_LINK]', '').trim() : null;
    let bData = isBooking ? { topic: cleanVal.split('\n')[1]?.replace('Topic: ', ''), dates: cleanVal.split('\n')[2]?.replace('Availability: ', '') } : null;
    let imageUrl = isImage ? resolveVoiceUrl(cleanVal.replace('[IMAGE]', '').trim()) : null;
    let videoUrl = isVideo ? resolveVoiceUrl(cleanVal.replace('[VIDEO]', '').trim()) : null;
    let fData = isFile ? { 
      url: resolveVoiceUrl(cleanVal.split('\n')[0].replace('[FILE]', '').trim()), 
      name: cleanVal.split('\n')[1] || 'ملف مرفق' 
    } : null;
    
    let vUrl = null, vDur = 0;
    if (isVoice) {
      const p = cleanVal.replace('[VOICE]', '').trim();
      if (p.includes('|')) { const s = p.split('|'); vDur = parseInt(s[0],10); vUrl = s.slice(1).join('|'); } else vUrl = p;
    }

    return (
      <div key={m.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
          <div className={`flex items-center gap-2 mb-1 px-1 ${isMine ? 'flex-row-reverse' : ''}`}>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{isBot ? 'System' : (m.sender?.firstName + ' ' + (m.sender?.lastName || ''))} {m.isPinned && <Pin size={8} className="inline ml-1" />}</span>
          </div>
          {m.parent && <div className="mb-1 p-2 rounded-t-xl bg-slate-100 dark:bg-white/5 border-r-4 border-brand-500/50 opacity-60 text-[10px]">{m.parent.content}</div>}
          <div className="group relative">
            <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-sm ${isMine ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'}`}>
              {isDrive ? (
                <a href={driveUrl} target="_blank" rel="noreferrer" className="underline flex items-center gap-1.5"><LinkIcon size={14}/> {driveUrl}</a>
              ) : isBooking ? (
                <div className="p-2 bg-black/10 rounded-lg">🗓 {bData.topic}<br/>⏰ {bData.dates}</div>
              ) : isImage ? (
                <div className="space-y-1">
                  <img src={imageUrl} alt="Attachment" className="max-w-[280px] sm:max-w-xs max-h-[300px] object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(imageUrl, '_blank')} />
                  <span className="text-[8px] opacity-60 block text-left">صورة مرفقة (48h retention)</span>
                </div>
              ) : isVideo ? (
                <div className="space-y-1">
                  <video controls src={videoUrl} className="max-w-[280px] sm:max-w-sm rounded-xl max-h-[320px] bg-black" />
                  <span className="text-[8px] opacity-60 block text-left">فيديو مرفق (48h retention)</span>
                </div>
              ) : isFile ? (
                <a href={fData.url} target="_blank" rel="noreferrer" download className="flex items-center gap-2.5 p-2 bg-black/10 rounded-xl hover:bg-black/20 transition-all">
                  <FileText size={18} className="text-brand-400 shrink-0" />
                  <div className="overflow-hidden text-right">
                    <p className="text-xs font-bold truncate max-w-[180px]">{fData.name}</p>
                    <span className="text-[8px] opacity-60">اضغط للتحميل</span>
                  </div>
                  <Download size={14} className="shrink-0 mr-auto opacity-70" />
                </a>
              ) : isVoice ? (
                <VoicePlayer src={vUrl} duration={vDur} isMine={isMine} />
              ) : (
                <p className="whitespace-pre-wrap select-text">{cleanVal}</p>
              )}
            </div>
            <div className={`absolute -bottom-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 ${isMine ? 'right-0' : 'left-0'} bg-white dark:bg-[#1a1a1e] p-1 rounded-full border border-slate-100 dark:border-white/10 shadow-xl`}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(cleanVal);
                  rToast.success("تم نسخ الرسالة");
                }} 
                className="p-1.5 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" 
                title="نسخ الرسالة"
              >
                <Copy size={12}/>
              </button>
              <button onClick={() => setReplyingTo(m)} className="p-1.5 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" title="رد"><MessageSquareReply size={12}/></button>
              <button onClick={() => handleTogglePin(m.id)} className={`p-1.5 rounded-full hover:bg-brand-500/10 transition-colors ${m.isPinned ? 'text-brand-500' : 'text-slate-400 hover:text-brand-500'}`} title="تثبيت"><Pin size={12} className={m.isPinned ? 'fill-current' : ''}/></button>
              <button
                onClick={() => {
                  rToast(({ closeToast }) => (
                    <div dir="rtl" className="flex flex-col gap-2 p-1">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 mb-2">حذف الرسالة؟</p>
                      <button onClick={async () => { closeToast(); try { await deleteSpecificMessageAPI(m.id, 'me'); setMessages(p => p.filter(x => x.id !== m.id)); } catch(e) {} }} className="w-full py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-black transition-all">لدي فقط</button>
                      {(isMine || user?.role === 'ADMIN' || user?.role === 'OWNER') && (
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
          <span className="text-[7px] text-slate-400 mt-1 uppercase">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 lg:gap-8 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <div className={`${activeThread ? 'hidden' : 'flex'} lg:flex w-full lg:w-96 bg-white dark:bg-[#0a0a0c]/60 backdrop-blur-xl border-l lg:border border-slate-200 dark:border-white/10 lg:rounded-[3rem] flex-col overflow-hidden shadow-2xl`}>
        <div className="p-8 bg-brand-600 shrink-0 text-white relative overflow-hidden">
           <h2 className="text-2xl font-black italic tracking-tighter">Elite Messaging</h2>
           <p className="text-[10px] font-bold opacity-70 uppercase tracking-[0.3em]">Corporate Command Center</p>
        </div>
        <div className="p-6 border-b border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="البحث..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
           {loadingSidebar ? <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-brand-500 mx-auto" /></div> : (
             <>
               {/* Project Groups */}
               <div className="space-y-2">
                 <button onClick={() => setExpandedSections(p => ({...p, projects: !p.projects}))} className="w-full flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-500 transition-colors">
                   <span>جروبات المشاريع</span>
                   <ChevronRight size={12} className={`transition-transform ${expandedSections.projects ? 'rotate-90' : 'rotate-180'}`} />
                 </button>
                 {expandedSections.projects && projects.filter(p=>p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                   <div key={p.id} className="rounded-2xl overflow-hidden">
                     <div className={`flex items-center gap-2 p-3 transition-all ${activeThread?.id === p.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                       <button onClick={() => setExpandedGroupId(expandedGroupId === `proj_${p.id}` ? null : `proj_${p.id}`)} className="p-1 rounded-lg hover:bg-white/10 transition-all flex-shrink-0" title="عرض الأعضاء">
                         <ChevronRight size={12} className={`transition-transform duration-300 ${expandedGroupId === `proj_${p.id}` ? 'rotate-90' : ''}`} />
                       </button>
                       <button onClick={() => selectThread(p, 'GROUP')} className="flex-1 text-right overflow-hidden">
                         <h4 className="text-xs font-black truncate">{p.name}</h4>
                         <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === p.id ? 'text-white' : 'text-slate-400'}`}>مشروع نشط</p>
                       </button>
                       {unreadThreads[p.id] > 0 && activeThread?.id !== p.id && (
                         <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shrink-0">{unreadThreads[p.id]}</span>
                       )}
                     </div>
                     {expandedGroupId === `proj_${p.id}` && p.teamMembers && p.teamMembers.length > 0 && (
                       <div className="bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 px-3 py-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                         {p.teamMembers.map(member => (
                           <div key={member.id} className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                             <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                 <UserCircle size={12} className="text-indigo-500" />
                               </div>
                               <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{member.firstName} {member.lastName}</span>
                             </div>
                             {(user?.role === 'ADMIN' || user?.role === 'OWNER') && member.id !== user.id && (
                               <button
                                 onClick={() => handleRemoveProjectMember(p.id, member.id)}
                                 className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                 title="إزالة من المشروع"
                               >
                                 <UserMinus size={11} />
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
               {/* Team Groups */}
               <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                 <div className="w-full flex items-center justify-between px-2 py-1">
                   <button onClick={() => setExpandedSections(p => ({...p, groups: !p.groups}))} className="flex items-center gap-2 flex-1 text-right hover:opacity-80 transition-opacity group">
                     <ChevronRight size={14} className={`transition-transform duration-300 ${expandedSections.groups ? 'rotate-90' : ''} text-slate-400 group-hover:text-brand-500`} />
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قنوات الفريق</h3>
                     <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 rounded-full text-slate-400 font-black">{teamGroups.length}</span>
                   </button>
                   {(user?.role === 'ADMIN' || user?.role === 'OWNER') && <button onClick={() => setIsCreateGroupModalOpen(true)} className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all flex-shrink-0"><Plus size={14}/></button>}
                 </div>
                 {expandedSections.groups && teamGroups.map(tg => (
                   <div key={tg.id} className="rounded-2xl overflow-hidden">
                     <div className={`flex items-center gap-2 p-3 transition-all ${activeThread?.id === tg.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                       <button onClick={() => setExpandedGroupId(expandedGroupId === tg.id ? null : tg.id)} className="p-1 rounded-lg hover:bg-white/10 transition-all flex-shrink-0" title="عرض الأعضاء">
                         <ChevronRight size={12} className={`transition-transform duration-300 ${expandedGroupId === tg.id ? 'rotate-90' : ''}`} />
                       </button>
                       <button onClick={() => selectThread(tg, 'TEAM_GROUP')} className="flex-1 text-right overflow-hidden">
                         <h4 className="text-xs font-black truncate">{tg.name}</h4>
                         <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === tg.id ? 'text-white' : 'text-slate-400'}`}>{tg.members?.length} أعضاء</p>
                       </button>
                       {unreadThreads[tg.id] > 0 && activeThread?.id !== tg.id && (
                         <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shrink-0">{unreadThreads[tg.id]}</span>
                       )}
                       {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                         <button
                           onClick={(e) => { e.stopPropagation(); handleDeleteGroup(tg.id); }}
                           className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex-shrink-0"
                           title="حذف الجروب"
                         >
                           <Trash2 size={11} />
                         </button>
                       )}
                     </div>
                     {expandedGroupId === tg.id && tg.members && tg.members.length > 0 && (
                       <div className="bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 px-3 py-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                         {tg.members.map(member => (
                           <div key={member.id} className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                             <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center">
                                 <UserCircle size={12} className="text-brand-500" />
                               </div>
                               <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{member.firstName} {member.lastName}</span>
                             </div>
                             {(user?.role === 'ADMIN' || user?.role === 'OWNER') && member.id !== user.id && (
                               <button
                                 onClick={() => handleRemoveGroupMember(tg.id, member.id)}
                                 className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                 title="إزالة من الجروب"
                               >
                                 <UserMinus size={11} />
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
               {/* Support / Team DM */}
               <div className="space-y-2">
                  <button onClick={() => setExpandedSections(p => ({...p, team: !p.team}))} className="w-full flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-500 transition-colors">
                    <span>{user.role === 'TEAM' ? 'دعم الإدارة' : 'شات الفريق'}</span>
                    <ChevronRight size={12} className={`transition-transform ${expandedSections.team ? 'rotate-90' : 'rotate-180'}`} />
                  </button>
                  {expandedSections.team && teamMembers.map(tm => (
                    <button key={tm.id} onClick={() => selectThread(tm, 'TEAM')} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeThread?.userId === tm.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeThread?.userId === tm.id ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-500'}`}><UserCircle size={18}/></div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <UserPresenceBadge isOnline={tm.isOnline} lastActiveAt={tm.lastActiveAt} size="xs" showText={false} />
                        </div>
                      </div>
                      <div className="flex-1 text-right overflow-hidden">
                        <h4 className="text-xs font-black truncate">{user.role === 'TEAM' ? 'Creziax Support' : (tm.firstName + ' ' + tm.lastName)}</h4>
                        <div className="flex items-center justify-between text-[9px] opacity-70">
                          <span className="truncate">{tm.position || tm.role}</span>
                          <UserPresenceBadge isOnline={tm.isOnline} lastActiveAt={tm.lastActiveAt} size="xs" showText={true} />
                        </div>
                      </div>
                      {unreadThreads[tm.id] > 0 && <span className="bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadThreads[tm.id]}</span>}
                    </button>
                  ))}
               </div>
               {/* Clients (Admin Only) */}
               {(user?.role === 'ADMIN' || user?.role === 'OWNER') && (
                 <div className="space-y-2">
                    <button onClick={() => setExpandedSections(p => ({...p, clients: !p.clients}))} className="w-full flex items-center justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-500 transition-colors">
                      <span>شات العملاء</span>
                      <ChevronRight size={12} className={`transition-transform ${expandedSections.clients ? 'rotate-90' : 'rotate-180'}`} />
                    </button>
                    {expandedSections.clients && clients.map(c => (
                       <button key={c.id} onClick={() => selectThread(c, 'DM')} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${activeThread?.userId === c.user?.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                         <div className="relative">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeThread?.userId === c.user?.id ? 'bg-white/20' : 'bg-brand-500/10 text-brand-500'}`}><UserCircle size={18}/></div>
                           <div className="absolute -bottom-0.5 -right-0.5">
                             <UserPresenceBadge isOnline={c.user?.isOnline} lastActiveAt={c.user?.lastActiveAt} size="xs" showText={false} />
                           </div>
                         </div>
                         <div className="flex-1 text-right overflow-hidden">
                           <h4 className="text-xs font-black truncate">{c.user?.firstName} {c.user?.lastName}</h4>
                           <div className="flex items-center justify-between text-[9px] opacity-70">
                             <span className="truncate">{c.company || 'عميل'}</span>
                             <UserPresenceBadge isOnline={c.user?.isOnline} lastActiveAt={c.user?.lastActiveAt} size="xs" showText={true} />
                           </div>
                         </div>
                         {unreadThreads[c.user?.id] > 0 && <span className="bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadThreads[c.user?.id]}</span>}
                       </button>
                     ))}
                 </div>
               )}
             </>
           )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0d0d12] lg:rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden min-h-0">
        {!activeThread ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 p-10 text-center w-full">
            <MessageSquare size={80} className="text-brand-500 mb-6" />
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">Command Center</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Select a secure signal to begin encrypted communication</p>
          </div>
        ) : (
          <>
             <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-white dark:bg-[#0d0d12] flex items-center justify-between gap-4 shrink-0">
               <div className="flex items-center gap-4">
                  <button onClick={() => setActiveThread(null)} className="lg:hidden p-2 bg-slate-100 dark:bg-white/10 rounded-xl"><ChevronRight size={20} className="rotate-180" /></button>
                   <div className="relative">
                     <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-brand-600/20"><UserCircle size={24}/></div>
                     {activeThread?.userId && (
                       <div className="absolute -bottom-1 -right-1">
                         <UserPresenceBadge 
                           isOnline={teamMembers.find(m => m.id === activeThread.userId)?.isOnline ?? clients.find(c => c.user?.id === activeThread.userId)?.user?.isOnline ?? activeThread.targetUser?.isOnline}
                           lastActiveAt={teamMembers.find(m => m.id === activeThread.userId)?.lastActiveAt ?? clients.find(c => c.user?.id === activeThread.userId)?.user?.lastActiveAt ?? activeThread.targetUser?.lastActiveAt}
                           size="sm"
                           showText={false}
                         />
                       </div>
                     )}
                   </div>
                   <div>
                     <h2 className="text-sm font-black uppercase tracking-tight leading-none mb-1.5 dark:text-white">{activeThread.name}</h2>
                     {activeThread?.userId ? (
                       <UserPresenceBadge 
                         isOnline={teamMembers.find(m => m.id === activeThread.userId)?.isOnline ?? clients.find(c => c.user?.id === activeThread.userId)?.user?.isOnline ?? activeThread.targetUser?.isOnline}
                         lastActiveAt={teamMembers.find(m => m.id === activeThread.userId)?.lastActiveAt ?? clients.find(c => c.user?.id === activeThread.userId)?.user?.lastActiveAt ?? activeThread.targetUser?.lastActiveAt}
                         size="sm"
                         showText={true}
                       />
                     ) : (
                       <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Signal Locked</span></div>
                     )}
                   </div>
               </div>
               <div className="flex items-center gap-2">
                 {(user?.role==='ADMIN'||user?.role==='OWNER') && (
                   <>
                    <button onClick={() => setIsAddMemberModalOpen(true)} className="p-2.5 bg-slate-100 dark:bg-white/10 rounded-xl hover:bg-brand-600 hover:text-white transition-all"><UserPlus size={16}/></button>
                    <button onClick={handleClearChat} className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                   </>
                 )}
                 <button onClick={() => setIsBookingModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-brand-600/20 active:scale-95 transition-all"><Calendar size={14}/> <span>حجز موعد</span></button>
               </div>
            </div>
             <div className="flex-1 overflow-y-auto min-h-0 px-6 py-8 space-y-8 custom-scrollbar">
               <PinnedBar message={messages.find(m=>m.isPinned)} onUnpin={handleTogglePin} />
               {loadingMessages ? <div className="h-full flex items-center justify-center"><Loader2 size={32} className="animate-spin text-brand-500" /></div> : messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-20"><ShieldAlert size={48} className="mb-4" /><p className="text-[10px] font-black uppercase tracking-widest">No signals detected</p></div> : messages.map((m, i) => renderMessage(m, i))}
               <div ref={scrollRef} />
            </div>
             <div className="p-4 md:p-6 bg-white dark:bg-[#0d0d12] border-t border-slate-100 dark:border-white/10 shrink-0 relative">
               {replyingTo && <div className="absolute bottom-full mb-2 left-0 w-full px-6 animate-in slide-in-from-bottom-2"><div className="bg-slate-100 dark:bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between border-r-4 border-brand-500 shadow-xl"><div className="overflow-hidden"><p className="text-[8px] font-black text-brand-500 mb-0.5">رد على {replyingTo.sender?.firstName}</p><p className="text-[10px] font-bold opacity-60 truncate">{replyingTo.content}</p></div><button onClick={() => setReplyingTo(null)}><X size={14} /></button></div></div>}
               {showLinkModal && <div className="absolute bottom-full mb-4 left-0 w-full px-6 animate-in slide-in-from-bottom-4"><div className="bg-white dark:bg-[#121215] border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3"><input autoFocus value={driveLink} onChange={e=>setDriveLink(e.target.value)} placeholder="رابط Google Drive..." className="w-full px-4 py-3 bg-slate-100 dark:bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none" /><button onClick={handleSendDriveLink} className="py-3 bg-brand-600 text-white rounded-xl font-black text-xs">إرسال الرابط</button></div></div>}
               <form onSubmit={handleSend} onPaste={handlePaste} className="flex items-center gap-2 relative z-10">
                   <input
                     type="file"
                     ref={fileInputRef}
                     onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                     className="hidden"
                     accept="*/*"
                   />
                  <div className="flex-1 min-w-0 bg-slate-100 dark:bg-white/5 border border-white/10 rounded-[1.5rem] px-3 py-2.5 sm:py-3 flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                     <input value={content} onChange={e=>setContent(e.target.value)} placeholder="اكتب رسالتك..." className="flex-1 min-w-0 bg-transparent border-none text-xs sm:text-sm font-bold outline-none dark:text-white" />
                     <div className="flex items-center gap-1 sm:gap-2 shrink-0 opacity-50">
                        <LinkIcon size={15} className="cursor-pointer hover:text-brand-500 text-slate-400 hover:opacity-100 transition-all shrink-0" onClick={()=>setShowLinkModal(!showLinkModal)} />
                        <Smile size={15} className="cursor-pointer hover:text-brand-500 text-slate-400 hover:opacity-100 transition-all shrink-0" onClick={()=>setShowEmojiPicker(!showEmojiPicker)} />
                        <button type="button" onClick={async () => {
                           if (isRecording) { mediaRecorderRef.current?.stop(); if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); setIsRecording(false); }
                           else {
                             try {
                               const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                               recordingChunksRef.current = []; const mr = new MediaRecorder(stream); mediaRecorderRef.current = mr;
                               mr.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
                               mr.onstop = () => {
                                 const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' }); setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob));
                                 stream.getTracks().forEach(t => t.stop());
                               };
                               mr.start(); setIsRecording(true); setRecordingSeconds(0);
                               recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
                             } catch(err) { rToast.error("الميكروفون مطلوب"); }
                           }
                        }} className={`p-1 rounded-full transition-all ${isRecording ? 'text-rose-500 animate-pulse' : 'hover:text-brand-500'}`}><svg width="16" height="16" viewBox="0 0 24 24" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg></button>
                     </div>
                  </div>
                  <button type="submit" disabled={!content.trim() && !isRecording} className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/30 active:scale-95 disabled:opacity-50 shrink-0">
                    <Send size={16} className="rotate-180" />
                  </button>
               </form>
               {isRecording && <div className="mt-3 flex items-center justify-center gap-2 text-rose-500 animate-pulse text-[10px] font-black uppercase tracking-widest bg-rose-500/10 py-1.5 rounded-lg border border-rose-500/20"><span>Rec mode: Secure</span><span className="tabular-nums">{Math.floor(recordingSeconds/60)}:{String(recordingSeconds%60).padStart(2,'0')}</span></div>}
               {audioUrl && !isRecording && (
                 <div className="mt-3 flex items-center gap-3 bg-brand-500/10 p-3 rounded-2xl border border-brand-500/20">
                   <audio src={audioUrl} controls className="flex-1 h-8" />
                   <button onClick={async () => {
                     try {
                       const fd = new FormData(); fd.append('file', audioBlob, `v_${Date.now()}.webm`);
                       const { data: up } = await axios.post(`${API_URL}/upload/file`, fd, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` } });
                       const msgType = (activeThread.type === 'DM' || activeThread.type === 'TEAM') ? 'PRIVATE' : 'GROUP';
                       const { data } = await sendMessageAPI({ content: `[VOICE]${recordingSeconds}|${up.url || up.fileUrl}`, type: msgType, threadId: activeThread.id, receiverId: activeThread.userId });
                       socket.emit('send_message', { ...data, type: msgType, senderSocketId: socket.id }); setMessages(p => [...p, { ...data, sender: user }]); setAudioBlob(null); setAudioUrl(null);
                     } catch(e) { rToast.error("فشل الصوت"); }
                   }} className="p-2.5 bg-brand-600 text-white rounded-xl"><Send size={14}/></button>
                   <button onClick={() => { setAudioUrl(null); setAudioBlob(null); }} className="p-2.5 bg-rose-500/20 text-rose-500 rounded-xl"><X size={14}/></button>
                 </div>
               )}
            </div>
          </>
        )}
      </div>

      {/* Modals - Simplified & Styled */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black italic uppercase tracking-tighter dark:text-white">Enrollment Hub</h3><button onClick={()=>setIsAddMemberModalOpen(false)}><X size={24}/></button></div>
             <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {teamMembers.map(tm => (
                  <button key={tm.id} onClick={() => setSelectedTeamMembers(p => p.includes(tm.id) ? p.filter(id => id !== tm.id) : [...p, tm.id])} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedTeamMembers.includes(tm.id) ? 'bg-brand-500/10 border-brand-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                    <span className="text-xs font-black dark:text-white">{tm.firstName} {tm.lastName}</span>
                    {selectedTeamMembers.includes(tm.id) && <Check size={16} className="text-brand-500" />}
                  </button>
                ))}
             </div>
             <button onClick={grantAccess} disabled={grantingAccess||selectedTeamMembers.length===0} className="w-full py-5 mt-6 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl disabled:opacity-50 transition-all">{grantingAccess ? 'Processing...' : 'Confirm Enrollment'}</button>
          </div>
        </div>
      )}

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black italic uppercase tracking-tighter dark:text-white">Strategic Scheduling</h3><button onClick={()=>setIsBookingModalOpen(false)}><X size={24}/></button></div>
             <div className="space-y-4">
                <input value={bookingData.topic} onChange={e=>setBookingData({...bookingData, topic: e.target.value})} placeholder="Meeting Purpose..." className="w-full p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-white/5 text-xs font-black outline-none" />
                <textarea value={bookingData.dates} onChange={e=>setBookingData({...bookingData, dates: e.target.value})} placeholder="Suggested Windows..." rows={3} className="w-full p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-white/5 text-xs font-black outline-none resize-none" />
             </div>
             <button onClick={handleBooking} disabled={sendingBooking||!bookingData.topic} className="w-full py-5 mt-6 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl disabled:opacity-50 transition-all">{sendingBooking ? 'Transmitting...' : 'Initiate Briefing'}</button>
          </div>
        </div>
      )}

      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 border border-white/10 shadow-2xl animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black italic uppercase tracking-tighter dark:text-white">Channel Architecture</h3><button onClick={()=>setIsCreateGroupModalOpen(false)}><X size={24}/></button></div>
             <input value={newGroupData.name} onChange={e=>setNewGroupData({...newGroupData, name: e.target.value})} placeholder="Channel Ops Name..." className="w-full p-4 mb-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-white/5 text-xs font-black outline-none" />
             <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                {teamMembers.map(tm => (
                  <button key={tm.id} onClick={() => setNewGroupData(p=>({...p, memberIds: p.memberIds.includes(tm.id)?p.memberIds.filter(x=>x!==tm.id):[...p.memberIds, tm.id]}))} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${newGroupData.memberIds.includes(tm.id) ? 'bg-brand-500/10 border-brand-500' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                    <span className="text-xs font-black dark:text-white">{tm.firstName} {tm.lastName}</span>
                  </button>
                ))}
             </div>
             <button onClick={handleCreateGroup} disabled={creatingGroup||!newGroupData.name} className="w-full py-5 mt-6 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl disabled:opacity-50 transition-all">Establish Channel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
