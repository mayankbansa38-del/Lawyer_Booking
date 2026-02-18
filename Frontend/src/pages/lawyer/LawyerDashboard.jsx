/**
 * Lawyer Dashboard - Main Overview Page
 * Shows statistics, recent appointments, and quick actions
 * 
 * @module pages/lawyer/LawyerDashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar, Users, DollarSign, TrendingUp, Clock,
    ChevronRight, Star, Briefcase
} from 'lucide-react';
import { StatCard, AppointmentCard, PageHeader } from '../../components/dashboard';
import { appointmentAPI, paymentAPI, clientAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LawyerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        appointments: { pending: 0, today: 0, total: 0 },
        earnings: { totalEarnings: 0, thisMonth: 0 },
        clients: 0,
    });
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const lawyerId = user?.lawyer?.id || user?.id;

                // Guard: do not fetch with an unknown ID
                if (!lawyerId) {
                    console.warn('LawyerDashboard: no lawyerId available yet');
                    setLoading(false);
                    return;
                }

                // Fetch appointments
                const { data: rawAppointments } = await appointmentAPI.getLawyerBookings();

                // Transform appointments to match Card component expected format
                const appointments = rawAppointments.map(apt => ({
                    ...apt,
                    date: apt.scheduledDate,
                    time: apt.scheduledTime,
                    clientName: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : 'Unknown Client',
                    clientImage: apt.client?.avatar,
                    caseType: apt.meetingType,
                    status: apt.status
                }));

                // Normalize dates to YYYY-MM-DD for reliable comparison
                const today = new Date().toISOString().split('T')[0];
                const pending = appointments.filter(a => a.status === 'PENDING').length;
                const todayApts = appointments.filter(a => {
                    if (!a.date) return false;
                    const aptDate = typeof a.date === 'string'
                        ? a.date.split('T')[0]
                        : new Date(a.date).toISOString().split('T')[0];
                    return aptDate === today;
                }).length;

                // Fetch earnings
                const { data: earnings } = await paymentAPI.getEarningsSummary();

                // Fetch clients
                const { data: clients } = await clientAPI.getByLawyer(lawyerId);

                setStats({
                    appointments: { pending, today: todayApts, total: appointments.length },
                    earnings: { totalEarnings: earnings.totalEarnings || 0, thisMonth: earnings.monthlyEarnings || 0 },
                    clients: clients.length,
                });

                // Get recent appointments (limit 5)
                setRecentAppointments(appointments.slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    const handleAppointmentAction = async (action, appointmentId) => {
        try {
            if (action === 'confirm') {
                await appointmentAPI.confirm(appointmentId);
            } else {
                await appointmentAPI.cancel(appointmentId);
            }

            // Refresh appointments
            const lawyerId = user?.lawyer?.id || user?.id;
            if (!lawyerId) return;
            const { data } = await appointmentAPI.getLawyerBookings();
            setRecentAppointments(data.slice(0, 5));
        } catch (error) {
            console.error('Error updating appointment:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title={`Welcome back, ${user?.name?.split(' ').pop() || 'Advocate'}`}
                subtitle="Here's what's happening with your practice today"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Today's Appointments"
                    value={stats.appointments.today}
                    subtitle={`${stats.appointments.pending} pending`}
                    icon={Calendar}
                    trend="up"
                    trendValue={12}
                />
                <StatCard
                    title="Total Clients"
                    value={stats.clients}
                    subtitle="Active clients"
                    icon={Users}
                    trend="up"
                    trendValue={8}
                />
                <StatCard
                    title="This Month's Earnings"
                    value={`₹${Number(stats.earnings.thisMonth).toLocaleString('en-IN')}`}
                    subtitle={`₹${Number(stats.earnings.totalEarnings).toLocaleString('en-IN')} total`}
                    icon={DollarSign}
                    trend="up"
                    trendValue={18}
                />
                <StatCard
                    title="Total Earnings"
                    value={`₹${Number(stats.earnings.totalEarnings).toLocaleString('en-IN')}`}
                    subtitle="All time"
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Appointments */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Recent Appointments</h3>
                            <Link
                                to="/lawyer/appointments"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                View all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="p-4 space-y-3">
                            {recentAppointments.length > 0 ? (
                                recentAppointments.map(apt => (
                                    <AppointmentCard
                                        key={apt.id}
                                        appointment={apt}
                                        onAction={handleAppointmentAction}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No appointments yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Info */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link
                                to="/lawyer/availability"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Set Availability</p>
                                    <p className="text-sm text-gray-500">Manage your schedule</p>
                                </div>
                            </Link>
                            <Link
                                to="/lawyer/profile"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Star className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Update Profile</p>
                                    <p className="text-sm text-gray-500">Enhance visibility</p>
                                </div>
                            </Link>
                            <Link
                                to="/lawyer/cases"
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Manage Cases</p>
                                    <p className="text-sm text-gray-500">Track progress</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-sm p-5 text-white">
                        <h3 className="font-semibold mb-4">Performance Summary</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-blue-100">Response Rate</span>
                                <span className="font-semibold">95%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-blue-100">Avg Rating</span>
                                <span className="font-semibold flex items-center gap-1">
                                    4.7 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-blue-100">Cases Won</span>
                                <span className="font-semibold">145</span>
                            </div>
                        </div>
                        <Link
                            to="/lawyer/earnings"
                            className="mt-4 block w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-center text-sm font-medium transition-colors"
                        >
                            View Earnings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
