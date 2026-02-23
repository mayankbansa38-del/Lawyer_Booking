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

export default {
    parsePaginationParams,
    buildPaginationMeta,
    parseSortParams,
    buildPrismaOrderBy,
};
