import { useEffect, useState, useRef } from 'react';
import { getMessagesAPI, sendMessageAPI, getThreadsAPI } from '../../store/api';
import useAuthStore from '../../store/authStore';
import { Send, User, MessageSquare, Search, MoreHorizontal, Smile, Paperclip, Loader2, UserCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const MessagesPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    const fetchThreads = async () => {
      setLoadingThreads(true);
      try {
        const { data } = await getThreadsAPI();
        setThreads(data);
        if (data.length > 0 && !activeThread) setActiveThread(data[0].threadId);
      } catch (err) {
        toast.error('Failed to sync conversations.');
      } finally {
        setLoadingThreads(false);
      }
    };
    if (user?.role === 'ADMIN') fetchThreads();
    else setActiveThread(user?.id);
  }, [user]);

  useEffect(() => {
    if (!activeThread) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await getMessagesAPI(activeThread);
        setMessages(data);
      } catch (err) {
        toast.error('Failed to load message history.');
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socketRef.current.emit('join_thread', activeThread);
    socketRef.current.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, [activeThread]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const { data } = await sendMessageAPI({ content, threadId: activeThread });
      socketRef.current.emit('send_message', data);
      setContent('');
    } catch (err) {
      toast.error('Transmission failed.');
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sidebar Channels (Admin only) */}
      {user?.role === 'ADMIN' && (
        <div className="w-80 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight mb-6">{t('message_center')}</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Find channel..." 
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {loadingThreads ? (
               <div className="py-20 text-center">
                 <Loader2 size={24} className="animate-spin text-brand-500 mx-auto" />
               </div>
            ) : threads.length === 0 ? (
               <div className="py-20 text-center px-6">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No active frequency detected.</p>
               </div>
            ) : (
              threads.map(t => (
                <button 
                  key={t.threadId} 
                  onClick={() => setActiveThread(t.threadId)} 
                  className={`w-full text-left px-5 py-4 rounded-[1.5rem] transition-all duration-300 flex items-center gap-4 group ${activeThread === t.threadId ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20 translate-x-1' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:translate-x-1'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${activeThread === t.threadId ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10 group-hover:bg-brand-500/10 group-hover:text-brand-500'}`}>
                    {t.threadId[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-tight truncate">Channel_{t.threadId.substring(0, 8)}</div>
                    <div className={`text-[10px] font-bold mt-0.5 truncate italic ${activeThread === t.threadId ? 'text-white/60' : 'text-slate-400'}`}>Ready for uplink...</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Communication Hub */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0c]/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl shadow-slate-200/30 dark:shadow-none">
        <div className="px-10 py-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-wider leading-none">
                {activeThread ? `Active Channel / ${activeThread.substring(0, 8)}` : t('initializing_uplink')}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic leading-none">Encrypted Frequency</span>
              </div>
            </div>
          </div>
          <button className="p-3 text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 rounded-2xl transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.03] dark:opacity-[0.05]">
          {loadingMessages ? (
             <div className="h-full flex flex-col items-center justify-center opacity-50">
               <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decoding Stream...</p>
             </div>
          ) : messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30">
               <UserCircle size={60} className="text-slate-200 dark:text-slate-700 mb-6" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Awaiting first transmission.</p>
             </div>
          ) : (
            messages.map((m, i) => (
              <div key={m.id || i} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                <div className={`group relative max-w-[80%] ${m.senderId === user.id ? 'items-end' : 'items-start'}`}>
                   <div className={`px-6 py-4 rounded-[2rem] text-sm font-bold leading-relaxed shadow-lg ${m.senderId === user.id ? 'bg-brand-600 text-white rounded-tr-none shadow-brand-600/20' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-white/5 shadow-slate-200/20'}`}>
                    <p className="italic">{m.content}</p>
                  </div>
                  <div className={`flex items-center gap-2 mt-3 px-2 ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-10 bg-white dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5">
          <form onSubmit={handleSend} className="relative flex items-center gap-4">
            <div className="flex-1 relative group">
              <input 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder={t('type_transmission')} 
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4.5 text-sm text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:italic placeholder:font-medium" 
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <button type="button" className="text-slate-300 hover:text-brand-500 transition-colors"><Smile size={20} /></button>
                <button type="button" className="text-slate-300 hover:text-brand-500 transition-colors"><Paperclip size={20} /></button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={!content.trim()}
              className="bg-brand-600 text-white p-4.5 rounded-2xl hover:bg-brand-500 hover:-translate-y-1 active:scale-95 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:translate-y-0"
            >
              <Send size={22} className="italic" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
