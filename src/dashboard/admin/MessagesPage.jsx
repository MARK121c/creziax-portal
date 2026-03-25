import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getClientsAPI, 
  getProjectsAPI, 
  getMessagesAPI, 
  sendMessageAPI,
  getUsersAPI,
  grantChatAccessAPI,
  createTeamGroupAPI,
  getTeamGroupsAPI,
  clearMessagesAPI,
  deleteTeamGroupAPI,
  removeGroupMemberAPI,
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
  UserPlus, X, Users, Check, Trash2, UserMinus, Paperclip, Pin, MessageSquareReply
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

// ──────────────────────────────────────────────
// Pinned Message Bar (V17.6 Supreme)
// ──────────────────────────────────────────────
const PinnedBar = ({ message, onUnpin }) => {
  if (!message) return null;
  return (
    <div className="sticky top-0 z-20 bg-brand-500/10 backdrop-blur-md border-b border-brand-500/20 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300 -mx-10 px-10">
      <div className="flex items-center gap-3 overflow-hidden">
        <Pin size={16} className="text-brand-500 shrink-0 fill-brand-500/20" />
        <div className="overflow-hidden">
           <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-0.5">رسالة مثبتة</p>
           <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-sm md:max-w-md">{message.content}</p>
        </div>
      </div>
      <button 
        onClick={() => onUnpin(message.id)} 
        className="p-2 hover:bg-brand-500/20 rounded-xl text-slate-400 hover:text-brand-500 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
        title="إلغاء التثبيت"
      >
        <span>إلغاء التثبيت</span>
        <X size={14} />
      </button>
    </div>
  );
};
import axios from 'axios';

const API_URL = 'https://api.creziax.cloud/api';

