/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker - Unified Dashboard Layout
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Single consolidated layout for all dashboard types (Lawyer, User, Admin).
 * Uses role-based configuration for navigation, theming, and display.
 * 
 * @module layouts/DashboardLayout
 */

import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
    // Shared icons
    LayoutDashboard, LogOut, Menu, X, ChevronRight, Bell,
    // Lawyer icons
    User, Calendar, Users, Briefcase, DollarSign, BarChart3,
    FileText, Clock, Settings,
    // User icons
    Heart, CreditCard,
    // Admin icons
    Scale, CheckCircle, Shield
} from 'lucide-react';
import NyayBookerLogo from '../components/NyayBookerLogo';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════
// ROLE CONFIGURATION
// Each role defines its navigation, theming, and display properties
// ═══════════════════════════════════════════════════════════════════════════

const ROLE_CONFIG = {
    lawyer: {
        navItems: [
            { path: '/lawyer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/lawyer/profile', icon: User, label: 'My Profile' },
            { path: '/lawyer/appointments', icon: Calendar, label: 'Appointments' },
            { path: '/lawyer/calendar', icon: Clock, label: 'Calendar' },
            { path: '/lawyer/clients', icon: Users, label: 'Clients' },
            { path: '/lawyer/cases', icon: Briefcase, label: 'Cases' },
            { path: '/lawyer/earnings', icon: DollarSign, label: 'Earnings' },
            { path: '/lawyer/analytics', icon: BarChart3, label: 'Analytics' },
            { path: '/lawyer/documents', icon: FileText, label: 'Documents' },
            { path: '/lawyer/availability', icon: Settings, label: 'Availability' },
        ],
        roleLabel: 'Advocate',
        defaultTitle: 'Dashboard',
        avatarSeed: 'lawyer',
        theme: 'light',
        requiresAuth: 'LAWYER',
    },
    user: {
        navItems: [
            { path: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/user/appointments', icon: Calendar, label: 'Appointments' },
            { path: '/user/saved-lawyers', icon: Heart, label: 'Saved Lawyers' },
            { path: '/user/cases', icon: Briefcase, label: 'My Cases' },
            { path: '/user/payments', icon: CreditCard, label: 'Payments' },
            { path: '/user/notifications', icon: Bell, label: 'Notifications' },
            { path: '/user/settings', icon: Settings, label: 'Settings' },
        ],
        roleLabel: 'Client',
        defaultTitle: 'Dashboard',
        avatarSeed: 'user',
        theme: 'light',
        requiresAuth: 'USER',
    },
    admin: {
        navItems: [
            { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/admin/users', icon: Users, label: 'User Management' },
            { path: '/admin/lawyers', icon: Scale, label: 'Lawyer Management' },
            { path: '/admin/verification', icon: CheckCircle, label: 'Pending Verification' },
        ],
        roleLabel: 'Administrator',
        defaultTitle: 'Admin Dashboard',
        avatarSeed: 'admin',
        theme: 'dark',
        requiresAuth: 'ADMIN',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME STYLES
// Centralized styling for light (Lawyer/User) and dark (Admin) themes
// ═══════════════════════════════════════════════════════════════════════════

const THEME_STYLES = {
    light: {
        sidebar: 'bg-white border-r border-gray-200',
        sidebarBorder: 'border-gray-100',
        closeButton: 'text-gray-500 hover:bg-gray-100',
        navLinkActive: 'bg-blue-50 text-blue-700',
        navLinkInactive: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        navIconActive: 'text-blue-600',
        navIconInactive: 'text-gray-400',
        logoutSection: 'border-gray-100 bg-white',
        logoutButton: 'text-red-600 hover:bg-red-50',
    },
    dark: {
        sidebar: 'bg-slate-900',
        sidebarBorder: 'border-slate-700',
        closeButton: 'text-slate-400 hover:bg-slate-800',
        navLinkActive: 'bg-blue-600 text-white',
        navLinkInactive: 'text-slate-300 hover:bg-slate-800 hover:text-white',
        navIconActive: 'text-white',
        navIconInactive: 'text-slate-400',
        logoutSection: 'border-slate-700 bg-slate-900',
        logoutButton: 'text-red-400 hover:bg-red-500/10',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unified Dashboard Layout
 * 
 * @param {Object} props
 * @param {'lawyer' | 'user' | 'admin'} props.role - Dashboard role type
 */
export default function DashboardLayout({ role = 'user' }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isLawyer, isUser, isLoading } = useAuth();

    // Get role-specific configuration
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.user;
    const theme = THEME_STYLES[config.theme];
    const isAdminRole = role === 'admin';

    // ─────────────────────────────────────────────────────────────────────────
    // Auth Guard
    // ─────────────────────────────────────────────────────────────────────────

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Check role-based authorization
    const isAuthorized =
        (config.requiresAuth === 'ADMIN' && isAdmin) ||
        (config.requiresAuth === 'LAWYER' && (isLawyer || isAdmin)) ||
        (config.requiresAuth === 'USER' && (isUser || isLawyer || isAdmin));

    if (!isAuthorized) {
        return <Navigate to="/login" replace />;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const closeSidebar = () => setSidebarOpen(false);
    const openSidebar = () => setSidebarOpen(true);

    const isActive = (path) => location.pathname === path;
    const currentPageLabel = config.navItems.find(item => isActive(item.path))?.label || config.defaultTitle;

    // Get display name - handle both name formats from API
    const displayName = user?.firstName || user?.name?.split(' ')[0] || role.charAt(0).toUpperCase() + role.slice(1);

    // ─────────────────────────────────────────────────────────────────────────
    // Render Logo Section
    // ─────────────────────────────────────────────────────────────────────────

    const renderLogo = () => {
        if (isAdminRole) {
            return (
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">
                        Admin<span className="text-blue-400">Panel</span>
                    </span>
                </Link>
            );
        }

        return (
            <Link to="/" className="flex items-center gap-2">
                <NyayBookerLogo size={36} />
                <span className="text-lg font-bold text-[#0c1f3f]">
                    Nyay<span className="text-[#cfa052]">Booker</span>
                </span>
            </Link>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render Avatar Section
    // ─────────────────────────────────────────────────────────────────────────

    const renderAvatar = () => {
        if (isAdminRole) {
            return (
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                </div>
            );
        }

        return (
            <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${config.avatarSeed}`}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover"
            />
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Main Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full w-64
                    transform transition-transform duration-300 ease-in-out
                    lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${theme.sidebar}
                `}
                aria-label="Sidebar navigation"
            >
                {/* Logo Header */}
                <div className={`h-16 flex items-center justify-between px-4 border-b ${theme.sidebarBorder}`}>
                    {renderLogo()}
                    <button
                        onClick={closeSidebar}
                        className={`lg:hidden p-2 rounded-lg ${theme.closeButton}`}
                        aria-label="Close sidebar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-8rem)]" aria-label="Main navigation">
                    {config.navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeSidebar}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${active ? theme.navLinkActive : theme.navLinkInactive}
                                `}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon className={`w-5 h-5 ${active ? theme.navIconActive : theme.navIconInactive}`} />
                                {item.label}
                                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Section */}
                <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${theme.logoutSection}`}>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${theme.logoutButton}`}
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <button
                        onClick={openSidebar}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        aria-label="Open sidebar"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="hidden lg:block">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {currentPageLabel}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <button
                            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            aria-label="View notifications"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
                        </button>

                        {/* User Info */}
                        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                            {renderAvatar()}
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">{config.roleLabel}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6" role="main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
