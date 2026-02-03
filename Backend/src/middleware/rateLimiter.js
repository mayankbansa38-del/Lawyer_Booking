/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Rate Limiter Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Rate limiting middleware for API protection.
 * 
 * @module middleware/rateLimiter
 */

import rateLimit from 'express-rate-limit';
import env from '../config/env.js';
import { RateLimitError } from '../utils/errors.js';

/**
 * Create rate limiter with custom options
 * 
 * @param {Object} options - Rate limit options
 * @param {number} [options.windowMs] - Time window in milliseconds
 * @param {number} [options.max] - Max requests in window
 * @param {string} [options.message] - Error message
 * @returns {Function} Express middleware
 */
export function createRateLimiter(options = {}) {
    const {
        windowMs = env.RATE_LIMIT_WINDOW_MS,
        max = env.RATE_LIMIT_MAX_REQUESTS,
        message = 'Too many requests, please try again later',
    } = options;

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, // Return rate limit info in headers
        legacyHeaders: false, // Disable X-RateLimit-* headers
        message: { success: false, message },
        handler: (req, res, next, options) => {
            next(new RateLimitError(message));
        },
        skip: (req) => {
            // Skip rate limiting in test environment
            return env.isTest;
        },
    });
}

/**
 * Default rate limiter for general API requests
 * 100 requests per 15 minutes
 */
export const apiLimiter = createRateLimiter();

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes (prevents brute force)
 */
export const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again in 15 minutes',
});

/**
 * Rate limiter for password reset requests
 * 3 requests per hour
 */
export const passwordResetLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests, please try again in an hour',
});

/**
 * Rate limiter for email verification resend
 * 3 requests per hour
 */
export const verificationLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many verification email requests, please try again in an hour',
});

/**
 * Rate limiter for file uploads
 * 10 uploads per hour
 */
export const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many file uploads, please try again later',
});

/**
 * Rate limiter for search/discovery endpoints
 * 30 requests per minute
 */
export const searchLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many search requests, please slow down',
});

/**
 * Rate limiter for payment operations
 * 10 requests per 15 minutes
 */
export const paymentLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many payment requests, please try again later',
});

export default {
    createRateLimiter,
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    verificationLimiter,
    uploadLimiter,
    searchLimiter,
    paymentLimiter,
};
