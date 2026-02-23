import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';

/**
 * Robust Native Hook for Notifications
 * Integrates AbortController for race-condition prevention and uses Backend Meta O(1) unread counting.
 */
export const useNotifications = (params = { page: 1, limit: 10, unreadOnly: false }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async (abortSignal) => {
        try {
            setLoading(true);
            const response = await notificationAPI.getAll(params, abortSignal ? { signal: abortSignal } : {});
            const data = response.data || [];

            setNotifications(data);

            // Rely on backend meta for exact count (O(1) on frontend), fallback to local compute
            setUnreadCount(response.meta?.unreadCount ?? data.filter(n => !n.isRead).length);
        } catch (error) {
            // Prevent throwing errors if the component simply unmounted (Axios throws CanceledError)
            if (error?.name !== 'AbortError' && error?.name !== 'CanceledError') {
                console.error('Notification fetch failed:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [params.page, params.limit, params.unreadOnly]);

    useEffect(() => {
        const controller = new AbortController();
        fetchNotifications(controller.signal);

        // Strict cleanup: cancels in-flight requests if user navigates away
        return () => controller.abort();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await notificationAPI.markAsRead(id);
        } catch {
            // Revert on failure
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await notificationAPI.markAllAsRead();
        } catch {
            // Revert on failure
            fetchNotifications();
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications };
};
