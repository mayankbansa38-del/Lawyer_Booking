/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Cases Routes (Refactored)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Case management with request/approval workflow:
 *   - Users REQUEST cases from completed bookings (status=REQUESTED)
 *   - Lawyers APPROVE or REJECT requests
 *   - Lawyers can also CREATE cases directly (status=OPEN)
 *   - Notifications sent on every lifecycle event
 *
 * @module modules/cases/routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { sendSuccess, sendCreated, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { parsePaginationParams } from '../../utils/pagination.js';
import { createNotification } from '../notifications/routes.js';
import logger from '../../utils/logger.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function generateCaseNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CASE-${timestamp}-${random}`;
}

async function createAuditEntry(prisma, { action, entityType, entityId, userId, caseId, details }) {
    return prisma.auditLog.create({
        data: { action, entityType, entityId, userId, caseId, details },
    });
}

/**
 * Verify user has access to a case (client, assigned lawyer, or admin)
 */
function assertCaseAccess(userCase, user) {
    const isClient = userCase.clientId === user.id;
    const isLawyer = userCase.lawyer?.userId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('You do not have access to this case');
    }
}

/**
 * Standard case include for list/detail queries
 */
const CASE_INCLUDE_LIST = {
    client: {
        select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
    },
    lawyer: {
        select: {
            id: true,
            userId: true,
            user: {
                select: { firstName: true, lastName: true, avatar: true },
            },
        },
    },
    _count: {
        select: { messages: true, documents: true },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/cases
 * @desc    Create a case request (USER) or create a case directly (LAWYER)
 * @access  Private
 *
 * USER flow:  requires bookingId (must be COMPLETED) → status = REQUESTED
 * LAWYER flow: requires clientId → status = OPEN
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { title, description, clientId, priority = 'MEDIUM', bookingId } = req.body;

    if (!title || !title.trim()) {
        throw new BadRequestError('Title is required');
    }

    let resolvedClientId = clientId;
    let resolvedLawyerId;
    let caseStatus;
    let lawyerUserId; // for notifications

    if (req.user.role === 'USER') {
        // ── User requests a case from a completed booking ──────────────
        if (!bookingId) {
            throw new BadRequestError('bookingId is required. Select a completed consultation.');
        }

        resolvedClientId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                lawyer: { select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } } },
            },
        });

        if (!booking || booking.clientId !== req.user.id) {
            throw new BadRequestError('Invalid booking — this booking does not belong to you');
        }

        if (booking.status !== 'COMPLETED') {
            throw new BadRequestError('You can only request a case after a completed consultation');
        }

        // Check no existing case is already linked to this booking
        const existingCase = await prisma.case.findUnique({
            where: { bookingId },
        });
        if (existingCase) {
            throw new BadRequestError('A case already exists for this booking');
        }

        resolvedLawyerId = booking.lawyerId;
        lawyerUserId = booking.lawyer.userId;
        caseStatus = 'REQUESTED'; // Pending lawyer approval

    } else if (req.user.role === 'LAWYER') {
        // ── Lawyer creates a case directly ─────────────────────────────
        if (!clientId) {
            throw new BadRequestError('clientId is required when a lawyer creates a case');
        }

        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id },
        });
        if (!lawyer) {
            throw new ForbiddenError('Lawyer profile not found');
        }

        resolvedLawyerId = lawyer.id;

        const client = await prisma.user.findUnique({ where: { id: clientId } });
        if (!client) throw new NotFoundError('Client');

        // Optionally link to a booking
        if (bookingId) {
            const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking || booking.lawyerId !== resolvedLawyerId || booking.clientId !== resolvedClientId) {
                throw new BadRequestError('Invalid booking reference');
            }
        }

        caseStatus = 'OPEN'; // No approval needed
    } else {
        throw new ForbiddenError('Only lawyers or users can create cases');
    }

    const newCase = await prisma.case.create({
        data: {
            caseNumber: generateCaseNumber(),
            title: title.trim(),
            description: description?.trim() || null,
            priority,
            status: caseStatus,
            clientId: resolvedClientId,
            lawyerId: resolvedLawyerId,
            bookingId: bookingId || null,
        },
        include: CASE_INCLUDE_LIST,
    });

    // ── Audit log ─────────────────────────────────────────────────────
    await createAuditEntry(prisma, {
        action: 'CREATE',
        entityType: 'Case',
        entityId: newCase.id,
        userId: req.user.id,
        caseId: newCase.id,
        details: { title, priority, status: caseStatus },
    });

    // ── Notifications ─────────────────────────────────────────────────
    if (req.user.role === 'USER' && lawyerUserId) {
        // Notify the lawyer about the new case request
        createNotification({
            userId: lawyerUserId,
            type: 'CASE',
            title: 'New Case Request',
            message: `${req.user.firstName} ${req.user.lastName} has requested a case: "${title}"`,
            actionUrl: `/lawyer/cases`,
            actionLabel: 'Review Request',
            metadata: { caseId: newCase.id },
        }).catch(err => logger.error('Failed to create case request notification', err));
    } else if (req.user.role === 'LAWYER') {
        // Notify the client that a lawyer opened a case for them
        createNotification({
            userId: resolvedClientId,
            type: 'CASE',
            title: 'New Case Opened',
            message: `Your lawyer has opened a case: "${title}"`,
            actionUrl: `/user/cases`,
            actionLabel: 'View Case',
            metadata: { caseId: newCase.id },
        }).catch(err => logger.error('Failed to create case creation notification', err));
    }

    logger.logBusiness('CASE_CREATED', {
        caseId: newCase.id,
        lawyerId: resolvedLawyerId,
        clientId: resolvedClientId,
        status: caseStatus,
    });

    const msg = caseStatus === 'REQUESTED'
        ? 'Case request submitted — awaiting lawyer approval'
        : 'Case created successfully';

    return sendCreated(res, { data: newCase }, msg);
}));

