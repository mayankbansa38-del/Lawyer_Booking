/**
 * Lawyer Appointments Management
 * View and manage pending, confirmed, and completed appointments
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Search, User, Video, Phone, MapPin, ExternalLink } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'COMPLETED', label: 'Completed' },
];

const statusConfig = {
    PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const meetingTypeIcons = { VIDEO: Video, PHONE: Phone, IN_PERSON: MapPin };

export default function LawyerAppointments() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await appointmentAPI.getLawyerBookings();
            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const handleConfirm = async (appointmentId) => {
        setActionLoading(appointmentId);
        try {
            await appointmentAPI.confirm(appointmentId);
            setAppointments(prev =>
                prev.map(apt => apt.id === appointmentId ? { ...apt, status: 'CONFIRMED' } : apt)
            );
        } catch (error) {
            console.error('Error confirming appointment:', error);
            alert('Failed to confirm appointment.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Cancel this appointment?')) return;
        setActionLoading(appointmentId);
        try {
            await appointmentAPI.cancel(appointmentId);
            setAppointments(prev =>
                prev.map(apt => apt.id === appointmentId ? { ...apt, status: 'CANCELLED' } : apt)
            );
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment.');
        } finally {
            setActionLoading(null);
        }
    };

    const getClientName = (apt) => {
        if (apt.client) {
            return `${apt.client.firstName || ''} ${apt.client.lastName || ''}`.trim() || 'Client';
        }
        return apt.clientName || 'Client';
    };

    // Filter by tab and search
    const filteredAppointments = appointments
        .filter(apt => activeTab === 'all' || apt.status === activeTab)
        .filter(apt => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const clientName = getClientName(apt).toLowerCase();
            const meetingType = (apt.meetingType || '').toLowerCase();
            return clientName.includes(q) || meetingType.includes(q);
        });

    const counts = {
        all: appointments.length,
        PENDING: appointments.filter(a => a.status === 'PENDING').length,
        CONFIRMED: appointments.filter(a => a.status === 'CONFIRMED').length,
        COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short', month: 'short', day: 'numeric',
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
    };

    return (
        <div>
            <PageHeader title="Appointments" subtitle="Manage your scheduled consultations" />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                            }`}>
                            {counts[tab.id]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by client name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : filteredAppointments.length > 0 ? (
                <div className="space-y-4">
                    {filteredAppointments.map(apt => {
                        const clientName = getClientName(apt);
                        const clientAvatar = apt.client?.avatar;
                        const status = statusConfig[apt.status] || statusConfig.PENDING;
                        const StatusIcon = status.icon;
                        const MeetingIcon = meetingTypeIcons[apt.meetingType] || Video;
                        const isLoading = actionLoading === apt.id;

                        return (
                            <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Client Avatar */}
                                    <div className="flex-shrink-0">
                                        {clientAvatar ? (
                                            <img src={clientAvatar} alt={clientName} className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="w-6 h-6 text-blue-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{clientName}</h3>
                                                {apt.bookingNumber && (
                                                    <span className="text-xs text-gray-400">#{apt.bookingNumber}</span>
                                                )}
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                <StatusIcon className="w-3.5 h-3.5" />
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {formatDate(apt.scheduledDate)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {formatTime(apt.scheduledTime)}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MeetingIcon className="w-4 h-4 text-gray-400" />
                                                {(apt.meetingType || 'VIDEO').replace('_', ' ')}
                                            </div>
                                            {apt.amount && (
                                                <div className="font-medium text-gray-800">
                                                    ₹{parseFloat(apt.amount).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        {apt.clientNotes && (
                                            <p className="mt-2 text-sm text-gray-500 italic">
                                                "{apt.clientNotes}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {apt.status === 'PENDING' && (
                                        <div className="flex sm:flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleConfirm(apt.id)}
                                                disabled={isLoading}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                disabled={isLoading}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                    {apt.status === 'CONFIRMED' && (
                                        <div className="flex sm:flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleCancel(apt.id)}
                                                disabled={isLoading}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={Calendar}
                    title="No appointments found"
                    description={activeTab === 'all' ? "You don't have any appointments yet." : `No ${activeTab.toLowerCase()} appointments.`}
                />
            )}
        </div>
    );
}
