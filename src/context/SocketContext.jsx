import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, user, token }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (!socketRef.current) {
      console.log("%c 🌐 Socket Context: Initializing Singleton... ", "background: #1e1b4b; color: #818cf8; font-weight: bold;");
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        auth: { token }
      });

      socketRef.current.on('connect', () => {
        console.log("%c 🌐 Global Pulse Connected: ", "color: #22c55e; font-weight: bold;", socketRef.current.id);
        
        // GLOBAL JOIN ROOMS (Deduplicated)
        socketRef.current.emit('join_rooms', { 
            userId: user.id, 
            role: user.role,
            projectIds: [] // Base rooms, others joined dynamically if needed
        });
      });

      socketRef.current.on('connect_error', (err) => {
        console.error("🌐 Socket Connection Error:", err.message);
      });
    }

    return () => {
      // We keep the socket alive during the session, it only disconnects on logout (handled by token/user check)
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