/**
 * @route   PUT /api/v1/cases/:id/approve
 * @desc    Lawyer approves a case request (REQUESTED → OPEN)
 * @access  Private (Assigned Lawyer only)
 */
router.put('/:id/approve', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const caseData = await prisma.case.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: { select: { userId: true } },
            client: { select: { id: true, firstName: true, lastName: true } },
        },
    });

    if (!caseData) throw new NotFoundError('Case');

    if (caseData.lawyer.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only the assigned lawyer can approve this case');
    }

    if (caseData.status !== 'REQUESTED') {
        throw new BadRequestError(`Cannot approve a case with status "${caseData.status}". Only REQUESTED cases can be approved.`);
    }

    const updated = await prisma.case.update({
        where: { id: req.params.id },
        data: { status: 'OPEN' },
        include: CASE_INCLUDE_LIST,
    });

    await createAuditEntry(prisma, {
        action: 'STATUS_CHANGE',
        entityType: 'Case',
        entityId: updated.id,
        userId: req.user.id,
        caseId: updated.id,
        details: { status: { from: 'REQUESTED', to: 'OPEN' } },
    });

    // Notify the client
    createNotification({
        userId: caseData.clientId,
        type: 'CASE',
        title: 'Case Request Approved',
        message: `Your case "${caseData.title}" has been approved by the lawyer.`,
        actionUrl: `/user/cases`,
        actionLabel: 'View Case',
        metadata: { caseId: updated.id },
    }).catch(err => logger.error('Failed to create case approval notification', err));

    logger.logBusiness('CASE_APPROVED', { caseId: updated.id });

    return sendSuccess(res, { data: updated, message: 'Case approved successfully' });
}));

/**
 * @route   PUT /api/v1/cases/:id/reject
 * @desc    Lawyer rejects a case request (REQUESTED → REJECTED)
 * @access  Private (Assigned Lawyer only)
 */
