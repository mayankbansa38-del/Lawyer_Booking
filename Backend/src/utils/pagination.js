/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Pagination Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Utilities for handling pagination (offset-based and cursor-based).
 * 
 * @module utils/pagination
 */

import { PAGINATION } from '../config/constants.js';

/**
 * Parse pagination parameters from request query
 * 
 * @param {Object} query - Request query object
 * @returns {Object} Parsed pagination parameters
 */
export function parsePaginationParams(query) {
    const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
        Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
}

/**
 * Build pagination metadata
 * 
 * @param {number} total - Total number of items
 * @param {number} page - Current page (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
export function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
    };
}

/**
 * Parse sorting parameters from request query
 * 
 * @param {Object} query - Request query object
 * @param {Object} allowedFields - Map of allowed sort fields to database columns
 * @param {string} [defaultField='createdAt'] - Default sort field
 * @param {string} [defaultOrder='desc'] - Default sort order
 * @returns {Object} Parsed sort parameters
 */
export function parseSortParams(query, allowedFields, defaultField = 'createdAt', defaultOrder = 'desc') {
    let sortBy = query.sortBy || query.sort_by || defaultField;
    let sortOrder = (query.sortOrder || query.sort_order || defaultOrder).toLowerCase();

    // Validate sort field
    if (!allowedFields[sortBy]) {
        sortBy = defaultField;
    }

    // Validate sort order
    if (!['asc', 'desc'].includes(sortOrder)) {
        sortOrder = defaultOrder;
    }

    return {
        field: allowedFields[sortBy] || sortBy,
        order: sortOrder,
    };
}

/**
 * Build Prisma orderBy clause
 * 
 * @param {string} field - Sort field
 * @param {string} order - Sort order ('asc' or 'desc')
 * @returns {Object} Prisma orderBy clause
 */
export function buildPrismaOrderBy(field, order) {
    // Handle nested fields (e.g., 'user.firstName')
    const parts = field.split('.');

    if (parts.length === 1) {
        return { [field]: order };
    }

    // Build nested orderBy
    let result = { [parts[parts.length - 1]]: order };
    for (let i = parts.length - 2; i >= 0; i--) {
        result = { [parts[i]]: result };
    }

    return result;
}

/**
 * Paginate an array (for in-memory pagination)
 * 
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result with data and meta
 */
export function paginateArray(array, page, limit) {
    const total = array.length;
    const skip = (page - 1) * limit;
    const data = array.slice(skip, skip + limit);
    const meta = buildPaginationMeta(total, page, limit);

    return { data, meta };
}

// ═══════════════════════════════════════════════════════════════════════════
// CURSOR-BASED PAGINATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encode cursor for cursor-based pagination
 * 
 * @param {Object} data - Data to encode
 * @returns {string} Base64-encoded cursor
 */
export function encodeCursor(data) {
    return Buffer.from(JSON.stringify(data)).toString('base64');
}

/**
 * Decode cursor for cursor-based pagination
 * 
 * @param {string} cursor - Base64-encoded cursor
 * @returns {Object|null} Decoded cursor data or null if invalid
 */
export function decodeCursor(cursor) {
    if (!cursor) return null;

    try {
        return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    } catch {
        return null;
    }
}

/**
 * Parse cursor pagination parameters
 * 
 * @param {Object} query - Request query object
 * @returns {Object} Cursor pagination parameters
 */
export function parseCursorParams(query) {
    const limit = Math.min(
        Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT),
        PAGINATION.MAX_LIMIT
    );

    const cursor = query.cursor || null;
    const decodedCursor = decodeCursor(cursor);

    return {
        limit,
        cursor,
        decodedCursor,
    };
}

/**
 * Build cursor pagination result
 * 
 * @param {Array} items - Fetched items (should fetch limit + 1)
 * @param {number} limit - Requested limit
 * @param {Function} getCursorValue - Function to get cursor value from item
 * @returns {Object} Cursor pagination result
 */
export function buildCursorPaginationResult(items, limit, getCursorValue) {
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;

    const nextCursor = hasMore && data.length > 0
        ? encodeCursor(getCursorValue(data[data.length - 1]))
        : null;

    return {
        data,
        hasMore,
        nextCursor,
    };
}

/**
 * Build Prisma cursor clause for cursor-based pagination
 * 
 * @param {Object} decodedCursor - Decoded cursor object
 * @param {string} [cursorField='id'] - Cursor field name
 * @returns {Object|undefined} Prisma cursor and skip clauses
 */
export function buildPrismaCursor(decodedCursor, cursorField = 'id') {
    if (!decodedCursor || !decodedCursor[cursorField]) {
        return undefined;
    }

    return {
        cursor: { [cursorField]: decodedCursor[cursorField] },
        skip: 1, // Skip the cursor item itself
    };
}

export default {
    parsePaginationParams,
    buildPaginationMeta,
    parseSortParams,
    buildPrismaOrderBy,
    paginateArray,
    encodeCursor,
    decodeCursor,
    parseCursorParams,
    buildCursorPaginationResult,
    buildPrismaCursor,
};
