/**
 * ChatPage — Real-time messaging with Socket.io + REST fallback
 * Shared between /lawyer/chat and /user/chat routes
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ChatPage.css';

/* ──────────────────── helpers ──────────────────── */
function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(ts) {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ──────────────────── ChatSidebar ──────────────────── */
function ChatSidebar({ conversations, activeId, onSelect, loading }) {
    const [search, setSearch] = useState('');
    const filtered = conversations.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.otherParty?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <aside className="chat-sidebar">
            <div className="chat-sidebar__header">
                <h2>Messages</h2>
                <span className="chat-sidebar__badge">{conversations.length}</span>
            </div>
            <div className="chat-sidebar__search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <input type="text" placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="chat-sidebar__list">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="chat-sidebar__item chat-sidebar__item--skeleton">
                            <div className="skeleton-avatar" />
                            <div className="skeleton-lines"><div /><div /></div>
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="chat-sidebar__empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        <p>No conversations yet</p>
                    </div>
                ) : filtered.map(c => (
                    <button key={c.caseId} className={`chat-sidebar__item ${activeId === c.caseId ? 'chat-sidebar__item--active' : ''}`} onClick={() => onSelect(c.caseId)}>
                        <div className="chat-sidebar__avatar">{(c.otherParty || 'U')[0].toUpperCase()}</div>
                        <div className="chat-sidebar__info">
                            <div className="chat-sidebar__name">{c.otherParty || 'Unknown'}</div>
                            <div className="chat-sidebar__preview">{c.lastMessage || 'No messages'}</div>
                        </div>
                        <div className="chat-sidebar__meta">
                            <span className="chat-sidebar__time">{c.lastMessageAt ? formatDate(c.lastMessageAt) : ''}</span>
                            {c.unreadCount > 0 && <span className="chat-sidebar__unread">{c.unreadCount}</span>}
                        </div>
                    </button>
                ))}
            </div>
        </aside>
    );
}

/* ──────────────────── ChatWindow ──────────────────── */
function ChatWindow({ caseId, messages, onSend, typingUser, loading }) {
    const { user } = useAuth();
    const endRef = useRef(null);
    const [input, setInput] = useState('');

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSend(input.trim());
        setInput('');
    };

    if (!caseId) {
        return (
            <div className="chat-window chat-window--empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <h3>Select a conversation</h3>
                <p>Choose from the sidebar to start messaging</p>
            </div>
        );
    }

    // Group messages by date
    const grouped = [];
    let lastDate = '';
    messages.forEach(m => {
        const d = formatDate(m.createdAt);
        if (d !== lastDate) {
            grouped.push({ type: 'date', label: d });
            lastDate = d;
        }
        grouped.push({ type: 'msg', ...m });
    });

    return (
        <div className="chat-window">
            <div className="chat-window__messages">
                {loading && (
                    <div className="chat-window__loading">
                        <div className="spinner" />
                        <span>Loading messages...</span>
                    </div>
                )}
                {grouped.map((item, i) => {
                    if (item.type === 'date') {
                        return <div key={`d-${i}`} className="chat-date-divider"><span>{item.label}</span></div>;
                    }
                    const isOwn = item.senderId === user?.id;
                    return (
                        <div key={item.id || i} className={`chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}`}>
                            <div className="chat-bubble__content">{item.content}</div>
                            <div className="chat-bubble__meta">
                                <span>{formatTime(item.createdAt)}</span>
                                {isOwn && item.read && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2"><path d="M20 6 9 17l-5-5" /><path d="M17 6 6 17" /></svg>}
                            </div>
                        </div>
                    );
                })}
                {typingUser && (
                    <div className="chat-bubble chat-bubble--other chat-bubble--typing">
                        <div className="typing-dots"><span /><span /><span /></div>
                    </div>
                )}
                <div ref={endRef} />
            </div>
            <form className="chat-window__input" onSubmit={handleSubmit}>
                <input type="text" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} autoFocus />
                <button type="submit" disabled={!input.trim()} aria-label="Send message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9z" /></svg>
                </button>
            </form>
        </div>
    );
}

/* ──────────────────── ChatPage ──────────────────── */
export default function ChatPage() {
    const { socket, connected, joinCase, leaveCase, sendMessage: socketSend, sendTyping, markRead } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [activeCaseId, setActiveCaseId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const typingTimeout = useRef(null);

    // Load conversations
    useEffect(() => {
        (async () => {
            try {
                const res = await chatAPI.getConversations();
                setConversations(res.data || []);
            } catch (err) {
                console.error('Failed to load conversations:', err);
            } finally {
                setLoadingConvos(false);
            }
        })();
    }, []);

    // Join/leave room when active case changes
    useEffect(() => {
        if (!activeCaseId) return;

        joinCase(activeCaseId);
        markRead(activeCaseId);

        return () => leaveCase(activeCaseId);
    }, [activeCaseId, joinCase, leaveCase, markRead]);

    // Load messages when switching case
    useEffect(() => {
        if (!activeCaseId) return;

        (async () => {
            setLoadingMsgs(true);
            try {
                const res = await chatAPI.getMessages(activeCaseId);
                setMessages(res.data || []);
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoadingMsgs(false);
            }
        })();
    }, [activeCaseId]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const onMessage = (msg) => {
            if (msg.caseId === activeCaseId) {
                setMessages(prev => [...prev, msg]);
            }
            // Update conversation preview
            setConversations(prev => prev.map(c =>
                c.caseId === msg.caseId ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt } : c
            ));
        };

        const onTyping = ({ userId }) => {
            setTypingUser(userId);
            clearTimeout(typingTimeout.current);
            typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
        };

        const onRead = ({ caseId }) => {
            if (caseId === activeCaseId) {
                setMessages(prev => prev.map(m => ({ ...m, read: true })));
            }
        };

        socket.on('message_received', onMessage);
        socket.on('user_typing', onTyping);
        socket.on('messages_read', onRead);

        return () => {
            socket.off('message_received', onMessage);
            socket.off('user_typing', onTyping);
            socket.off('messages_read', onRead);
        };
    }, [socket, activeCaseId]);

    const handleSend = useCallback((content) => {
        if (connected) {
            socketSend(activeCaseId, content);
        } else {
            // REST fallback
            chatAPI.sendMessage(activeCaseId, { content }).catch(console.error);
        }
    }, [connected, activeCaseId, socketSend]);

    const handleSelectConvo = useCallback((caseId) => {
        setActiveCaseId(caseId);
        setTypingUser(null);
    }, []);

    return (
        <div className="chat-page">
            <ChatSidebar
                conversations={conversations}
                activeId={activeCaseId}
                onSelect={handleSelectConvo}
                loading={loadingConvos}
            />
            <ChatWindow
                caseId={activeCaseId}
                messages={messages}
                onSend={handleSend}
                typingUser={typingUser}
                loading={loadingMsgs}
            />
            {!connected && (
                <div className="chat-connection-bar">
                    <span className="chat-connection-dot" />
                    Reconnecting...
                </div>
            )}
        </div>
    );
}
