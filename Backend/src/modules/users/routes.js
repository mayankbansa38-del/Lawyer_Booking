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
 * @route   POST /api/v1/users/avatar
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/avatar', authenticate, asyncHandler(async (req, res) => {
    try {
        const { uploadAvatar, handleUpload } = await import('../../middleware/upload.js');
        const { BadRequestError } = await import('../../utils/errors.js');
        const { uploadToStorage } = await import('../../config/supabase.js');

        // Wrap middleware in promise to handle async flow
        await new Promise((resolve, reject) => {
            handleUpload(uploadAvatar)(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        if (!req.file) {
            throw new BadRequestError('No image file provided');
        }

        const prisma = getPrismaClient();

        // Upload to storage (Supabase)
        const avatarUrl = await uploadToStorage(req.file, 'avatars', req.user.id);

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { avatar: avatarUrl },
            select: { id: true, avatar: true }
        });

        return sendSuccess(res, {
            data: { avatar: user.avatar },
            message: 'Profile picture updated'
        });
    } catch (error) {
        throw error;
    }
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

// ═══════════════════════════════════════════════════════════════════════════
// SAVED LAWYERS (Favorites)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/users/saved-lawyers
 * @desc    Get user's saved/favorite lawyers
 * @access  Private
 */
router.get('/saved-lawyers', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const savedLawyers = await prisma.savedLawyer.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
            lawyer: {
                select: {
                    id: true,
                    slug: true,
                    bio: true,
                    headline: true,
                    experience: true,
                    hourlyRate: true,
                    consultationFee: true,
                    city: true,
                    state: true,
                    isAvailable: true,
                    averageRating: true,
                    completedBookings: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    specializations: {
                        where: { isPrimary: true },
                        take: 3,
                        select: {
                            practiceArea: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    const transformed = savedLawyers.map(sl => ({
        id: sl.lawyer.id,
        savedAt: sl.createdAt,
        name: `${sl.lawyer.user.firstName} ${sl.lawyer.user.lastName}`,
        image: sl.lawyer.user.avatar,
        location: [sl.lawyer.city, sl.lawyer.state].filter(Boolean).join(', ') || 'India',
        experience: sl.lawyer.experience,
        rating: sl.lawyer.averageRating || 0,
        casesWon: sl.lawyer.completedBookings || 0,
        specialty: sl.lawyer.specializations.map(s => s.practiceArea.name),
        consultationFee: parseFloat(sl.lawyer.consultationFee) || 0,
        isAvailable: sl.lawyer.isAvailable,
    }));

    return sendSuccess(res, { data: transformed });
}));

/**
 * @route   POST /api/v1/users/saved-lawyers/:lawyerId
 * @desc    Save/favorite a lawyer
 * @access  Private
 */
router.post('/saved-lawyers/:lawyerId', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { lawyerId } = req.params;

    // Verify lawyer exists
    const lawyer = await prisma.lawyer.findUnique({ where: { id: lawyerId } });
    if (!lawyer) {
        throw new NotFoundError('Lawyer');
    }

    // Upsert to handle duplicate gracefully
    await prisma.savedLawyer.upsert({
        where: {
            userId_lawyerId: { userId: req.user.id, lawyerId },
        },
        create: { userId: req.user.id, lawyerId },
        update: {}, // No-op if already exists
    });

    return sendSuccess(res, { message: 'Lawyer saved to favorites' });
}));

/**
 * @route   DELETE /api/v1/users/saved-lawyers/:lawyerId
 * @desc    Remove a saved/favorite lawyer
 * @access  Private
 */
router.delete('/saved-lawyers/:lawyerId', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { lawyerId } = req.params;

    await prisma.savedLawyer.deleteMany({
        where: { userId: req.user.id, lawyerId },
    });

    return sendSuccess(res, { message: 'Lawyer removed from favorites' });
}));

export default router;
