/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Analytics Service (MongoDB)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Analytics tracking and reporting using MongoDB.
 * 
 * @module modules/analytics/service
 */

import mongoose from 'mongoose';
import { getMongoConnection, getPrismaClient } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { BOOKING_STATUS } from '../../config/constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// MONGODB SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Page view schema
 */
const pageViewSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    sessionId: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    referrer: String,
    userAgent: String,
    ip: String,
    country: String,
    city: String,
    device: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String,
    os: String,
    duration: Number, // seconds
    timestamp: { type: Date, default: Date.now, index: true },
});

/**
 * Event schema (for custom events)
 */
const eventSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    sessionId: String,
    event: { type: String, required: true, index: true },
    category: { type: String, index: true },
    properties: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true },
});

/**
 * Search log schema
 */
const searchLogSchema = new mongoose.Schema({
    userId: String,
    query: { type: String, required: true },
    filters: mongoose.Schema.Types.Mixed,
    resultsCount: Number,
    selectedResultId: String,
    selectedResultPosition: Number,
    timestamp: { type: Date, default: Date.now, index: true },
});

/**
 * API request log schema
 */
const apiLogSchema = new mongoose.Schema({
    requestId: String,
    userId: String,
    method: { type: String, required: true },
    path: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    duration: Number, // milliseconds
    ip: String,
    userAgent: String,
    error: String,
    timestamp: { type: Date, default: Date.now, index: true },
});

/**
 * Daily aggregation schema (for pre-computed metrics)
 */
const dailyMetricsSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true, index: true },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    bookingsCreated: { type: Number, default: 0 },
    bookingsCompleted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 },
    topPages: [{ path: String, views: Number }],
    topLawyers: [{ lawyerId: String, bookings: Number }],
    conversionRate: { type: Number, default: 0 },
});

// Create models
let PageView, Event, SearchLog, ApiLog, DailyMetrics;

