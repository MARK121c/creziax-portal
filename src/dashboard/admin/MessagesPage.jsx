import { useEffect, useState, useRef } from 'react';
import { getTicketsAPI, getTicketAPI, createTicketAPI, updateTicketAPI, sendMessageAPI } from '../../store/api';
import useAuthStore from '../../store/authStore';
import { 
  Send, MessageSquare, Search, MoreHorizontal, Smile, Paperclip, 
  Loader2, UserCircle, Plus, Filter, Clock, CheckCircle2, AlertCircle,
  Tag, ChevronRight
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  
  const [newTicketForm, setNewTicketForm] = useState({ title: '', description: '', priority: 'MEDIUM' });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  
  const socketRef = useRef();
  const scrollRef = useRef();

  // Fetch Tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data } = await getTicketsAPI();
      setTickets(data);
      if (data.length > 0 && !activeTicket) {
        // Automatically select first ticket if none active
        fetchTicketDetails(data[0].id);
      }
    } catch (err) {
      toast.error("فشل تحميل التذاكر");
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTicketDetails = async (id) => {
    setLoadingMessages(true);
    try {
      const { data } = await getTicketAPI(id);
      setActiveTicket(data);
      setMessages(data.messages || []);
      
      // Join socket thread
      if (socketRef.current) {
        socketRef.current.emit('join_thread', id);
      }
    } catch (err) {
      toast.error("فشل تحميل تفاصيل التذكرة");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', {
      transports: ['websocket'],
    });

    socketRef.current.on('receive_message', (msg) => {
      // If it belongs to our active ticket, add it
      setMessages(prev => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeTicket) return;
    
    try {
      const { data } = await sendMessageAPI({ 
        content, 
        threadId: activeTicket.id,
        ticketId: activeTicket.id,
        receiverId: user.role === 'CLIENT' ? activeTicket.assignedStaffId : activeTicket.client?.userId
      });
      socketRef.current.emit('send_message', { ...data, threadId: activeTicket.id });
      setContent('');
    } catch (err) {
      toast.error("فشل إرسال الرسالة");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setSubmittingTicket(true);
    try {
      const { data } = await createTicketAPI(newTicketForm);
      toast.success("تم فتح التذكرة بنجاح");
      setShowNewTicketModal(false);
      setNewTicketForm({ title: '', description: '', priority: 'MEDIUM' });
      fetchTickets();
      fetchTicketDetails(data.id);
    } catch (err) {
      toast.error("فشل فتح التذكرة");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const updateTicketStatus = async (status) => {
    if (!activeTicket) return;
    try {
      await updateTicketAPI(activeTicket.id, { status });
      toast.success("تم تحديث حالة التذكرة");
      fetchTicketDetails(activeTicket.id);
      fetchTickets();
    } catch (err) {
      toast.error("فشل التحديث");
    }
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'HIGH': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 md:gap-8 animate-in fade-in duration-700">
      
      {/* Sidebar: Tickets List */}
      <div className="w-full lg:w-96 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none max-h-[45vh] lg:max-h-none">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">قناة التواصل</h2>
            {user.role === 'CLIENT' && (
              <button 
                onClick={() => setShowNewTicketModal(true)}
                className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-95"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="البحث في التذاكر..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 custom-scrollbar">
          {loadingTickets ? (
            <div className="py-20 text-center"><Loader2 size={32} className="animate-spin text-brand-500 mx-auto" /></div>
          ) : tickets.length === 0 ? (
            <div className="py-20 text-center px-6">
               <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/5">
                 <AlertCircle size={24} className="text-slate-300" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">لا يوجد تذاكر نشطة</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <button 
                key={ticket.id} 
                onClick={() => fetchTicketDetails(ticket.id)}
                className={`w-full text-left p-4 rounded-[1.8rem] transition-all duration-300 flex flex-col gap-3 group relative border ${activeTicket?.id === ticket.id ? 'bg-brand-600 border-brand-500 shadow-xl shadow-brand-600/20' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${activeTicket?.id === ticket.id ? 'bg-white/20 text-white border-white/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'}`}>
                    #{ticket.ticketNumber}
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${activeTicket?.id === ticket.id ? 'bg-white/20 text-white border-white/20' : getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className={`text-sm font-black truncate ${activeTicket?.id === ticket.id ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                    {ticket.title}
                  </h3>
                  <p className={`text-[10px] font-bold mt-1.5 truncate ${activeTicket?.id === ticket.id ? 'text-white/60' : 'text-slate-400'}`}>
                    {ticket.client?.user?.firstName} {ticket.client?.user?.lastName}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter ${activeTicket?.id === ticket.id ? 'text-white/80' : 'text-slate-400'}`}>
                    {ticket.status === 'OPEN' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                    {ticket.status}
                  </div>
                  {ticket._count.messages > 0 && (
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTicket?.id === ticket.id ? 'bg-white text-brand-600' : 'bg-brand-500/10 text-brand-500'}`}>
                      {ticket._count.messages}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl shadow-slate-200/30 dark:shadow-none min-h-0">
        {!activeTicket ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 p-10 text-center">
            <div className="w-24 h-24 bg-brand-500/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-brand-500/10">
              <MessageSquare size={44} className="text-brand-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">مرحباً بك في مركز الدعم</h3>
            <p className="text-slate-500 max-w-sm font-medium">اختر تذكرة من القائمة الجانبية لبدء المحادثة، أو افتح تذكرة جديدة إذا كنت بحاجة للمساعدة.</p>
          </div>
        ) : (
          <>
            <div className="px-6 md:px-10 py-5 md:py-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20 flex-shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">
                      {activeTicket.title}
                    </h2>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(activeTicket.priority)}`}>
                      {activeTicket.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${activeTicket.status === 'OPEN' ? 'bg-emerald-500 border-2 border-emerald-500/20 animate-pulse' : 'bg-slate-400'}`}></span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{activeTicket.status} • #{activeTicket.ticketNumber}</span>
                  </div>
                </div>
              </div>
              
              {(user.role === 'ADMIN' || user.role === 'OWNER') && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                  <button 
                    onClick={() => updateTicketStatus('OPEN')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${activeTicket.status === 'OPEN' ? 'bg-white dark:bg-white/10 text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                  >
                    Open
                  </button>
                  <button 
                    onClick={() => updateTicketStatus('CLOSED')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${activeTicket.status === 'CLOSED' ? 'bg-white dark:bg-white/10 text-slate-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    Closed
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 custom-scrollbar bg-slate-50/20 dark:bg-transparent">
              {loadingMessages ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-50"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
              ) : messages.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                   <AlertCircle size={44} className="mb-4" />
                   <p className="font-black text-[10px] uppercase tracking-[0.2em]">لا توجد رسائل بعد</p>
                 </div>
              ) : (
                messages.map((m, i) => (
                  <div key={m.id || i} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                    <div className={`flex flex-col ${m.senderId === user.id ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                       <div className={`flex items-center gap-2 mb-2 px-1 ${m.senderId === user.id ? 'flex-row-reverse' : ''}`}>
                          <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-white/5 flex items-center justify-center text-[8px] font-bold text-slate-500">
                             {m.sender?.avatarUrl ? <img src={m.sender.avatarUrl} className="w-full h-full object-cover rounded-lg" /> : m.sender?.firstName?.[0]}
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                            {m.sender?.firstName} {m.sender?.lastName} • {m.sender?.role}
                          </span>
                       </div>
                       <div className={`px-5 py-4 rounded-[2rem] text-sm font-bold leading-relaxed shadow-lg ${m.senderId === user.id ? 'bg-brand-600 text-white rounded-tr-none shadow-brand-600/20' : 'bg-white dark:bg-[#121215] text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-white/5'}`}>
                        <p>{m.content}</p>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400 mt-2 px-2 uppercase tracking-widest leading-none">
                        {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>

            <div className="p-4 md:p-8 bg-white dark:bg-[#0a0a0c] border-t border-slate-100 dark:border-white/5">
              <form onSubmit={handleSend} className="relative flex items-center gap-3">
                <div className="flex-1 relative group">
                  <input 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="اكتب رسالتك للموظف المسؤول..." 
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-30">
                    <Smile size={18} className="cursor-pointer" />
                    <Paperclip size={18} className="cursor-pointer" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={!content.trim() || activeTicket.status === 'CLOSED'}
                  className="bg-brand-600 text-white p-4 rounded-2xl hover:bg-brand-500 hover:-translate-y-1 active:scale-95 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:translate-y-0"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setShowNewTicketModal(false)}></div>
          <div className="bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">فتح تذكرة جديدة</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">اشرح مشكلتك وسيقوم فريقنا بالرد عليك في أقرب وقت.</p>
              </div>
              <button onClick={() => setShowNewTicketModal(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl"><ChevronRight size={18} /></button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">عنوان المشكلة</label>
                <input 
                  required
                  value={newTicketForm.title}
                  onChange={e => setNewTicketForm({...newTicketForm, title: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">الأهمية</label>
                <select 
                  value={newTicketForm.priority}
                  onChange={e => setNewTicketForm({...newTicketForm, priority: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl font-bold appearance-none cursor-pointer"
                >
                  <option value="LOW" className="dark:bg-slate-900">منخفضة</option>
                  <option value="MEDIUM" className="dark:bg-slate-900">متوسطة</option>
                  <option value="HIGH" className="dark:bg-slate-900">عالية جداً (Urgent)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">التفاصيل</label>
                <textarea 
                  required
                  rows={4}
                  value={newTicketForm.description}
                  onChange={e => setNewTicketForm({...newTicketForm, description: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl font-bold resize-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={submittingTicket}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98] flex items-center justify-center"
              >
                {submittingTicket ? <Loader2 className="animate-spin" size={20} /> : "إرسال التذكرة"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
