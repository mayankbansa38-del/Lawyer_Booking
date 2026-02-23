/**
 * Lawyer Cases Page
 * View, manage, approve/reject case requests, and create new cases
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Search, ChevronRight, Calendar, Clock, Scale, Plus, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { caseAPI, clientAPI } from '../../services/api';

const STATUS_CONFIG = {
    REQUESTED: { label: 'Pending Request', color: 'bg-amber-100 text-amber-700', dotColor: 'bg-amber-500' },
    OPEN: { label: 'Open', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
    PENDING_DOCS: { label: 'Pending Docs', color: 'bg-orange-100 text-orange-700', dotColor: 'bg-orange-500' },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500' },
    CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' },
    RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500' },
    REJECTED: { label: 'Declined', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
};

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'REQUESTED', label: 'Requests' },
    { id: 'active', label: 'Active' },
    { id: 'CLOSED', label: 'Closed' },
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

export default function LawyerCases() {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCase, setSelectedCase] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // 'approve' | 'reject' | null
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    // ── Create case modal state ──
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [clients, setClients] = useState([]);
    const [createForm, setCreateForm] = useState({ title: '', description: '', clientId: '', priority: 'MEDIUM' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    const fetchCases = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await caseAPI.getAll();
            setCases(data || []);
        } catch (error) {
            console.error('Error fetching cases:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const filteredCases = cases.filter(c => {
        // Tab filter
        let tabMatch = true;
        if (activeTab === 'REQUESTED') tabMatch = c.status === 'REQUESTED';
        else if (activeTab === 'active') tabMatch = ['OPEN', 'IN_PROGRESS', 'PENDING_DOCS', 'UNDER_REVIEW'].includes(c.status);
        else if (activeTab === 'CLOSED') tabMatch = ['CLOSED', 'RESOLVED', 'REJECTED'].includes(c.status);

        // Search filter
        const q = searchQuery.toLowerCase();
        const searchMatch = !q ||
            c.title.toLowerCase().includes(q) ||
            c.caseNumber.toLowerCase().includes(q) ||
            c.client?.name?.toLowerCase().includes(q);

        return tabMatch && searchMatch;
    });

    const counts = {
        all: cases.length,
        REQUESTED: cases.filter(c => c.status === 'REQUESTED').length,
        active: cases.filter(c => ['OPEN', 'IN_PROGRESS', 'PENDING_DOCS', 'UNDER_REVIEW'].includes(c.status)).length,
        CLOSED: cases.filter(c => ['CLOSED', 'RESOLVED', 'REJECTED'].includes(c.status)).length,
    };

    // ── Approve handler ──
    const handleApprove = async (caseId) => {
        if (!window.confirm('Approve this case request? The client will be notified.')) return;
        setActionLoading('approve');
        try {
            await caseAPI.approve(caseId);
            await fetchCases();
            setSelectedCase(null);
        } catch (err) {
            console.error('Approve failed:', err);
            alert(err.response?.data?.message || 'Failed to approve case');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Reject handler ──
    const handleReject = async (caseId) => {
        setActionLoading('reject');
        try {
            await caseAPI.reject(caseId, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            await fetchCases();
            setSelectedCase(null);
        } catch (err) {
            console.error('Reject failed:', err);
            alert(err.response?.data?.message || 'Failed to reject case');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Create case handler ──
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.title.trim() || !createForm.clientId) {
            setCreateError('Title and client are required');
            return;
        }
        setCreateLoading(true);
        setCreateError('');
        try {
            await caseAPI.create(createForm);
            setShowCreateModal(false);
            setCreateForm({ title: '', description: '', clientId: '', priority: 'MEDIUM' });
            await fetchCases();
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create case');
        } finally {
            setCreateLoading(false);
        }
    };

    const openCreateModal = async () => {
        setShowCreateModal(true);
        try {
            const res = await clientAPI.getByLawyer();
            setClients(res.data || []);
        } catch (err) {
            console.error('Failed to fetch clients:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader title="Cases" subtitle="Manage your legal cases and requests" />
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Case
                </button>
            </div>

            {/* Request alert banner */}
            {counts.REQUESTED > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        You have <strong>{counts.REQUESTED}</strong> pending case request{counts.REQUESTED > 1 ? 's' : ''} awaiting your review.
                    </p>
                    <button
                        onClick={() => setActiveTab('REQUESTED')}
                        className="ml-auto text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                    >
                        Review now
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                    >
                        {tab.label}
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                            {counts[tab.id]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cases List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                    ) : filteredCases.length > 0 ? (
                        <div className="space-y-3">
                            {filteredCases.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCase(c)}
                                    className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all duration-200 ${selectedCase?.id === c.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:shadow-md hover:border-gray-200'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">{c.title}</h4>
                                            <p className="text-sm text-gray-500 mt-0.5">{c.caseNumber}</p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-3">
                                            <StatusBadge status={c.status} />
                                            <ChevronRight className={`w-5 h-5 ${selectedCase?.id === c.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <Scale className="w-3.5 h-3.5 text-gray-400" />
                                            {c.client?.name || 'Client'}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Briefcase} title="No cases found" description="No cases match your criteria." />
                    )}
                </div>

                {/* Case Details + Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit sticky top-24">
                    {selectedCase ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-900">{selectedCase.title}</h3>
                                <p className="text-sm text-gray-500">{selectedCase.caseNumber}</p>
                            </div>
                            <div><StatusBadge status={selectedCase.status} /></div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Scale className="w-4 h-4 text-gray-400" />
                                    Client: {selectedCase.client?.name}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Filed: {new Date(selectedCase.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                {selectedCase.description && (
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                                        <p className="text-gray-700">{selectedCase.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Approve / Reject Actions for REQUESTED cases */}
                            {selectedCase.status === 'REQUESTED' && (
                                <div className="border-t pt-4 space-y-2">
                                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Action Required</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(selectedCase.id)}
                                            disabled={actionLoading === 'approve'}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={actionLoading === 'reject'}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* View details link for active cases */}
                            {['OPEN', 'IN_PROGRESS'].includes(selectedCase.status) && (
                                <button
                                    onClick={() => navigate(`/lawyer/cases/${selectedCase.id}`)}
                                    className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    View Full Details
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">Select a case to view details</div>
                    )}
                </div>
            </div>

            {/* ── Reject Modal ── */}
            {showRejectModal && selectedCase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Decline Case Request</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Declining &ldquo;{selectedCase.title}&rdquo; from {selectedCase.client?.name}. The client will be notified.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            placeholder="Reason for declining (optional)..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 resize-none text-sm"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReject(selectedCase.id)}
                                disabled={actionLoading === 'reject'}
                                className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                            >
                                {actionLoading === 'reject' ? 'Declining...' : 'Confirm Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Case Modal ── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create a New Case</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            {createError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{createError}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                                {clients.length === 0 ? (
                                    <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">No clients found. Book a consultation first.</p>
                                ) : (
                                    <select
                                        value={createForm.clientId}
                                        onChange={(e) => setCreateForm(f => ({ ...f, clientId: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">Select a client...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.firstName} {c.lastName} ({c.email})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Case Title *</label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g., Property Dispute Resolution"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    placeholder="Brief description of the case..."
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <div className="flex gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setCreateForm(f => ({ ...f, priority: p }))}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${createForm.priority === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading || !createForm.title.trim() || !createForm.clientId}
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                                >
                                    {createLoading ? 'Creating...' : 'Create Case'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
