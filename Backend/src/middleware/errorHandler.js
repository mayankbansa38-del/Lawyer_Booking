/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Error Handler Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Global error handling middleware for consistent error responses.
 * 
 * @module middleware/errorHandler
 */

import { AppError, isOperationalError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

/**
 * Handle Prisma errors
 * 
 * @param {Error} error - Prisma error
 * @returns {AppError} Converted error
 */
function handlePrismaError(error) {
    const { code, meta } = error;

    const prismaErrors = {
        // Unique constraint violation
        P2002: {
            status: HTTP_STATUS.CONFLICT,
            code: ERROR_CODES.ALREADY_EXISTS,
            message: `A record with this ${meta?.target?.join(', ') || 'value'} already exists`,
        },
        // Foreign key constraint failure
        P2003: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Referenced record does not exist',
        },
        // Record not found
        P2001: {
            status: HTTP_STATUS.NOT_FOUND,
            code: ERROR_CODES.NOT_FOUND,
            message: 'Record not found',
        },
        P2025: {
            status: HTTP_STATUS.NOT_FOUND,
            code: ERROR_CODES.NOT_FOUND,
            message: 'Record not found',
        },
        // Required field missing
        P2012: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Required field is missing',
        },
        // Invalid data
        P2007: {
            status: HTTP_STATUS.BAD_REQUEST,
            code: ERROR_CODES.INVALID_INPUT,
            message: 'Invalid data provided',
        },
    };

    const errorInfo = prismaErrors[code] || {
        status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Database operation failed',
    };

    return new AppError(errorInfo.message, errorInfo.status, errorInfo.code);
}

/**
 * Handle JWT errors
 * 
 * @param {Error} error - JWT error
 * @returns {AppError} Converted error
 */
function handleJwtError(error) {
    if (error.name === 'TokenExpiredError') {
        return new AppError(
            'Token has expired',
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.TOKEN_EXPIRED
        );
    }

    if (error.name === 'JsonWebTokenError') {
        return new AppError(
            'Invalid token',
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.TOKEN_INVALID
        );
    }

    return new AppError(
        'Authentication failed',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED
    );
}

/**
 * Handle Mongoose/MongoDB errors
 * 
 * @param {Error} error - MongoDB error
 * @returns {AppError} Converted error
 */
function handleMongoError(error) {
    // Duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        return new AppError(
            `A record with this ${field || 'value'} already exists`,
            HTTP_STATUS.CONFLICT,
            ERROR_CODES.ALREADY_EXISTS
        );
    }

    // Validation error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => ({
            field: e.path,
            message: e.message,
        }));
        return new AppError(
            'Validation failed',
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            { errors }
        );
    }

    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
        return new AppError(
            `Invalid ${error.path}: ${error.value}`,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.INVALID_INPUT
        );
    }

    return new AppError(
        'Database operation failed',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DATABASE_ERROR
    );
}

/**
 * Handle Multer file upload errors
 * 
 * @param {Error} error - Multer error
 * @returns {AppError} Converted error
 */
function handleMulterError(error) {
    const multerErrors = {
        LIMIT_FILE_SIZE: 'File size exceeds maximum allowed limit',
        LIMIT_FILE_COUNT: 'Too many files uploaded',
        LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
        LIMIT_FIELD_KEY: 'Field name too long',
        LIMIT_FIELD_VALUE: 'Field value too long',
        LIMIT_PART_COUNT: 'Too many parts',
    };

    const message = multerErrors[error.code] || 'File upload error';
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_INPUT);
}

/**
 * Not found handler for undefined routes
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function notFoundHandler(req, res, next) {
    return sendError(res, {
        message: `Route ${req.method} ${req.originalUrl} not found`,
        statusCode: HTTP_STATUS.NOT_FOUND,
        errorCode: ERROR_CODES.NOT_FOUND,
    });
}

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 * 
 * @param {Error} error
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(error, req, res, next) {
    // Already handled, skip
    if (res.headersSent) {
        return next(error);
    }

    let appError = error;

    // Convert known error types to AppError
    if (!(error instanceof AppError)) {
        // Prisma errors
        if (error.code?.startsWith('P2')) {
            appError = handlePrismaError(error);
        }
        // JWT errors
        else if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            appError = handleJwtError(error);
        }
        // MongoDB errors
        else if (error.name === 'MongoError' || error.name === 'MongoServerError' || error.code === 11000) {
            appError = handleMongoError(error);
        }
        // Multer errors
        else if (error.name === 'MulterError') {
            appError = handleMulterError(error);
        }
        // Mongoose validation errors
        else if (error.name === 'ValidationError' && error.errors) {
            appError = handleMongoError(error);
        }
        // Syntax error (JSON parsing)
        else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
            appError = new AppError(
                'Invalid JSON in request body',
                HTTP_STATUS.BAD_REQUEST,
                ERROR_CODES.INVALID_INPUT
            );
        }
        // Unknown error
        else {
            appError = new AppError(
                env.isProduction ? 'Internal server error' : error.message,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                ERROR_CODES.INTERNAL_ERROR
            );
        }
    }

    // Log error
    const logData = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        errorCode: appError.errorCode,
        statusCode: appError.statusCode,
    };

    if (isOperationalError(appError)) {
        // Expected errors - log as warning
        logger.warn(appError.message, logData);
    } else {
        // Unexpected errors - log as error with stack trace
        logger.error(error.message, { ...logData, stack: error.stack });
    }

    // Send error response
    return sendError(res, {
        message: appError.message,
        statusCode: appError.statusCode,
        errorCode: appError.errorCode,
        details: env.isDevelopment ? appError.details : undefined,
    });
}

export default {
    notFoundHandler,
    errorHandler,
};
