/**
 * User Payments Page
 * View payment history
 */

import { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/mockAuth';

export default function UserPayments() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function fetchPayments() {
            try {
                const { data } = await paymentAPI.getAll({ clientId: user?.id || 'u1' });
                setPayments(data);
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPayments();
    }, [user]);

    const filteredPayments = filter === 'all' ? payments : payments.filter(p => p.status === filter);
    const total = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div>
            <PageHeader title="Payments" subtitle="Your payment history" />

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.status === 'pending').length}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
                {['all', 'completed', 'pending'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Payments List */}
            {filteredPayments.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lawyer</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3"><p className="font-medium text-gray-900 text-sm">{payment.lawyerName}</p></td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{payment.description}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {payment.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {payment.status === 'completed' && (
                                                <button className="text-blue-600 hover:text-blue-700"><Download className="w-4 h-4" /></button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState icon={CreditCard} title="No payments" description="You haven't made any payments yet." />
            )}
        </div>
    );
}