function getModels() {
    const conn = getMongoConnection();
    if (!conn) {
        logger.warn('MongoDB not connected, analytics disabled');
        return null;
    }

    if (!PageView) {
        PageView = conn.model('PageView', pageViewSchema);
        Event = conn.model('Event', eventSchema);
        SearchLog = conn.model('SearchLog', searchLogSchema);
        ApiLog = conn.model('ApiLog', apiLogSchema);
        DailyMetrics = conn.model('DailyMetrics', dailyMetricsSchema);
    }

    return { PageView, Event, SearchLog, ApiLog, DailyMetrics };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track page view
 * 
 * @param {Object} data - Page view data
 */
export async function trackPageView(data) {
    try {
        const models = getModels();
        if (!models) return;

        await models.PageView.create({
            userId: data.userId,
            sessionId: data.sessionId,
            path: data.path,
            referrer: data.referrer,
            userAgent: data.userAgent,
            ip: data.ip,
            country: data.country,
            city: data.city,
            device: data.device,
            browser: data.browser,
            os: data.os,
            duration: data.duration,
        });
    } catch (error) {
        logger.error('Failed to track page view:', error);
    }
}

/**
 * Track custom event
 * 
 * @param {Object} data - Event data
 */
export async function trackEvent(data) {
    try {
        const models = getModels();
        if (!models) return;

        await models.Event.create({
            userId: data.userId,
            sessionId: data.sessionId,
            event: data.event,
            category: data.category,
            properties: data.properties,
        });
    } catch (error) {
        logger.error('Failed to track event:', error);
    }
}

/**
 * Track search
 * 
 * @param {Object} data - Search data
 */
export async function trackSearch(data) {
    try {
        const models = getModels();
        if (!models) return;

        await models.SearchLog.create({
            userId: data.userId,
            query: data.query,
            filters: data.filters,
            resultsCount: data.resultsCount,
            selectedResultId: data.selectedResultId,
            selectedResultPosition: data.selectedResultPosition,
        });
    } catch (error) {
        logger.error('Failed to track search:', error);
    }
}

/**
 * Log API request
 * 
 * @param {Object} data - Request data
 */
export async function logApiRequest(data) {
    try {
        const models = getModels();
        if (!models) return;

        await models.ApiLog.create({
            requestId: data.requestId,
            userId: data.userId,
            method: data.method,
            path: data.path,
            statusCode: data.statusCode,
            duration: data.duration,
            ip: data.ip,
            userAgent: data.userAgent,
            error: data.error,
        });
    } catch (error) {
        logger.error('Failed to log API request:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// REPORTING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get dashboard overview metrics
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Dashboard metrics
 */
export async function getDashboardMetrics(startDate, endDate) {
    try {
        const models = getModels();
        if (!models) return null;

        const [
            pageViewsAgg,
            uniqueVisitorsAgg,
            eventsAgg,
            apiErrorsAgg,
            topPages,
            deviceBreakdown,
        ] = await Promise.all([
            // Total page views
            models.PageView.countDocuments({
                timestamp: { $gte: startDate, $lte: endDate },
            }),

            // Unique visitors
            models.PageView.distinct('sessionId', {
                timestamp: { $gte: startDate, $lte: endDate },
            }),

            // Key events count
            models.Event.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: '$event',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),

            // API errors
            models.ApiLog.countDocuments({
                timestamp: { $gte: startDate, $lte: endDate },
                statusCode: { $gte: 500 },
            }),

            // Top pages (moved into Promise.all)
            models.PageView.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: '$path',
                        views: { $sum: 1 },
                    },
                },
                { $sort: { views: -1 } },
                { $limit: 10 },
            ]),

            // Device breakdown (moved into Promise.all)
            models.PageView.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        device: { $exists: true },
                    },
                },
                {
                    $group: {
                        _id: '$device',
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        return {
            pageViews: pageViewsAgg,
            uniqueVisitors: uniqueVisitorsAgg.length,
            topEvents: eventsAgg,
            apiErrors: apiErrorsAgg,
            topPages: topPages.map(p => ({ path: p._id, views: p.views })),
            deviceBreakdown: deviceBreakdown.reduce((acc, d) => {
                acc[d._id] = d.count;
                return acc;
            }, {}),
        };
    } catch (error) {
        logger.error('Failed to get dashboard metrics:', error);
        return null;
    }
}

/**
 * Get page views over time
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} granularity - 'hour', 'day', 'week', 'month'
 * @returns {Promise<Array>} Time series data
 */
export async function getPageViewsTimeSeries(startDate, endDate, granularity = 'day') {
    try {
        const models = getModels();
        if (!models) return [];

        const dateFormat = {
            hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } },
            day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            week: { $week: '$timestamp' },
            month: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
        };

        const result = await models.PageView.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: dateFormat[granularity] || dateFormat.day,
                    views: { $sum: 1 },
                    uniqueVisitors: { $addToSet: '$sessionId' },
                },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    views: 1,
                    uniqueVisitors: { $size: '$uniqueVisitors' },
                },
            },
            { $sort: { date: 1 } },
        ]);

        return result;
    } catch (error) {
        logger.error('Failed to get page views time series:', error);
        return [];
    }
}

/**
 * Get search analytics
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Search analytics
 */
export async function getSearchAnalytics(startDate, endDate) {
    try {
        const models = getModels();
        if (!models) return null;

        const [totalSearches, topQueries, zeroResults] = await Promise.all([
            models.SearchLog.countDocuments({
                timestamp: { $gte: startDate, $lte: endDate },
            }),

            models.SearchLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: { $toLower: '$query' },
                        count: { $sum: 1 },
                        avgResults: { $avg: '$resultsCount' },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ]),

            models.SearchLog.countDocuments({
                timestamp: { $gte: startDate, $lte: endDate },
                resultsCount: 0,
            }),
        ]);

        return {
            totalSearches,
            zeroResultsCount: zeroResults,
            zeroResultsRate: totalSearches > 0 ? (zeroResults / totalSearches * 100).toFixed(2) : 0,
            topQueries: topQueries.map(q => ({
                query: q._id,
                count: q.count,
                avgResults: Math.round(q.avgResults),
            })),
        };
    } catch (error) {
        logger.error('Failed to get search analytics:', error);
        return null;
    }
}

/**
 * Get API performance metrics
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} API metrics
 */
