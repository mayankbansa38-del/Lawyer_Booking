/**
 * Lawyer Clients Page
 * View and manage client list with case history
 */

import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, Briefcase, X, User } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { clientAPI, appointmentAPI, caseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/** Safe full-name builder */
function fullName(obj) {
    if (!obj) return 'Unknown';
    if (obj.name) return obj.name;
    const first = obj.firstName || '';
    const last = obj.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown';
}

/** Fallback avatar with initials */
function Avatar({ src, name, size = 'md' }) {
    const [failed, setFailed] = useState(false);
    const px = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
    const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    if (src && !failed) {
        return <img src={src} alt={name} className={`${px} rounded-full object-cover`} onError={() => setFailed(true)} />;
    }
    return (
        <div className={`${px} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold`}>
            {initials}
        </div>
    );
}

export default function LawyerClients() {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientDetails, setClientDetails] = useState(null);

    useEffect(() => {
        async function fetchClients() {
            try {
                const { data } = await clientAPI.getByLawyer(user?.lawyer?.id || user?.id);
                setClients(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchClients();
    }, [user]);

    const handleClientSelect = async (client) => {
        setSelectedClient(client);
        try {
            const [aptsRes, casesRes] = await Promise.all([
                appointmentAPI.getAll({ userId: client.id, lawyerId: user?.lawyer?.id || user?.id }),
                caseAPI.getAll({ clientId: client.id, lawyerId: user?.lawyer?.id || user?.id })
            ]);
            setClientDetails({
                appointments: Array.isArray(aptsRes.data) ? aptsRes.data : [],
                cases: Array.isArray(casesRes.data) ? casesRes.data : [],
            });
        } catch (error) {
            console.error('Error fetching client details:', error);
        }
    };

    const filteredClients = clients.filter(c => {
        const name = fullName(c).toLowerCase();
        const email = (c.email || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || email.includes(q);
    });

    return (
        <div>
            <PageHeader title="Clients" subtitle={`${clients.length} total clients`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client List */}
                <div className="lg:col-span-2">
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        </div>
                    ) : filteredClients.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredClients.map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => handleClientSelect(client)}
                                    className={`flex items-center gap-4 p-4 bg-white rounded-xl border text-left transition-all hover:shadow-md ${selectedClient?.id === client.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'
                                        }`}
                                >
                                    <Avatar src={client.avatar || client.image} name={fullName(client)} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{fullName(client)}</p>
                                        <p className="text-sm text-gray-500 truncate">{client.email || '—'}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {client.totalAppointments || 0} appointment{client.totalAppointments !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={User} title="No clients found" description={searchQuery ? 'No clients match your search.' : 'No clients yet. Clients appear here after bookings.'} />
                    )}
                </div>

                {/* Client Details Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedClient ? (
                        <>
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <Avatar src={selectedClient.avatar || selectedClient.image} name={fullName(selectedClient)} size="lg" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{fullName(selectedClient)}</h3>
                                        <p className="text-sm text-gray-500">{selectedClient.location || '—'}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedClient(null); setClientDetails(null); }} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {selectedClient.email || '—'}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {selectedClient.phone || selectedClient.phoneNumber || '—'}
                                </div>
                                {selectedClient.createdAt && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        Client since {new Date(selectedClient.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            {clientDetails && (
                                <>
                                    <div className="border-t pt-4 mb-4">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-gray-400" /> Cases ({clientDetails.cases.length})
                                        </h4>
                                        {clientDetails.cases.length > 0 ? (
                                            <div className="space-y-2">
                                                {clientDetails.cases.map(c => (
                                                    <div key={c.id} className="p-2 bg-gray-50 rounded-lg text-sm">
                                                        <p className="font-medium text-gray-900">{c.title}</p>
                                                        <p className="text-gray-500 text-xs">{c.caseNumber} · {typeof c.status === 'string' ? c.status : c.status?.label || '—'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No active cases</p>
                                        )}
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" /> Recent Appointments
                                        </h4>
                                        {clientDetails.appointments.length > 0 ? (
                                            <div className="space-y-2">
                                                {clientDetails.appointments.slice(0, 3).map(apt => {
                                                    const aptStatus = typeof apt.status === 'string' ? apt.status : 'pending';
                                                    return (
                                                        <div key={apt.id} className="p-2 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
                                                            <span>{new Date(apt.date || apt.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${aptStatus === 'COMPLETED' || aptStatus === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                                    aptStatus === 'CONFIRMED' || aptStatus === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                                        'bg-yellow-100 text-yellow-700'
                                                                }`}>{aptStatus}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No appointments</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Select a client to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
