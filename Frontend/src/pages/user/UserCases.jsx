/**
 * User Cases Page
 * View active and past cases
 */

import { useState, useEffect } from 'react';
import { Briefcase, Calendar, ChevronRight, FileText } from 'lucide-react';
import { PageHeader, CaseCard, EmptyState } from '../../components/dashboard';
import { caseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'closed', label: 'Closed' },
];

export default function UserCases() {
    const { user } = useAuth();
    const [cases, setCases] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);

    useEffect(() => {
        async function fetchCases() {
            try {
                const { data } = await caseAPI.getAll({ clientId: user?.id || 'u1' });
                setCases(data);
            } catch (error) {
                console.error('Error fetching cases:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, [user]);

    const filteredCases = cases.filter(c => c.status === activeTab);
    const counts = { active: cases.filter(c => c.status === 'active').length, pending: cases.filter(c => c.status === 'pending').length, closed: cases.filter(c => c.status === 'closed').length };

    return (
        <div>
            <PageHeader title="My Cases" subtitle="Track your legal cases" />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                        {tab.label}<span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>{counts[tab.id]}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cases List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                    ) : filteredCases.length > 0 ? (
                        <div className="space-y-4">
                            {filteredCases.map(c => (
                                <div key={c.id} onClick={() => setSelectedCase(c)} className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${selectedCase?.id === c.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:shadow-md'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{c.title}</h4>
                                            <p className="text-sm text-gray-500">{c.caseNumber}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                        <span>Lawyer: {c.lawyerName}</span>
                                        {c.nextHearing && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Next: {new Date(c.nextHearing).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} title="No cases" description={`You don't have any ${activeTab} cases.`} />
                    )}
                </div>

                {/* Case Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedCase ? (
                        <>
                            <h3 className="font-semibold text-gray-900 mb-1">{selectedCase.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{selectedCase.caseNumber}</p>
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Assigned Lawyer</p>
                                    <p className="font-medium text-gray-900">{selectedCase.lawyerName}</p>
                                </div>
                                {selectedCase.nextHearing && (
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-600">Next Hearing</p>
                                        <p className="font-medium text-blue-700">{new Date(selectedCase.nextHearing).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    </div>
                                )}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Timeline</h4>
                                    <div className="space-y-3">
                                        {selectedCase.timeline?.slice(0, 5).map((event, idx) => (
                                            <div key={idx} className="flex gap-3"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500" /><div><p className="text-sm font-medium text-gray-900">{event.event}</p><p className="text-xs text-gray-500">{event.date}</p></div></div>
                                        ))}
                                    </div>
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
