/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Request Logger Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * HTTP request logging middleware with distributed tracing support.
 * 
 * @module middleware/requestLogger
 */

import { randomUUID } from 'crypto';
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

    // Use the UUID set by requestId middleware (runs before this)
    // Do NOT generate a second ID — it breaks distributed tracing
    const requestId = req.id;

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
    // Use existing header (for distributed tracing) or generate new UUID v4
    const id = req.headers['x-request-id'] || randomUUID();
    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
}

export default {
    requestLogger,
    requestId,
};
