/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Request Logger Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * HTTP request logging middleware.
 * 
 * @module middleware/requestLogger
 */

import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs request and response details
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Log request start
    const requestId = Math.random().toString(36).substring(7);
    req.requestId = requestId;

    // Store original end function
    const originalEnd = res.end;

    // Override end to capture response
    res.end = function (chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);

        const duration = Date.now() - startTime;

        // Log request completion
        logger.logRequest(req, res.statusCode, duration);
    };

    next();
}

/**
 * Request ID middleware
 * Adds unique request ID to requests and responses
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestId(req, res, next) {
    const id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
}

export default {
    requestLogger,
    requestId,
};
