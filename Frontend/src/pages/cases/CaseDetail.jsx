/**
 * CaseDetail — Full case view with tabbed navigation
 * Shared between lawyer/case/:id and user/case/:id routes
 * Uses Tailwind CSS exclusively.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { caseAPI, chatAPI, documentAPI, casePaymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TABS = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'payments', label: 'Payments', icon: '💰' },
    { id: 'chat', label: 'Messages', icon: '💬' },
    { id: 'documents', label: 'Documents', icon: '📄' },
];

const STATUS_MAP = {
    REQUESTED: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    OPEN: { label: 'Open', color: 'bg-green-100 text-green-700 border-green-300' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    PENDING_DOCS: { label: 'Pending Docs', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    UNDER_REVIEW: { label: 'Under Review', color: 'bg-violet-100 text-violet-700 border-violet-300' },
    CLOSED: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-300' },
    RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    REJECTED: { label: 'Declined', color: 'bg-red-100 text-red-700 border-red-300' },
};

const PAYMENT_STATUS = {
    REQUESTED: { label: 'Requested', cls: 'bg-amber-100 text-amber-700' },
    PROCESSING: { label: 'Processing', cls: 'bg-indigo-100 text-indigo-700' },
    DENIED: { label: 'Denied', cls: 'bg-red-100 text-red-700' },
    COMPLETED: { label: 'Paid', cls: 'bg-emerald-100 text-emerald-700' },
    FAILED: { label: 'Failed', cls: 'bg-red-100 text-red-700' },
};

function formatPaise(paise) {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function CaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [caseData, setCaseData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [messages, setMessages] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);

    // Desc editing (lawyers)
    const [editingDesc, setEditingDesc] = useState(false);
    const [descDraft, setDescDraft] = useState('');
    const [savingDesc, setSavingDesc] = useState(false);

    // Payment request modal (lawyers)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentDescription, setPaymentDescription] = useState('');
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    // Pay/deny action
    const [actionLoading, setActionLoading] = useState(null);

    // Document upload
    const [showDocUploadModal, setShowDocUploadModal] = useState(false);
    const [docUploading, setDocUploading] = useState(false);
    const [docUploadData, setDocUploadData] = useState({ title: '', documentType: 'Legal Document' });
    const docFileInputRef = useRef(null);
    const [docSelectedFile, setDocSelectedFile] = useState(null);

    const isLawyer = user?.role === 'LAWYER' || user?.role === 'ADMIN';

    useEffect(() => {
        (async () => {
            try {
                const res = await caseAPI.getById(id);
                setCaseData(res.data);
            } catch (err) {
                console.error('Failed to load case:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        (async () => {
            setTabLoading(true);
            try {
                switch (activeTab) {
                    case 'chat': {
                        const res = await chatAPI.getMessages(id);
                        setMessages(res.data || []);
                        break;
                    }
                    case 'documents': {
                        const res = await documentAPI.getByCase(id);
                        setDocuments(res.data || []);
                        break;
                    }
                    case 'payments': {
                        const res = await casePaymentAPI.getCasePayments(id);
                        setPayments(res.data || []);
                        break;
                    }
                    default: break;
                }
            } catch (err) {
                console.error(`Failed to load ${activeTab}:`, err);
            } finally {
                setTabLoading(false);
            }
        })();
    }, [id, activeTab]);

    const handleDescSave = async () => {
        setSavingDesc(true);
        try {
            await caseAPI.update(id, { description: descDraft });
            setCaseData(prev => ({ ...prev, description: descDraft }));
            setEditingDesc(false);
        } catch (err) {
            console.error('Failed to update description:', err);
        } finally {
            setSavingDesc(false);
        }
    };

    // ── Payment handlers ──
    const handleRequestPayment = async (e) => {
        e.preventDefault();
        setPaymentError('');
        const amt = parseFloat(paymentAmount);
        if (!amt || amt <= 0) { setPaymentError('Enter a valid amount in rupees'); return; }
        if (!paymentDescription.trim()) { setPaymentError('Description is required'); return; }
        setSubmittingPayment(true);
        try {
            await casePaymentAPI.requestPayment(id, { amount: amt, description: paymentDescription.trim() });
            const res = await casePaymentAPI.getCasePayments(id);
            setPayments(res.data || []);
            setShowPaymentModal(false);
            setPaymentAmount('');
            setPaymentDescription('');
        } catch (err) {
            setPaymentError(err.response?.data?.message || 'Failed to send payment request');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const handlePay = async (paymentId) => {
        if (!window.confirm('Confirm payment? This will process the payment immediately.')) return;
        setActionLoading(paymentId);
        try {
            await casePaymentAPI.payPayment(paymentId);
            const res = await casePaymentAPI.getCasePayments(id);
            setPayments(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Payment failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeny = async (paymentId) => {
        if (!window.confirm('Are you sure you want to deny this payment request?')) return;
        setActionLoading(paymentId);
        try {
            await casePaymentAPI.denyPayment(paymentId);
            const res = await casePaymentAPI.getCasePayments(id);
            setPayments(res.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deny payment');
        } finally {
            setActionLoading(null);
        }
    };

    const handleStartMeeting = async () => {
        setActionLoading('meeting');
        try {
            const res = await caseAPI.createMeeting(id);
            if (res.data?.link) {
                // Open meeting in new tab
                window.open(res.data.link, '_blank', 'noopener,noreferrer');
                // Refresh chat to show the new message
                if (activeTab === 'chat') {
                    const chatRes = await chatAPI.getMessages(id);
                    setMessages(chatRes.data || []);
                }
                alert('Meeting started! Client has been notified.');
            }
        } catch (err) {
            console.error('Failed to start meeting:', err);
            alert(err.response?.data?.message || 'Failed to start meeting');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDocUpload = async () => {
        if (!docSelectedFile) return;
        setDocUploading(true);
        try {
            const formData = new FormData();
            formData.append('document', docSelectedFile);
            if (docUploadData.title) formData.append('description', docUploadData.title);
            formData.append('caseId', id);

            const typeMap = {
                'Legal Document': 'CASE_DOCUMENT',
                'Evidence': 'CASE_DOCUMENT',
                'Court Document': 'CASE_DOCUMENT',
                'Other': 'OTHER'
            };
            formData.append('type', typeMap[docUploadData.documentType] || 'OTHER');

            await documentAPI.upload(formData);
            setShowDocUploadModal(false);
            setDocSelectedFile(null);
            setDocUploadData({ title: '', documentType: 'Legal Document' });

            // Refresh
            const res = await documentAPI.getByCase(id);
            setDocuments(res.data || []);
        } catch (error) {
            console.error('Error uploading document:', error);
            alert(error.response?.data?.message || 'Upload failed');
        } finally {
            setDocUploading(false);
        }
    };

    const chatBasePath = location.pathname.includes('/lawyer/') ? '/lawyer/chat' : '/user/chat';

    // ── Loading / empty states ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
                <div className="w-6 h-6 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm">Loading case...</span>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
                <h3 className="text-lg font-semibold text-slate-700">Case not found</h3>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors">Go back</button>
            </div>
        );
    }

    const status = STATUS_MAP[caseData.status] || STATUS_MAP.OPEN;
    const totalPaid = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amountInPaise, 0);
    const pendingCount = payments.filter(p => p.status === 'REQUESTED' || p.status === 'PROCESSING').length;

    return (
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-6">
            {/* ── Back + Title ── */}
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-indigo-500 text-sm font-medium mb-4 hover:text-indigo-700 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                Back
            </button>
            <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{caseData.title}</h1>
                    <p className="text-sm text-slate-400 mt-1">{caseData.caseNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                    {isLawyer && ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'PENDING_DOCS'].includes(caseData.status) && (
                        <button
                            onClick={handleStartMeeting}
                            disabled={actionLoading === 'meeting'}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            title="Start a video meeting and notify the client"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                            {actionLoading === 'meeting' ? 'Starting...' : 'Video Call'}
                        </button>
                    )}
                    <span className={`shrink-0 px-3.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* ── Tabs (at the top) ── */}
            <div className="flex gap-1 border-b border-slate-200 mt-4 mb-6 overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <span className="text-base">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}
            <div className="min-h-[300px]">
                {tabLoading && (
                    <div className="flex justify-center py-10">
                        <div className="w-6 h-6 border-[3px] border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                )}

                {/* ─── Overview ─── */}
                {activeTab === 'overview' && !tabLoading && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <InfoCard label="Priority" value={caseData.priority || 'Normal'} />
                            <InfoCard label="Filed" value={caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
                            <InfoCard label="Client" value={caseData.client ? `${caseData.client.firstName} ${caseData.client.lastName}` : '—'} />
                            <InfoCard label="Lawyer" value={caseData.lawyer?.user ? `${caseData.lawyer.user.firstName} ${caseData.lawyer.user.lastName}` : '—'} />
                        </div>

                        {/* Description */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-slate-600">Description</h3>
                                {isLawyer && !editingDesc && (
                                    <button onClick={() => { setDescDraft(caseData.description || ''); setEditingDesc(true); }} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-500 border border-slate-200 rounded-md hover:bg-indigo-50 transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        Edit
                                    </button>
                                )}
                            </div>
                            {editingDesc ? (
                                <div className="space-y-3">
                                    <textarea value={descDraft} onChange={e => setDescDraft(e.target.value)} rows={5} placeholder="Describe the case..." className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-y min-h-[100px]" />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingDesc(false)} disabled={savingDesc} className="px-4 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-md hover:bg-slate-100">Cancel</button>
                                        <button onClick={handleDescSave} disabled={savingDesc} className="px-5 py-1.5 text-xs font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:opacity-50">{savingDesc ? 'Saving...' : 'Save'}</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 leading-relaxed">{caseData.description || 'No description provided.'}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl p-5 text-center text-white">
                                <span className="block text-2xl font-bold">{caseData._count?.messages || 0}</span>
                                <span className="text-xs opacity-80">Messages</span>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl p-5 text-center text-white">
                                <span className="block text-2xl font-bold">{caseData._count?.documents || 0}</span>
                                <span className="text-xs opacity-80">Documents</span>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl p-5 text-center text-white">
                                <span className="block text-2xl font-bold">{caseData._count?.history || 0}</span>
                                <span className="text-xs opacity-80">Updates</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Payments ─── */}
                {activeTab === 'payments' && !tabLoading && (
                    <div className="space-y-5">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-xl font-bold text-slate-900">{payments.length}</span>
                                <span className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-400 mt-1">Total Requests</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-xl font-bold text-emerald-600">{formatPaise(totalPaid)}</span>
                                <span className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-400 mt-1">Total Paid</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-xl font-bold text-amber-500">{pendingCount}</span>
                                <span className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-400 mt-1">Pending</span>
                            </div>
                        </div>

                        {/* Lawyer: Request payment */}
                        {isLawyer && !['CLOSED', 'RESOLVED', 'REJECTED'].includes(caseData.status) && (
                            <button onClick={() => { setShowPaymentModal(true); setPaymentError(''); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                Request Payment
                            </button>
                        )}

                        {/* Payment list */}
                        {payments.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm">No payment requests yet.</div>
                        ) : (
                            <div className="space-y-3">
                                {payments.map(p => {
                                    const ps = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.REQUESTED;
                                    const canAct = p.status === 'REQUESTED' && !isLawyer;
                                    const busy = actionLoading === p.id;
                                    return (
                                        <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xl font-bold text-slate-900">{formatPaise(p.amountInPaise)}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold uppercase tracking-wide ${ps.cls}`}>{ps.label}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 leading-relaxed mb-3">{p.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                {canAct && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handlePay(p.id)} disabled={busy} className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                                                            {busy ? 'Processing...' : 'Pay Now'}
                                                        </button>
                                                        <button onClick={() => handleDeny(p.id)} disabled={busy} className="px-3 py-1.5 text-red-500 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors">
                                                            Deny
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Request Payment Modal */}
                        {showPaymentModal && (
                            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]" onClick={() => setShowPaymentModal(false)}>
                                <div className="bg-white rounded-2xl p-7 w-full max-w-[440px] shadow-2xl animate-[slideUp_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-bold text-slate-900">Request Payment</h3>
                                        <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
                                    </div>
                                    <form onSubmit={handleRequestPayment}>
                                        <div className="mb-4">
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Amount (₹)</label>
                                            <input type="number" min="1" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 5000" required autoFocus className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                                            <textarea value={paymentDescription} onChange={e => setPaymentDescription(e.target.value)} placeholder="e.g. Consultation fee for initial review" rows={3} required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-y min-h-[70px]" />
                                        </div>
                                        {paymentError && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-md mb-3">{paymentError}</p>}
                                        <div className="flex justify-end gap-2 mt-5">
                                            <button type="button" onClick={() => setShowPaymentModal(false)} disabled={submittingPayment} className="px-5 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100">Cancel</button>
                                            <button type="submit" disabled={submittingPayment} className="px-6 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors">{submittingPayment ? 'Sending...' : 'Send Request'}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Messages ─── */}
                {activeTab === 'chat' && !tabLoading && (
                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto px-2">
                        <div className="flex justify-end pb-3 mb-3 border-b border-slate-200">
                            <button onClick={() => navigate(chatBasePath, { state: { caseId: id } })} className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                Open Full Chat
                            </button>
                        </div>
                        {messages.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-sm">No messages in this case yet.</div>
                        ) : messages.map(m => (
                            <div key={m.id} className={`max-w-[75%] flex flex-col ${m.senderId === user?.id ? 'self-end' : ''}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.senderId === user?.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'}`}>{m.content}</div>
                                <span className={`text-[0.65rem] text-slate-400 mt-0.5 px-2 ${m.senderId === user?.id ? 'text-right' : ''}`}>{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── Documents ─── */}
                {activeTab === 'documents' && !tabLoading && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDocUploadModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-semibold transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Upload Document
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {documents.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-slate-400 text-sm bg-slate-50 border border-slate-200 rounded-xl">No documents uploaded yet.</div>
                            ) : documents.map(d => (
                                <div key={d.id} className="relative group">
                                    <div
                                        onClick={async () => {
                                            try {
                                                const res = await documentAPI.download(d.id);
                                                if (res.data?.url) {
                                                    window.open(res.data.url, '_blank', 'noopener,noreferrer');
                                                }
                                            } catch (err) {
                                                alert('Could not open document.');
                                            }
                                        }}
                                        className="flex items-center gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer w-full"
                                    >
                                        <span className="text-2xl">📄</span>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-slate-900 truncate">{d.description || d.originalName}</h4>
                                            <p className="text-xs text-slate-400 mt-1">{d.type} · {(d.size / 1024).toFixed(1)}KB · {new Date(d.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {isLawyer && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!window.confirm('Delete this document?')) return;
                                                try {
                                                    await documentAPI.delete(d.id);
                                                    setDocuments(docs => docs.filter(doc => doc.id !== d.id));
                                                } catch (err) {
                                                    alert('Failed to delete document');
                                                }
                                            }}
                                            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                            title="Delete document"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Document Upload Modal */}
            {showDocUploadModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.15s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-[slideUp_0.2s_ease-out]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                            <button onClick={() => { setShowDocUploadModal(false); setDocSelectedFile(null); }} className="p-1 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                <input
                                    type="file"
                                    ref={docFileInputRef}
                                    onChange={(e) => setDocSelectedFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                {docSelectedFile && <p className="text-xs text-gray-500 mt-1">{(docSelectedFile.size / 1024).toFixed(1)} KB</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={docUploadData.title}
                                    onChange={(e) => setDocUploadData(d => ({ ...d, title: e.target.value }))}
                                    placeholder="Document title"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    value={docUploadData.documentType}
                                    onChange={(e) => setDocUploadData(d => ({ ...d, documentType: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white outline-none"
                                >
                                    <option>Legal Document</option>
                                    <option>Evidence</option>
                                    <option>Court Document</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowDocUploadModal(false); setDocSelectedFile(null); }}
                                className="flex-1 py-2 text-sm font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDocUpload}
                                disabled={!docSelectedFile || docUploading}
                                className="flex-1 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {docUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {docUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-400">{label}</span>
            <span className="text-sm font-semibold text-slate-900">{value}</span>
        </div>
    );
}
