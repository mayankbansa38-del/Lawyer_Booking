/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Logger Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Winston logger with structured logging, file rotation, and console output.
 * 
 * @module utils/logger
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment safely (before env.js is loaded)
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

/**
 * Custom log format for console output
 */
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Add metadata if present
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }

        return msg;
    })
);

/**
 * JSON format for file logging
 */
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

/**
 * Log file paths
 */
const logsDir = path.join(__dirname, '../../logs');

/**
 * Winston logger transports
 */
const transports = [
    // Console transport (always enabled)
    new winston.transports.Console({
        format: consoleFormat,
        level: LOG_LEVEL,
    }),
];

// Add file transports in production
if (NODE_ENV === 'production') {
    transports.push(
        // Error log file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        // Combined log file
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
    level: LOG_LEVEL,
    levels: winston.config.npm.levels,
    transports,

    // Don't exit on handled exceptions
    exitOnError: false,

    // Handle uncaught exceptions
    exceptionHandlers: NODE_ENV === 'production' ? [
        new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
            format: fileFormat,
        }),
    ] : undefined,

    // Handle unhandled promise rejections
    rejectionHandlers: NODE_ENV === 'production' ? [
        new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
            format: fileFormat,
        }),
    ] : undefined,
});

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, statusCode, duration) => {
    const logData = {
        method: req.method,
        url: req.originalUrl,
        status: statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    };

    // Add user ID if authenticated
    if (req.user?.id) {
        logData.userId = req.user.id;
    }

    // Determine log level based on status code
    if (statusCode >= 500) {
        logger.error('Request failed', logData);
    } else if (statusCode >= 400) {
        logger.warn('Request error', logData);
    } else {
        logger.info('Request completed', logData);
    }
};

/**
 * Log database operation
 * @param {string} operation - Operation name
 * @param {string} model - Model/table name
 * @param {number} duration - Duration in ms
 * @param {Object} [metadata] - Additional metadata
 */
logger.logDbOperation = (operation, model, duration, metadata = {}) => {
    logger.debug('Database operation', {
        operation,
        model,
        duration: `${duration}ms`,
        ...metadata,
    });
};

/**
 * Log external service call
 * @param {string} service - Service name
 * @param {string} operation - Operation name
 * @param {boolean} success - Whether call succeeded
 * @param {number} duration - Duration in ms
 * @param {Object} [metadata] - Additional metadata
 */
logger.logExternalCall = (service, operation, success, duration, metadata = {}) => {
    const logFn = success ? logger.info : logger.error;
    logFn('External service call', {
        service,
        operation,
        success,
        duration: `${duration}ms`,
        ...metadata,
    });
};

/**
 * Log security event
 * @param {string} event - Event type
 * @param {Object} metadata - Event metadata
 */
logger.logSecurity = (event, metadata = {}) => {
    logger.warn('Security event', {
        event,
        timestamp: new Date().toISOString(),
        ...metadata,
    });
};

/**
 * Log business event
 * @param {string} event - Event name
 * @param {Object} metadata - Event metadata
 */
logger.logBusiness = (event, metadata = {}) => {
    logger.info('Business event', {
        event,
        timestamp: new Date().toISOString(),
        ...metadata,
    });
};

export default logger;
