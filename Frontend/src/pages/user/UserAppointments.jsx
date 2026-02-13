/**
 * User Appointments Page
 * View upcoming and past appointments
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Video, MapPin } from 'lucide-react';
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

    const filteredAppointments = appointments.filter(apt => {
        if (activeTab === 'upcoming') return apt.status === 'confirmed' || apt.status === 'pending';
        if (activeTab === 'completed') return apt.status === 'completed';
        return apt.status === 'cancelled';
    });

    const counts = {
        upcoming: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };

    return (
        <div>
            <PageHeader title="Appointments" subtitle="Your scheduled consultations" />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {tab.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                            {counts[tab.id]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Appointments */}
            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
            ) : filteredAppointments.length > 0 ? (
                <div className="space-y-4">
                    {filteredAppointments.map(apt => (
                        <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <img src={apt.lawyerImage} alt={apt.lawyerName} className="w-16 h-16 rounded-xl object-cover" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900">{apt.lawyerName}</h4>
                                    <p className="text-sm text-gray-500">{apt.caseType}</p>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(apt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{apt.time}</span>
                                        <span className="flex items-center gap-1">{apt.type === 'video' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}{apt.type === 'video' ? 'Video call' : 'In person'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {apt.status === 'confirmed' && (
                                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                            {apt.type === 'video' ? 'Join Call' : 'Get Directions'}
                                        </button>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
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
    );
}
