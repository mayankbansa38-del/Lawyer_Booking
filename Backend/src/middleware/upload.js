/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - File Upload Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Multer configuration for file uploads.
 * 
 * @module middleware/upload
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FILE_LIMITS } from '../config/constants.js';
import { BadRequestError } from '../utils/errors.js';

/**
 * Multer storage configuration
 * Uses memory storage for processing before upload to Supabase
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter for images
 * 
 * @param {import('express').Request} req
 * @param {Express.Multer.File} file
 * @param {Function} cb
 */
function imageFilter(req, file, cb) {
    if (FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError(
            `Invalid image type. Allowed: ${FILE_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}`
        ));
    }
}

/**
 * File filter for documents
 * 
 * @param {import('express').Request} req
 * @param {Express.Multer.File} file
 * @param {Function} cb
 */
function documentFilter(req, file, cb) {
    if (FILE_LIMITS.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError(
            `Invalid document type. Allowed: ${FILE_LIMITS.ALLOWED_DOCUMENT_TYPES.join(', ')}`
        ));
    }
}

/**
 * Generate unique filename
 * 
 * @param {Express.Multer.File} file - Original file
 * @returns {string} Unique filename
 */
export function generateFilename(file) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const uniqueId = uuidv4().slice(0, 8);
    return `${timestamp}-${uniqueId}${ext}`;
}

/**
 * Generate storage path for file
 * 
 * @param {string} userId - User ID
 * @param {string} type - File type (avatars, documents, etc.)
 * @param {string} filename - Filename
 * @returns {string} Storage path
 */
export function generateStoragePath(userId, type, filename) {
    return `${userId}/${type}/${filename}`;
}

/**
 * Upload middleware for avatar images
 */
export const uploadAvatar = multer({
    storage: memoryStorage,
    limits: {
        fileSize: FILE_LIMITS.MAX_AVATAR_SIZE,
        files: 1,
    },
    fileFilter: imageFilter,
}).single('avatar');

/**
 * Upload middleware for documents
 */
export const uploadDocument = multer({
    storage: memoryStorage,
    limits: {
        fileSize: FILE_LIMITS.MAX_FILE_SIZE,
        files: 1,
    },
    fileFilter: documentFilter,
}).single('document');

/**
 * Upload middleware for multiple documents
 */
export const uploadDocuments = multer({
    storage: memoryStorage,
    limits: {
        fileSize: FILE_LIMITS.MAX_FILE_SIZE,
        files: 5,
    },
    fileFilter: documentFilter,
}).array('documents', 5);

/**
 * Upload middleware for verification documents (lawyer)
 */
export const uploadVerificationDocuments = multer({
    storage: memoryStorage,
    limits: {
        fileSize: FILE_LIMITS.MAX_FILE_SIZE,
        files: 3,
    },
    fileFilter: documentFilter,
}).fields([
    { name: 'barCertificate', maxCount: 1 },
    { name: 'idProof', maxCount: 1 },
    { name: 'degreeCertificate', maxCount: 1 },
]);

/**
 * Handle multer errors
 * Wrapper middleware to convert multer errors to AppError
 * 
 * @param {Function} uploadMiddleware - Multer upload middleware
 * @returns {Function} Express middleware
 */
export function handleUpload(uploadMiddleware) {
    return (req, res, next) => {
        uploadMiddleware(req, res, (error) => {
            if (error instanceof multer.MulterError) {
                const messages = {
                    LIMIT_FILE_SIZE: 'File size exceeds maximum allowed limit',
                    LIMIT_FILE_COUNT: 'Too many files uploaded',
                    LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
                    LIMIT_PART_COUNT: 'Too many parts in the request',
                    LIMIT_FIELD_KEY: 'Field name is too long',
                    LIMIT_FIELD_VALUE: 'Field value is too long',
                    LIMIT_FIELD_COUNT: 'Too many fields',
                };
                return next(new BadRequestError(messages[error.code] || 'File upload error'));
            }
            if (error) {
                return next(error);
            }
            next();
        });
    };
}

export default {
    uploadAvatar,
    uploadDocument,
    uploadDocuments,
    uploadVerificationDocuments,
    handleUpload,
    generateFilename,
    generateStoragePath,
};
