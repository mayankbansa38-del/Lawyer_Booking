/**
 * User Notifications Page
 */

import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { PageHeader, NotificationCard, EmptyState } from '../../components/dashboard';
import { notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const { data } = await notificationAPI.getAll(user?.id || 'u1', 'client');
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

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div>
            <PageHeader
                title="Notifications"
                subtitle={`${unreadCount} unread`}
                actions={unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Check className="w-4 h-4" /> Mark all read
                    </button>
                )}
            />

            {notifications.length > 0 ? (
                <div className="space-y-3 max-w-2xl">
                    {notifications.map(notification => (
                        <NotificationCard key={notification.id} notification={notification} onMarkRead={handleMarkRead} />
                    ))}
                </div>
            ) : (
                <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
            )}
        </div>
    );
}