export async function getApiMetrics(startDate, endDate) {
    try {
        const models = getModels();
        if (!models) return null;

        const [overall, byEndpoint, errorBreakdown] = await Promise.all([
            // Overall metrics
            models.ApiLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRequests: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                        p95Duration: { $percentile: { input: '$duration', p: [0.95], method: 'approximate' } },
                        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 500] }, 1, 0] } },
                    },
                },
            ]),

            // By endpoint
            models.ApiLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                    },
                },
                {
                    $group: {
                        _id: { method: '$method', path: '$path' },
                        count: { $sum: 1 },
                        avgDuration: { $avg: '$duration' },
                        errors: { $sum: { $cond: [{ $gte: ['$statusCode', 500] }, 1, 0] } },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ]),

            // Error breakdown
            models.ApiLog.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        statusCode: { $gte: 400 },
                    },
                },
                {
                    $group: {
                        _id: '$statusCode',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ]),
        ]);

        return {
            totalRequests: overall[0]?.totalRequests || 0,
            avgDuration: Math.round(overall[0]?.avgDuration || 0),
            p95Duration: Math.round(overall[0]?.p95Duration?.[0] || 0),
            errorRate: overall[0]?.totalRequests > 0
                ? ((overall[0]?.errors / overall[0]?.totalRequests) * 100).toFixed(2)
                : 0,
            topEndpoints: byEndpoint.map(e => ({
                method: e._id.method,
                path: e._id.path,
                count: e.count,
                avgDuration: Math.round(e.avgDuration),
                errorRate: e.count > 0 ? ((e.errors / e.count) * 100).toFixed(2) : 0,
            })),
            errorBreakdown: errorBreakdown.map(e => ({
                statusCode: e._id,
                count: e.count,
            })),
        };
    } catch (error) {
        logger.error('Failed to get API metrics:', error);
        return null;
    }
}

/**
 * Clean up old analytics data
 * 
 * @param {number} daysToKeep - Number of days to keep
 * @returns {Promise<Object>} Deletion counts
 */
export async function cleanupOldData(daysToKeep = 90) {
    try {
        const models = getModels();
        if (!models) return null;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const [pageViews, events, searchLogs, apiLogs] = await Promise.all([
            models.PageView.deleteMany({ timestamp: { $lt: cutoffDate } }),
            models.Event.deleteMany({ timestamp: { $lt: cutoffDate } }),
            models.SearchLog.deleteMany({ timestamp: { $lt: cutoffDate } }),
            models.ApiLog.deleteMany({ timestamp: { $lt: cutoffDate } }),
        ]);

        const result = {
            pageViews: pageViews.deletedCount,
            events: events.deletedCount,
            searchLogs: searchLogs.deletedCount,
            apiLogs: apiLogs.deletedCount,
        };

        logger.info('Analytics cleanup completed', result);
        return result;
    } catch (error) {
        logger.error('Failed to cleanup analytics data:', error);
        return null;
    }
}

/**
 * Get hybrid dashboard metrics (Postgres + MongoDB)
 * 
 * @param {string} lawyerId - Lawyer ID
 * @returns {Promise<Object>} Hybrid metrics matching mock data structure
 */
