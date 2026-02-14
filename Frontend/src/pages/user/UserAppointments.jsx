/**
 * User Appointments Page - Enhanced
 * Premium design with stat cards, search, and improved layout
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Video, MapPin, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { PageHeader, AppointmentCard, EmptyState } from '../../components/dashboard';
import { appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
];

export default function UserAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchAppointments() {
            try {
                if (!user?.id) return;
                const { data } = await appointmentAPI.getAll({ userId: user.id });
                setAppointments(data);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAppointments();
    }, [user]);

    const filteredAppointments = appointments
        .filter(apt => {
            if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'pending';
            if (activeTab === 'completed') return apt.status === 'completed';
            return apt.status === 'cancelled';
        })
        .filter(apt => !searchQuery || apt.lawyerName?.toLowerCase().includes(searchQuery.toLowerCase()) || apt.caseType?.toLowerCase().includes(searchQuery.toLowerCase()));

    const counts = {
        upcoming: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                <p className="text-gray-500 mt-1">Your scheduled consultations</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Upcoming" value={counts.upcoming} icon={Calendar} color="bg-blue-500" />
                <StatCard title="Completed" value={counts.completed} icon={CheckCircle} color="bg-green-500" />
                <StatCard title="Cancelled" value={counts.cancelled} icon={XCircle} color="bg-red-500" />
            </div>

            {/* Search & Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row gap-4 mb-5">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by lawyer name or case type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200/60'}`}>
                                    {counts[tab.id]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Appointments List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : filteredAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {filteredAppointments.map(apt => (
                            <div key={apt.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100/80 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <img src={apt.lawyerImage} alt={apt.lawyerName} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-sm" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900">{apt.lawyerName}</h4>
                                        <p className="text-sm text-gray-500">{apt.caseType}</p>
                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-gray-400" />{new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-gray-400" />{apt.time}</span>
                                            <span className="flex items-center gap-1">{apt.type === 'video' ? <Video className="w-4 h-4 text-gray-400" /> : <MapPin className="w-4 h-4 text-gray-400" />}{apt.type === 'video' ? 'Video call' : 'In person'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {apt.status === 'confirmed' && (
                                            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                                                {apt.type === 'video' ? 'Join Call' : 'Get Directions'}
                                            </button>
                                        )}
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState icon={Calendar} title="No appointments" description={`You don't have any ${activeTab} appointments.`} action={{ href: '/lawyers', label: 'Find a Lawyer' }} />
                )}
            </div>
        </div>
    );
}
