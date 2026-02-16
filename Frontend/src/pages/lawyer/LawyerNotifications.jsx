/**
 * Lawyer Notifications Page
 * Premium design with stat cards and improved notification list
 */

import { useState, useEffect } from 'react';
import { Bell, Check, Mail, MailOpen, CheckCheck } from 'lucide-react';
import { PageHeader, NotificationCard, EmptyState } from '../../components/dashboard';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LawyerNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function fetchNotifications() {
            try {
                if (!user?.id) return;
                // 'lawyer' role ensures backend filters correctly if needed, 
                // though usually user ID is enough for the notification model
                const { data } = await notificationAPI.getAll(user.id, 'lawyer');
                setNotifications(data);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchNotifications();
    }, [user]);

    const handleMarkRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Error marking notification:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await Promise.all(notifications.filter(n => !n.read).map(n => notificationAPI.markAsRead(n.id)));
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all notifications:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const readCount = notifications.filter(n => n.read).length;

    const filteredNotifications = filter === 'all' ? notifications :
        filter === 'unread' ? notifications.filter(n => !n.read) :
            notifications.filter(n => n.read);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-500 mt-1">Updates on your appointments and practice</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200">
                        <CheckCheck className="w-4 h-4" /> Mark all as read
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{notifications.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Unread</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{unreadCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500">
                            <Mail className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Read</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{readCount}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500">
                            <MailOpen className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { id: 'all', label: 'All', count: notifications.length },
                    { id: 'unread', label: 'Unread', count: unreadCount },
                    { id: 'read', label: 'Read', count: readCount }
                ].map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${filter === f.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                        {f.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === f.id ? 'bg-white/20' : 'bg-gray-100'}`}>{f.count}</span>
                    </button>
                ))}
            </div>

            {/* Notifications */}
            {filteredNotifications.length > 0 ? (
                <div className="space-y-3 max-w-2xl">
                    {filteredNotifications.map(notification => (
                        <NotificationCard key={notification.id} notification={notification} onMarkRead={handleMarkRead} />
                    ))}
                </div>
            ) : (
                <EmptyState icon={Bell} title="No notifications" description="You have no notifications at the moment." />
            )}
        </div>
    );
}
