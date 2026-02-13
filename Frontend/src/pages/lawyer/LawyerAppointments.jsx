/**
 * Lawyer Appointments Management
 * View and manage pending, confirmed, and completed appointments
 */

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Filter, Search } from 'lucide-react';
import { PageHeader, AppointmentCard, EmptyState } from '../../components/dashboard';
import { appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'completed', label: 'Completed' },
];

export default function LawyerAppointments() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const params = { lawyerId: user?.lawyer?.id || user?.id };
            if (activeTab !== 'all') params.status = activeTab;
            const { data } = await appointmentAPI.getAll(params);
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [activeTab, user]);

    const handleAction = async (action, appointmentId) => {
        try {
            const status = action === 'confirm' ? 'confirmed' : 'cancelled';
            await appointmentAPI.updateStatus(appointmentId, status);
            fetchAppointments();
        } catch (error) {
            console.error('Error updating appointment:', error);
        }
    };

    const filteredAppointments = appointments.filter(apt =>
        apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.caseType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const counts = {
        all: appointments.length,
        pending: appointments.filter(a => a.status === 'pending').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
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
                        placeholder="Search by client or case type..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments.map(apt => (
                        <AppointmentCard
                            key={apt.id}
                            appointment={apt}
                            showClient={true}
                            onAction={apt.status === 'pending' ? handleAction : undefined}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Calendar}
                    title="No appointments found"
                    description={activeTab === 'all' ? "You don't have any appointments yet." : `No ${activeTab} appointments.`}
                />
            )}
        </div>
    );
}
