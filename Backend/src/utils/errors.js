/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Custom Error Classes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Application-specific error classes for consistent error handling.
 * All errors extend the base AppError class.
 * 
 * @module utils/errors
 */

import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Application error code
     * @param {Object} [details] - Additional error details
     */
    constructor(
        message,
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        errorCode = ERROR_CODES.INTERNAL_ERROR,
        details = null
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.isOperational = true; // Distinguishes operational errors from programming errors
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON-friendly format
     */
    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                code: this.errorCode,
                details: this.details,
                timestamp: this.timestamp,
            },
        };
    }
}

/**
 * 400 Bad Request - Invalid input or malformed request
 */
export class BadRequestError extends AppError {
    constructor(message = 'Bad Request', details = null) {
        super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT, details);
    }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', errorCode = ERROR_CODES.UNAUTHORIZED) {
        super(message, HTTP_STATUS.UNAUTHORIZED, errorCode);
    }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', details = null) {
        super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, details);
    }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource', identifier = null) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, { resource, identifier });
    }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
    constructor(message = 'Resource already exists', details = null) {
        super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.ALREADY_EXISTS, details);
    }
}

/**
 * 422 Unprocessable Entity - Validation errors
 */
export class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = []) {
        super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.VALIDATION_ERROR, { errors });
    }

    /**
     * Create validation error from Joi validation result
     * @param {Object} joiError - Joi validation error
     */
    static fromJoi(joiError) {
        const errors = joiError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
        }));
        return new ValidationError('Validation failed', errors);
    }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests, please try again later') {
        super(message, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMITED);
    }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
    }
}

/**
 * Database operation error
 */
export class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', operation = null) {
        super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, { operation });
    }
}

/**
 * External service error (Supabase, Razorpay, etc.)
 */
export class ExternalServiceError extends AppError {
    constructor(service, message = 'External service error') {
        super(
            `${service}: ${message}`,
            HTTP_STATUS.SERVICE_UNAVAILABLE,
            ERROR_CODES.EXTERNAL_SERVICE_ERROR,
            { service }
        );
    }
}

/**
 * Authentication-specific errors
 */
export class AuthenticationError extends UnauthorizedError {
    constructor(type = 'generic') {
        const messages = {
            generic: 'Authentication failed',
            invalidCredentials: 'Invalid email or password',
            tokenExpired: 'Token has expired',
            tokenInvalid: 'Invalid token',
            tokenMissing: 'No authentication token provided',
            emailNotVerified: 'Please verify your email first',
            accountDisabled: 'Account has been disabled',
        };

        const errorCodes = {
            generic: ERROR_CODES.UNAUTHORIZED,
            invalidCredentials: ERROR_CODES.INVALID_CREDENTIALS,
            tokenExpired: ERROR_CODES.TOKEN_EXPIRED,
            tokenInvalid: ERROR_CODES.TOKEN_INVALID,
            tokenMissing: ERROR_CODES.UNAUTHORIZED,
            emailNotVerified: ERROR_CODES.UNAUTHORIZED,
            accountDisabled: ERROR_CODES.FORBIDDEN,
        };

        super(messages[type] || messages.generic, errorCodes[type] || errorCodes.generic);
        this.authType = type;
    }
}

/**
 * Business logic errors
 */
export class BusinessError extends AppError {
    constructor(message, errorCode = ERROR_CODES.CONFLICT, details = null) {
        super(message, HTTP_STATUS.CONFLICT, errorCode, details);
    }
}

/**
 * Booking-specific errors
 */
export class BookingError extends BusinessError {
    constructor(type = 'generic') {
        const messages = {
            generic: 'Booking operation failed',
            slotUnavailable: 'Selected time slot is no longer available',
            alreadyBooked: 'You already have a booking at this time',
            inPast: 'Cannot book appointments in the past',
            tooSoon: 'Booking must be at least 24 hours in advance',
            lawyerUnavailable: 'Lawyer is not available at this time',
            cannotCancel: 'This booking cannot be cancelled',
            alreadyCancelled: 'Booking has already been cancelled',
            alreadyCompleted: 'Booking has already been completed',
        };

        const errorCodes = {
            generic: ERROR_CODES.CONFLICT,
            slotUnavailable: ERROR_CODES.SLOT_UNAVAILABLE,
            alreadyBooked: ERROR_CODES.BOOKING_CONFLICT,
            inPast: ERROR_CODES.INVALID_INPUT,
            tooSoon: ERROR_CODES.INVALID_INPUT,
            lawyerUnavailable: ERROR_CODES.SLOT_UNAVAILABLE,
            cannotCancel: ERROR_CODES.CONFLICT,
            alreadyCancelled: ERROR_CODES.CONFLICT,
            alreadyCompleted: ERROR_CODES.CONFLICT,
        };

        super(messages[type] || messages.generic, errorCodes[type] || errorCodes.generic);
        this.bookingErrorType = type;
    }
}

/**
 * Payment-specific errors
 */
export class PaymentError extends BusinessError {
    constructor(type = 'generic', details = null) {
        const messages = {
            generic: 'Payment operation failed',
            failed: 'Payment processing failed',
            insufficientFunds: 'Insufficient funds',
            invalidCard: 'Invalid card details',
            expired: 'Payment session has expired',
            alreadyPaid: 'Payment has already been processed',
            refundFailed: 'Refund processing failed',
            notRefundable: 'This payment is not eligible for refund',
        };

        const errorCodes = {
            generic: ERROR_CODES.PAYMENT_FAILED,
            failed: ERROR_CODES.PAYMENT_FAILED,
            insufficientFunds: ERROR_CODES.INSUFFICIENT_FUNDS,
            invalidCard: ERROR_CODES.INVALID_INPUT,
            expired: ERROR_CODES.TOKEN_EXPIRED,
            alreadyPaid: ERROR_CODES.CONFLICT,
            refundFailed: ERROR_CODES.PAYMENT_FAILED,
            notRefundable: ERROR_CODES.CONFLICT,
        };

        super(messages[type] || messages.generic, errorCodes[type] || errorCodes.generic, details);
        this.paymentErrorType = type;
    }
}

/**
 * Check if error is an operational error (expected) vs programming error (bug)
 * @param {Error} error
 * @returns {boolean}
 */
export function isOperationalError(error) {
    return error instanceof AppError && error.isOperational;
}

export default {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    RateLimitError,
    InternalError,
    DatabaseError,
    ExternalServiceError,
    AuthenticationError,
    BusinessError,
    BookingError,
    PaymentError,
    isOperationalError,
};
