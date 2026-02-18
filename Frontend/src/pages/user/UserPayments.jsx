/**
 * User Payments Page - Enhanced
 * Premium design with stat cards and improved table
 */

import { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, Clock, XCircle, IndianRupee, Receipt, TrendingUp } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserPayments() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        async function fetchPayments() {
            try {
                if (!user?.id) return;
                const { data } = await paymentAPI.getAll({ clientId: user.id });

                // Transform data
                const formattedData = data.map(p => ({
                    ...p,
                    lawyerName: p.booking?.lawyer?.user
                        ? `${p.booking.lawyer.user.firstName} ${p.booking.lawyer.user.lastName}`
                        : 'Unknown Lawyer',
                    description: p.booking
                        ? `${p.booking.meetingType} Consultation (${p.booking.bookingNumber})`
                        : 'Legal Service',
                    date: p.createdAt || p.processedAt,
                    amount: Number(p.amount) || 0,
                    status: p.status?.toUpperCase() || 'PENDING'
                }));

                setPayments(formattedData);
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPayments();
    }, [user]);

    const filteredPayments = filter === 'all' ? payments : payments.filter(p => p.status === filter.toUpperCase());
    const total = payments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
                <p className="text-gray-500 mt-1">Your payment history & transactions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Spent"
                    value={`₹${total.toLocaleString('en-IN')}`}
                    icon={IndianRupee}
                    color="bg-blue-500"
                    subtitle="Completed payments"
                />
                <StatCard
                    title="Transactions"
                    value={payments.length}
                    icon={Receipt}
                    color="bg-indigo-500"
                    subtitle="All time"
                />
                <StatCard
                    title="Pending Amount"
                    value={`₹${pending.toLocaleString('en-IN')}`}
                    icon={Clock}
                    color="bg-amber-500"
                    subtitle="Awaiting payment"
                />
                <StatCard
                    title="Completed"
                    value={payments.filter(p => p.status === 'COMPLETED').length}
                    icon={CheckCircle}
                    color="bg-green-500"
                    subtitle="Successful payments"
                />
            </div>

            {/* Filters & Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
                    <div className="flex gap-2">
                        {['all', 'completed', 'pending'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredPayments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80">
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lawyer</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <CreditCard className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm">{payment.lawyerName}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{payment.description}</td>
                                        <td className="px-5 py-4 text-sm text-gray-600">{new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {payment.status === 'COMPLETED' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {payment.status === 'COMPLETED' && (
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState icon={CreditCard} title="No payments" description="You haven't made any payments yet." />
                    </div>
                )}
            </div>
        </div>
    );
}
