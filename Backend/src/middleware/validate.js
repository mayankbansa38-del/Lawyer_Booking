/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Validation Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Request validation middleware using Joi.
 * 
 * @module middleware/validate
 */

import { ValidationError } from '../utils/errors.js';

/**
 * Validate request using Joi schema
 * 
 * @param {Object} schema - Joi schema object with body, query, params keys
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.stripUnknown=true] - Remove unknown properties
 * @param {boolean} [options.abortEarly=false] - Return all errors
 * @returns {Function} Express middleware
 */
export function validate(schema, options = {}) {
    const { stripUnknown = true, abortEarly = false } = options;

    const joiOptions = {
        abortEarly,
        stripUnknown,
        errors: {
            wrap: {
                label: '',
            },
        },
    };

    return async (req, res, next) => {
        const validationErrors = [];

        // Validate each part of the request
        for (const key of ['params', 'query', 'body']) {
            if (schema[key]) {
                const { error, value } = schema[key].validate(req[key], joiOptions);

                if (error) {
                    validationErrors.push(
                        ...error.details.map(detail => ({
                            field: `${key}.${detail.path.join('.')}`,
                            message: detail.message,
                            type: detail.type,
                        }))
                    );
                } else {
                    // Replace with validated (and potentially transformed) value
                    req[key] = value;
                }
            }
        }

        if (validationErrors.length > 0) {
            return next(new ValidationError('Validation failed', validationErrors));
        }

        next();
    };
}

/**
 * Validate request body only
 * 
 * @param {Object} bodySchema - Joi schema for body
 * @returns {Function} Express middleware
 */
export function validateBody(bodySchema) {
    return validate({ body: bodySchema });
}

/**
 * Validate request query only
 * 
 * @param {Object} querySchema - Joi schema for query
 * @returns {Function} Express middleware
 */
export function validateQuery(querySchema) {
    return validate({ query: querySchema });
}

/**
 * Validate request params only
 * 
 * @param {Object} paramsSchema - Joi schema for params
 * @returns {Function} Express middleware
 */
export function validateParams(paramsSchema) {
    return validate({ params: paramsSchema });
}

export default {
    validate,
    validateBody,
    validateQuery,
    validateParams,
};