router.put('/:id/reject', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { reason } = req.body;

    const caseData = await prisma.case.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: { select: { userId: true } },
            client: { select: { id: true, firstName: true, lastName: true } },
        },
    });

    if (!caseData) throw new NotFoundError('Case');

    if (caseData.lawyer.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only the assigned lawyer can reject this case');
    }

    if (caseData.status !== 'REQUESTED') {
        throw new BadRequestError(`Cannot reject a case with status "${caseData.status}". Only REQUESTED cases can be rejected.`);
    }

    const updated = await prisma.case.update({
        where: { id: req.params.id },
        data: { status: 'REJECTED' },
        include: CASE_INCLUDE_LIST,
    });

    await createAuditEntry(prisma, {
        action: 'STATUS_CHANGE',
        entityType: 'Case',
        entityId: updated.id,
        userId: req.user.id,
        caseId: updated.id,
        details: { status: { from: 'REQUESTED', to: 'REJECTED' }, reason: reason || null },
    });

    // Notify the client
    const rejectionMsg = reason
        ? `Your case "${caseData.title}" has been declined. Reason: ${reason}`
        : `Your case "${caseData.title}" has been declined by the lawyer.`;

    createNotification({
        userId: caseData.clientId,
        type: 'CASE',
        title: 'Case Request Declined',
        message: rejectionMsg,
        actionUrl: `/user/cases`,
        actionLabel: 'View Cases',
        metadata: { caseId: updated.id, reason },
    }).catch(err => logger.error('Failed to create case rejection notification', err));

    logger.logBusiness('CASE_REJECTED', { caseId: updated.id, reason });

    return sendSuccess(res, { data: updated, message: 'Case rejected' });
}));

/**
 * @route   GET /api/v1/cases
 * @desc    Get user's cases (role-aware: client sees their cases, lawyer sees assigned)
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, priority, search } = req.query;

    const where = {};

    // Role-based filtering
    if (req.user.role === 'LAWYER') {
        const lawyer = await prisma.lawyer.findUnique({
            where: { userId: req.user.id },
            select: { id: true },
        });
        if (!lawyer) throw new ForbiddenError('Lawyer profile not found');
        where.lawyerId = lawyer.id;
    } else if (req.user.role === 'USER') {
        where.clientId = req.user.id;
    }
    // ADMINs see all — no filter

    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { caseNumber: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    const [cases, total] = await Promise.all([
        prisma.case.findMany({
            where,
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: CASE_INCLUDE_LIST,
        }),
        prisma.case.count({ where }),
    ]);

    const transformed = cases.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        description: c.description,
        status: c.status,
        priority: c.priority,
        client: {
            id: c.client.id,
            name: `${c.client.firstName} ${c.client.lastName}`,
            avatar: c.client.avatar,
            email: c.client.email,
        },
        lawyer: {
            id: c.lawyer.id,
            name: `${c.lawyer.user.firstName} ${c.lawyer.user.lastName}`,
            avatar: c.lawyer.user.avatar,
        },
        messageCount: c._count.messages,
        documentCount: c._count.documents,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        closedAt: c.closedAt,
    }));

    return sendPaginated(res, { data: transformed, total, page, limit });
}));

/**
 * @route   GET /api/v1/cases/:id
 * @desc    Get case detail with latest messages + documents
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const caseData = await prisma.case.findUnique({
        where: { id: req.params.id },
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true, avatar: true, email: true, phone: true },
            },
            lawyer: {
                select: {
                    id: true,
                    userId: true,
                    user: {
                        select: { firstName: true, lastName: true, avatar: true, email: true },
                    },
                    specializations: {
                        include: {
                            practiceArea: { select: { name: true } },
                        },
                    },
                },
            },
            booking: {
                select: {
                    id: true,
                    bookingNumber: true,
                    scheduledDate: true,
                    status: true,
                },
            },
            messages: {
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: {
                        select: { id: true, firstName: true, lastName: true, avatar: true },
                    },
                },
            },
            documents: {
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    originalName: true,
                    type: true,
                    mimeType: true,
                    size: true,
                    storageUrl: true,
                    createdAt: true,
                },
            },
            _count: {
                select: { messages: true, documents: true, auditLogs: true },
            },
        },
    });

    if (!caseData) {
        throw new NotFoundError('Case');
    }

    assertCaseAccess(caseData, req.user);

    return sendSuccess(res, { data: caseData });
}));

/**
 * @route   PUT /api/v1/cases/:id
 * @desc    Update case (status, priority, description)
 * @access  Private (Lawyer + Admin)
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { status, priority, title, description } = req.body;

    const existingCase = await prisma.case.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: { select: { userId: true } },
        },
    });

    if (!existingCase) {
        throw new NotFoundError('Case');
    }

    // Only the assigned lawyer or admin can update
    const isLawyer = existingCase.lawyer.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isLawyer && !isAdmin) {
        throw new ForbiddenError('Only the assigned lawyer or admin can update cases');
    }

    const updateData = {};
    const changes = {};

    if (status && status !== existingCase.status) {
        updateData.status = status;
        changes.status = { from: existingCase.status, to: status };
        if (['CLOSED', 'RESOLVED'].includes(status)) {
            updateData.closedAt = new Date();
        }
    }
    if (priority && priority !== existingCase.priority) {
        updateData.priority = priority;
        changes.priority = { from: existingCase.priority, to: priority };
    }
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.case.update({
        where: { id: req.params.id },
        data: updateData,
        include: CASE_INCLUDE_LIST,
    });

    const action = changes.status ? 'STATUS_CHANGE' : 'UPDATE';
    await createAuditEntry(prisma, {
        action,
        entityType: 'Case',
        entityId: updated.id,
        userId: req.user.id,
        caseId: updated.id,
        details: changes,
    });

    return sendSuccess(res, { data: updated, message: 'Case updated successfully' });
}));

/**
 * @route   GET /api/v1/cases/:id/history
 * @desc    Get audit log for a case
 * @access  Private
 */
