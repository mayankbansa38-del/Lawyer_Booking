/**
 * Lawyer Verification Page
 * Admin can approve or reject pending lawyer verifications
 */

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, FileText, Scale, ExternalLink, Eye } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function LawyerVerification() {
    const [pendingLawyers, setPendingLawyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLawyer, setSelectedLawyer] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPendingLawyers();
    }, []);

    const fetchPendingLawyers = async () => {
        try {
            const response = await apiClient.get('/admin/lawyers/pending');
            setPendingLawyers(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch pending lawyers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (lawyerId, status) => {
        setProcessingId(lawyerId);
        try {
            const action = status === 'VERIFIED' ? 'approve' : 'reject';
            await apiClient.put(`/admin/lawyers/${lawyerId}/verify`, {
                action,
                rejectionReason: status === 'REJECTED' ? 'Documents could not be verified.' : undefined,
            });
            setPendingLawyers(pendingLawyers.filter(l => l.id !== lawyerId));
            setSelectedLawyer(null);
        } catch (error) {
            console.error('Failed to verify lawyer:', error);
            // Do not remove from list on error
        } finally {
            setProcessingId(null);
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
                    <h1 className="text-2xl font-bold text-gray-900">Pending Verifications</h1>
                    <p className="text-gray-500 mt-1">Review and verify lawyer registrations</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-medium text-sm">
                        <Clock className="w-4 h-4" />
                        {pendingLawyers.length} Pending
                    </span>
                </div>
            </div>

            {pendingLawyers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                    <p className="text-gray-500">No pending lawyer verifications at the moment.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingLawyers.map((lawyer) => (
                        <div key={lawyer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    {/* Lawyer Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <Scale className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Adv. {lawyer.user?.firstName} {lawyer.user?.lastName}
                                            </h3>
                                            <p className="text-gray-500">{lawyer.user?.email}</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    {lawyer.barCouncilId}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                                    {lawyer.city}, {lawyer.state}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                                    Enrolled: {lawyer.enrollmentYear}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedLawyer(selectedLawyer?.id === lawyer.id ? null : lawyer)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Details
                                        </button>
                                        <button
                                            onClick={() => handleVerify(lawyer.id, 'REJECTED')}
                                            disabled={processingId === lawyer.id}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleVerify(lawyer.id, 'VERIFIED')}
                                            disabled={processingId === lawyer.id}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50"
                                        >
                                            {processingId === lawyer.id ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            Approve
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {selectedLawyer?.id === lawyer.id && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                                                <dl className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <dt className="text-gray-500">Email</dt>
                                                        <dd className="text-gray-900">{lawyer.user?.email}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-gray-500">Phone</dt>
                                                        <dd className="text-gray-900">{lawyer.user?.phone || 'N/A'}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-gray-500">Location</dt>
                                                        <dd className="text-gray-900">{lawyer.city}, {lawyer.state}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Bar Council Details</h4>
                                                <dl className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <dt className="text-gray-500">Bar Council ID</dt>
                                                        <dd className="text-gray-900 font-mono">{lawyer.barCouncilId}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-gray-500">State Bar Council</dt>
                                                        <dd className="text-gray-900">{lawyer.barCouncilState}</dd>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <dt className="text-gray-500">Enrollment Year</dt>
                                                        <dd className="text-gray-900">{lawyer.enrollmentYear}</dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>
                                        {lawyer.bio && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Bio</h4>
                                                <p className="text-sm text-gray-600">{lawyer.bio}</p>
                                            </div>
                                        )}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-xs text-gray-400">
                                                Submitted on {new Date(lawyer.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
