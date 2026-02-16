/**
 * Create Case Page
 * Users can create a case after a completed consultation
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { caseAPI, appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PRIORITIES = [
    { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-700' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

export default function CreateCase() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const preselectedBookingId = searchParams.get('bookingId');

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        bookingId: preselectedBookingId || '',
    });

    useEffect(() => {
        async function fetchBookings() {
            try {
                const res = await appointmentAPI.getAll({ status: 'COMPLETED' });
                const data = res.data || [];
                setBookings(data);
                // If preselected and exists in list, keep it
                if (preselectedBookingId && data.some(b => b.id === preselectedBookingId)) {
                    setForm(f => ({ ...f, bookingId: preselectedBookingId }));
                }
            } catch (err) {
                console.error('Error fetching bookings:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchBookings();
    }, [preselectedBookingId]);

    const selectedBooking = bookings.find(b => b.id === form.bookingId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setError('Case title is required');
            return;
        }
        if (!form.bookingId) {
            setError('Please select a completed consultation');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            await caseAPI.create({
                title: form.title,
                description: form.description,
                priority: form.priority,
                bookingId: form.bookingId,
            });
            setSuccess(true);
        } catch (err) {
            console.error('Error creating case:', err);
            setError(err.response?.data?.message || 'Failed to create case. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Created!</h2>
                    <p className="text-gray-600 mb-6">Your case has been created and assigned to the lawyer from your consultation.</p>
                    <button
                        onClick={() => navigate('/user/cases')}
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View My Cases
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create a Case</h1>
                    <p className="text-gray-600">Open a legal case from a completed consultation</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                {/* Select Consultation */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completed Consultation *</label>
                    {bookings.length === 0 ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                            No completed consultations found. You need to complete a booking first.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {bookings.map(b => (
                                <button
                                    key={b.id}
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, bookingId: b.id }))}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.bookingId === b.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {b.lawyer?.user?.firstName
                                                    ? `Adv. ${b.lawyer.user.firstName} ${b.lawyer.user.lastName}`
                                                    : b.lawyer?.name || 'Lawyer'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {b.bookingNumber} · {new Date(b.scheduledDate).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                            Completed
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Case Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Title *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g., Property Dispute Resolution"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        placeholder="Describe the legal matter and what you need help with..."
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <div className="flex gap-2">
                        {PRIORITIES.map(p => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${form.priority === p.value
                                        ? `${p.color} ring-2 ring-offset-1 ring-blue-500`
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !form.bookingId || !form.title.trim()}
                        className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        <Briefcase className="w-4 h-4" />
                        {submitting ? 'Creating...' : 'Create Case'}
                    </button>
                </div>
            </form>
        </div>
    );
}
