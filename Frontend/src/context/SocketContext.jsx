/**
 * Socket.io Context — manages WebSocket lifecycle + auth
 */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
    const { token, user } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token || !user) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [token, user]);

    const joinCase = useCallback((caseId) => {
        socketRef.current?.emit('join_case', caseId);
    }, []);

    const leaveCase = useCallback((caseId) => {
        socketRef.current?.emit('leave_case', caseId);
    }, []);

    const sendMessage = useCallback((caseId, content, type = 'TEXT') => {
        socketRef.current?.emit('send_message', { caseId, content, type });
    }, []);

    const sendTyping = useCallback((caseId) => {
        socketRef.current?.emit('typing', { caseId });
    }, []);

    const markRead = useCallback((caseId) => {
        socketRef.current?.emit('mark_read', { caseId });
    }, []);

    const value = {
        socket: socketRef.current,
        connected,
        joinCase,
        leaveCase,
        sendMessage,
        sendTyping,
        markRead,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
}

export default SocketContext;
