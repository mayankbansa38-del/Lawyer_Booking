/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Reviews Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Review management routes.
 * 
 * @module modules/reviews/routes
 */

import { Router } from 'express';
import { authenticate, requireVerifiedLawyer, authorize } from '../../middleware/auth.js';
import { sendSuccess, sendCreated, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { parsePaginationParams, parseSortParams } from '../../utils/pagination.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/v1/reviews
 * @desc    Create a review for a completed booking
 * @access  Private
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { bookingId, rating, title, content } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        throw new BadRequestError('Rating must be between 1 and 5');
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { review: true },
    });

    if (!booking) {
        throw new NotFoundError('Booking');
    }

    if (booking.clientId !== req.user.id) {
        throw new ForbiddenError('You can only review your own bookings');
    }

    if (booking.status !== 'COMPLETED') {
        throw new BadRequestError('You can only review completed consultations');
    }

    if (booking.review) {
        throw new ConflictError('You have already reviewed this booking');
    }

    // Create review
    const review = await prisma.review.create({
        data: {
            bookingId,
            authorId: req.user.id,
            lawyerId: booking.lawyerId,
            rating,
            title,
            content,
            isVerified: true, // Verified because it's tied to a completed booking
        },
    });

    // Update lawyer average rating
    const aggregation = await prisma.review.aggregate({
        where: { lawyerId: booking.lawyerId, isPublished: true },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await prisma.lawyer.update({
        where: { id: booking.lawyerId },
        data: {
            averageRating: aggregation._avg.rating || 0,
            totalReviews: aggregation._count.rating || 0,
        },
    });

    logger.logBusiness('REVIEW_CREATED', {
        reviewId: review.id,
        lawyerId: booking.lawyerId,
        rating,
    });

    return sendCreated(res, { review }, 'Review submitted successfully');
}));

/**
 * @route   GET /api/v1/reviews/lawyer/:lawyerId
 * @desc    Get reviews for a lawyer
 * @access  Public
 */
router.get('/lawyer/:lawyerId', asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { lawyerId } = req.params;
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { rating } = req.query;

    const where = {
        lawyerId,
        isPublished: true,
        isHidden: false,
    };

    if (rating) {
        where.rating = parseInt(rating);
    }

    const [reviews, total, aggregation] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                rating: true,
                title: true,
                content: true,
                isVerified: true,
                helpfulCount: true,
                lawyerResponse: true,
                respondedAt: true,
                createdAt: true,
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
        }),
        prisma.review.count({ where }),
        prisma.review.aggregate({
            where: { lawyerId, isPublished: true },
            _avg: { rating: true },
            _count: { rating: true },
        }),
    ]);

    // Rating distribution
    const ratingDistribution = await prisma.review.groupBy({
        by: ['rating'],
        where: { lawyerId, isPublished: true },
        _count: { rating: true },
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(r => {
        distribution[r.rating] = r._count.rating;
    });

    const transformed = reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        isVerified: r.isVerified,
        helpfulCount: r.helpfulCount,
        lawyerResponse: r.lawyerResponse,
        respondedAt: r.respondedAt,
        createdAt: r.createdAt,
        author: {
            name: `${r.author.firstName} ${r.author.lastName.charAt(0)}.`,
            avatar: r.author.avatar,
        },
    }));

    return sendPaginated(res, {
        data: transformed,
        total,
        page,
        limit,
        message: 'Success',
    });
}));

/**
 * @route   GET /api/v1/reviews/my
 * @desc    Get current user's reviews
 * @access  Private
 */
