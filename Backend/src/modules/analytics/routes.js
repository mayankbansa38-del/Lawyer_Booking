/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Analytics Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Analytics tracking and reporting routes.
 * 
 * @module modules/analytics/routes
 */

import { Router } from 'express';
import { authenticate, authorize, optionalAuth } from '../../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../../utils/response.js';
import * as analyticsService from './service.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING ENDPOINTS (Public/Semi-public)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/analytics/pageview
 * @desc    Track page view
 * @access  Public
 */
router.post('/pageview', optionalAuth, asyncHandler(async (req, res) => {
    const { sessionId, path, referrer, duration } = req.body;

    // Parse user agent
    const userAgent = req.get('user-agent') || '';
    const device = parseDevice(userAgent);
    const browser = parseBrowser(userAgent);
    const os = parseOS(userAgent);

    await analyticsService.trackPageView({
        userId: req.user?.id,
        sessionId,
        path,
        referrer,
        userAgent,
        ip: req.ip,
        device,
        browser,
        os,
        duration,
    });

    return sendSuccess(res, { message: 'Page view tracked' });
}));

/**
 * @route   POST /api/v1/analytics/event
 * @desc    Track custom event
 * @access  Public
 */
router.post('/event', optionalAuth, asyncHandler(async (req, res) => {
    const { sessionId, event, category, properties } = req.body;

    await analyticsService.trackEvent({
        userId: req.user?.id,
        sessionId,
        event,
        category,
        properties,
    });

    return sendSuccess(res, { message: 'Event tracked' });
}));

/**
 * @route   POST /api/v1/analytics/search
 * @desc    Track search
 * @access  Public
 */
router.post('/search', optionalAuth, asyncHandler(async (req, res) => {
    const { query, filters, resultsCount, selectedResultId, selectedResultPosition } = req.body;

    await analyticsService.trackSearch({
        userId: req.user?.id,
        query,
        filters,
        resultsCount,
        selectedResultId,
        selectedResultPosition,
    });

    return sendSuccess(res, { message: 'Search tracked' });
}));

// ═══════════════════════════════════════════════════════════════════════════
// REPORTING ENDPOINTS (Admin only)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard metrics
 * @access  Private/Admin
 */
router.get('/dashboard', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const { startDate, endDate } = parseDateRange(req.query);

    const metrics = await analyticsService.getDashboardMetrics(startDate, endDate);

    return sendSuccess(res, { data: metrics });
}));

/**
 * @route   GET /api/v1/analytics/pageviews
 * @desc    Get page views time series
 * @access  Private/Admin
 */
router.get('/pageviews', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const { startDate, endDate } = parseDateRange(req.query);
    const granularity = req.query.granularity || 'day';

    const data = await analyticsService.getPageViewsTimeSeries(startDate, endDate, granularity);

    return sendSuccess(res, { data });
}));

/**
 * @route   GET /api/v1/analytics/search
 * @desc    Get search analytics
 * @access  Private/Admin
 */
router.get('/search', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const { startDate, endDate } = parseDateRange(req.query);

    const data = await analyticsService.getSearchAnalytics(startDate, endDate);

    return sendSuccess(res, { data });
}));

/**
 * @route   GET /api/v1/analytics/api
 * @desc    Get API performance metrics
 * @access  Private/Admin
 */
router.get('/api', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const { startDate, endDate } = parseDateRange(req.query);

    const data = await analyticsService.getApiMetrics(startDate, endDate);

    return sendSuccess(res, { data });
}));

/**
 * @route   POST /api/v1/analytics/cleanup
 * @desc    Clean up old analytics data
 * @access  Private/Admin
 */
router.post('/cleanup', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const daysToKeep = parseInt(req.body.daysToKeep) || 90;

    const result = await analyticsService.cleanupOldData(daysToKeep);

    return sendSuccess(res, {
        data: result,
        message: `Cleaned up data older than ${daysToKeep} days`,
    });
}));

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse date range from query
 */
function parseDateRange(query) {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
        ? new Date(query.startDate)
        : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days

    return { startDate, endDate };
}

/**
 * Parse device from user agent
 */
function parseDevice(userAgent) {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    return 'desktop';
}

/**
 * Parse browser from user agent
 */
function parseBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    if (/opera|opr/i.test(userAgent)) return 'Opera';
    return 'Other';
}

/**
 * Parse OS from user agent
 */
function parseOS(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
    return 'Other';
}

export default router;
