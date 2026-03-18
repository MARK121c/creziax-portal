import { useEffect, useState, useRef, useCallback } from 'react';
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
  uploadAttachmentAPI
} from '../../store/api';
import useAuthStore from '../../store/authStore';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { 
  Send, MessageSquare, Search, MoreHorizontal, Smile, Paperclip, 
  Loader2, UserCircle, Plus, Filter, Clock, CheckCircle2, AlertCircle,
  Tag, ChevronRight, Briefcase, Calendar, ExternalLink, ShieldAlert,
  UserPlus, X, Users, Check, Trash2
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({
    projects: true,
    groups: true,
    global: true,
    team: false,
    clients: false
  });

  const [newGroupData, setNewGroupData] = useState({ name: '', memberIds: [] });
  const [creatingGroup, setCreatingGroup] = useState(false);
  
  const socketRef = useRef();
  const scrollRef = useRef();

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoadingSidebar(false);
    }
  }, [user?.role]);

  const fetchThreadMessages = async (threadId) => {
    setLoadingMessages(true);
    try {
      const { data } = await getMessagesAPI(threadId);
      setMessages(data || []);
      
      if (socketRef.current) {
        socketRef.current.emit('join_thread', threadId);
      }
    } catch (err) {
      toast.error("فشل تحميل الرسائل");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchData();

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', {
      transports: ['websocket'],
    });

    socketRef.current.on('receive_message', (msg) => {
      if (msg.threadId === activeThread?.id) {
        if (msg.senderId !== user?.id) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }
    });

    return () => socketRef.current.disconnect();
  }, [fetchData, activeThread?.id]);

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
      toast.error('عذراً، يمنع مشاركة بيانات التواصل الخارجية لضمان أمان العمل والالتزام بسياسة الخصوصية.', {
        icon: <ShieldAlert className="text-rose-500" />,
        duration: 5000
      });
      return false;
    }
    return true;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!content.trim() && !selectedFile) || !activeThread || uploadingFile) return;
    
    // Privacy Firewall: Admins bypass validation rule
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
    if (content.trim() && !isAdmin && !validateMessage(content)) return;

    if (selectedFile) {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const { data } = await uploadAttachmentAPI(formData);
        
        const msgContent = content.trim() ? `[FILE]${data.url}\n${content.trim()}` : `[FILE]${data.url}`;
        const msgData = {
          content: msgContent,
          threadId: activeThread.id,
          receiverId: activeThread.type === 'DM' || activeThread.type === 'TEAM' ? activeThread.userId : null
        };

        const res = await sendMessageAPI(msgData);
        setMessages(prev => [...prev, { ...res.data, sender: user }]);
        socketRef.current.emit('send_message', { ...res.data, threadId: activeThread.id });
        toast.success('تم إرسال المرفق بنجاح');
      } catch (err) {
        toast.error('فشل رفع الملف، يرجى المحاولة مرة أخرى');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
      setSelectedFile(null);
      setContent('');
      return;
    }

    try {
      const { data } = await sendMessageAPI({ 
        content, 
        threadId: activeThread.id,
        receiverId: activeThread.type === 'DM' || activeThread.type === 'TEAM' ? activeThread.userId : null
      });
      socketRef.current.emit('send_message', { ...data, threadId: activeThread.id });
      setContent('');
      setMessages(prev => [...prev, { ...data, sender: user }]);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data.message);
      } else {
        toast.error("فشل إرسال الرسالة");
      }
    }
  };

  const handleClearChat = async () => {
    if (!activeThread) return;
    if (!window.confirm("تحذير: هل أنت متأكد من مسح جميع رسائل هذه المحادثة؟ سيتم حذفها نهائياً ولن يمكن استرجاعها.")) return;
    try {
      await clearMessagesAPI(activeThread.id);
      setMessages([]);
      toast.success("تم مسح المحادثة بنجاح من قاعدة البيانات");
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل مسح المحادثة");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeThread) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً، الحد الأقصى هو 100 ميجا بايت');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    e.target.value = '';
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectThread = (item, type) => {
    let memberCount = 2;
    if (type === 'GROUP') {
      memberCount = (item.teamMembers?.length || 0) + 1; // Team + Client
    } else if (type === 'TEAM_GROUP') {
      memberCount = item.members?.length || 0;
    } else if (type === 'GLOBAL') {
      memberCount = teamMembers.length + 1; // Team + Owner
    }

    const thread = {
      id: type === 'DM' || type === 'TEAM' ? item.user?.id || item.id : item.id,
      name: type === 'DM' || type === 'TEAM' ? (item.user ? `${item.user.firstName} ${item.user.lastName}` : (item.firstName ? `${item.firstName} ${item.lastName}` : item.name)) : item.name,
      type: type,
      userId: type === 'DM' || type === 'TEAM' ? (item.user?.id || item.id) : null,
      driveUrl: type === 'GROUP' ? item.driveUrl : null,
      avatarUrl: type === 'DM' || type === 'TEAM' ? (item.logoUrl || item.avatarUrl) : null,
      memberCount
    };
    setActiveThread(thread);
    fetchThreadMessages(thread.id);
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = `${c.user?.firstName} ${c.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (user?.role === 'TEAM') {
      return user.permissions?.includes(`chat:${c.user?.id}`);
    }
    return true;
  });
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grantAccess = async () => {
    if (selectedTeamMembers.length === 0 || !activeThread) return;
    setGrantingAccess(true);
    try {
      // Execute concurrently for all selected members
      await Promise.all(selectedTeamMembers.map(id => grantChatAccessAPI(id, activeThread.id)));
      toast.success(`تم منح صلاحية الوصول بنجاح`);
      setIsAddMemberModalOpen(false);
      setSelectedTeamMembers([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل منح الصلاحية");
    } finally {
      setGrantingAccess(false);
    }
  };

  const handleCreateGroup = async (e) => {
    if (e) e.preventDefault();
    if (!newGroupData.name || newGroupData.memberIds.length === 0) {
      toast.error("يرجى إدخال اسم الجروب واختيار أعضاء");
      return;
    }
    setCreatingGroup(true);
    try {
      const { data } = await createTeamGroupAPI(newGroupData);
      setTeamGroups(prev => [...prev, data]);
      toast.success("تم إنشاء جروب الفريق بنجاح");
      setIsCreateGroupModalOpen(false);
      setNewGroupData({ name: '', memberIds: [] });
      // Auto-select the new group
      selectThread(data, 'TEAM_GROUP');
    } catch (err) {
      toast.error(err.response?.data?.message || "فشل إنشاء الجروب");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleBooking = async () => {
    if (!bookingData.topic || !bookingData.dates || !activeThread) return;
    setSendingBooking(true);
    
    const cardContent = `[MEETING_BOOKING]
Topic: ${bookingData.topic}
Availability: ${bookingData.dates}`;

    try {
      const { data } = await sendMessageAPI({ 
        content: cardContent, 
        threadId: activeThread.id,
        receiverId: activeThread.type === 'DM' || activeThread.type === 'TEAM' ? activeThread.userId : null
      });
      socketRef.current.emit('send_message', { ...data, threadId: activeThread.id });
      setBookingData({ topic: '', dates: '' });
      setIsBookingModalOpen(false);
      setMessages(prev => [...prev, { ...data, sender: user }]);
      toast.success("تم إرسال طلب الموعد");
    } catch (err) {
      toast.error("فشل إرسال طلب الموعد");
    } finally {
       setSendingBooking(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 md:gap-8 animate-in fade-in duration-700">
      {!user ? (
        <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#0a0a0c]/40 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl">
           <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-brand-500" size={32} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">جاري تهيئة مركز الرسائل...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full lg:w-96 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none max-h-[45vh] lg:max-h-none">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">مركز الرسائل الآمن</h2>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="البحث في المحادثات..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-right" dir="rtl">
              {loadingSidebar ? (
                <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-brand-500 mx-auto" /></div>
              ) : (
                <>
                  {/* 1. Project Groups (Teams) */}
                  <div className="space-y-3">
                    <button 
                      onClick={() => toggleSection('projects')}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group"
                    >
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-brand-500 transition-colors">جروبات المشاريع (Teams)</h3>
                      <div className={`text-slate-400 transition-transform duration-300 ${expandedSections.projects ? 'rotate-180' : ''}`}>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                    {expandedSections.projects && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {filteredProjects.map(p => (
                          <button 
                            key={p.id} 
                            onClick={() => selectThread(p, 'GROUP')}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === p.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                              {p.logoUrl ? <img src={p.logoUrl} className="w-full h-full object-cover" /> : <Briefcase size={20} />}
                            </div>
                            <div className="flex-1 text-right overflow-hidden">
                              <h4 className="text-xs font-black truncate">{p.name}</h4>
                              <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === p.id ? 'text-white' : 'text-slate-400'}`}>Project Command Center</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Internal Team Groups (New) */}
                  {user?.role !== 'CLIENT' && (
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="w-full flex items-center justify-between px-4 py-2">
                        <button 
                          onClick={() => toggleSection('groups')}
                          className="flex items-center gap-2 hover:text-brand-500 transition-colors group"
                        >
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-brand-500 transition-colors">قنوات الفريق (Internal)</h3>
                          <div className={`text-slate-400 transition-transform duration-300 ${expandedSections.groups ? 'rotate-180' : ''}`}>
                            <ChevronRight size={14} />
                          </div>
                        </button>
                        {(user.role === 'ADMIN' || user.role === 'OWNER') && (
                          <button 
                            onClick={() => setIsCreateGroupModalOpen(true)}
                            className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                            title="إنشاء جروب جديد"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                      {expandedSections.groups && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                           {/* Global Team Channel (Always first in this section) */}
                           <button 
                            onClick={() => selectThread({ id: 'TEAM_GLOBAL', name: 'قروب الفريق (العام)' }, 'GROUP')}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === 'TEAM_GLOBAL' ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                              <ShieldAlert size={20} />
                            </div>
                            <div className="flex-1 text-right overflow-hidden">
                              <h4 className="text-xs font-black truncate">قروب الفريق (العام)</h4>
                              <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === 'TEAM_GLOBAL' ? 'text-white' : 'text-emerald-500'}`}>المركز الرئيسي للنقاش</p>
                            </div>
                          </button>

                          {/* Custom Team Groups */}
                          {teamGroups.map(tg => (
                            <button 
                              key={tg.id} 
                              onClick={() => selectThread(tg, 'TEAM_GROUP')}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === tg.id ? 'bg-brand-600 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                                <Users size={20} />
                              </div>
                              <div className="flex-1 text-right overflow-hidden">
                                <h4 className="text-xs font-black truncate">{tg.name}</h4>
                                <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === tg.id ? 'text-white' : 'text-slate-400'}`}>{tg.members?.length} أعضاء</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Team Members (1:1) */}
                  {user?.role !== 'CLIENT' && (
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                      <button 
                        onClick={() => toggleSection('team')}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group"
                      >
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-brand-500 transition-colors">أعضاء الفريق (Internal)</h3>
                        <div className={`text-slate-400 transition-transform duration-300 ${expandedSections.team ? 'rotate-180' : ''}`}>
                          <ChevronRight size={14} />
                        </div>
                      </button>
                      {expandedSections.team && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                          {teamMembers.filter(tm => tm.id !== user?.id).map(tm => (
                            <button 
                              key={tm.id} 
                              onClick={() => selectThread(tm, 'TEAM')}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === tm.id ? 'bg-slate-800 text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                                {tm.avatarUrl ? <img src={tm.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                              </div>
                              <div className="flex-1 text-right overflow-hidden">
                                <h4 className="text-xs font-black truncate">{tm.firstName} {tm.lastName}</h4>
                                <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === tm.id ? 'text-white' : 'text-slate-400'}`}>{tm.position || 'Team Member'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Client DMs */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <button 
                      onClick={() => toggleSection('clients')}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all group"
                    >
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-brand-500 transition-colors">شات العملاء (DMs)</h3>
                      <div className={`text-slate-400 transition-transform duration-300 ${expandedSections.clients ? 'rotate-180' : ''}`}>
                        <ChevronRight size={14} />
                      </div>
                    </button>
                    {expandedSections.clients && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {filteredClients.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => selectThread(c, 'DM')}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeThread?.id === c.user?.id ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
                              {c.logoUrl ? <img src={c.logoUrl} className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                            </div>
                            <div className="flex-1 text-right overflow-hidden">
                              <h4 className="text-xs font-black truncate">{c.user?.firstName} {c.user?.lastName}</h4>
                              <p className={`text-[9px] font-bold truncate opacity-60 ${activeThread?.id === c.user?.id ? 'text-white' : 'text-slate-400'}`}>{c.company || 'Private Conversation'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl shadow-slate-200/30 dark:shadow-none min-h-0">
            {!activeThread ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 p-10 text-center">
                <div className="w-24 h-24 bg-brand-500/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-brand-500/10">
                  <MessageSquare size={44} className="text-brand-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 italic">الخصوصية أولاً</h3>
                <p className="text-slate-500 max-w-sm font-bold text-sm leading-relaxed">نظام التواصل الآمن من Creziax. اختر محادثة للبدء، جميع الرسائل مشفرة وتحت رقابة صارمة لضمان الخصوصية.</p>
              </div>
            ) : (
              <>
                <div className="px-6 md:px-10 py-5 md:py-7 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" dir="rtl">
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
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeThread.type === 'DM' ? 'محادثة خاصة' : activeThread.type === 'TEAM_GROUP' ? 'مجموعة عمل داخلي' : 'جروب المشـروع'} • قناة تواصل محصنة</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5" dir="rtl"><Users size={12}/> {activeThread.memberCount} أشخاص</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {activeThread.type === 'GROUP' && (user.role === 'ADMIN' || user.role === 'OWNER') && (
                       <button 
                        onClick={() => setIsAddMemberModalOpen(true)}
                        className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95"
                       >
                         <UserPlus size={16} />
                         إضافة عضو فريق
                       </button>
                     )}
                     {(user.role === 'ADMIN' || user.role === 'OWNER') && (
                        <button 
                          onClick={handleClearChat}
                          className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500/20 active:scale-95 flex items-center justify-center border border-rose-500/20"
                          title="مسح جميع بيانات المحادثة نهائياً"
                        >
                          <Trash2 size={20} />
                        </button>
                     )}
                     {activeThread.driveUrl && (
                       <a 
                         href={activeThread.driveUrl} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95"
                       >
                         <Briefcase size={16} />
                         ملفات المشروع
                       </a>
                     )}
                     <button 
                    type="button"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="flex items-center gap-2.5 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 hover:scale-105 active:scale-95"
                  >
                    <Calendar size={16} />
                    Book a Meeting
                  </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 custom-scrollbar bg-slate-50/20 dark:bg-[#08080a]">
                  {loadingMessages ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-50"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
                  ) : messages.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                       <ShieldAlert size={44} className="mb-4 text-brand-500" />
                       <p className="font-black text-[10px] uppercase tracking-[0.2em] max-w-xs leading-loose italic">ابدأ المحادثة الآن. جميع البيانات محمية بفلتر الخصوصية التلقائي.</p>
                     </div>
                  ) : messages.map((m, i) => {
                      const isBookingCard = m.content?.startsWith('[MEETING_BOOKING]');
                      const isFileCard = m.content?.startsWith('[FILE]');
                      let bookingDetails = null;
                      let fileDetails = null;
                      
                      if (isBookingCard) {
                        const lines = m.content.split('\n');
                        bookingDetails = {
                          topic: lines[1]?.replace('Topic: ', ''),
                          dates: lines[2]?.replace('Availability: ', '')
                        };
                      } else if (isFileCard) {
                        const fileLines = m.content.split('\n');
                        const fileUrlItem = fileLines[0].replace('[FILE]', '');
                        const fileUrl = fileUrlItem;
                        const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                        const caption = fileLines.slice(1).join('\n');
                        fileDetails = { url: fileUrl, isImage, caption };
                      }

                      // Enhance avatar rendering using fresh store data
                      const msgAvatar = m.sender?.avatarUrl || 
                                        clients.find(c => c.user?.id === m.senderId)?.logoUrl || 
                                        teamMembers.find(t => t.id === m.senderId)?.avatarUrl;

                      return (
                        <div key={m.id || i} className={`flex ${m.senderId === user?.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                          <div className={`flex flex-col ${m.senderId === user?.id ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                             <div className={`flex items-center gap-3 mb-2 px-1 ${m.senderId === user?.id ? 'flex-row-reverse' : ''}`}>
                                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-300 dark:border-white/10 overflow-hidden shadow-sm">
                                   {msgAvatar ? <img src={msgAvatar} className="w-full h-full object-cover" /> : (m.sender?.firstName?.[0] || 'U')}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                  {m.sender?.firstName} {m.sender?.lastName} {m.senderId === user?.id && '(أنت)'}
                                </span>
                             </div>
                            <div className={`px-6 py-4 rounded-[1rem] md:rounded-[1.5rem] text-sm font-bold leading-relaxed shadow-xl ${m.senderId === user?.id ? 'bg-brand-600 text-white rounded-tr-none shadow-brand-600/10' : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-white/5'} ${isBookingCard ? 'border-2 border-brand-500/30 ring-4 ring-brand-500/10' : ''} ${isFileCard && fileDetails.isImage ? 'p-2' : ''}`}>
                              {isBookingCard ? (
                                <div className="space-y-4 min-w-[200px] text-right" dir="rtl">
                                   <div className="flex items-center gap-3 pb-3 border-b border-white/20">
                                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                         <Calendar size={16} />
                                      </div>
                                      <span className="text-[10px] uppercase font-black tracking-widest">طلب ميتنج جديد</span>
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[9px] opacity-70 uppercase font-black tracking-widest">موضوع النقاش</p>
                                      <p className="text-xs font-black">{bookingDetails?.topic}</p>
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[9px] opacity-70 uppercase font-black tracking-widest">المواعيد المقترحة</p>
                                      <p className="text-xs font-black bg-white/10 p-3 rounded-xl border border-white/5">{bookingDetails?.dates}</p>
                                   </div>
                                   <div className="flex items-center gap-2 pt-2 text-[8px] font-black opacity-60 uppercase tracking-widest">
                                      <Clock size={10} />
                                      انتظار التأكيد من الإدارة
                                   </div>
                                </div>
                              ) : isFileCard ? (
                                <div className="flex flex-col gap-3">
                                  {fileDetails.isImage ? (
                                    <a href={fileDetails.url} target="_blank" rel="noopener noreferrer">
                                      <img src={fileDetails.url} className="max-w-full sm:max-w-[300px] h-auto rounded-xl border border-white/10" />
                                    </a>
                                  ) : (
                                    <a href={fileDetails.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 p-3 rounded-xl border border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all font-black text-xs min-w-[200px]" dir="rtl">
                                      <div className="flex flex-col items-start gap-1">
                                         <span className="text-[10px] uppercase tracking-widest opacity-80">مرفق</span>
                                         <span className="truncate max-w-[150px] opacity-100 underline underline-offset-4" style={{direction: 'ltr'}}>{fileDetails.url.split('/').pop()}</span>
                                      </div>
                                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Paperclip size={18} />
                                      </div>
                                    </a>
                                  )}
                                  {fileDetails.caption && <p className="text-sm font-bold border-t border-black/5 dark:border-white/10 pt-2 break-all">{fileDetails.caption}</p>}
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              )}
                            </div>
                            <span className="text-[8px] font-black text-slate-400 mt-2 px-2 uppercase tracking-[0.2em]">
                              {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  <div ref={scrollRef} />
                </div>

                <div className="p-4 md:p-8 bg-white dark:bg-[#0a0a0c] border-t border-slate-100 dark:border-white/5 relative">
                  {/* Upload Preview Widget */}
                  {selectedFile && (
                    <div className="absolute bottom-full mb-4 left-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="bg-slate-800 dark:bg-white/10 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl backdrop-blur-md border border-white/5 mx-4 md:mx-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Paperclip size={20} />
                          </div>
                          <div className="text-right">
                            <h4 className="text-sm font-black truncate max-w-[200px]" dir="ltr">{selectedFile.name}</h4>
                            <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">سيتم إرسال هذا المرفق</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setSelectedFile(null)} 
                          className="w-10 h-10 rounded-xl hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all bg-white/5"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="relative flex items-center gap-3">
                    <div className="flex-1 relative transition-all">
                      {showEmojiPicker && (
                        <div ref={emojiRef} className="absolute bottom-20 left-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-300">

                          <EmojiPicker 
                            onEmojiClick={(emojiData) => setContent(prev => prev + emojiData.emoji)}
                            theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
                          />
                        </div>
                      )}
                      
                      <input 
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        onClick={() => setShowEmojiPicker(false)}
                        placeholder={uploadingFile ? "جاري رفع المرفق..." : "اكتب رسالتك داخل بيئة العمل الآمنة..."} 
                        disabled={uploadingFile}
                        className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-[1.5rem] px-6 py-5 text-sm text-slate-800 dark:text-white font-black focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-bold placeholder:opacity-50 text-right disabled:opacity-50" 
                        dir="rtl"
                      />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 opacity-50">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <Paperclip 
                          size={20} 
                          onClick={() => fileInputRef.current?.click()}
                          className={`cursor-pointer transition-all active:scale-95 ${uploadingFile ? 'animate-pulse text-brand-500 opacity-100 rotate-12 scale-110' : 'hover:text-brand-500 hover:opacity-100'}`} 
                        />
                        <Smile 
                          size={20} 
                          onClick={() => setShowEmojiPicker(prev => !prev)}
                          className={`cursor-pointer transition-all active:scale-95 ${showEmojiPicker ? 'text-brand-500 opacity-100' : 'hover:text-brand-500 hover:opacity-100'}`} 
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={(!content.trim() && !selectedFile) || uploadingFile}
                      className="bg-brand-600 text-white w-[60px] h-[60px] rounded-full hover:bg-brand-500 flex items-center justify-center transition-all shadow-xl shadow-brand-600/30 disabled:opacity-50 active:scale-90 flex-shrink-0"
                    >
                      {uploadingFile ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <Send size={24} className="transform rotate-180 mr-1" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">إضافة عضو للمحادثة</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">منح صلاحية الوصول لقناة العميل الآمنة</p>
                </div>
              </div>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6" dir="rtl">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اختر عضو الفريق</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {teamMembers.map(tm => (
                    <button 
                      key={tm.id}
                      onClick={() => {
                        if (selectedTeamMembers.includes(tm.id)) {
                          setSelectedTeamMembers(prev => prev.filter(id => id !== tm.id));
                        } else {
                          setSelectedTeamMembers(prev => [...prev, tm.id]);
                        }
                      }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${selectedTeamMembers.includes(tm.id) ? 'bg-brand-500/5 border-brand-500/30' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 hover:border-brand-500/20'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedTeamMembers.includes(tm.id) ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 dark:border-white/10'}`}>
                        {selectedTeamMembers.includes(tm.id) && <Check size={12} strokeWidth={4} />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-xs font-black text-slate-400 overflow-hidden shadow-sm">
                        {tm.avatarUrl ? <img src={tm.avatarUrl} className="w-full h-full object-cover" /> : (tm.firstName?.[0] || 'T')}
                      </div>
                      <div className="flex-1 text-right">
                        <h4 className="text-[11px] font-black text-slate-700 dark:text-white uppercase tracking-widest">{tm.firstName} {tm.lastName}</h4>
                        <p className="text-[9px] font-bold text-slate-400">{tm.position || 'فريق العمل'}</p>
                      </div>
                    </button>
                  ))}
                  {teamMembers.length === 0 && <p className="text-center py-10 text-xs font-bold text-slate-400 italic">لا يوجد أعضاء متاحين حالياً</p>}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  disabled={selectedTeamMembers.length === 0 || grantingAccess}
                  onClick={grantAccess}
                  className="flex-1 h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                >
                  {grantingAccess ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                  منح صلاحية الوصول
                </button>
                <button 
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 h-14 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">جدولة موعد جديد</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تحديد الاجتماعات ضمن بيئة العمل</p>
                </div>
              </div>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6" dir="rtl">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">موضوع الاجتماع / الاستفسار</label>
                  <input 
                    type="text"
                    value={bookingData.topic}
                    onChange={e => setBookingData({...bookingData, topic: e.target.value})}
                    placeholder="مثال: مراجعة تصاميم السوشيال ميديا"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المواعيد المناسبة (التاريخ والوقت)</label>
                  <textarea 
                    value={bookingData.dates}
                    onChange={e => setBookingData({...bookingData, dates: e.target.value})}
                    placeholder="مثال: الخميس الساعة 4 عصراً أو الجمعة 10 صباحاً"
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  disabled={!bookingData.topic || !bookingData.dates || sendingBooking}
                  onClick={handleBooking}
                  className="flex-1 h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3"
                >
                  {sendingBooking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  إرسال طلب الموعد
                </button>
                <button 
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 h-14 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0c] rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">إنشاء جروب فريق جديد</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مساحة عمل خاصة لأعضاء الفريق</p>
                </div>
              </div>
              <button onClick={() => setIsCreateGroupModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6" dir="rtl">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الجروب</label>
                  <input 
                    type="text"
                    value={newGroupData.name}
                    onChange={e => setNewGroupData({...newGroupData, name: e.target.value})}
                    placeholder="مثال: فريق المونتاج، إدارة المشاريع..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-brand-500/20 transition-all font-black"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اختر الأعضاء</label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {teamMembers.filter(tm => tm.id !== user.id).map(tm => (
                      <button 
                        key={tm.id}
                        type="button"
                        onClick={() => {
                          const exists = newGroupData.memberIds.includes(tm.id);
                          if (exists) {
                            setNewGroupData({...newGroupData, memberIds: newGroupData.memberIds.filter(id => id !== tm.id)});
                          } else {
                            setNewGroupData({...newGroupData, memberIds: [...newGroupData.memberIds, tm.id]});
                          }
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${newGroupData.memberIds.includes(tm.id) ? 'bg-brand-500/5 border-brand-500/30' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5'}`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${newGroupData.memberIds.includes(tm.id) ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 dark:border-white/10'}`}>
                          {newGroupData.memberIds.includes(tm.id) && <Check size={12} strokeWidth={4} />}
                        </div>
                        <div className="flex-1 text-right">
                          <h4 className="text-xs font-black text-slate-700 dark:text-white">{tm.firstName} {tm.lastName}</h4>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  disabled={!newGroupData.name || newGroupData.memberIds.length === 0 || creatingGroup}
                  onClick={handleCreateGroup}
                  className="flex-1 h-14 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-brand-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {creatingGroup ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
                  إنشاء الجروب
                </button>
                <button 
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="flex-1 h-14 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
