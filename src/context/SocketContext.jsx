import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children, user, token }) => {
  const [socket, setSocket] = React.useState(null);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    if (!socket) {
      console.log("%c 🌐 Socket Context: Initializing Singleton... ", "background: #1e1b4b; color: #818cf8; font-weight: bold;");
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'https://api.creziax.cloud', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log("%c 🌐 Global Pulse Connected: ", "color: #22c55e; font-weight: bold;", newSocket.id);
        
        newSocket.emit('join_rooms', { 
            userId: user.id || user._id, 
            role: user.role,
            projectIds: [] 
        });
      });

      newSocket.on('connect_error', (err) => {
        console.error("🌐 Socket Connection Error:", err.message);
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        console.log("🌐 Socket Context: Cleaning up...");
        socket.disconnect();
      }
    };
  }, [token, user?.id, user?._id, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
