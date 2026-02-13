import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard, Settings, LogOut, ChevronDown,
    Shield, Scale, UserCircle, Bell
} from 'lucide-react';

/**
 * Reusable Profile Dropdown Component
 * Ensures consistency between Public Navbar and Dashboard Navbar
 */
export default function ProfileDropdown({
    user,
    role = 'user', // 'admin', 'lawyer', 'user'
    onLogout,
    theme = 'light' // 'light' or 'dark' (for trigger button styling)
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Role configuration mapping
    const roleConfigMap = {
        admin: {
            text: 'Administrator',
            primary: '#0c1f3f', // Navy
            accent: '#cfa052',  // Gold
            icon: Shield,
            bgGradient: 'bg-gradient-to-br from-[#0c1f3f] to-[#1a3b6e]'
        },
        lawyer: {
            text: 'Legal Professional',
            primary: '#1e40af', // Blue
            accent: '#60a5fa',  // Light Blue
            icon: Scale,
            bgGradient: 'bg-gradient-to-br from-blue-900 to-blue-700'
        },
        user: {
            text: 'Client',
            primary: '#059669', // Emerald
            accent: '#34d399',  // Light Emerald
            icon: UserCircle,
            bgGradient: 'bg-gradient-to-br from-emerald-900 to-emerald-700'
        }
    };

    const config = roleConfigMap[role] || roleConfigMap.user;
    const RoleIcon = config.icon;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getUserInitials = () => {
        if (!user) return 'U';
        const first = user.firstName?.[0] || '';
        const last = user.lastName?.[0] || '';
        return (first + last).toUpperCase() || 'U';
    };

    const handleLogout = () => {
        setIsOpen(false);
        if (onLogout) onLogout();
    };

    // Trigger Button Styles based on theme
    const triggerStyles = theme === 'dark'
        ? "border-transparent hover:bg-white/10 hover:border-white/20 text-white"
        : "border-transparent hover:bg-gray-50 hover:border-gray-200 text-gray-800";

    const nameStyles = theme === 'dark'
        ? "text-white group-hover:text-[#cfa052]"
        : "text-gray-800 group-hover:text-blue-700";

    const subTextStyles = theme === 'dark'
        ? "text-[#cfa052] opacity-90"
        : "text-gray-500";

    const iconStyles = theme === 'dark'
        ? "text-gray-400 group-hover:text-[#cfa052]"
        : "text-gray-400 group-hover:text-blue-500";

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 border group ${triggerStyles}`}
            >
                {/* Avatar with Status Ring */}
                <div className="relative">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.firstName}
                            className={`w-10 h-10 rounded-xl object-cover ring-2 transition-all duration-300 ${theme === 'dark' ? 'ring-white/10 group-hover:ring-[#cfa052]' : 'ring-gray-100 group-hover:ring-blue-100'}`}
                        />
                    ) : (
                        <div className={`w-10 h-10 rounded-xl ${config.bgGradient} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-all duration-300 ring-2 ${theme === 'dark' ? 'ring-white/10 group-hover:ring-[#cfa052]' : 'ring-white ring-offset-2'}`}>
                            {getUserInitials()}
                        </div>
                    )}
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                </div>

                {/* Name & Role */}
                <div className="hidden lg:flex flex-col items-start">
                    <span className={`text-sm font-bold leading-tight transition-colors duration-300 ${nameStyles}`}>
                        {user?.firstName} {user?.lastName?.charAt(0)}.
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold leading-tight transition-colors duration-300 ${subTextStyles}`}>
                        {config.text}
                    </span>
                </div>

                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ease-out ${iconStyles} ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Premium Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-xl shadow-blue-900/10 border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 origin-top-right">

                    {/* Premium Header */}
                    <div className={`${config.bgGradient} relative overflow-hidden p-6`}>
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 blur-[40px] rounded-full translate-x-10 -translate-y-10"></div>

                        <div className="relative z-10 flex items-center gap-4">
                            <div className="relative">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.firstName} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/10 shadow-lg" />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl ring-4 ring-white/10 shadow-lg">
                                        {getUserInitials()}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                                    <RoleIcon className={`w-3.5 h-3.5 ${role === 'admin' ? 'text-[#0c1f3f]' : 'text-blue-600'}`} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-lg truncate tracking-tight">
                                    {user?.firstName} {user?.lastName}
                                </h3>
                                <p className="text-white/70 text-sm truncate font-medium">{user?.email}</p>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-[10px] font-semibold text-white uppercase tracking-wide">Online</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
                        {[
                            { label: 'Bookings', value: '12' },
                            { label: 'Reviews', value: '4.8' },
                            { label: 'Verified', value: user?.isEmailVerified ? 'Yes' : 'No' }
                        ].map((stat, idx) => (
                            <div key={idx} className="p-3 text-center hover:bg-gray-50 transition-colors cursor-default">
                                <p className="text-gray-900 font-bold text-sm">{stat.value}</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                        <Link
                            to="/dashboard"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Dashboard</p>
                            </div>
                        </Link>

                        <Link
                            to={role === 'lawyer' ? "/lawyer/profile" : "/user/settings"}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-gray-200 group-hover:text-gray-700 transition-colors">
                                <Settings className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Settings</p>
                            </div>
                        </Link>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-amber-50/50 hover:text-amber-700 transition-all group text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">Notifications</p>
                            </div>
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</span>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="p-2 pt-0 mt-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-[#0c1f3f] hover:bg-[#1a3b6e] transition-all shadow-md hover:shadow-lg group"
                        >
                            <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-sm font-semibold">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
