/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Chat Routes (REST fallback)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * REST endpoints for chat message history. Real-time handled by Socket.io.
 * 
 * @module modules/chat/routes
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { sendSuccess, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { parsePaginationParams } from '../../utils/pagination.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * Verify user has access to a case's chat
 */
async function verifyCaseAccess(prisma, caseId, userId) {
    const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
            lawyer: { select: { userId: true } },
        },
    });

    if (!caseData) {
        throw new NotFoundError('Case');
    }

    const isClient = caseData.clientId === userId;
    const isLawyer = caseData.lawyer.userId === userId;

    if (!isClient && !isLawyer) {
        throw new ForbiddenError('You do not have access to this case chat');
    }

    return caseData;
}

/**
 * @route   GET /api/v1/chat/:caseId/messages
 * @desc    Get paginated messages for a case
 * @access  Private
 */
router.get('/:caseId/messages', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { caseId } = req.params;

    await verifyCaseAccess(prisma, caseId, req.user.id);

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where: { caseId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        }),
        prisma.message.count({ where: { caseId } }),
    ]);

    // Transform — reverse so oldest-first in the page
    const transformed = messages.reverse().map(m => ({
        id: m.id,
        content: m.content,
        type: m.type,
        attachmentUrl: m.attachmentUrl,
        sender: {
            id: m.sender.id,
            name: `${m.sender.firstName} ${m.sender.lastName}`,
            avatar: m.sender.avatar,
            role: m.sender.role,
        },
        isRead: m.isRead,
        readAt: m.readAt,
        createdAt: m.createdAt,
    }));

    return sendPaginated(res, { data: transformed, total, page, limit });
}));

/**
 * @route   POST /api/v1/chat/:caseId/messages
 * @desc    Send a message (REST fallback — primary is Socket.io)
 * @access  Private
 */
router.post('/:caseId/messages', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { caseId } = req.params;
    const { content, type = 'TEXT', attachmentUrl } = req.body;

    if (!content && type === 'TEXT') {
        throw new BadRequestError('Message content is required');
    }

    await verifyCaseAccess(prisma, caseId, req.user.id);

    const message = await prisma.message.create({
        data: {
            content: content || '',
            type,
            attachmentUrl,
            senderId: req.user.id,
            caseId,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                },
            },
        },
    });

    // Also create an audit entry
    await prisma.auditLog.create({
        data: {
            action: 'MESSAGE_SENT',
            entityType: 'Message',
            entityId: message.id,
            userId: req.user.id,
            caseId,
            details: { type, hasAttachment: !!attachmentUrl },
        },
    });

    logger.logBusiness('MESSAGE_SENT', {
        messageId: message.id,
        caseId,
        senderId: req.user.id,
    });

    return sendSuccess(res, {
        data: {
            id: message.id,
            content: message.content,
            type: message.type,
            attachmentUrl: message.attachmentUrl,
            sender: {
                id: message.sender.id,
                name: `${message.sender.firstName} ${message.sender.lastName}`,
                avatar: message.sender.avatar,
                role: message.sender.role,
            },
            isRead: message.isRead,
            createdAt: message.createdAt,
        },
        message: 'Message sent',
    });
}));

/**
 * @route   PUT /api/v1/chat/:caseId/messages/read
 * @desc    Mark all unread messages in a case as read (for current user)
 * @access  Private
 */
router.put('/:caseId/messages/read', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { caseId } = req.params;

    await verifyCaseAccess(prisma, caseId, req.user.id);

    // Mark messages NOT sent by the current user as read
    const result = await prisma.message.updateMany({
        where: {
            caseId,
            senderId: { not: req.user.id },
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return sendSuccess(res, {
        data: { markedRead: result.count },
        message: `${result.count} messages marked as read`,
    });
}));

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get list of active case conversations for current user
 * @access  Private
 */
router.get('/conversations', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const where = {};

    if (req.user.role === 'LAWYER') {
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id },
            select: { id: true },
        });
        if (!lawyer) throw new ForbiddenError('Lawyer profile not found');
        where.lawyerId = lawyer.id;
    } else {
        where.clientId = req.user.id;
    }

    // Only cases that aren't closed
    where.status = { notIn: ['CLOSED', 'RESOLVED'] };

    const cases = await prisma.case.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            lawyer: {
                select: {
                    id: true,
                    user: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                },
            },
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                    content: true,
                    createdAt: true,
                    senderId: true,
                    type: true,
                },
            },
            _count: {
                select: {
                    messages: {
                        where: {
                            isRead: false,
                            senderId: { not: req.user.id },
                        },
                    },
                },
            },
        },
    });

    const transformed = cases.map(c => ({
        caseId: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        status: c.status,
        otherParty: req.user.role === 'LAWYER'
            ? { id: c.client.id, name: `${c.client.firstName} ${c.client.lastName}`, avatar: c.client.avatar }
            : { id: c.lawyer.user.id, name: `${c.lawyer.user.firstName} ${c.lawyer.user.lastName}`, avatar: c.lawyer.user.avatar },
        lastMessage: c.messages[0] || null,
        unreadCount: c._count.messages,
        updatedAt: c.updatedAt,
    }));

    return sendSuccess(res, { data: transformed });
}));

export default router;
