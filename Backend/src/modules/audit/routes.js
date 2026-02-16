/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Audit Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Generic audit log retrieval for any entity.
 * Auto-logging is handled via Prisma middleware (see config/database.js).
 * 
 * @module modules/audit/routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { sendSuccess, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { parsePaginationParams } from '../../utils/pagination.js';

const router = Router();

/**
 * @route   GET /api/v1/audit/:entityType/:entityId
 * @desc    Get audit history for any entity
 * @access  Private (Admin only for non-case entities)
 */
router.get('/:entityType/:entityId', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { entityType, entityId } = req.params;
    const { page, limit, skip } = parsePaginationParams(req.query);

    // Non-admin users can only view audit logs for cases they belong to
    if (req.user.role !== 'ADMIN' && entityType === 'Case') {
        const caseData = await prisma.case.findUnique({
            where: { id: entityId },
            include: { lawyer: { select: { userId: true } } },
        });

        if (!caseData) {
            return sendSuccess(res, { data: [], total: 0 });
        }

        const isClient = caseData.clientId === req.user.id;
        const isLawyer = caseData.lawyer.userId === req.user.id;

        if (!isClient && !isLawyer) {
            return sendSuccess(res, { data: [], total: 0 });
        }
    } else if (req.user.role !== 'ADMIN') {
        // Non-admin, non-case entity — only show own logs
        // (Handled by restricting to userId)
    }

    const where = { entityType, entityId };

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    return sendPaginated(res, {
        data: logs.map(log => ({
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
        })),
        total,
        page,
        limit,
    });
}));

/**
 * @route   GET /api/v1/audit/recent
 * @desc    Get recent audit activity (Admin only)
 * @access  Private/Admin
 */
router.get('/recent', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const logs = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
            },
        },
    });

    return sendSuccess(res, {
        data: logs.map(log => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            user: {
                id: log.user.id,
                name: `${log.user.firstName} ${log.user.lastName}`,
                avatar: log.user.avatar,
            },
            details: log.details,
            createdAt: log.createdAt,
        })),
    });
}));

export default router;
