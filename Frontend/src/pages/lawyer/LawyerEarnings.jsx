/**
 * Lawyer Earnings Page
 * Track earnings, payments, and payouts
 */

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, Filter } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/dashboard';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LawyerEarnings() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({ totalEarnings: 0, thisMonth: 0, pending: 0, totalTransactions: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function fetchData() {
            try {
                const [paymentsRes, summaryRes] = await Promise.all([
                    paymentAPI.getAll({ lawyerId: user?.id || '1' }),
                    paymentAPI.getEarningsSummary(user?.id || '1')
                ]);
                setPayments(paymentsRes.data);
                setSummary(summaryRes.data);
            } catch (error) {
                console.error('Error fetching earnings:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const filteredPayments = payments.filter(p => filter === 'all' || p.status === filter);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div>
            <PageHeader
                title="Earnings"
                subtitle="Track your income and payments"
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        <Download className="w-4 h-4" /> Export
                    </button>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Earnings" value={`₹${summary.totalEarnings.toLocaleString('en-IN')}`} subtitle="All time" icon={DollarSign} />
                <StatCard title="This Month" value={`₹${summary.thisMonth.toLocaleString('en-IN')}`} icon={TrendingUp} trend="up" trendValue={18} />
                <StatCard title="Pending Payouts" value={`₹${(summary.pending || 0).toLocaleString('en-IN')}`} subtitle="Awaiting settlement" icon={Clock} />
                <StatCard title="Transactions" value={summary.totalTransactions} subtitle="Completed" icon={CheckCircle} />
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Transaction History</h3>
                    <div className="flex items-center gap-2">
                        {['all', 'completed', 'pending'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Your Earnings</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayments.map(payment => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900 text-sm">{payment.clientName}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{payment.description}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-green-600">₹{payment.lawyerEarnings.toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No transactions found</div>
                )}
            </div>
        </div>
    );
}
