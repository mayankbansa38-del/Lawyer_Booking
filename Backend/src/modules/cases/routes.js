/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Cases Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Case management routes — CRUD for legal cases with audit trail.
 * 
 * @module modules/cases/routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { sendSuccess, sendCreated, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { parsePaginationParams } from '../../utils/pagination.js';
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

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/cases
 * @desc    Create a new case
 * @access  Private (Lawyer)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { title, description, clientId, priority = 'MEDIUM', bookingId } = req.body;

    if (!title) {
        throw new BadRequestError('Title is required');
    }

    let resolvedClientId = clientId;
    let resolvedLawyerId;

    if (req.user.role === 'LAWYER') {
        // Lawyer creating a case — needs clientId
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

        // Verify client exists
        const client = await prisma.user.findUnique({ where: { id: clientId } });
        if (!client) throw new NotFoundError('Client');

    } else if (req.user.role === 'USER') {
        // User creating a case — needs bookingId to identify the lawyer
        if (!bookingId) {
            throw new BadRequestError('bookingId is required. You can create a case from a completed consultation.');
        }

        resolvedClientId = req.user.id;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking || booking.clientId !== req.user.id) {
            throw new BadRequestError('Invalid booking — this booking does not belong to you');
        }

        if (booking.status !== 'COMPLETED') {
            throw new BadRequestError('You can only create a case after a completed consultation');
        }

        resolvedLawyerId = booking.lawyerId;
    } else {
        throw new ForbiddenError('Only lawyers or users can create cases');
    }

    // If bookingId provided by lawyer, verify it
    if (bookingId && req.user.role === 'LAWYER') {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking || booking.lawyerId !== resolvedLawyerId || booking.clientId !== resolvedClientId) {
            throw new BadRequestError('Invalid booking reference');
        }
    }

    const newCase = await prisma.case.create({
        data: {
            caseNumber: generateCaseNumber(),
            title,
            description,
            priority,
            clientId: resolvedClientId,
            lawyerId: resolvedLawyerId,
            bookingId: bookingId || null,
        },
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true, avatar: true },
            },
            lawyer: {
                select: {
                    id: true,
                    user: {
                        select: { firstName: true, lastName: true, avatar: true },
                    },
                },
            },
        },
    });

    // Audit log
    await createAuditEntry(prisma, {
        action: 'CREATE',
        entityType: 'Case',
        entityId: newCase.id,
        userId: req.user.id,
        caseId: newCase.id,
        details: { title, priority },
    });

    logger.logBusiness('CASE_CREATED', {
        caseId: newCase.id,
        lawyerId: resolvedLawyerId,
        clientId: resolvedClientId,
    });

    return sendCreated(res, { data: newCase }, 'Case created successfully');
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
            include: {
                client: {
                    select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
                },
                lawyer: {
                    select: {
                        id: true,
                        user: {
                            select: { firstName: true, lastName: true, avatar: true },
                        },
                    },
                },
                _count: {
                    select: { messages: true, documents: true },
                },
            },
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
        include: {
            client: {
                select: { id: true, firstName: true, lastName: true },
            },
            lawyer: {
                select: {
                    id: true,
                    user: { select: { firstName: true, lastName: true } },
                },
            },
        },
    });

    // Audit the changes
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

    // Verify case exists and user has access
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

export default router;
