/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Documents Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Document upload and management routes.
 * 
 * @module modules/documents/routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import { uploadDocument, handleUpload, generateFilename, generateStoragePath } from '../../middleware/upload.js';
import { sendSuccess, sendCreated, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { uploadFile, deleteFile, getSignedUrl, BUCKETS } from '../../config/supabase.js';
import { parsePaginationParams } from '../../utils/pagination.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/v1/documents
 * @desc    Upload a document
 * @access  Private
 */
router.post('/',
    authenticate,
    uploadLimiter,
    handleUpload(uploadDocument),
    asyncHandler(async (req, res) => {
        const prisma = getPrismaClient();
        const { type = 'OTHER', description, isPublic = false, caseId } = req.body;
        const file = req.file;

        if (!file) {
            throw new Error('No file uploaded');
        }

        // Generate filename and path
        const filename = generateFilename(file);
        const storagePath = generateStoragePath(req.user.id, 'documents', filename);

        // Upload to Supabase
        const { url } = await uploadFile({
            bucket: BUCKETS.DOCUMENTS,
            path: storagePath,
            file: file.buffer,
            contentType: file.mimetype,
        });

        // Save to database
        const document = await prisma.document.create({
            data: {
                userId: req.user.id,
                name: filename,
                originalName: file.originalname,
                type,
                mimeType: file.mimetype,
                size: file.size,
                storagePath,
                storageUrl: url,
                isPublic: isPublic === 'true' || isPublic === true,
                description,
                caseId: caseId || null,
            },
        });

        logger.logBusiness('DOCUMENT_UPLOADED', {
            documentId: document.id,
            userId: req.user.id,
            type,
            size: file.size,
        });

        return sendCreated(res, { document }, 'Document uploaded successfully');
    })
);

/**
 * @route   GET /api/v1/documents
 * @desc    Get user's documents
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { type, caseId } = req.query;

    let where = { deletedAt: null };

    if (caseId) {
        // Shared access for cases: verify user is either client or lawyer
        const caseRecord = await prisma.case.findUnique({
            where: { id: caseId },
            include: { client: true, lawyer: true }
        });

        if (!caseRecord) {
            return res.status(404).json({ success: false, message: 'Case not found' });
        }

        const isClient = caseRecord.clientId === req.user.id;
        const isLawyer = caseRecord.lawyer?.userId === req.user.id;

        if (!isClient && !isLawyer && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to view case documents' });
        }

        where.caseId = caseId;
    } else {
        // Individual access: only show strictly user's own documents
        where.userId = req.user.id;
    }

    if (type) {
        where.type = type.toUpperCase();
    }

    const [documents, total] = await Promise.all([
        prisma.document.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                originalName: true,
                type: true,
                mimeType: true,
                size: true,
                storageUrl: true,
                isPublic: true,
                description: true,
                createdAt: true,
            },
        }),
        prisma.document.count({ where }),
    ]);

    return sendPaginated(res, {
        data: documents,
        total,
        page,
        limit,
    });
}));

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
    });

    if (!document || document.deletedAt) {
        throw new NotFoundError('Document');
    }

    // Check authorization
    let isAuthorized = false;
    const isOwner = document.userId === req.user.id;
    const isShared = document.sharedWith?.includes(req.user.id);
    const isAdmin = req.user.role === 'ADMIN';

    if (isOwner || isShared || isAdmin || document.isPublic) {
        isAuthorized = true;
    } else if (document.caseId) {
        // Shared access through case relation
        const caseRecord = await prisma.case.findUnique({
            where: { id: document.caseId },
            include: { lawyer: true }
        });
        if (caseRecord && (caseRecord.clientId === req.user.id || caseRecord.lawyer?.userId === req.user.id)) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new ForbiddenError('You do not have access to this document');
    }

    return sendSuccess(res, { data: document });
}));

/**
 * @route   GET /api/v1/documents/:id/download
 * @desc    Get signed download URL for document
 * @access  Private
 */
router.get('/:id/download', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
    });

    if (!document || document.deletedAt) {
        throw new NotFoundError('Document');
    }

    // Check authorization
    let isAuthorized = false;
    const isOwner = document.userId === req.user.id;
    const isShared = document.sharedWith?.includes(req.user.id);
    const isAdmin = req.user.role === 'ADMIN';

    if (isOwner || isShared || isAdmin || document.isPublic) {
        isAuthorized = true;
    } else if (document.caseId) {
        // Shared access through case relation
        const caseRecord = await prisma.case.findUnique({
            where: { id: document.caseId },
            include: { lawyer: true }
        });
        if (caseRecord && (caseRecord.clientId === req.user.id || caseRecord.lawyer?.userId === req.user.id)) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new ForbiddenError('You do not have access to this document');
    }

    // Get signed URL (expires in 1 hour)
    const signedUrl = await getSignedUrl(BUCKETS.DOCUMENTS, document.storagePath, 3600);

    return sendSuccess(res, {
        data: {
            url: signedUrl,
            filename: document.originalName,
            expiresIn: 3600,
        },
    });
}));

