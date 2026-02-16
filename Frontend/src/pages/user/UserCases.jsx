/**
 * User Cases Page - Enhanced
 * Premium design with stat cards and improved case detail panel
 */

import { useState, useEffect } from 'react';
import { Briefcase, Calendar, ChevronRight, FileText, Scale, Clock, AlertCircle } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
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
                if (!user?.id) return;
                const { data } = await caseAPI.getAll({ clientId: user.id });
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
    const counts = {
        active: cases.filter(c => c.status === 'active').length,
        pending: cases.filter(c => c.status === 'pending').length,
        closed: cases.filter(c => c.status === 'closed').length
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
                <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
                <p className="text-gray-500 mt-1">Track your legal cases</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Active Cases" value={counts.active} icon={Briefcase} color="bg-blue-500" />
                <StatCard title="Pending" value={counts.pending} icon={Clock} color="bg-amber-500" />
                <StatCard title="Closed" value={counts.closed} icon={Scale} color="bg-green-500" />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                        {tab.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>{counts[tab.id]}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cases List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : filteredCases.length > 0 ? (
                        <div className="space-y-4">
                            {filteredCases.map(c => (
                                <div key={c.id} onClick={() => setSelectedCase(c)} className={`bg-white rounded-2xl shadow-sm border p-5 cursor-pointer transition-all duration-200 ${selectedCase?.id === c.id ? 'border-blue-500 ring-2 ring-blue-100 shadow-md' : 'border-gray-100 hover:shadow-md hover:border-gray-200'}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{c.title}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{c.caseNumber}</p>
                                        </div>
                                        <ChevronRight className={`w-5 h-5 transition-transform ${selectedCase?.id === c.id ? 'text-blue-500 rotate-90' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <Scale className="w-3 h-3 text-indigo-600" />
                                            </div>
                                            {c.lawyerName}
                                        </span>
                                        {c.nextHearing && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg text-blue-700 text-xs font-medium">
                                                <Calendar className="w-3 h-3" /> Next: {new Date(c.nextHearing).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} title="No cases" description={`You don't have any ${activeTab} cases.`} />
                    )}
                </div>

                {/* Case Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedCase ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedCase.title}</h3>
                                    <p className="text-sm text-gray-500">{selectedCase.caseNumber}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3.5 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Lawyer</p>
                                    <p className="font-medium text-gray-900 mt-1">{selectedCase.lawyerName}</p>
                                </div>
                                {selectedCase.nextHearing && (
                                    <div className="p-3.5 bg-blue-50 rounded-xl">
                                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Next Hearing</p>
                                        <p className="font-medium text-blue-700 mt-1">{new Date(selectedCase.nextHearing).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    </div>
                                )}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /> Timeline</h4>
                                    <div className="space-y-3">
                                        {selectedCase.timeline?.slice(0, 5).map((event, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                                                    {idx < (selectedCase.timeline?.length - 1) && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
                                                </div>
                                                <div className="pb-3">
                                                    <p className="text-sm font-medium text-gray-900">{event.event}</p>
                                                    <p className="text-xs text-gray-500">{event.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">Select a case to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
