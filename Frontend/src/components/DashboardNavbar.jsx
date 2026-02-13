import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, X, Bell, ChevronDown, LogOut,
    Settings, Shield, Briefcase, User as UserIcon
} from 'lucide-react';
import NyayBookerLogo from './NyayBookerLogo';
import ProfileDropdown from './ProfileDropdown';
import LogoHover from './LogoHover';
import NotificationDropdown from './NotificationDropdown';

/**
 * Reusable Dashboard Navbar Component
 * Uses composition pattern - accepts navigation config as props
 * @param {Object} props
 * @param {Array} props.navItems - Navigation items [{path, icon, label}]
 * @param {string} props.role - User role ('admin', 'lawyer', 'user')
 * @param {Object} props.user - User object
 * @param {number} props.unreadCount - Unread notification count
 * @param {Function} props.onLogout - Logout handler
 * @param {Function} props.onNotificationClick - Notification click handler
 */
export default function DashboardNavbar({
    navItems = [],
    role = 'user',
    user,
    unreadCount = 0,
    onLogout,
    onNotificationClick
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const notificationRef = useRef(null);

    // Role configuration
    const roleConfig = {
        admin: {
            color: 'from-indigo-600 to-purple-600',
            textColor: 'text-indigo-600',
            bgColor: 'bg-gradient-to-r from-indigo-600 to-purple-600',
            icon: Shield,
            text: 'Admin',
            theme: 'dark'
        },
        lawyer: {
            color: 'from-blue-600 to-cyan-600',
            textColor: 'text-blue-600',
            bgColor: 'bg-gradient-to-r from-blue-600 to-cyan-600',
            icon: Briefcase,
            text: 'Lawyer',
            theme: 'light'
        },
        user: {
            color: 'from-green-600 to-emerald-600',
            textColor: 'text-green-600',
            bgColor: 'bg-gradient-to-r from-green-600 to-emerald-600',
            icon: UserIcon,
            text: 'User',
            theme: 'light'
        }
    };

    const config = roleConfig[role] || roleConfig.user;
    const RoleIcon = config.icon;

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path) => location.pathname === path;

    const getUserInitials = () => {
        if (!user) return '?';
        return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
    };

    const handleNotificationClick = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (onNotificationClick && !isNotificationOpen) {
            onNotificationClick();
        }
    };

    return (
        <nav className={`sticky top-0 z-50 ${config.theme === 'dark' ? 'bg-[#0c1f3f]' : 'bg-white'} border-b ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    {/* Logo */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <LogoHover theme={config.theme} />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active
                                        ? config.theme === 'dark'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : `${config.bgColor} text-white shadow-md`
                                        : config.theme === 'dark'
                                            ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Notification Bell */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={handleNotificationClick}
                                className={`relative p-2.5 rounded-xl transition-all duration-200 ${config.theme === 'dark'
                                    ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                    }`}
                                aria-label="View notifications"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            <NotificationDropdown
                                isOpen={isNotificationOpen}
                                onClose={() => setIsNotificationOpen(false)}
                                notifications={[]} // TODO: Fetch real notifications
                                onMarkAllRead={() => console.log('Mark all read')}
                                onNotificationClick={() => navigate('/user/notifications')}
                            />
                        </div>

                        {/* Profile Dropdown */}
                        <ProfileDropdown
                            user={user}
                            role={role}
                            onLogout={onLogout}
                            theme={config.theme}
                        />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${config.theme === 'dark'
                            ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-[600px] pb-4" : "max-h-0"
                } ${config.theme === 'dark' ? 'bg-[#0c1f3f]' : 'bg-white'}`}>
                {/* Mobile Profile Card */}
                {user && (
                    <div className={`mx-4 mt-2 mb-3 p-4 rounded-2xl ${config.bgColor}`}>
                        <div className="flex items-center gap-3">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.firstName} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
                                    {getUserInitials()}
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-white">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-white/80 flex items-center gap-1">
                                    <RoleIcon className="w-3 h-3" />
                                    {config.text}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Nav Links */}
                <div className="px-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${active
                                    ? config.theme === 'dark'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : `${config.bgColor} text-white`
                                    : config.theme === 'dark'
                                        ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile Actions */}
                <div className="px-4 mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <Link
                        to={role === 'admin' ? '/admin/settings' : role === 'lawyer' ? '/lawyer/profile' : '/user/settings'}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${config.theme === 'dark'
                            ? 'text-gray-300 hover:bg-white/5 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                    <button
                        onClick={() => {
                            setIsMenuOpen(false);
                            if (onLogout) onLogout();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>
    );
}
