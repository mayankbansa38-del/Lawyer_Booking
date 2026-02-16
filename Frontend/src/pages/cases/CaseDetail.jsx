/**
 * CaseDetail — Full case view with tabbed navigation
 * Shared between lawyer/case/:id and user/case/:id routes
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseAPI, chatAPI, documentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './CaseDetail.css';

const TABS = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'chat', label: 'Messages', icon: '💬' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'history', label: 'History', icon: '🕒' },
];

const STATUS_MAP = {
    OPEN: { label: 'Open', color: '#22c55e' },
    IN_PROGRESS: { label: 'In Progress', color: '#6366f1' },
    PENDING_REVIEW: { label: 'Pending Review', color: '#f59e0b' },
    CLOSED: { label: 'Closed', color: '#94a3b8' },
    CANCELLED: { label: 'Cancelled', color: '#ef4444' },
};

export default function CaseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [caseData, setCaseData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [messages, setMessages] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabLoading, setTabLoading] = useState(false);

    // Load case data
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

    // Load tab-specific data
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
                    case 'history': {
                        const res = await caseAPI.getHistory(id);
                        setHistory(res.data || []);
                        break;
                    }
                    default:
                        break;
                }
            } catch (err) {
                console.error(`Failed to load ${activeTab}:`, err);
            } finally {
                setTabLoading(false);
            }
        })();
    }, [id, activeTab]);

    if (loading) {
        return (
            <div className="case-detail__loading">
                <div className="spinner" /><span>Loading case...</span>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="case-detail__empty">
                <h3>Case not found</h3>
                <button onClick={() => navigate(-1)}>Go back</button>
            </div>
        );
    }

    const status = STATUS_MAP[caseData.status] || STATUS_MAP.OPEN;

    return (
        <div className="case-detail">
            {/* Header */}
            <div className="case-detail__header">
                <button className="case-detail__back" onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <div className="case-detail__title-row">
                    <div>
                        <h1>{caseData.title}</h1>
                        <p className="case-detail__case-number">{caseData.caseNumber}</p>
                    </div>
                    <span className="case-detail__status" style={{ background: status.color + '20', color: status.color, borderColor: status.color + '40' }}>
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="case-detail__tabs">
                {TABS.map(tab => (
                    <button key={tab.id} className={`case-detail__tab ${activeTab === tab.id ? 'case-detail__tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                        <span className="case-detail__tab-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="case-detail__content">
                {tabLoading && <div className="case-detail__tab-loading"><div className="spinner" /></div>}

                {activeTab === 'overview' && (
                    <div className="case-detail__overview">
                        <div className="case-detail__info-grid">
                            <InfoCard label="Priority" value={caseData.priority || 'Normal'} />
                            <InfoCard label="Filed Date" value={caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
                            <InfoCard label="Client" value={caseData.client ? `${caseData.client.firstName} ${caseData.client.lastName}` : '—'} />
                            <InfoCard label="Lawyer" value={caseData.lawyer?.user ? `${caseData.lawyer.user.firstName} ${caseData.lawyer.user.lastName}` : '—'} />
                        </div>
                        {caseData.description && (
                            <div className="case-detail__description">
                                <h3>Description</h3>
                                <p>{caseData.description}</p>
                            </div>
                        )}
                        <div className="case-detail__stats-row">
                            <StatCard label="Messages" value={caseData._count?.messages || 0} />
                            <StatCard label="Documents" value={caseData._count?.documents || 0} />
                            <StatCard label="Updates" value={caseData._count?.history || 0} />
                        </div>
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="case-detail__messages">
                        {messages.length === 0 ? (
                            <div className="case-detail__empty-tab">No messages in this case yet.</div>
                        ) : messages.map(m => (
                            <div key={m.id} className={`case-detail__msg ${m.senderId === user?.id ? 'case-detail__msg--own' : ''}`}>
                                <div className="case-detail__msg-bubble">{m.content}</div>
                                <span className="case-detail__msg-time">{new Date(m.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="case-detail__docs">
                        {documents.length === 0 ? (
                            <div className="case-detail__empty-tab">No documents uploaded yet.</div>
                        ) : documents.map(d => (
                            <div key={d.id} className="case-detail__doc-card">
                                <div className="case-detail__doc-icon">📄</div>
                                <div className="case-detail__doc-info">
                                    <h4>{d.title || d.originalName}</h4>
                                    <p>{d.fileType} · {(d.fileSize / 1024).toFixed(1)}KB · {new Date(d.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="case-detail__history">
                        {history.length === 0 ? (
                            <div className="case-detail__empty-tab">No activity history yet.</div>
                        ) : history.map((h, i) => (
                            <div key={h.id || i} className="case-detail__history-item">
                                <div className="case-detail__history-dot" />
                                <div className="case-detail__history-content">
                                    <p className="case-detail__history-action">{h.action}</p>
                                    <p className="case-detail__history-detail">{h.details || h.description}</p>
                                    <span className="case-detail__history-time">{new Date(h.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="info-card">
            <span className="info-card__label">{label}</span>
            <span className="info-card__value">{value}</span>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="stat-card">
            <span className="stat-card__value">{value}</span>
            <span className="stat-card__label">{label}</span>
        </div>
    );
}
