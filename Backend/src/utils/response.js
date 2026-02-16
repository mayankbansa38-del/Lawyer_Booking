/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - API Response Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Standardized API response format for consistent client handling.
 * 
 * @module utils/response
 */

import { HTTP_STATUS } from '../config/constants.js';

/**
 * Standard API response structure
 * 
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Human-readable message
 * @property {*} data - Response data (for successful requests)
 * @property {Object} error - Error details (for failed requests)
 * @property {Object} meta - Pagination and other metadata
 */

/**
 * Send successful response
 * 
 * @param {import('express').Response} res - Express response object
 * @param {Object} options - Response options
 * @param {*} [options.data] - Response data
 * @param {string} [options.message='Success'] - Success message
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {Object} [options.meta] - Additional metadata
 */
export function sendSuccess(res, { data = null, message = 'Success', statusCode = HTTP_STATUS.OK, meta = null }) {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
}

/**
 * Send created response (201)
 * 
 * @param {import('express').Response} res - Express response object
 * @param {*} data - Created resource
 * @param {string} [message='Resource created successfully'] - Success message
 */
export function sendCreated(res, data, message = 'Resource created successfully') {
    return sendSuccess(res, {
        data,
        message,
        statusCode: HTTP_STATUS.CREATED,
    });
}

/**
 * Send no content response (204)
 * 
 * @param {import('express').Response} res - Express response object
 */
export function sendNoContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Send error response
 * 
 * @param {import('express').Response} res - Express response object
 * @param {Object} options - Error options
 * @param {string} [options.message='An error occurred'] - Error message
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} [options.errorCode] - Application error code
 * @param {*} [options.details] - Error details
 */
export function sendError(res, { message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null, details = null }) {
    const response = {
        success: false,
        message,
        error: {
            code: errorCode,
        },
    };

    if (details !== null) {
        response.error.details = details;
    }

    return res.status(statusCode).json(response);
}

/**
 * Send paginated response
 * 
 * @param {import('express').Response} res - Express response object
 * @param {Object} options - Pagination options
 * @param {Array} options.data - Array of items
 * @param {number} options.total - Total number of items
 * @param {number} options.page - Current page (1-indexed)
 * @param {number} options.limit - Items per page
 * @param {string} [options.message='Success'] - Success message
 */
export function sendPaginated(res, { data, total, page, limit, message = 'Success' }) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return sendSuccess(res, {
        data,
        message,
        meta: {
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
            },
        },
    });
}

/**
 * Send cursor-based paginated response
 * 
 * @param {import('express').Response} res - Express response object
 * @param {Object} options - Cursor pagination options
 * @param {Array} options.data - Array of items
 * @param {string|null} options.nextCursor - Cursor for next page
 * @param {string|null} options.prevCursor - Cursor for previous page
 * @param {boolean} options.hasMore - Whether there are more items
 * @param {string} [options.message='Success'] - Success message
 */
export function sendCursorPaginated(res, { data, nextCursor, prevCursor, hasMore, message = 'Success' }) {
    return sendSuccess(res, {
        data,
        message,
        meta: {
            pagination: {
                nextCursor,
                prevCursor,
                hasMore,
            },
        },
    });
}

/**
 * Response helper wrapper for async route handlers
 * Automatically catches errors and forwards them to error handler
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Create a controller method with standard response handling
 * 
 * @param {Function} serviceMethod - Service method to call
 * @param {Object} options - Controller options
 * @param {number} [options.successStatus=200] - Success status code
 * @param {string} [options.successMessage='Success'] - Success message
 * @returns {Function} Express route handler
 */
export function createController(serviceMethod, options = {}) {
    const { successStatus = HTTP_STATUS.OK, successMessage = 'Success' } = options;

    return asyncHandler(async (req, res) => {
        const result = await serviceMethod(req);

        return sendSuccess(res, {
            data: result,
            message: successMessage,
            statusCode: successStatus,
        });
    });
}

export default {
    sendSuccess,
    sendCreated,
    sendNoContent,
    sendError,
    sendPaginated,
    sendCursorPaginated,
    asyncHandler,
    createController,
};
