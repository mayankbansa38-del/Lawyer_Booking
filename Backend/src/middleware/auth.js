/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Authentication Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * JWT authentication and role-based access control middleware.
 * 
 * @module middleware/auth
 */

import { verifyAccessToken } from '../utils/crypto.js';
import { AuthenticationError, ForbiddenError } from '../utils/errors.js';
import { getPrismaClient } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Extract JWT token from Authorization header
 * 
 * @param {import('express').Request} req - Express request
 * @returns {string|null} Token or null
 */
function extractToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return null;
    }

    // Support "Bearer <token>" format
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return authHeader;
}

/**
 * Authenticate user via JWT token
 * Attaches user to req.user if authenticated
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function authenticate(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            throw new AuthenticationError('tokenMissing');
        }

        // Verify token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationError('tokenExpired');
            }
            throw new AuthenticationError('tokenInvalid');
        }

        // Validate token type
        if (decoded.type !== 'access') {
            throw new AuthenticationError('tokenInvalid');
        }

        // Fetch user from database
        const prisma = getPrismaClient();
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                isActive: true,
                isEmailVerified: true,
                lawyer: {
                    select: {
                        id: true,
                        verificationStatus: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AuthenticationError('tokenInvalid');
        }

        if (!user.isActive) {
            throw new AuthenticationError('accountDisabled');
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            isEmailVerified: user.isEmailVerified,
            lawyerId: user.lawyer?.id || null,
            lawyerVerificationStatus: user.lawyer?.verificationStatus || null,
        };

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication - doesn't fail if not authenticated
 * Useful for endpoints that behave differently for authenticated users
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function optionalAuth(req, res, next) {
    try {
        const token = extractToken(req);

        if (!token) {
            req.user = null;
            return next();
        }

        // Try to authenticate, but don't fail
        await authenticate(req, res, (error) => {
            if (error) {
                // Log but don't fail
                logger.debug('Optional auth failed:', { error: error.message });
                req.user = null;
            }
            next();
        });
    } catch (error) {
        req.user = null;
        next();
    }
}

/**
 * Require email verification
 * Must be used after authenticate middleware
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireEmailVerification(req, res, next) {
    if (!req.user) {
        return next(new AuthenticationError('tokenMissing'));
    }

    if (!req.user.isEmailVerified) {
        return next(new AuthenticationError('emailNotVerified'));
    }

    next();
}

/**
 * Create role-based authorization middleware
 * 
 * @param {...string} allowedRoles - Roles that are allowed access
 * @returns {Function} Express middleware
 */
export function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthenticationError('tokenMissing'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError(
                `Access denied. Required role: ${allowedRoles.join(' or ')}`
            ));
        }

        next();
    };
}

/**
 * Require lawyer role with verified status
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireVerifiedLawyer(req, res, next) {
    if (!req.user) {
        return next(new AuthenticationError('tokenMissing'));
    }

    if (req.user.role !== 'LAWYER') {
        return next(new ForbiddenError('Access denied. Lawyer account required.'));
    }

    if (!req.user.lawyerId) {
        return next(new ForbiddenError('Lawyer profile not found.'));
    }

    if (req.user.lawyerVerificationStatus !== 'VERIFIED') {
        return next(new ForbiddenError(
            'Lawyer verification required. Your profile is still pending verification.'
        ));
    }

    next();
}

/**
 * Require admin role
 * Shorthand for authorize('ADMIN')
 */
export const requireAdmin = authorize('ADMIN');

/**
 * Require lawyer role (verified or not)
 * Shorthand for authorize('LAWYER', 'ADMIN')
 */
export const requireLawyer = authorize('LAWYER', 'ADMIN');

/**
 * Check if user owns the resource
 * 
 * @param {Function} getResourceUserId - Function to extract user ID from resource
 * @returns {Function} Express middleware
 */
export function requireOwnership(getResourceUserId) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next(new AuthenticationError('tokenMissing'));
            }

            // Admins can access any resource
            if (req.user.role === 'ADMIN') {
                return next();
            }

            const resourceUserId = await getResourceUserId(req);

            if (resourceUserId !== req.user.id) {
                return next(new ForbiddenError('You do not have access to this resource.'));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

export default {
    authenticate,
    optionalAuth,
    requireEmailVerification,
    authorize,
    requireVerifiedLawyer,
    requireAdmin,
    requireLawyer,
    requireOwnership,
};
