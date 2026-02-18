/**
 * User Dashboard - Premium Overview
 * Enhanced design matching admin panel style
 * Shows stats, quick actions, upcoming appointments, and recent activity
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar, Heart, Briefcase, Clock, ChevronRight, Star, MapPin,
    Search, TrendingUp, CreditCard, Bell, ArrowRight, CheckCircle,
    Scale, FileText, AlertCircle
} from 'lucide-react';
import { AppointmentCard } from '../../components/dashboard';
import { appointmentAPI, favoritesAPI, caseAPI, notificationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ upcoming: 0, saved: 0, activeCases: 0, totalPayments: 0 });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [savedLawyers, setSavedLawyers] = useState([]);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) return;
            try {
                const userId = user.id;
                const [aptsRes, favsRes, casesRes, notifsRes] = await Promise.all([
                    appointmentAPI.getAll(),
                    favoritesAPI.getByUser(userId),
                    caseAPI.getAll({ clientId: userId }),
                    notificationAPI.getAll(userId, 'client').catch(() => ({ data: [] }))
                ]);

                const upcoming = aptsRes.data
                    .filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
                    .map(apt => ({
                        ...apt,
                        date: apt.scheduledDate,
                        time: apt.scheduledTime,
                        lawyerName: apt.lawyer.name,
                        lawyerImage: apt.lawyer.avatar,
                        caseType: apt.meetingType + ' - ' + (apt.lawyer.specialization || 'Legal Consultation'),
                        status: apt.status
                    }));
                const activeCases = casesRes.data.filter(c => c.status === 'ACTIVE' || c.status === 'OPEN').length;

                setStats({
                    upcoming: upcoming.length,
                    saved: favsRes.data.length,
                    activeCases,
                    totalPayments: aptsRes.data.filter(a => a.status === 'COMPLETED').length
                });
                setUpcomingAppointments(upcoming.slice(0, 3));
                setSavedLawyers(favsRes.data.slice(0, 4));
                setRecentNotifications((notifsRes.data || []).slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    // Admin-style StatCard
    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
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

    const currentDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
                </h1>
                <p className="text-gray-500 mt-1">{currentDate}</p>
            </div>

            {/* Stats Grid - Admin Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Upcoming Appointments"
                    value={stats.upcoming}
                    icon={Calendar}
                    color="bg-blue-500"
                    subtitle="Scheduled consultations"
                />
                <StatCard
                    title="Active Cases"
                    value={stats.activeCases}
                    icon={Briefcase}
                    color="bg-amber-500"
                    subtitle="Currently ongoing"
                />
                <StatCard
                    title="Completed Sessions"
                    value={stats.totalPayments}
                    icon={CheckCircle}
                    color="bg-green-500"
                    subtitle="All time"
                />
            </div>

            {/* Quick Actions - Admin Style */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/lawyers"
                        className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Find a Lawyer</p>
                            <p className="text-sm text-gray-500">Browse experienced advocates</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link
                        to="/user/appointments"
                        className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">My Appointments</p>
                            <p className="text-sm text-gray-500">View all consultations</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link
                        to="/user/cases"
                        className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group"
                    >
                        <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">My Cases</p>
                            <p className="text-sm text-gray-500">Track legal cases</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </div>
            </div>

            {/* Two Column Layout - Appointments & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Appointments */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
                            <Link to="/user/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                View all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="p-5 space-y-3">
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map(apt => (
                                    <AppointmentCard key={apt.id} appointment={apt} showClient={false} showLawyer={true} />
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 mb-4">No upcoming appointments</p>
                                    <Link to="/lawyers" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors">
                                        <Search className="w-4 h-4" /> Find a Lawyer
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Saved Lawyers & Recent Notifications */}
                <div className="space-y-6">
                    {/* CTA Card */}
                    <Link to="/lawyers" className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-5 text-white hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                        <div className="flex items-center gap-3 mb-3">
                            <Scale className="w-6 h-6" />
                            <h3 className="font-semibold text-lg">Need Legal Help?</h3>
                        </div>
                        <p className="text-sm text-blue-100 mb-4">Find experienced lawyers in your area for any legal matter</p>
                        <span className="inline-flex items-center gap-1 text-sm font-medium bg-white/20 rounded-lg px-3 py-1.5">
                            Browse Lawyers <ChevronRight className="w-4 h-4" />
                        </span>
                    </Link>


                </div>
            </div>
        </div>
    );
}
