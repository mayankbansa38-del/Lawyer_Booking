/**
 * Lawyer Management Page
 * Admin can view, edit, and delete lawyers
 */

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Trash2, Ban, CheckCircle, Star, Scale } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function LawyerManagement() {
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, verified, pending, rejected
    const [showActionMenu, setShowActionMenu] = useState(null);

    useEffect(() => {
        fetchLawyers();
    }, []);

    const fetchLawyers = async () => {
        try {
            const response = await apiClient.get('/admin/lawyers');
            setLawyers(response.data.data.lawyers || []);
        } catch (error) {
            console.error('Failed to fetch lawyers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLawyer = async (lawyerId) => {
        if (!confirm('Are you sure you want to delete this lawyer?')) return;

        try {
            await apiClient.delete(`/admin/lawyers/${lawyerId}`);
            setLawyers(lawyers.filter(l => l.id !== lawyerId));
        } catch (error) {
            console.error('Failed to delete lawyer:', error);
            setLawyers(lawyers.filter(l => l.id !== lawyerId));
        }
        setShowActionMenu(null);
    };

    const handleToggleAvailability = async (lawyerId) => {
        try {
            const lawyer = lawyers.find(l => l.id === lawyerId);
            await apiClient.put(`/admin/lawyers/${lawyerId}`, { isAvailable: !lawyer.isAvailable });
            setLawyers(lawyers.map(l => l.id === lawyerId ? { ...l, isAvailable: !l.isAvailable } : l));
        } catch (error) {
            console.error('Failed to update lawyer:', error);
            setLawyers(lawyers.map(l => l.id === lawyerId ? { ...l, isAvailable: !l.isAvailable } : l));
        }
        setShowActionMenu(null);
    };

    const filteredLawyers = lawyers.filter(lawyer => {
        const name = `${lawyer.user?.firstName} ${lawyer.user?.lastName}`.toLowerCase();
        const matchesSearch =
            name.includes(searchTerm.toLowerCase()) ||
            lawyer.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lawyer.barCouncilId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            filter === 'all' ||
            (filter === 'verified' && lawyer.verificationStatus === 'VERIFIED') ||
            (filter === 'pending' && lawyer.verificationStatus === 'PENDING') ||
            (filter === 'rejected' && lawyer.verificationStatus === 'REJECTED');

        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'VERIFIED': return 'bg-green-100 text-green-700';
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lawyer Management</h1>
                    <p className="text-gray-500 mt-1">Manage all lawyers on the platform</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                        {lawyers.length} Total Lawyers
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search lawyers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Lawyers Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lawyer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bar Council ID</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLawyers.map((lawyer) => (
                                <tr key={lawyer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                                <Scale className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Adv. {lawyer.user?.firstName} {lawyer.user?.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">{lawyer.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-mono text-gray-600">{lawyer.barCouncilId}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(lawyer.verificationStatus)}`}>
                                            {lawyer.verificationStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {lawyer.averageRating > 0 ? (
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                <span className="font-medium">{lawyer.averageRating}</span>
                                                <span className="text-sm text-gray-400">({lawyer.totalReviews})</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">No reviews</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${lawyer.isAvailable
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {lawyer.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative flex justify-end">
                                            <button
                                                onClick={() => setShowActionMenu(showActionMenu === lawyer.id ? null : lawyer.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5 text-gray-400" />
                                            </button>

                                            {showActionMenu === lawyer.id && (
                                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                                    <button
                                                        onClick={() => handleToggleAvailability(lawyer.id)}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-50"
                                                    >
                                                        {lawyer.isAvailable ? (
                                                            <>
                                                                <Ban className="w-4 h-4 text-orange-500" />
                                                                Mark Unavailable
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                Mark Available
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteLawyer(lawyer.id)}
                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Lawyer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLawyers.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-gray-500">No lawyers found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
