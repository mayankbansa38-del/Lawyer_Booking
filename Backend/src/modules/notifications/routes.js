/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Notifications Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Notification management routes.
 * 
 * @module modules/notifications/routes
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { sendSuccess, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { parsePaginationParams } from '../../utils/pagination.js';

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { unreadOnly } = req.query;

    const where = {
        userId: req.user.id,
        OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
        ],
    };

    if (unreadOnly === 'true') {
        where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                title: true,
                message: true,
                isRead: true,
                actionUrl: true,
                actionLabel: true,
                metadata: true,
                createdAt: true,
            },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                userId: req.user.id,
                isRead: false,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        }),
    ]);

    return sendPaginated(res, {
        data: notifications,
        total,
        page,
        limit,
    });
}));

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const count = await prisma.notification.count({
        where: {
            userId: req.user.id,
            isRead: false,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
            ],
        },
    });

    return sendSuccess(res, { data: { count } });
}));

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
    });

    if (!notification) {
        throw new NotFoundError('Notification');
    }

    if (notification.userId !== req.user.id) {
        throw new ForbiddenError('Not authorized');
    }

    if (!notification.isRead) {
        await prisma.notification.update({
            where: { id: notification.id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    return sendSuccess(res, { message: 'Notification marked as read' });
}));

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    await prisma.notification.updateMany({
        where: {
            userId: req.user.id,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return sendSuccess(res, { message: 'All notifications marked as read' });
}));

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
    });

    if (!notification) {
        throw new NotFoundError('Notification');
    }

    if (notification.userId !== req.user.id) {
        throw new ForbiddenError('Not authorized');
    }

    await prisma.notification.delete({
        where: { id: notification.id },
    });

    return sendSuccess(res, { message: 'Notification deleted' });
}));

/**
 * @route   DELETE /api/v1/notifications
 * @desc    Delete all read notifications
 * @access  Private
 */
router.delete('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    await prisma.notification.deleteMany({
        where: {
            userId: req.user.id,
            isRead: true,
        },
    });

    return sendSuccess(res, { message: 'Read notifications deleted' });
}));

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION CREATION UTILITY (for use by other modules)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a notification
 * 
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.actionUrl] - Action URL
 * @param {string} [options.actionLabel] - Action label
 * @param {Object} [options.metadata] - Additional metadata
 * @param {Date} [options.expiresAt] - Expiry date
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    actionUrl,
    actionLabel,
    metadata,
    expiresAt,
}) {
    const prisma = getPrismaClient();

    return prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            actionUrl,
            actionLabel,
            metadata,
            expiresAt,
        },
    });
}

/**
 * Create multiple notifications
 * 
 * @param {Array<Object>} notifications - Array of notification options
 * @returns {Promise<number>} Count of created notifications
 */
export async function createManyNotifications(notifications) {
    const prisma = getPrismaClient();

    const result = await prisma.notification.createMany({
        data: notifications,
    });

    return result.count;
}

export default router;