router.get('/my', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);

    const where = { authorId: req.user.id };

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                lawyer: {
                    select: {
                        id: true,
                        slug: true,
                        user: {
                            select: { firstName: true, lastName: true, avatar: true },
                        },
                    },
                },
            },
        }),
        prisma.review.count({ where }),
    ]);

    const transformed = reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        lawyerResponse: r.lawyerResponse,
        createdAt: r.createdAt,
        lawyer: {
            id: r.lawyer.id,
            slug: r.lawyer.slug,
            name: `${r.lawyer.user.firstName} ${r.lawyer.user.lastName}`,
            avatar: r.lawyer.user.avatar,
        },
    }));

    return sendPaginated(res, {
        data: transformed,
        total,
        page,
        limit,
    });
}));

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update a review
 * @access  Private
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { rating, title, content } = req.body;

    const review = await prisma.review.findUnique({
        where: { id: req.params.id },
    });

    if (!review) {
        throw new NotFoundError('Review');
    }

    if (review.authorId !== req.user.id) {
        throw new ForbiddenError('You can only edit your own reviews');
    }

    // Can only edit within 48 hours
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 48) {
        throw new BadRequestError('Reviews can only be edited within 48 hours of submission');
    }

    const updated = await prisma.review.update({
        where: { id: review.id },
        data: {
            rating: rating !== undefined ? rating : undefined,
            title: title !== undefined ? title : undefined,
            content: content !== undefined ? content : undefined,
        },
    });

    // Recalculate lawyer rating
    const aggregation = await prisma.review.aggregate({
        where: { lawyerId: review.lawyerId, isPublished: true },
        _avg: { rating: true },
    });

    await prisma.lawyer.update({
        where: { id: review.lawyerId },
        data: { averageRating: aggregation._avg.rating || 0 },
    });

    return sendSuccess(res, {
        data: updated,
        message: 'Review updated successfully',
    });
}));

/**
 * @route   POST /api/v1/reviews/:id/respond
 * @desc    Respond to a review (Lawyer)
 * @access  Private/Lawyer
 */
router.post('/:id/respond', authenticate, requireVerifiedLawyer, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { response } = req.body;

    if (!response || response.trim().length < 10) {
        throw new BadRequestError('Response must be at least 10 characters');
    }

    const review = await prisma.review.findUnique({
        where: { id: req.params.id },
        include: { lawyer: true },
    });

    if (!review) {
        throw new NotFoundError('Review');
    }

    if (review.lawyer.userId !== req.user.id) {
        throw new ForbiddenError('You can only respond to reviews on your profile');
    }

    if (review.lawyerResponse) {
        throw new ConflictError('You have already responded to this review');
    }

    const updated = await prisma.review.update({
        where: { id: review.id },
        data: {
            lawyerResponse: response.trim(),
            respondedAt: new Date(),
        },
    });

    logger.logBusiness('REVIEW_RESPONSE_ADDED', {
        reviewId: review.id,
        lawyerId: review.lawyerId,
    });

    return sendSuccess(res, {
        data: updated,
        message: 'Response added successfully',
    });
}));

/**
 * @route   POST /api/v1/reviews/:id/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
router.post('/:id/helpful', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const review = await prisma.review.findUnique({
        where: { id: req.params.id },
    });

    if (!review) {
        throw new NotFoundError('Review');
    }

    // Increment helpful count (simplified - in production would track per user)
    await prisma.review.update({
        where: { id: review.id },
        data: { helpfulCount: { increment: 1 } },
    });

    return sendSuccess(res, { message: 'Marked as helpful' });
}));

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const review = await prisma.review.findUnique({
        where: { id: req.params.id },
    });

    if (!review) {
        throw new NotFoundError('Review');
    }

    // Only author or admin can delete
    if (review.authorId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Not authorized to delete this review');
    }

    await prisma.review.delete({
        where: { id: review.id },
    });

    // Recalculate lawyer rating
    const aggregation = await prisma.review.aggregate({
        where: { lawyerId: review.lawyerId, isPublished: true },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await prisma.lawyer.update({
        where: { id: review.lawyerId },
        data: {
            averageRating: aggregation._avg.rating || 0,
            totalReviews: aggregation._count.rating || 0,
        },
    });

    logger.logBusiness('REVIEW_DELETED', { reviewId: review.id });

    return sendSuccess(res, { message: 'Review deleted successfully' });
}));

export default router;
