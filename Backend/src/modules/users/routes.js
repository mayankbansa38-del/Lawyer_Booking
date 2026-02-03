/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Users Routes (Stub)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * User management routes - To be implemented.
 * 
 * @module modules/users/routes
 */

import { Router } from 'express';
import { authenticate, authorize, requireOwnership } from '../../middleware/auth.js';
import { sendSuccess, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';

const router = Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    return sendSuccess(res, { data: { user } });
}));

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phone: phone || undefined,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            updatedAt: true,
        },
    });

    return sendSuccess(res, {
        data: { user },
        message: 'Profile updated successfully',
    });
}));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/:id', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lawyer: true,
        },
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    return sendSuccess(res, { data: { user } });
}));

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: parseInt(limit),
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isEmailVerified: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
    ]);

    return sendSuccess(res, {
        data: users,
        meta: {
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
}));

export default router;
