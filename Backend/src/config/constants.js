/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Application Constants
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralized constants used throughout the application.
 * Keep all magic numbers and strings here for easy maintenance.
 * 
 * @module config/constants
 */

/**
 * User roles in the system
 * @enum {string}
 */
export const USER_ROLES = Object.freeze({
    USER: 'USER',
    LAWYER: 'LAWYER',
    ADMIN: 'ADMIN',
});

/**
 * Booking status values
 * @enum {string}
 */
export const BOOKING_STATUS = Object.freeze({
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
    RESCHEDULED: 'RESCHEDULED',
});

/**
 * Payment status values
 * @enum {string}
 */
export const PAYMENT_STATUS = Object.freeze({
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
    PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
});

/**
 * Payment methods
 * @enum {string}
 */
export const PAYMENT_METHODS = Object.freeze({
    CARD: 'CARD',
    UPI: 'UPI',
    NET_BANKING: 'NET_BANKING',
    WALLET: 'WALLET',
});

/**
 * Lawyer verification status
 * @enum {string}
 */
export const VERIFICATION_STATUS = Object.freeze({
    PENDING: 'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED',
});

/**
 * Legal practice areas / specializations
 * @enum {string}
 */
export const PRACTICE_AREAS = Object.freeze({
    CORPORATE_LAW: 'Corporate Law',
    CRIMINAL_LAW: 'Criminal Law',
    FAMILY_LAW: 'Family Law',
    CIVIL_LAW: 'Civil Law',
    PROPERTY_LAW: 'Property Law',
    TAX_LAW: 'Tax Law',
    INTELLECTUAL_PROPERTY: 'Intellectual Property',
    LABOR_LAW: 'Labor Law',
    IMMIGRATION_LAW: 'Immigration Law',
    BANKING_LAW: 'Banking Law',
    ENVIRONMENTAL_LAW: 'Environmental Law',
    CONSUMER_LAW: 'Consumer Law',
    CYBER_LAW: 'Cyber Law',
    CONSTITUTIONAL_LAW: 'Constitutional Law',
    ARBITRATION: 'Arbitration',
    MEDIATION: 'Mediation',
    OTHER: 'Other',
});

/**
 * Document types for uploads
 * @enum {string}
 */
export const DOCUMENT_TYPES = Object.freeze({
    BAR_COUNCIL_CERTIFICATE: 'BAR_COUNCIL_CERTIFICATE',
    ID_PROOF: 'ID_PROOF',
    DEGREE_CERTIFICATE: 'DEGREE_CERTIFICATE',
    CASE_DOCUMENT: 'CASE_DOCUMENT',
    CONTRACT: 'CONTRACT',
    AVATAR: 'AVATAR',
    OTHER: 'OTHER',
});

/**
 * Notification types
 * @enum {string}
 */
export const NOTIFICATION_TYPES = Object.freeze({
    BOOKING_CREATED: 'BOOKING_CREATED',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    BOOKING_REMINDER: 'BOOKING_REMINDER',
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
    REVIEW_RECEIVED: 'REVIEW_RECEIVED',
    PROFILE_VERIFIED: 'PROFILE_VERIFIED',
    MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
    SYSTEM: 'SYSTEM',
});

/**
 * File upload limits
 */
export const FILE_LIMITS = Object.freeze({
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
});

/**
 * Pagination defaults
 */
export const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
});

/**
 * Booking duration options (in minutes)
 */
export const BOOKING_DURATIONS = Object.freeze([30, 45, 60, 90, 120]);

/**
 * Default booking duration in minutes
 */
export const DEFAULT_BOOKING_DURATION = 60;

/**
 * Working hours configuration
 */
export const WORKING_HOURS = Object.freeze({
    START: '09:00',
    END: '18:00',
    SLOT_INTERVAL: 30, // minutes
});

/**
 * Token expiry times
 */
export const TOKEN_EXPIRY = Object.freeze({
    EMAIL_VERIFICATION: '24h',
    PASSWORD_RESET: '1h',
    REFRESH_TOKEN: '30d',
    ACCESS_TOKEN: '7d',
});

/**
 * HTTP Status codes
 * Common status codes used in API responses
 */
export const HTTP_STATUS = Object.freeze({
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
});

/**
 * Error codes for API responses
 * Used for frontend error handling
 */
export const ERROR_CODES = Object.freeze({
    // Authentication errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Business logic errors
    BOOKING_CONFLICT: 'BOOKING_CONFLICT',
    SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

    // Rate limiting
    RATE_LIMITED: 'RATE_LIMITED',
});

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = Object.freeze({
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
});

/**
 * Regex patterns for validation
 */
export const REGEX = Object.freeze({
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_INDIA: /^(\+91[\-\s]?)?[6-9]\d{9}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    BAR_COUNCIL_ID: /^[A-Z]{2,3}\/\d{4,6}\/\d{4}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
});

export default {
    USER_ROLES,
    BOOKING_STATUS,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    VERIFICATION_STATUS,
    PRACTICE_AREAS,
    DOCUMENT_TYPES,
    NOTIFICATION_TYPES,
    FILE_LIMITS,
    PAGINATION,
    BOOKING_DURATIONS,
    DEFAULT_BOOKING_DURATION,
    WORKING_HOURS,
    TOKEN_EXPIRY,
    HTTP_STATUS,
    ERROR_CODES,
    CACHE_TTL,
    REGEX,
};