router.get('/:id/history', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);

    const caseData = await prisma.case.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: { select: { userId: true } },
        },
    });

    if (!caseData) {
        throw new NotFoundError('Case');
    }

    assertCaseAccess(caseData, req.user);

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where: { caseId: req.params.id },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
                },
            },
        }),
        prisma.auditLog.count({ where: { caseId: req.params.id } }),
    ]);

    const transformed = logs.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: {
            id: log.user.id,
            name: `${log.user.firstName} ${log.user.lastName}`,
            avatar: log.user.avatar,
            role: log.user.role,
        },
        details: log.details,
        createdAt: log.createdAt,
    }));

    return sendPaginated(res, { data: transformed, total, page, limit });
}));

/**
 * @route   POST /api/v1/cases/:id/meeting
 * @desc    Generate a case meeting link, notify client, post message in chat
 * @access  Private (Assigned Lawyer only)
 */
router.post('/:id/meeting', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const caseData = await prisma.case.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: { select: { userId: true } },
        },
    });

    if (!caseData) throw new NotFoundError('Case');

    if (caseData.lawyer.userId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Only the assigned lawyer can generate a meeting for this case');
    }

    if (!['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'PENDING_DOCS'].includes(caseData.status)) {
        throw new BadRequestError(`Cannot start a meeting for a case with status "${caseData.status}".`);
    }

    // Generate link deterministically from case ID
    const roomId = req.params.id.replace(/[^a-zA-Z0-9]/g, '');
    const meetLink = `https://meet.jit.si/NyayBooker_Case_${roomId}`;

    // Create a message in the case chat
    await prisma.message.create({
        data: {
            content: `I have started a video meeting. Please join here:\n${meetLink}`,
            caseId: req.params.id,
            senderId: req.user.id,
        }
    });

    // Notify the client
    createNotification({
        userId: caseData.clientId,
        type: 'CASE',
        title: 'Video Meeting Started',
        message: `Your lawyer has started a video meeting for case "${caseData.title}".`,
        actionUrl: `/user/cases/${req.params.id}`,
        actionLabel: 'View Case',
        metadata: { caseId: req.params.id, link: meetLink },
    }).catch(err => logger.error('Failed to create case meeting notification', err));

    logger.logBusiness('CASE_MEETING_STARTED', { caseId: req.params.id, lawyerId: caseData.lawyerId });

    return sendSuccess(res, { data: { link: meetLink }, message: 'Meeting started and client notified' });
}));

export default router;
