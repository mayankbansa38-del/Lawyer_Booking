/**
 * Lawyer Cases Page
 * View and manage active cases
 */

import { useState, useEffect } from 'react';
import { Briefcase, Search, ChevronRight, Calendar, MapPin, FileText } from 'lucide-react';
import { PageHeader, CaseCard, EmptyState } from '../../components/dashboard';
import { caseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'closed', label: 'Closed' },
];

export default function LawyerCases() {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCase, setSelectedCase] = useState(null);

    useEffect(() => {
        async function fetchCases() {
            try {
                const params = { lawyerId: user?.id || '1' };
                if (activeTab !== 'all') params.status = activeTab;
                const { data } = await caseAPI.getAll(params);
                setCases(data);
            } catch (error) {
                console.error('Error fetching cases:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, [activeTab, user]);

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const counts = {
        all: cases.length,
        active: cases.filter(c => c.status === 'active').length,
        pending: cases.filter(c => c.status === 'pending').length,
        closed: cases.filter(c => c.status === 'closed').length,
    };

    return (
        <div>
            <PageHeader title="Cases" subtitle="Manage your legal cases" />

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

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search cases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cases List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                    ) : filteredCases.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredCases.map(c => (
                                <CaseCard key={c.id} caseData={c} onClick={() => setSelectedCase(c)} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} title="No cases found" description="No cases match your criteria." />
                    )}
                </div>

                {/* Case Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedCase ? (
                        <>
                            <h3 className="font-semibold text-gray-900 mb-1">{selectedCase.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{selectedCase.caseNumber}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Filed: {new Date(selectedCase.filedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                {selectedCase.court && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {selectedCase.court}
                                    </div>
                                )}
                                {selectedCase.nextHearing && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-600 font-medium">Next Hearing</p>
                                        <p className="text-sm text-blue-700 font-semibold">{new Date(selectedCase.nextHearing).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                                <div className="space-y-3">
                                    {selectedCase.timeline?.slice(0, 4).map((event, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{event.event}</p>
                                                <p className="text-xs text-gray-500">{event.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-500">Select a case to view details</div>
                    )}
                </div>
            </div>
        </div>
    );
}
