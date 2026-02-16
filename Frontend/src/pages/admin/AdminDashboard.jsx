/**
 * Admin Dashboard Page
 * Overview statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { Users, Scale, Calendar, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalLawyers: 0,
        pendingVerifications: 0,
        totalBookings: 0,
        recentUsers: [],
        recentLawyers: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await apiClient.get('/admin/dashboard');
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Welcome back, Admin. Here's what's happening.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="bg-blue-500"
                    subtitle="Registered clients"
                />
                <StatCard
                    title="Total Lawyers"
                    value={stats.totalLawyers}
                    icon={Scale}
                    color="bg-indigo-500"
                    subtitle="Active advocates"
                />
                <StatCard
                    title="Pending Verification"
                    value={stats.pendingVerifications}
                    icon={Clock}
                    color="bg-amber-500"
                    subtitle="Awaiting review"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    icon={Calendar}
                    color="bg-green-500"
                    subtitle="All time"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/verification"
                        className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Review Pending</p>
                            <p className="text-sm text-gray-500">{stats.pendingVerifications} lawyers awaiting</p>
                        </div>
                    </a>
                    <a
                        href="/admin/users"
                        className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Manage Users</p>
                            <p className="text-sm text-gray-500">View all registered users</p>
                        </div>
                    </a>
                    <a
                        href="/admin/lawyers"
                        className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Manage Lawyers</p>
                            <p className="text-sm text-gray-500">View all lawyers</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
                    <div className="space-y-3">
                        {stats.recentUsers?.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{user.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                <p className="text-xs text-gray-400">{user.createdAt}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Lawyers */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Lawyers</h2>
                    <div className="space-y-3">
                        {stats.recentLawyers?.map((lawyer) => (
                            <div key={lawyer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <Scale className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{lawyer.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{lawyer.specialization}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${lawyer.status === 'VERIFIED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {lawyer.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