export async function getHybridDashboardMetrics(lawyerId) {
    try {
        // 1. Setup Dates (Last 6 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);

        // 2. Fetch Postgres + MongoDB data in parallel
        const models = getModels();

        const [bookings, pageViewsCount, previousPageViewsCount] = await Promise.all([
            // Postgres: bookings
            getPrismaClient().booking.findMany({
                where: {
                    lawyerId: lawyerId,
                    date: { gte: startDate, lte: endDate }
                },
                include: { payment: true }
            }),

            // MongoDB: current period page views
            models
                ? models.PageView.countDocuments({
                    path: { $regex: lawyerId },
                    timestamp: { $gte: startDate, $lte: endDate }
                })
                : Promise.resolve(0),

            // MongoDB: previous period page views (for trend)
            models
                ? models.PageView.countDocuments({
                    path: { $regex: lawyerId },
                    timestamp: {
                        $gte: (() => { const d = new Date(startDate); d.setMonth(d.getMonth() - 6); return d; })(),
                        $lt: startDate
                    }
                })
                : Promise.resolve(0),
        ]);

        // 4. Calculate Metrics

        // Earnings
        const currentEarnings = bookings
            .filter(b => b.status === BOOKING_STATUS.COMPLETED && b.payment?.status === 'COMPLETED')
            .reduce((sum, b) => sum + (b.payment?.amount || 0), 0);

        // Booking Rate (Bookings / Page Views)
        const bookingRate = pageViewsCount > 0 ? ((bookings.length / pageViewsCount) * 100) : 0;

        // Group by Month for Chart
        const monthlyDataMap = new Map();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            monthlyDataMap.set(key, { month: months[d.getMonth()], views: 0, bookings: 0, earnings: 0 });
        }

        // Fill Bookings & Earnings
        bookings.forEach(b => {
            const d = new Date(b.date);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (monthlyDataMap.has(key)) {
                const data = monthlyDataMap.get(key);
                data.bookings++;
                if (b.status === BOOKING_STATUS.COMPLETED && b.payment?.status === 'COMPLETED') {
                    data.earnings += (b.payment?.amount || 0);
                }
            }
        });

        // Fill Page Views (if Mongo connected)
        if (models) {
            const viewsTimeSeries = await models.PageView.aggregate([
                {
                    $match: {
                        path: { $regex: lawyerId },
                        timestamp: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { month: { $month: '$timestamp' }, year: { $year: '$timestamp' } },
                        count: { $sum: 1 }
                    }
                }
            ]);

            viewsTimeSeries.forEach(v => {
                const monthName = months[v._id.month - 1];
                const key = `${monthName} ${v._id.year}`;
                if (monthlyDataMap.has(key)) {
                    monthlyDataMap.get(key).views = v.count;
                }
            });
        }

        // 5. Construct Final Response
        return {
            lawyerId,
            profileViews: (() => {
                const now = new Date();
                const curMonth = now.getMonth();
                const curYear = now.getFullYear();
                const thisMonthKey = `${months[curMonth]} ${curYear}`;
                // Safe wrap: January (0) -> previous is December (11) of prior year
                const prevMonth = (curMonth + 11) % 12;
                const prevYear = curMonth === 0 ? curYear - 1 : curYear;
                const lastMonthKey = `${months[prevMonth]} ${prevYear}`;
                return {
                    total: pageViewsCount,
                    thisMonth: monthlyDataMap.get(thisMonthKey)?.views || 0,
                    lastMonth: monthlyDataMap.get(lastMonthKey)?.views || 0,
                    trend: pageViewsCount >= previousPageViewsCount ? 'up' : 'down',
                    trendPercentage: previousPageViewsCount > 0 ? Math.round(((pageViewsCount - previousPageViewsCount) / previousPageViewsCount) * 100) : 100
                };
            })(),
            bookingRate: {
                total: bookings.length,
                percentage: Math.round(bookingRate),
                // TODO: Calculate actual trend from previous period data
                trend: 'up',
                trendPercentage: 5
            },
            responseRate: {
                // TODO: Implement actual response time tracking
                percentage: 98,
                avgResponseTime: '2 hours'
            },
            earnings: (() => {
                const now = new Date();
                const curMonth = now.getMonth();
                const curYear = now.getFullYear();
                const thisMonthKey = `${months[curMonth]} ${curYear}`;
                const prevMonth = (curMonth + 11) % 12;
                const prevYear = curMonth === 0 ? curYear - 1 : curYear;
                const lastMonthKey = `${months[prevMonth]} ${prevYear}`;
                const thisMonthEarnings = monthlyDataMap.get(thisMonthKey)?.earnings || 0;
                const lastMonthEarnings = monthlyDataMap.get(lastMonthKey)?.earnings || 0;
                return {
                    thisMonth: thisMonthEarnings,
                    lastMonth: lastMonthEarnings,
                    trend: thisMonthEarnings >= lastMonthEarnings ? 'up' : 'down',
                    trendPercentage: lastMonthEarnings > 0 ? Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100) : 100
                };
            })(),
            monthlyData: Array.from(monthlyDataMap.values())
        };

    } catch (error) {
        logger.error('Failed to get hybrid dashboard metrics:', error);
        throw error;
    }
}

export default {
    trackPageView,
    trackEvent,
    trackSearch,
    logApiRequest,
    getDashboardMetrics,
    getPageViewsTimeSeries,
    getSearchAnalytics,
    getApiMetrics,
    cleanupOldData,
    getHybridDashboardMetrics,
};
