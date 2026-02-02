/**
 * Lawyer Analytics Page
 * View profile performance metrics and trends
 */

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Calendar, Star, Clock, Users } from 'lucide-react';
import { PageHeader, StatCard } from '../../components/dashboard';
import { lawyerAPI } from '../../services/api';
import { useAuth } from '../../context/mockAuth';

export default function LawyerAnalytics() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const { data } = await lawyerAPI.getAnalytics(user?.id || '1');
                setAnalytics(data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, [user]);

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    const maxEarnings = Math.max(...analytics.monthlyData.map(d => d.earnings));

    return (
        <div>
            <PageHeader title="Analytics" subtitle="Track your profile performance" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Profile Views"
                    value={analytics.profileViews.thisMonth}
                    subtitle={`${analytics.profileViews.total} total`}
                    icon={Eye}
                    trend={analytics.profileViews.trend}
                    trendValue={analytics.profileViews.trendPercentage}
                />
                <StatCard
                    title="Booking Rate"
                    value={`${analytics.bookingRate.percentage}%`}
                    subtitle={`${analytics.bookingRate.total} bookings`}
                    icon={Calendar}
                    trend={analytics.bookingRate.trend}
                    trendValue={analytics.bookingRate.trendPercentage}
                />
                <StatCard
                    title="Response Rate"
                    value={analytics.responseRate.percentage + '%'}
                    subtitle={`Avg ${analytics.responseRate.avgResponseTime}`}
                    icon={Clock}
                />
                <StatCard
                    title="Monthly Earnings"
                    value={`₹${analytics.earnings.thisMonth.toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    trend={analytics.earnings.trend}
                    trendValue={analytics.earnings.trendPercentage}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Performance Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-6">Monthly Earnings</h3>
                    <div className="space-y-4">
                        {analytics.monthlyData.map((month, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="w-10 text-sm text-gray-500">{month.month}</span>
                                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transition-all duration-500"
                                        style={{ width: `${(month.earnings / maxEarnings) * 100}%` }}
                                    />
                                </div>
                                <span className="w-20 text-sm font-medium text-gray-900 text-right">
                                    ₹{(month.earnings / 1000).toFixed(0)}K
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Views & Bookings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-6">Views vs Bookings</h3>
                    <div className="space-y-6">
                        {analytics.monthlyData.map((month, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <span className="w-10 text-sm text-gray-500">{month.month}</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2">
                                        <Eye className="w-4 h-4 text-blue-500" />
                                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(month.views / 350) * 100}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500 w-8">{month.views}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-green-500" />
                                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(month.bookings / 30) * 100}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-500 w-8">{month.bookings}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-6 mt-6 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-gray-600">Profile Views</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-gray-600">Bookings</span>
                        </div>
                    </div>
                </div>

                {/* Performance Tips */}
                <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-sm p-6 text-white">
                    <h3 className="font-semibold mb-4">Tips to Improve Your Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-lg p-4">
                            <Star className="w-6 h-6 mb-2" />
                            <h4 className="font-medium mb-1">Add More Reviews</h4>
                            <p className="text-sm text-blue-100">Encourage satisfied clients to leave reviews.</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <Clock className="w-6 h-6 mb-2" />
                            <h4 className="font-medium mb-1">Faster Response</h4>
                            <p className="text-sm text-blue-100">Respond within 2 hours to boost visibility.</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                            <Users className="w-6 h-6 mb-2" />
                            <h4 className="font-medium mb-1">Complete Profile</h4>
                            <p className="text-sm text-blue-100">Add certifications and education details.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