/**
 * @route   PUT /api/v1/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { description, isPublic } = req.body;

    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
    });

    if (!document || document.deletedAt) {
        throw new NotFoundError('Document');
    }

    // Check modifying permissions
    let isAuthorized = false;
    const isOwner = document.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (isOwner || isAdmin) {
        isAuthorized = true;
    } else if (document.caseId) {
        // Only the lawyer of the case can modify its documents, client cannot
        const caseRecord = await prisma.case.findUnique({
            where: { id: document.caseId },
            include: { lawyer: true }
        });
        if (caseRecord && caseRecord.lawyer?.userId === req.user.id) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new ForbiddenError('Not authorized to modify this document');
    }

    const updated = await prisma.document.update({
        where: { id: document.id },
        data: {
            description: description !== undefined ? description : undefined,
            isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
        },
    });

    return sendSuccess(res, {
        data: updated,
        message: 'Document updated successfully',
    });
}));

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete document (soft delete)
 * @access  Private
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
    });

    if (!document || document.deletedAt) {
        throw new NotFoundError('Document');
    }

    // Check deleting permissions
    let isAuthorized = false;
    const isOwner = document.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (isOwner || isAdmin) {
        isAuthorized = true;
    } else if (document.caseId) {
        // Only the lawyer of the case can delete its documents, client cannot
        const caseRecord = await prisma.case.findUnique({
            where: { id: document.caseId },
            include: { lawyer: true }
        });
        if (caseRecord && caseRecord.lawyer?.userId === req.user.id) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new ForbiddenError('Not authorized to delete this document');
    }

    // Soft delete
    await prisma.document.update({
        where: { id: document.id },
        data: { deletedAt: new Date() },
    });

    // Delete from storage (async)
    deleteFile(BUCKETS.DOCUMENTS, document.storagePath).catch(error => {
        logger.error('Failed to delete file from storage', {
            documentId: document.id,
            error: error.message,
        });
    });

    logger.logBusiness('DOCUMENT_DELETED', {
        documentId: document.id,
        userId: req.user.id,
    });

    return sendSuccess(res, { message: 'Document deleted successfully' });
}));

/**
 * @route   POST /api/v1/documents/:id/share
 * @desc    Share document with users
 * @access  Private
 */
router.post('/:id/share', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { userIds } = req.body;

    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
    });

    if (!document || document.deletedAt) {
        throw new NotFoundError('Document');
    }

    if (document.userId !== req.user.id) {
        throw new ForbiddenError('Not authorized to share this document');
    }

    // Merge with existing shared users
    const existingShared = document.sharedWith || [];
    const newSharedWith = [...new Set([...existingShared, ...userIds])];

    const updated = await prisma.document.update({
        where: { id: document.id },
        data: { sharedWith: newSharedWith },
    });

    return sendSuccess(res, {
        data: { sharedWith: updated.sharedWith },
        message: 'Document shared successfully',
    });
}));

export default router;
