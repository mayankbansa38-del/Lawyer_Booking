/**
 * User Appointments Page - Enhanced
 * Premium design with stat cards, search, and improved layout
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Video, MapPin, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const tabs = [
    { id: 'upcoming', label: 'Upcoming', statuses: ['PENDING', 'CONFIRMED'] },
    { id: 'completed', label: 'Completed', statuses: ['COMPLETED'] },
    { id: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
];

const statusConfig = {
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const meetingTypeIcons = {
    VIDEO: Video,
    IN_PERSON: MapPin,
};

export default function UserAppointments() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchAppointments() {
            setLoading(true);
            try {
                const { data } = await appointmentAPI.getAll();
                setAppointments(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching appointments:', error);
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        }
        if (user) fetchAppointments();
    }, [user]);

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await appointmentAPI.cancel(appointmentId);
            setAppointments(prev =>
                prev.map(apt => apt.id === appointmentId ? { ...apt, status: 'CANCELLED' } : apt)
            );
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        }
    };

    // Filter logic
    const currentStatuses = tabs.find(t => t.id === activeTab)?.statuses || [];

    // Helper to robustly get lawyer name/details from potentially nested object
    const getLawyerName = (apt) => {
        if (apt.lawyer?.user) return `${apt.lawyer.user.firstName} ${apt.lawyer.user.lastName}`;
        if (apt.lawyerName) return apt.lawyerName;
        return 'Lawyer';
    };

    const getCaseType = (apt) => apt.caseType || apt.lawyer?.specialization || 'Consultation';

    const filteredAppointments = appointments
        .filter(apt => currentStatuses.includes(apt.status))
        .filter(apt => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            const name = getLawyerName(apt).toLowerCase();
            const type = getCaseType(apt).toLowerCase();
            return name.includes(query) || type.includes(query);
        });

    const counts = {
        upcoming: appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status)).length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
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
                            placeholder="Search by lawyer name or consultation type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
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
                        {filteredAppointments.map(apt => {
                            const lawyerName = getLawyerName(apt);
                            const caseType = getCaseType(apt);
                            const lawyerAvatar = apt.lawyer?.user?.avatar;
                            const status = statusConfig[apt.status] || statusConfig.PENDING;
                            const StatusIcon = status.icon;
                            const MeetingIcon = meetingTypeIcons[apt.meetingType] || Video;

                            return (
                                <div key={apt.id} className="bg-gray-50/50 rounded-xl p-4 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <img
                                            src={lawyerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${lawyerName}`}
                                            alt={lawyerName}
                                            className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-sm bg-white"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900">{lawyerName}</h4>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{caseType}</p>

                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-gray-600">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {formatDate(apt.scheduledDate)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    {formatTime(apt.scheduledTime)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MeetingIcon className="w-4 h-4 text-gray-400" />
                                                    {(apt.meetingType || 'VIDEO').replace('_', ' ')}
                                                </span>
                                                {apt.amount && (
                                                    <span className="flex items-center gap-1.5 font-medium text-gray-900">
                                                        ₹{parseInt(apt.amount).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col gap-2 flex-shrink-0 mt-4 sm:mt-0 border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100">
                                            {apt.status === 'CONFIRMED' && apt.meetingLink && (
                                                <a
                                                    href={apt.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    Join Call
                                                </a>
                                            )}
                                            {apt.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleCancel(apt.id)}
                                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            )}
                                            <Link
                                                to={`/lawyers/${apt.lawyer?.id || apt.lawyerId}`}
                                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-white hover:shadow-sm transition-all"
                                            >
                                                View Profile
                                            </Link>
                                        </div>
                                    </div>

                                    {apt.clientNotes && (
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Notes</p>
                                            <p className="text-sm text-gray-600">{apt.clientNotes}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={Calendar}
                        title={`No ${activeTab} appointments`}
                        description={activeTab === 'upcoming'
                            ? "You don't have any upcoming appointments. Book a consultation with a top lawyer today."
                            : `You don't have any ${activeTab} appointments.`}
                        action={activeTab === 'upcoming' ? { href: '/lawyers', label: 'Find a Lawyer' } : undefined}
                    />
                )}
            </div>
        </div>
    );
}
