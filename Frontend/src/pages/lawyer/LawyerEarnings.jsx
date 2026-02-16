/**
 * Lawyer Earnings Page
 * Track earnings, payments, and manage payment credentials
 */

import { useState, useEffect, useCallback } from 'react';
import {
    DollarSign, TrendingUp, CheckCircle, Download, CreditCard,
    Calendar, Clock, User, ChevronDown, ChevronUp, Wallet,
    Building2, Save, Loader2, AlertCircle
} from 'lucide-react';
import { PageHeader, StatCard } from '../../components/dashboard';
import { paymentAPI, lawyerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── Status Badge Component ──────────────────────────────────────────────────

const STATUS_STYLES = {
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    FAILED: 'bg-red-50 text-red-700 border border-red-200',
    REFUNDED: 'bg-gray-100 text-gray-600 border border-gray-200',
    PROCESSING: 'bg-blue-50 text-blue-700 border border-blue-200',
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.PENDING}`}>
            {status}
        </span>
    );
}

// ─── Transaction Card Component ──────────────────────────────────────────────

function TransactionCard({ payment }) {
    const client = payment.booking?.client;
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
    const clientAvatar = client?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=f0f0f0&color=333`;
    const bookingDate = payment.booking?.scheduledDate
        ? new Date(payment.booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const bookingTime = payment.booking?.scheduledTime || '';
    const amount = Number(payment.amount);
    const txnId = payment.gatewayPaymentId || payment.id?.slice(0, 12);
    const method = payment.method || 'CARD';

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
            <div className="flex items-start justify-between gap-4">
                {/* Left: Client info */}
                <div className="flex items-center gap-3.5 min-w-0">
                    <img
                        src={clientAvatar}
                        alt={clientName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{clientName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{bookingDate}</span>
                            {bookingTime && (
                                <>
                                    <Clock className="w-3.5 h-3.5 ml-1" />
                                    <span>{bookingTime}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Amount & status */}
                <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</p>
                    <StatusBadge status={payment.status} />
                </div>
            </div>

            {/* Bottom row: method + txn id */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="font-medium">{method}</span>
                    {payment.booking?.meetingType && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-50 rounded-md text-gray-500">{payment.booking.meetingType}</span>
                    )}
                </div>
                <span className="font-mono text-gray-400" title={payment.gatewayPaymentId || payment.id}>
                    {payment.booking?.bookingNumber || `TXN-${txnId}`}
                </span>
            </div>
        </div>
    );
}

// ─── Payment Credentials Section ─────────────────────────────────────────────

function PaymentCredentials() {
    const [expanded, setExpanded] = useState(false);
    const [form, setForm] = useState({
        bankAccountName: '',
        bankAccountNumber: '',
        bankIfscCode: '',
        upiId: '',
    });
    const [saving, setSaving] = useState(false);
    const [loadingCreds, setLoadingCreds] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!expanded) return;
        setLoadingCreds(true);
        lawyerAPI.getPaymentCredentials()
            .then(res => {
                setForm(prev => ({ ...prev, ...res.data }));
            })
            .catch(() => { })
            .finally(() => setLoadingCreds(false));
    }, [expanded]);

    const handleSave = async () => {
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            await lawyerAPI.updatePaymentCredentials(form);
            setMessage({ text: 'Payment credentials updated successfully!', type: 'success' });
        } catch (err) {
            setMessage({
                text: err?.response?.data?.message || 'Failed to update credentials',
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 text-sm">Payment Acceptance Credentials</h3>
                        <p className="text-xs text-gray-400">Manage your bank account and UPI details</p>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {expanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-5">
                    {loadingCreds ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Bank Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Building2 className="w-4 h-4 text-gray-500" />
                                    Bank Account Details
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Account Holder Name</label>
                                        <input
                                            type="text"
                                            value={form.bankAccountName}
                                            onChange={e => setForm(prev => ({ ...prev, bankAccountName: e.target.value }))}
                                            placeholder="e.g. Advocate Sharma"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Account Number</label>
                                        <input
                                            type="text"
                                            value={form.bankAccountNumber}
                                            onChange={e => setForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                                            placeholder="e.g. 1234567890"
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">IFSC Code</label>
                                        <input
                                            type="text"
                                            value={form.bankIfscCode}
                                            onChange={e => setForm(prev => ({ ...prev, bankIfscCode: e.target.value.toUpperCase() }))}
                                            placeholder="e.g. SBIN0001234"
                                            maxLength={11}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm font-mono uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* UPI */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <CreditCard className="w-4 h-4 text-gray-500" />
                                    UPI Details
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">UPI ID</label>
                                    <input
                                        type="text"
                                        value={form.upiId}
                                        onChange={e => setForm(prev => ({ ...prev, upiId: e.target.value }))}
                                        placeholder="e.g. advocate@upi"
                                        className="w-full max-w-xs px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Feedback message */}
                            {message.text && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}

                            {/* Save button */}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : 'Save Credentials'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Export Helper ────────────────────────────────────────────────────────────

function exportCSV(payments) {
    const headers = ['Date', 'Client', 'Booking #', 'Amount (INR)', 'Method', 'Status', 'Transaction ID'];
    const rows = payments.map(p => {
        const client = p.booking?.client;
        const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown';
        const date = new Date(p.createdAt).toLocaleDateString('en-IN');
        return [
            date,
            clientName,
            p.booking?.bookingNumber || '',
            Number(p.amount),
            p.method || 'N/A',
            p.status,
            p.gatewayPaymentId || p.id,
        ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NyayBooker_Earnings_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LawyerEarnings() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({
        totalEarnings: 0,
        monthlyEarnings: 0,
        completedPayments: 0,
        pendingPayments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchData = useCallback(async () => {
        try {
            const [paymentsRes, summaryRes] = await Promise.all([
                paymentAPI.getAll(),
                paymentAPI.getEarningsSummary()
            ]);
            setPayments(paymentsRes.data || []);
            setSummary(summaryRes.data || {});
        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter.toUpperCase();
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Earnings"
                subtitle="Track your income, payments, and manage credentials"
                actions={
                    <button
                        onClick={() => exportCSV(payments)}
                        disabled={payments.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                }
            />

            {/* Stats — No "Pending Payouts" or "Pending Transactions" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Earnings"
                    value={`₹${Number(summary.totalEarnings || 0).toLocaleString('en-IN')}`}
                    subtitle="All time"
                    icon={DollarSign}
                />
                <StatCard
                    title="This Month"
                    value={`₹${Number(summary.monthlyEarnings || 0).toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    trend="up"
                    trendValue={12}
                />
                <StatCard
                    title="Completed Payments"
                    value={summary.completedPayments || 0}
                    subtitle="Successfully received"
                    icon={CheckCircle}
                />
            </div>

            {/* Transaction History */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">Transaction History</h3>
                    <div className="flex items-center gap-2">
                        {['all', 'completed', 'pending', 'failed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === f
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredPayments.length > 0 ? (
                    <div className="space-y-3">
                        {filteredPayments.map(payment => (
                            <TransactionCard key={payment.id} payment={payment} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-center py-16 text-gray-400">
                            <DollarSign className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="font-medium">No transactions found</p>
                            <p className="text-sm mt-1">Payments will appear here once clients book consultations</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Credentials */}
            <PaymentCredentials />
        </div>
    );
}
