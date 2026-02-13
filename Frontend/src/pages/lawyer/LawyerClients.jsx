/**
 * Lawyer Clients Page
 * View and manage client list with case history
 */

import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Calendar, Briefcase, ChevronRight, X } from 'lucide-react';
import { PageHeader, ClientCard, EmptyState } from '../../components/dashboard';
import { clientAPI, appointmentAPI, caseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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
                setClients(data);
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
            setClientDetails({ appointments: aptsRes.data, cases: casesRes.data });
        } catch (error) {
            console.error('Error fetching client details:', error);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                <ClientCard key={client.id} client={client} onClick={() => handleClientSelect(client)} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Search} title="No clients found" description="No clients match your search." />
                    )}
                </div>

                {/* Client Details Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedClient ? (
                        <>
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <img src={selectedClient.image} alt={selectedClient.name} className="w-16 h-16 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{selectedClient.name}</h3>
                                        <p className="text-sm text-gray-500">{selectedClient.location}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedClient(null)} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {selectedClient.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    {selectedClient.phone}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Client since {new Date(selectedClient.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                </div>
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
                                                        <p className="text-gray-500 text-xs">{c.caseNumber}</p>
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
                                                {clientDetails.appointments.slice(0, 3).map(apt => (
                                                    <div key={apt.id} className="p-2 bg-gray-50 rounded-lg text-sm flex items-center justify-between">
                                                        <span>{new Date(apt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${apt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                            apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>{apt.status}</span>
                                                    </div>
                                                ))}
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
                            <p>Select a client to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
