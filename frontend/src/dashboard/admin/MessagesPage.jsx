import { useEffect, useState, useRef } from 'react';
import { getMessagesAPI, sendMessageAPI, getThreadsAPI } from '../../store/api';
import useAuthStore from '../../store/authStore';
import { Send, User } from 'lucide-react';
import { io } from 'socket.io-client';

const MessagesPage = () => {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const socketRef = useRef();
  const scrollRef = useRef();

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const { data } = await getThreadsAPI();
        setThreads(data);
        if (data.length > 0 && !activeThread) setActiveThread(data[0].threadId);
      } catch {}
    };
    if (user?.role === 'ADMIN') fetchThreads();
    else setActiveThread(user?.id); // For clients, threadId is their userId
  }, [user]);

  useEffect(() => {
    if (!activeThread) return;
    const fetchMessages = async () => {
      try {
        const { data } = await getMessagesAPI(activeThread);
        setMessages(data);
      } catch {}
    };
    fetchMessages();

    // Socket setup
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
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
    } catch {}
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Thread List (Admin only) */}
      {user?.role === 'ADMIN' && (
        <div className="w-64 bg-gray-900 border border-gray-800 rounded-2xl p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">Conversations</h2>
          <div className="space-y-2">
            {threads.map(t => (
              <button key={t.threadId} onClick={() => setActiveThread(t.threadId)} className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${activeThread === t.threadId ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
                Thread: {t.threadId.substring(0, 8)}...
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Box */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-800/30">
          <h2 className="font-semibold text-white">Chat - {activeThread?.substring(0, 8)}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={m.id || i} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${m.senderId === user.id ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-300 rounded-tl-none border border-gray-700'}`}>
                <p>{m.content}</p>
                <p className="text-[10px] opacity-50 mt-1">{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-gray-800/30 border-t border-gray-800 flex gap-2">
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/50 outline-none" />
          <button type="submit" className="bg-violet-600 text-white p-2 rounded-xl hover:bg-violet-500 transition-all"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
};

export default MessagesPage;