const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'OWNER' && user.role !== 'ADMIN') {
        navigate('/client/messages');
    }
  }, [user, navigate]);

  const { setActiveThreadId, resetUnreadMessages, unreadThreads, setGlobalCountVisible } = useNotificationStore();

  useEffect(() => {
    // v17.6 Supreme Zero-Out Sidebar Logic
    resetUnreadMessages(); // Reset all global unread counts
    setGlobalCountVisible(false); // Hide global badge
  }, [resetUnreadMessages, setGlobalCountVisible]);
  
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
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    groups: true,
    global: true,
    team: false,
    clients: false
  });

  const [newGroupData, setNewGroupData] = useState({ name: '', memberIds: [] });
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinningMessageId, setPinningMessageId] = useState(null);
  
  const socket = useSocket();
  const scrollRef = useRef();
  const activeThreadRef = useRef(activeThread);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const fetchData = useCallback(async () => {
    setLoadingSidebar(true);
    try {
      const [cRes, pRes, uRes, gRes] = await Promise.all([
        getClientsAPI(),
        getProjectsAPI(),
        getUsersAPI(),
        getTeamGroupsAPI()
      ]);
      setClients(cRes.data);
      setProjects(pRes.data);
      setTeamMembers(uRes.data.filter(u => u.role !== 'CLIENT'));
      setTeamGroups(gRes.data);
    } catch (err) {
      rToast.error("فشل تحميل البيانات");
    } finally {
      setLoadingSidebar(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchThreadMessages = async (threadId, isDM, dmUserId) => {
    if (!threadId) return;
    setLoadingMessages(true);
    try {
      const { data } = await getMessagesAPI(threadId);
      setMessages(data || []);
      const clearId = isDM ? (dmUserId || threadId) : threadId;
      markAsReadAPI({ threadId: clearId });
      resetUnreadMessages(clearId);
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
        const projectIds = projects.map(p => p.id);
        const groupIds = teamGroups.map(g => g.id);
        socket.emit('join_rooms', {
          userId: user.id,
          role: user.role,
          projectIds: [...projectIds, ...groupIds]
        });
      }
    };

    handleJoinRooms();
    socket.on('connect', handleJoinRooms);
    return () => socket.off('connect', handleJoinRooms);
  }, [projects, teamGroups, user, loadingSidebar, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg) => {
      const current = activeThreadRef.current;
      if (!current) return;
      
      const targetId = current.userId || current.id;
      const isCorrectThread = 
        (newMsg.type === 'GROUP' && newMsg.threadId === current.id) ||
        (newMsg.type === 'PRIVATE' && (newMsg.senderId === targetId || newMsg.receiverId === targetId));
      
      if (isCorrectThread) {
        if (newMsg.senderId !== user?.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, sender: newMsg.sender || { firstName: newMsg.senderName || 'مستخدم', role: 'USER' } }];
          });
          const tid = current.type === 'DM' || current.type === 'TEAM' ? current.userId : current.id;
          resetUnreadMessages(tid);
          markAsReadAPI({ threadId: tid }).catch(() => {});
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('chat_deleted', ({ threadId }) => {
      if (activeThreadRef.current?.id === threadId) {
        setMessages([]);
        setActiveThread(null);
        rToast.success("تم مسح هذه المحادثة من قبل الإدارة");
      }
    });

    socket.on('message_deleted', ({ id }) => {
      // v17.6-SUPREME Iron Deletion: Direct Filter
      setMessages(prev => prev.filter(m => m.id !== id));
    });

    socket.on('message_pinned', ({ id, isPinned }) => {
      setMessages(prev => {
        // v17.6-SUPREME: Only one pinned message per thread allowed
        if (isPinned) {
          return prev.map(m => m.id === id ? { ...m, isPinned: true } : { ...m, isPinned: false });
        }
        return prev.map(m => m.id === id ? { ...m, isPinned: false } : m);
      });
    });

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('chat_deleted');
      socket.off('message_deleted');
      socket.off('message_pinned');
    };
  }, [user?.id, socket, resetUnreadMessages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateMessage = (text) => {
    const phoneRegex = /(01|\+)[0-9]{8,15}/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const socialRegex = /(t\.me|wa\.me|whatsapp|telegram)/i;
    if (phoneRegex.test(text) || emailRegex.test(text) || socialRegex.test(text)) {
      rToast.error('عذراً، يمنع مشاركة بيانات التواصل الخارجية لضمان أمان العمل والالتزام بسياسة الخصوصية.', {
        duration: 5000
      });
      return false;
    }
    return true;
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || !activeThread) return;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
    if (!isAdmin && !validateMessage(content)) return;

    const isDM = activeThread.type === 'DM' || activeThread.type === 'TEAM';
    const type = isDM ? 'PRIVATE' : 'GROUP';
    try {
      const { data } = await sendMessageAPI({ 
        content, 
        type,
        threadId: type === 'GROUP' ? activeThread.id : null,
        receiverId: type === 'PRIVATE' ? activeThread.userId : null,
        parentId: replyingTo?.id || null
      });
      
      socket.emit('send_message', { 
        ...data, 
        type,
        threadId: type === 'GROUP' ? activeThread.id : null,
        receiverId: type === 'PRIVATE' ? activeThread.userId : null,
        senderName: `${user?.firstName} ${user?.lastName}`,
        parent: replyingTo
      });
      setContent('');
      setReplyingTo(null);
      setMessages(prev => [...prev, { ...data, sender: user, parent: replyingTo }]);
    } catch (err) {
      if (err.response?.status === 403) {
        rToast.error(err.response.data.message);
      } else {
        rToast.error("فشل إرسال الرسالة");
      }
    }
  };

  const handleSendDriveLink = async () => {
    if (!driveLink.trim() || !activeThread) return;
    try {
      const msgContent = `[DRIVE_LINK]${driveLink.trim()}`;
      const { data } = await sendMessageAPI({
        content: msgContent,
        threadId: activeThread.id,
        receiverId: activeThread.type === 'DM' || activeThread.type === 'TEAM' ? activeThread.userId : null
      });
      socket.emit('send_message', { ...data, threadId: activeThread.id });
      setMessages(prev => [...prev, { ...data, sender: user }]);
      setDriveLink('');
      setShowLinkModal(false);
      rToast.success('تم إرسال رابط الملف بنجاح');
    } catch (err) {
      rToast.error('فشل إرسال الرابط');
    }
  };

  const handleClearChat = async () => {
    if (!activeThread) return;
    if (!window.confirm("تحذير: هل أنت متأكد من مسح جميع رسائل هذه المحادثة؟ سيتم حذفها نهائياً.")) return;
    try {
      await clearMessagesAPI(activeThread.id);
      socket.emit('force_delete_chat', { 
        threadId: activeThread.id, 
        type: activeThread.type === 'GROUP' ? 'GROUP' : 'PRIVATE',
        receiverId: activeThread.userId 
      });
      setMessages([]);
      rToast.success("تم مسح المحادثة بنجاح");
    } catch (err) {
      rToast.error(err.response?.data?.message || "فشل مسح المحادثة");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('تحذير: سيتم حذف الجروب وجميع رسائله نهائياً.')) return;
    try {
      await deleteTeamGroupAPI(groupId);
      setTeamGroups(prev => prev.filter(g => g.id !== groupId));
      if (activeThread?.id === groupId) setActiveThread(null);
      rToast.success('تم حذف الجروب بنجاح');
    } catch (err) {
      rToast.error(err.response?.data?.message || 'فشل حذف الجروب');
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    if (!window.confirm('إزالة هذا العضو من الجروب?')) return;
    try {
      await removeGroupMemberAPI(groupId, memberId);
      setTeamGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, members: g.members.filter(m => m.id !== memberId) } : g
      ));
      rToast.success('تم إزالة العضو');
    } catch (err) {
      rToast.error(err.response?.data?.message || 'فشل إزالة العضو');
    }
  };

  const selectThread = (item, type) => {
    let memberCount = 2;
    if (type === 'GROUP') { memberCount = (item.teamMembers?.length || 0) + 1; }
    else if (type === 'TEAM_GROUP') { memberCount = item.members?.length || 0; }

    const threadId = type === 'DM' || type === 'TEAM' ? item.user?.id || item.id : item.id;
    resetUnreadMessages(threadId);
    setActiveThreadId(threadId);
    setActiveThread({
      id: threadId,
      name: type === 'DM' || type === 'TEAM' ? (item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.firstName ? `${item.firstName} ${item.lastName}` : item.name)) : item.name,
      type,
      userId: type === 'DM' || type === 'TEAM' ? (item.user?.id || item.id) : null,
      driveUrl: type === 'GROUP' ? item.driveUrl : null,
      memberCount
    });
    fetchThreadMessages(threadId, type === 'DM' || type === 'TEAM', item.user?.id || item.id);
  };

  const grantAccess = async () => {
    if (selectedTeamMembers.length === 0 || !activeThread) return;
    setGrantingAccess(true);
    try {
      await Promise.all(selectedTeamMembers.map(id => grantChatAccessAPI(id, activeThread.id)));
      rToast.success(`تم منح صلاحية الوصول بنجاح`);
      setIsAddMemberModalOpen(false);
      setSelectedTeamMembers([]);
    } catch (err) {
      rToast.error("فشل منح الصلاحية");
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleTogglePin = async (msgId) => {
    setPinningMessageId(msgId);
    try {
      const { data } = await togglePinAPI(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned: data.isPinned } : m));
      rToast.success(data.isPinned ? "تم تثبيت الرسالة" : "تم إلغاء التثبيت");
    } catch (err) {
      rToast.error("فشل تعديل التثبيت");
    } finally {
      setPinningMessageId(null);
    }
  };

  const handleCreateGroup = async (e) => {
    if (e) e.preventDefault();
    if (!newGroupData.name || newGroupData.memberIds.length === 0) return;
    setCreatingGroup(true);
    try {
      const { data } = await createTeamGroupAPI(newGroupData);
      setTeamGroups(prev => [...prev, data]);
      rToast.success("تم إنشاء جروب الفريق");
      setIsCreateGroupModalOpen(false);
      setNewGroupData({ name: '', memberIds: [] });
      selectThread(data, 'TEAM_GROUP');
    } catch (err) {
      rToast.error("فشل إنشاء الجروب");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleBooking = async () => {
    if (!bookingData.topic || !bookingData.dates || !activeThread) return;
    setSendingBooking(true);
    const cardContent = `[MEETING_BOOKING]\nTopic: ${bookingData.topic}\nAvailability: ${bookingData.dates}`;
    try {
      const { data } = await sendMessageAPI({ 
        content: cardContent, 
        threadId: activeThread.id,
        receiverId: activeThread.type === 'DM' || activeThread.type === 'TEAM' ? activeThread.userId : null
      });
      socket.emit('send_message', { ...data, threadId: activeThread.id });
      setBookingData({ topic: '', dates: '' });
      setIsBookingModalOpen(false);
      setMessages(prev => [...prev, { ...data, sender: user }]);
      rToast.success("تم إرسال طلب الموعد");
    } catch (err) {
      rToast.error("فشل إرسال طلب الموعد");
    } finally {
       setSendingBooking(false);
    }
  };

  const renderMessage = (m, i) => {
    const isDriveLink = m.content?.startsWith('[DRIVE_LINK]');
    const isBookingCard = m.content?.startsWith('[MEETING_BOOKING]');
    const isFileCard = m.content?.startsWith('[FILE]');
    let bookingDetails = null;
    let driveUrl = null;
    let fileDetails = null;
    
    if (isDriveLink) {
      driveUrl = m.content.replace('[DRIVE_LINK]', '').trim();
    } else if (isBookingCard) {
      const lines = m.content.split('\n');
      bookingDetails = {
        topic: lines[1]?.replace('Topic: ', ''),
        dates: lines[2]?.replace('Availability: ', '')
      };
    } else if (isFileCard) {
      const fileLines = m.content.split('\n');
      const fileUrl = fileLines[0].replace('[FILE]', '');
      const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
      fileDetails = { url: fileUrl, isImage, caption: fileLines.slice(1).join('\n') };
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
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Calendar size={16} /></div>
                      <span className="text-[10px] uppercase font-black tracking-widest">طلب موعد</span>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] opacity-70 uppercase font-black tracking-widest">الموضوع</p>
                      <p className="text-xs font-black">{bookingDetails?.topic}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] opacity-70 uppercase font-black tracking-widest">المواعيد</p>
                      <p className="text-xs font-black p-2 bg-white/10 rounded-lg">{bookingDetails?.dates}</p>
                   </div>
                </div>
              ) : isFileCard ? (
                 <div className="flex flex-col gap-3">
                    {fileDetails.isImage ? (
                      <a href={fileDetails.url} target="_blank" rel="noopener noreferrer">
                        <img src={fileDetails.url} className="max-w-[280px] rounded-xl border border-white/10 shadow-lg" />
                      </a>
                    ) : (
                      <a href={fileDetails.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-white/10">
                        <Paperclip size={18} className="text-brand-500" />
                        <span className="text-xs underline truncate max-w-[150px]">{fileDetails.url.split('/').pop()}</span>
                      </a>
                    )}
                    {fileDetails.caption && <p className="text-xs opacity-80 mt-1">{fileDetails.caption}</p>}
                 </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              )}
            </div>

            <div className={`absolute -bottom-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 ${isMine ? 'right-0' : 'left-0'} bg-white dark:bg-[#1a1a1e] p-1 rounded-full border border-slate-100 dark:border-white/10 shadow-xl`}>
              <button onClick={() => setReplyingTo(m)} className="p-2 rounded-full hover:bg-brand-500/10 text-slate-400 hover:text-brand-500 transition-colors" title="رد">
                <MessageSquareReply size={14} />
              </button>
              <button 
                onClick={() => handleTogglePin(m.id)}
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
                           {(user.role === 'ADMIN' || user.role === 'OWNER') && <button onClick={async () => { closeToast(); try { await deleteSpecificMessageAPI(m.id, 'everyone'); setMessages(prev => prev.filter(msg => msg.id !== m.id)); } catch(e) {} }} className="bg-rose-500 text-[10px] font-bold px-3 py-1 rounded-md text-white">للجميع</button>}
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
          <span className="text-[8px] font-black text-slate-400 mt-2 px-2 uppercase tracking-[0.2em] flex items-center gap-1">
            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMine && <CheckCircle2 size={10} className={m.isRead ? "text-brand-400" : "text-slate-500"} />}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 md:gap-8 animate-in fade-in duration-700">
      <div className="w-full lg:w-96 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none max-h-[45vh] lg:max-h-none">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">مركز الرسائل</h2>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="البحث هنا..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-right" dir="rtl">
          {loadingSidebar ? (
            <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-brand-500 mx-auto" /></div>
          ) : (
            <>
              <div className="space-y-3">
                <button onClick={() => setExpandedSections(p => ({...p, projects: !p.projects}))} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جروبات المشاريع</h3>
                   <ChevronRight size={14} className={`transition-transform duration-300 ${expandedSections.projects ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.projects && projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                  <button key={p.id} onClick={() => selectThread(p, 'GROUP')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                    <div className="flex-1 text-right overflow-hidden">
                      <h4 className="text-xs font-black truncate">{p.name}</h4>
                      <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === p.id ? 'text-white' : 'text-slate-400'}`}>مشروع نشط</p>
                    </div>
                    {unreadThreads[p.id] > 0 && activeThread?.id !== p.id && (
                      <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shrink-0">{unreadThreads[p.id]}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="w-full flex items-center justify-between px-4 py-2">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قنوات الفريق</h3>
                   <button onClick={() => setIsCreateGroupModalOpen(true)} className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all"><Plus size={14}/></button>
                </div>
                {teamGroups.map(tg => (
                  <button key={tg.id} onClick={() => selectThread(tg, 'TEAM_GROUP')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === tg.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                    <div className="flex-1 text-right overflow-hidden">
                      <h4 className="text-xs font-black truncate">{tg.name}</h4>
                      <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === tg.id ? 'text-white' : 'text-slate-400'}`}>{tg.members?.length} أعضاء</p>
                    </div>
                    {unreadThreads[tg.id] > 0 && activeThread?.id !== tg.id && (
                      <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shrink-0">{unreadThreads[tg.id]}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => setExpandedSections(p => ({...p, team: !p.team}))} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">شات الفريق</h3>
                   <ChevronRight size={14} className={`transition-transform duration-300 ${expandedSections.team ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.team && teamMembers.filter(tm => tm.id !== user.id && `${tm.firstName} ${tm.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())).map(tm => (
                  <button key={tm.id} onClick={() => selectThread(tm, 'TEAM')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.userId === tm.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                    <div className="flex-1 text-right overflow-hidden">
                      <h4 className="text-xs font-black truncate">{tm.firstName} {tm.lastName}</h4>
                      <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.userId === tm.id ? 'text-white' : 'text-slate-400'}`}>{tm.position || 'فريق العمل'}</p>
                    </div>
                    {unreadThreads[tm.id] > 0 && activeThread?.userId !== tm.id && (
                      <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shrink-0">{unreadThreads[tm.id]}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => setExpandedSections(p => ({...p, clients: !p.clients}))} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">شات العملاء</h3>
                   <ChevronRight size={14} className={`transition-transform duration-300 ${expandedSections.clients ? 'rotate-180' : ''}`} />
                </button>
                {expandedSections.clients && clients.filter(c => `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                  <button key={c.id} onClick={() => selectThread(c, 'DM')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.userId === c.user?.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                    <div className="flex-1 text-right overflow-hidden">
                      <h4 className="text-xs font-black truncate">{c.user?.firstName} {c.user?.lastName}</h4>
                      <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.userId === c.user?.id ? 'text-white' : 'text-slate-400'}`}>{c.company || 'خاص'}</p>
                    </div>
                    {unreadThreads[c.user?.id] > 0 && activeThread?.userId !== c.user?.id && (
                      <span className="bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shrink-0">{unreadThreads[c.user?.id]}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm dark:shadow-none min-h-0">
        {!activeThread ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 p-10 text-center">
            <MessageSquare size={64} className="text-brand-500 mb-6" />
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 italic">اختر محادثة للبدء</h3>
            <p className="text-slate-500 max-w-sm font-bold text-sm">تواصل آمن ومحمي داخل بيئة Creziax.</p>
          </div>
        ) : (
          <>
            <div className="px-6 md:px-10 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between gap-4" dir="rtl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-500/10 text-brand-500 border border-brand-500/20 flex-shrink-0">
                  <UserCircle size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none mb-2">{activeThread.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-400">نشط الآن</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 {activeThread.driveUrl && (
                   <a 
                     href={activeThread.driveUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white rounded-xl font-black text-[10px] uppercase transition-all shadow-sm"
                   >
                     <Briefcase size={14} />
                     <span>ملفات المشروع</span>
                   </a>
                 )}
                 <button onClick={() => setIsAddMemberModalOpen(true)} className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-sm" title="إضافة عضو"><UserPlus size={18} /></button>
                 <button onClick={handleClearChat} className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="مسح المحادثة"><Trash2 size={18} /></button>
                 <button onClick={() => setIsBookingModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg"><Calendar size={14}/><span>حجز موعد</span></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 custom-scrollbar bg-slate-50/30 dark:bg-[#08080a] relative">
              <PinnedBar 
                message={messages.find(m => m.isPinned)} 
                onUnpin={(id) => handleTogglePin(id)} 
              />

              {loadingMessages ? (
                 <div className="h-full flex flex-col items-center justify-center"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
              ) : messages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                   <ShieldAlert size={44} className="mb-4 text-brand-500" />
                   <p className="text-xs font-black">لا توجد رسائل بعد</p>
                 </div>
              ) : messages.map((m, i) => renderMessage(m, i))}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 md:p-6 bg-white dark:bg-[#0a0a0c] border-t border-slate-100 dark:border-white/5 relative">
              {replyingTo && (
                <div className="absolute bottom-full mb-2 left-0 w-full px-4 md:px-6 animate-in slide-in-from-bottom-2" dir="rtl">
                   <div className="bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between border-r-4 border-brand-500 shadow-xl">
                      <div className="overflow-hidden">
                         <p className="text-[10px] font-black text-brand-500 mb-1">رد على {replyingTo.sender?.firstName}</p>
                         <p className="text-xs font-bold text-slate-500 truncate">{replyingTo.content}</p>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-rose-500"><X size={18} /></button>
                   </div>
                </div>
              )}

              {showLinkModal && (
                <div className="absolute bottom-full mb-4 left-0 w-full px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4" dir="rtl">
                  <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
                    <input autoFocus value={driveLink} onChange={e => setDriveLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendDriveLink()} placeholder="لصق رابط Google Drive هنا..." className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 rounded-xl text-sm font-bold" />
                    <button onClick={handleSendDriveLink} className="py-3 bg-brand-600 text-white rounded-xl font-black text-sm">إرسال الرابط</button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSend} className="relative flex items-center gap-3" dir="rtl">
                <div className="flex-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                  <input value={content} onChange={e => setContent(e.target.value)} placeholder="اكتب رسالتك هنا..." className="flex-1 bg-transparent border-none text-sm font-bold outline-none dark:text-white" />
                  <div className="flex items-center gap-3 opacity-50">
                    <LinkIcon size={20} className="cursor-pointer hover:text-brand-500 hover:opacity-100 transition-all" onClick={() => setShowLinkModal(!showLinkModal)} />
                    <Smile size={20} className="cursor-pointer hover:text-brand-500 hover:opacity-100 transition-all" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                  </div>
                </div>
                <button type="submit" disabled={!content.trim()} className="w-14 h-14 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/30 disabled:opacity-50"><Send size={20} className="rotate-180 mr-1" /></button>
              </form>
              
              {showEmojiPicker && (
                <div ref={emojiRef} className="absolute bottom-20 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
                  <EmojiPicker onEmojiClick={(e) => setContent(p => p + e.emoji)} theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black dark:text-white text-slate-800">إضافة عضو للمحادثة</h3>
                <button onClick={() => setIsAddMemberModalOpen(false)}><X size={24} className="text-slate-400"/></button>
             </div>
             <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                {teamMembers.map(tm => (
                  <button key={tm.id} onClick={() => setSelectedTeamMembers(p => p.includes(tm.id) ? p.filter(id => id !== tm.id) : [...p, tm.id])} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedTeamMembers.includes(tm.id) ? 'bg-brand-500/5 border-brand-500/30' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-xs font-black">{tm.firstName} {tm.lastName}</span>
                    <div className={`w-5 h-5 rounded border ${selectedTeamMembers.includes(tm.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-300'}`}>{selectedTeamMembers.includes(tm.id) && <Check size={12} className="text-white mx-auto"/>}</div>
                  </button>
                ))}
             </div>
             <button onClick={grantAccess} disabled={grantingAccess || selectedTeamMembers.length === 0} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all disabled:opacity-50">{grantingAccess ? 'جاري الإضافة...' : 'تأكيد الإضافة'}</button>
          </div>
        </div>
      )}

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black dark:text-white text-slate-800">جدولة موعد</h3>
                <button onClick={() => setIsBookingModalOpen(false)}><X size={24} className="text-slate-400"/></button>
             </div>
             <div className="space-y-4">
                <input value={bookingData.topic} onChange={e => setBookingData({...bookingData, topic: e.target.value})} placeholder="موضوع الاجتماع..." className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" />
                <textarea value={bookingData.dates} onChange={e => setBookingData({...bookingData, dates: e.target.value})} placeholder="المواعيد المقترحة..." rows={3} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold resize-none" />
             </div>
             <button onClick={handleBooking} disabled={sendingBooking || !bookingData.topic} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all disabled:opacity-50">{sendingBooking ? 'جاري الإرسال...' : 'إرسال الطلب'}</button>
          </div>
        </div>
      )}

      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] p-8 space-y-6 animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black dark:text-white text-slate-800">إنشاء جروب فريق</h3>
                <button onClick={() => setIsCreateGroupModalOpen(false)}><X size={24} className="text-slate-400"/></button>
             </div>
             <input value={newGroupData.name} onChange={e => setNewGroupData({...newGroupData, name: e.target.value})} placeholder="اسم الجروب الجديد..." className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold" />
             <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
                {teamMembers.filter(tm => tm.id !== user.id).map(tm => (
                  <button key={tm.id} onClick={() => setNewGroupData(p => ({...p, memberIds: p.memberIds.includes(tm.id) ? p.memberIds.filter(id => id !== tm.id) : [...p.memberIds, tm.id]}))} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${newGroupData.memberIds.includes(tm.id) ? 'bg-brand-500/5 border-brand-500/30' : 'bg-slate-50 border-slate-100'}`}>
                    <span className="text-xs font-black">{tm.firstName} {tm.lastName}</span>
                    <div className={`w-5 h-5 rounded border ${newGroupData.memberIds.includes(tm.id) ? 'bg-brand-500 border-brand-500' : 'border-slate-300'}`}>{newGroupData.memberIds.includes(tm.id) && <Check size={12} className="text-white mx-auto"/>}</div>
                  </button>
                ))}
             </div>
             <button onClick={handleCreateGroup} disabled={creatingGroup || !newGroupData.name} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all disabled:opacity-50">{creatingGroup ? 'جاري الإنشاء...' : 'إنشاء الجروب'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
