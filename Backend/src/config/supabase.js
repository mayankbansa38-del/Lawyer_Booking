/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Supabase Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Supabase client initialization and storage utilities.
 * Used for file uploads (documents, avatars).
 * 
 * @module config/supabase
 */

import { createClient } from '@supabase/supabase-js';
import env from './env.js';
import logger from '../utils/logger.js';
import { FILE_LIMITS } from './constants.js';

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Supabase client instance
 * Uses service role key for server-side operations
 */
let supabase = null;

/**
 * Get or create Supabase client
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
    if (!supabase) {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
            logger.warn('⚠️  Supabase credentials not configured');
            return null;
        }

        supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        logger.info('✅ Supabase client initialized');
    }

    return supabase;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Storage bucket names
 */
export const BUCKETS = {
    DOCUMENTS: env.SUPABASE_BUCKET_DOCUMENTS,
    AVATARS: env.SUPABASE_BUCKET_AVATARS,
};

/**
 * Upload file to Supabase Storage
 * 
 * @param {Object} options - Upload options
 * @param {string} options.bucket - Bucket name
 * @param {string} options.path - File path within bucket
 * @param {Buffer|Blob|File} options.file - File to upload
 * @param {string} options.contentType - MIME type
 * @param {boolean} [options.upsert=false] - Overwrite if exists
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadFile({ bucket, path, file, contentType, upsert = false }) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Supabase client not initialized');
    }

    // Validate file size
    const fileSize = file.length || file.size;
    if (fileSize > FILE_LIMITS.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum limit of ${FILE_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Validate content type for avatars
    if (bucket === BUCKETS.AVATARS && !FILE_LIMITS.ALLOWED_IMAGE_TYPES.includes(contentType)) {
        throw new Error(`Invalid image type. Allowed: ${FILE_LIMITS.ALLOWED_IMAGE_TYPES.join(', ')}`);
    }

    // Validate content type for documents
    if (bucket === BUCKETS.DOCUMENTS && !FILE_LIMITS.ALLOWED_DOCUMENT_TYPES.includes(contentType)) {
        throw new Error(`Invalid document type. Allowed: ${FILE_LIMITS.ALLOWED_DOCUMENT_TYPES.join(', ')}`);
    }

    try {
        const { data, error } = await client.storage
            .from(bucket)
            .upload(path, file, {
                contentType,
                upsert,
                cacheControl: '3600',
            });

        if (error) {
            logger.error('Supabase upload error:', error);
            throw error;
        }

        // Get public URL
        const { data: urlData } = client.storage
            .from(bucket)
            .getPublicUrl(data.path);

        logger.info(`File uploaded: ${bucket}/${path}`);

        return {
            url: urlData.publicUrl,
            path: data.path,
        };
    } catch (error) {
        logger.error('File upload failed:', error);
        throw error;
    }
}

/**
 * Delete file from Supabase Storage
 * 
 * @param {string} bucket - Bucket name
 * @param {string|string[]} paths - File path(s) to delete
 * @returns {Promise<void>}
 */
export async function deleteFile(bucket, paths) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Supabase client not initialized');
    }

    const pathArray = Array.isArray(paths) ? paths : [paths];

    try {
        const { error } = await client.storage
            .from(bucket)
            .remove(pathArray);

        if (error) {
            logger.error('Supabase delete error:', error);
            throw error;
        }

        logger.info(`Files deleted from ${bucket}:`, pathArray);
    } catch (error) {
        logger.error('File deletion failed:', error);
        throw error;
    }
}

/**
 * Get signed URL for private file access
 * 
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @param {number} [expiresIn=3600] - URL expiry in seconds
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { data, error } = await client.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) {
            logger.error('Supabase signed URL error:', error);
            throw error;
        }

        return data.signedUrl;
    } catch (error) {
        logger.error('Failed to create signed URL:', error);
        throw error;
    }
}

/**
 * List files in a bucket path
 * 
 * @param {string} bucket - Bucket name
 * @param {string} [path=''] - Path to list
 * @param {Object} [options] - List options
 * @param {number} [options.limit=100] - Max files to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Array>} List of files
 */
export async function listFiles(bucket, path = '', options = {}) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Supabase client not initialized');
    }

    const { limit = 100, offset = 0 } = options;

    try {
        const { data, error } = await client.storage
            .from(bucket)
            .list(path, {
                limit,
                offset,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (error) {
            logger.error('Supabase list error:', error);
            throw error;
        }

        return data;
    } catch (error) {
        logger.error('Failed to list files:', error);
        throw error;
    }
}

/**
 * Move/rename file in Supabase Storage
 * 
 * @param {string} bucket - Bucket name
 * @param {string} fromPath - Current path
 * @param {string} toPath - New path
 * @returns {Promise<void>}
 */
export async function moveFile(bucket, fromPath, toPath) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { error } = await client.storage
            .from(bucket)
            .move(fromPath, toPath);

        if (error) {
            logger.error('Supabase move error:', error);
            throw error;
        }

        logger.info(`File moved: ${fromPath} -> ${toPath}`);
    } catch (error) {
        logger.error('File move failed:', error);
        throw error;
    }
}

/**
 * Copy file in Supabase Storage
 * 
 * @param {string} bucket - Bucket name
 * @param {string} fromPath - Source path
 * @param {string} toPath - Destination path
 * @returns {Promise<void>}
 */
export async function copyFile(bucket, fromPath, toPath) {
    const client = getSupabaseClient();

    if (!client) {
        throw new Error('Supabase client not initialized');
    }

    try {
        const { error } = await client.storage
            .from(bucket)
            .copy(fromPath, toPath);

        if (error) {
            logger.error('Supabase copy error:', error);
            throw error;
        }

        logger.info(`File copied: ${fromPath} -> ${toPath}`);
    } catch (error) {
        logger.error('File copy failed:', error);
        throw error;
    }
}

/**
 * Check if Supabase Storage is available
 * @returns {Promise<boolean>}
 */
export async function checkStorageHealth() {
    const client = getSupabaseClient();

    if (!client) {
        return false;
    }

    try {
        // Try to list buckets as a health check
        const { error } = await client.storage.listBuckets();
        return !error;
    } catch {
        return false;
    }
}

export default {
    getSupabaseClient,
    BUCKETS,
    uploadFile,
    deleteFile,
    getSignedUrl,
    listFiles,
    moveFile,
    copyFile,
    checkStorageHealth,
};
