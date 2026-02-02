/**
 * Lawyer Dashboard Layout
 * Sidebar navigation wrapper for all lawyer dashboard pages
 * 
 * @module layouts/LawyerLayout
 */

import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, Calendar, Users, Briefcase,
    DollarSign, BarChart3, FileText, Clock, Settings,
    LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react';
import NyayBookerLogo from '../components/NyayBookerLogo';
import { useAuth } from '../context/mockAuth';

const navItems = [
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
];

export default function LawyerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    <Link to="/" className="flex items-center gap-2">
                        <NyayBookerLogo size={36} />
                        <span className="text-lg font-bold text-[#0c1f3f]">
                            Nyay<span className="text-[#cfa052]">Booker</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-8rem)]">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                `}
                            >
                                <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.label}
                                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="hidden lg:block">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>

                        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                            <img
                                src={user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer'}
                                alt={user?.name || 'Lawyer'}
                                className="w-9 h-9 rounded-full object-cover"
                            />
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-gray-900">{user?.name || 'Lawyer'}</p>
                                <p className="text-xs text-gray-500">Advocate</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
