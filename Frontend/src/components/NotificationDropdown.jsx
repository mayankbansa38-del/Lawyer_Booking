import { useRef, useEffect } from "react";
import { Bell, Check, Clock, X } from "lucide-react";

/**
 * Premium Notification Dropdown
 * Theme: Deep Navy (#0c1f3f) & Gold (#cfa052)
 */
export default function NotificationDropdown({
    isOpen,
    onClose,
    notifications = [],
    onMarkAllRead,
    onNotificationClick,
    onViewAll
}) {
    const dropdownRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={dropdownRef} className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 origin-top-right">
            {/* Header - Glassmorphic Navy */}
            <div className="bg-[#0c1f3f] relative overflow-hidden p-5 flex items-center justify-between">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#cfa052] opacity-10 blur-[50px] rounded-full translate-x-10 -translate-y-10"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                        <Bell className="w-5 h-5 text-[#cfa052]" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg tracking-tight">Notifications</h3>
                        <p className="text-blue-200/60 text-xs font-medium uppercase tracking-wider">Updates & Alerts</p>
                    </div>
                </div>

                {/* Mark all read action */}
                <button
                    onClick={onMarkAllRead}
                    className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white group"
                    title="Mark all as read"
                >
                    <Check className="w-4 h-4" />
                </button>
            </div>

            {/* Content Area */}
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => onNotificationClick && onNotificationClick(notif)}
                                className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer group flex gap-4 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                            >
                                {/* Icon/Avatar */}
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notif.read ? 'bg-[#0c1f3f] text-[#cfa052]' : 'bg-gray-100 text-gray-400'}`}>
                                    <Bell className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notif.read ? 'text-gray-900 font-semibold' : 'text-gray-600'} leading-snug line-clamp-2`}>
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-400 font-medium">{notif.timeAgo || 'Just now'}</span>
                                    </div>
                                </div>

                                {!notif.read && (
                                    <div className="shrink-0 self-center">
                                        <div className="w-2 h-2 rounded-full bg-[#cfa052] shadow-sm shadow-[#cfa052]/50"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 px-6 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-semibold">No new notifications</h4>
                        <p className="text-gray-500 text-sm mt-1 max-w-[200px]">You're all caught up! Check back later for updates.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                <button
                    onClick={onViewAll}
                    className="text-xs font-semibold text-[#0c1f3f] hover:text-[#cfa052] transition-colors uppercase tracking-wide"
                >
                    View All History
                </button>
            </div>
        </div>
    );
}
