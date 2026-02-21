/**
 * User Cases Page
 * Shows the user's cases with request-based workflow status tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, ChevronRight, Scale, Clock, AlertCircle, Plus, XCircle, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../../components/dashboard';
import { caseAPI } from '../../services/api';

const STATUS_CONFIG = {
    REQUESTED: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' },
    OPEN: { label: 'Active', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
    PENDING_DOCS: { label: 'Pending Docs', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500' },
    CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' },
    RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500' },
    REJECTED: { label: 'Declined', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
};

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'REQUESTED', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'CLOSED', label: 'Closed' },
    { id: 'REJECTED', label: 'Declined' },
];

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
            {config.label}
        </span>
    );
}

export default function UserCases() {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);

    useEffect(() => {
        async function fetchCases() {
            try {
                const { data } = await caseAPI.getAll();
                setCases(data || []);
            } catch (error) {
                console.error('Error fetching cases:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCases();
    }, []);

    const filteredCases = cases.filter(c => {
        if (activeTab === 'all') return true;
        // "active" tab groups OPEN, IN_PROGRESS, PENDING_DOCS, UNDER_REVIEW
        if (activeTab === 'active') return ['OPEN', 'IN_PROGRESS', 'PENDING_DOCS', 'UNDER_REVIEW'].includes(c.status);
        return c.status === activeTab;
    });

    const counts = {
        all: cases.length,
        REQUESTED: cases.filter(c => c.status === 'REQUESTED').length,
        active: cases.filter(c => ['OPEN', 'IN_PROGRESS', 'PENDING_DOCS', 'UNDER_REVIEW'].includes(c.status)).length,
        CLOSED: cases.filter(c => ['CLOSED', 'RESOLVED'].includes(c.status)).length,
        REJECTED: cases.filter(c => c.status === 'REJECTED').length,
    };

    // eslint-disable-next-line no-unused-vars
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
                    <p className="text-gray-500 mt-1">Track your legal cases and requests</p>
                </div>
                <button
                    onClick={() => navigate('/user/create-case')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Request a Case
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard title="Pending Requests" value={counts.REQUESTED} icon={Clock} color="bg-amber-500" />
                <StatCard title="Active Cases" value={counts.active} icon={Briefcase} color="bg-blue-500" />
                <StatCard title="Closed" value={counts.CLOSED} icon={CheckCircle2} color="bg-green-500" />
                <StatCard title="Declined" value={counts.REJECTED} icon={XCircle} color="bg-red-500" />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {TABS.map(tab => (
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
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">{c.title}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{c.caseNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <StatusBadge status={c.status} />
                                            <ChevronRight className={`w-5 h-5 transition-transform ${selectedCase?.id === c.id ? 'text-blue-500 rotate-90' : 'text-gray-400'}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <Scale className="w-3 h-3 text-indigo-600" />
                                            </div>
                                            {c.lawyer?.name || 'Assigned Lawyer'}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} title="No cases" description={activeTab === 'all' ? "You haven't created any case requests yet." : `No ${TABS.find(t => t.id === activeTab)?.label?.toLowerCase()} cases.`} />
                    )}
                </div>

                {/* Case Details Sidebar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedCase ? (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{selectedCase.title}</h3>
                                    <p className="text-sm text-gray-500">{selectedCase.caseNumber}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3.5 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                                    <div className="mt-1.5"><StatusBadge status={selectedCase.status} /></div>
                                </div>
                                <div className="p-3.5 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Lawyer</p>
                                    <p className="font-medium text-gray-900 mt-1">{selectedCase.lawyer?.name || '—'}</p>
                                </div>
                                <div className="p-3.5 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</p>
                                    <p className="font-medium text-gray-900 mt-1">{selectedCase.priority}</p>
                                </div>
                                {selectedCase.description && (
                                    <div className="p-3.5 bg-gray-50 rounded-xl">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                                        <p className="text-sm text-gray-700 mt-1">{selectedCase.description}</p>
                                    </div>
                                )}
                                {selectedCase.status === 'REQUESTED' && (
                                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                            <p className="text-sm text-amber-700">Waiting for the lawyer to review and approve your request.</p>
                                        </div>
                                    </div>
                                )}
                                {selectedCase.status === 'REJECTED' && (
                                    <div className="p-3.5 bg-red-50 rounded-xl border border-red-200">
                                        <div className="flex items-start gap-2">
                                            <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                            <p className="text-sm text-red-700">This case request was declined by the lawyer.</p>
                                        </div>
                                    </div>
                                )}
                                {['OPEN', 'IN_PROGRESS'].includes(selectedCase.status) && (
                                    <button
                                        onClick={() => navigate(`/user/cases/${selectedCase.id}`)}
                                        className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        View Full Details
                                    </button>
                                )}
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
