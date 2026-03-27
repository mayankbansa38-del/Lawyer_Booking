/**
 * User Reviews Page
 * Allows users to view their submitted reviews and write new ones for completed bookings
 */

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Clock, ChevronRight, X, Send, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { reviewAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Star Rating Component
function StarRating({ rating, onRate, size = 'md', interactive = false }) {
    const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
    const starSize = sizeClasses[size];

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => interactive && onRate?.(star)}
                    className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                    disabled={!interactive}
                >
                    <Star
                        className={`${starSize} ${star <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-200 text-gray-200'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

// Review Modal
function ReviewModal({ booking, onClose, onSubmit, isSubmitting }) {
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        setError('');
        onSubmit({ bookingId: booking.id, rating, title, content });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                            for {booking.lawyer?.name || 'Lawyer'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating */}
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-3">How would you rate your experience?</p>
                        <StarRating rating={rating} onRate={setRating} size="lg" interactive />
                        <p className="text-xs text-gray-400 mt-2">
                            {rating === 0 ? 'Click to rate' :
                                rating === 1 ? 'Poor' :
                                    rating === 2 ? 'Fair' :
                                        rating === 3 ? 'Good' :
                                            rating === 4 ? 'Very Good' : 'Excellent'}
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Summarize your experience..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Review</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share details about your experience with this lawyer..."
                            rows={4}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UserReviews() {
    const { user } = useAuth();
    const [myReviews, setMyReviews] = useState([]);
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsRes, pendingRes] = await Promise.all([
                reviewAPI.getMyReviews(1, 50),
                reviewAPI.getCompletedBookingsWithoutReview(),
            ]);
            setMyReviews(reviewsRes?.data || []);
            setPendingBookings(pendingRes?.data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSubmitReview = async (data) => {
        try {
            setIsSubmitting(true);
            await reviewAPI.create(data);
            setSelectedBooking(null);
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await reviewAPI.delete(reviewId);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete review');
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
                <p className="text-gray-500 mt-1">Manage your reviews and rate lawyers you've consulted with</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Reviews Given</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{myReviews.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Rating Given</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">
                                {myReviews.length > 0
                                    ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
                                    : '—'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{pendingBookings.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'pending'
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Pending Reviews ({pendingBookings.length})
                        {activeTab === 'pending' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('submitted')}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'submitted'
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Submitted Reviews ({myReviews.length})
                        {activeTab === 'submitted' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                    </button>
                </div>

                <div className="p-5">
                    {/* Pending Tab */}
                    {activeTab === 'pending' && (
                        <div className="space-y-3">
                            {pendingBookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Star className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No pending reviews</p>
                                    <p className="text-sm text-gray-400 mt-1">All your completed consultations have been reviewed</p>
                                </div>
                            ) : (
                                pendingBookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        <img
                                            src={booking.lawyer?.avatar || `https://ui-avatars.com/api/?name=${booking.lawyer?.name || 'L'}&background=3b82f6&color=fff`}
                                            alt="Lawyer"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                                {booking.lawyer?.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {booking.meetingType} • {formatDate(booking.scheduledDate)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Write Review
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Submitted Tab */}
                    {activeTab === 'submitted' && (
                        <div className="space-y-4">
                            {myReviews.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">No reviews yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Your submitted reviews will appear here</p>
                                </div>
                            ) : (
                                myReviews.map((review) => (
                                    <div key={review.id} className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100/80 transition-colors">
                                        {/* Review header */}
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={review.lawyer?.avatar || `https://ui-avatars.com/api/?name=${review.lawyer?.name || 'L'}&background=3b82f6&color=fff`}
                                                    alt="Lawyer"
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                />
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 text-sm">{review.lawyer?.name}</h4>
                                                    <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={review.rating} size="sm" />
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete review"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Review content */}
                                        {review.title && (
                                            <h5 className="font-medium text-gray-800 text-sm mb-1">{review.title}</h5>
                                        )}
                                        {review.content && (
                                            <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                                        )}

                                        {/* Lawyer response */}
                                        {review.lawyerResponse && (
                                            <div className="mt-3 pl-4 border-l-2 border-blue-200 bg-blue-50/50 rounded-r-lg p-3">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">Lawyer's Response</p>
                                                <p className="text-sm text-gray-700">{review.lawyerResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {selectedBooking && (
                <ReviewModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onSubmit={handleSubmitReview}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
