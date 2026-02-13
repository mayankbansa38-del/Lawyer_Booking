/**
 * User Dashboard - Main Overview
 * Shows upcoming appointments, saved lawyers, and recent activity
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Heart, Briefcase, Clock, ChevronRight, Star, MapPin } from 'lucide-react';
import { StatCard, AppointmentCard, PageHeader } from '../../components/dashboard';
import { appointmentAPI, favoritesAPI, caseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ upcoming: 0, saved: 0, activeCases: 0 });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [savedLawyers, setSavedLawyers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!user?.id) return;
            try {
                const userId = user.id;
                const [aptsRes, favsRes, casesRes] = await Promise.all([
                    appointmentAPI.getAll({ userId }),
                    favoritesAPI.getByUser(userId),
                    caseAPI.getAll({ clientId: userId })
                ]);

                const upcoming = aptsRes.data.filter(a => a.status === 'confirmed' || a.status === 'pending');
                const activeCases = casesRes.data.filter(c => c.status === 'active').length;

                setStats({ upcoming: upcoming.length, saved: favsRes.data.length, activeCases });
                setUpcomingAppointments(upcoming.slice(0, 3));
                setSavedLawyers(favsRes.data.slice(0, 4));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div>
            <PageHeader title={`Welcome, ${user?.name?.split(' ')[0] || 'User'}`} subtitle="Manage your legal consultations" />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard title="Upcoming Appointments" value={stats.upcoming} icon={Calendar} />
                <StatCard title="Saved Lawyers" value={stats.saved} icon={Heart} />
                <StatCard title="Active Cases" value={stats.activeCases} icon={Briefcase} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Appointments */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                            <Link to="/user/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                View all <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="p-4 space-y-3">
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map(apt => (
                                    <AppointmentCard key={apt.id} appointment={apt} showClient={false} showLawyer={true} />
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No upcoming appointments</p>
                                    <Link to="/lawyers" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                                        Find a Lawyer
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <Link to="/lawyers" className="block bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-sm p-5 text-white hover:shadow-lg transition-shadow">
                        <h3 className="font-semibold mb-2">Need Legal Help?</h3>
                        <p className="text-sm text-blue-100 mb-4">Find experienced lawyers in your area</p>
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                            Browse Lawyers <ChevronRight className="w-4 h-4" />
                        </span>
                    </Link>

                    {/* Saved Lawyers */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Saved Lawyers</h3>
                            <Link to="/user/saved-lawyers" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
                        </div>
                        {savedLawyers.length > 0 ? (
                            <div className="space-y-3">
                                {savedLawyers.map(lawyer => (
                                    <Link key={lawyer.id} to={`/lawyers/${lawyer.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <img src={lawyer.image} alt={lawyer.name} className="w-10 h-10 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">{lawyer.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {lawyer.rating}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No saved lawyers yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
