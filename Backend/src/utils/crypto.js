/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Cryptographic Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Password hashing, token generation, and other crypto operations.
 * 
 * @module utils/crypto
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD HASHING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Salt rounds for bcrypt hashing
 * Higher = more secure but slower
 */
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 * 
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} Whether password matches
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// ═══════════════════════════════════════════════════════════════════════════
// JWT TOKENS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate JWT access token
 * 
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
export function generateAccessToken(payload) {
    return jwt.sign(
        {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            type: 'access',
        },
        env.JWT_SECRET,
        {
            expiresIn: env.JWT_EXPIRES_IN,
            issuer: 'nyaybooker',
            audience: 'nyaybooker-api',
        }
    );
}

/**
 * Generate JWT refresh token
 * 
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.tokenId - Refresh token ID (for revocation)
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(payload) {
    return jwt.sign(
        {
            userId: payload.userId,
            tokenId: payload.tokenId,
            type: 'refresh',
        },
        env.JWT_REFRESH_SECRET,
        {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
            issuer: 'nyaybooker',
            audience: 'nyaybooker-api',
        }
    );
}

/**
 * Verify JWT access token
 * 
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_SECRET, {
        issuer: 'nyaybooker',
        audience: 'nyaybooker-api',
    });
}

/**
 * Verify JWT refresh token
 * 
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'nyaybooker',
        audience: 'nyaybooker-api',
    });
}

/**
 * Decode JWT without verification (for expired tokens)
 * 
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null
 */
export function decodeToken(token) {
    return jwt.decode(token);
}

/**
 * Get token expiry date
 * 
 * @param {string} expiresIn - Expiry string (e.g., '7d', '1h')
 * @returns {Date} Expiry date
 */
export function getTokenExpiryDate(expiresIn) {
    const units = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid expiry format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    const ms = parseInt(value, 10) * units[unit];

    return new Date(Date.now() + ms);
}

// ═══════════════════════════════════════════════════════════════════════════
// RANDOM TOKEN GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate cryptographically secure random token
 * 
 * @param {number} [length=32] - Token length in bytes
 * @returns {string} Hex-encoded random token
 */
export function generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate URL-safe random token
 * 
 * @param {number} [length=32] - Token length in bytes
 * @returns {string} URL-safe base64 token
 */
export function generateUrlSafeToken(length = 32) {
    return crypto.randomBytes(length)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate OTP (One-Time Password)
 * 
 * @param {number} [length=6] - OTP length
 * @returns {string} Numeric OTP
 */
export function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';

    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        otp += digits[bytes[i] % 10];
    }

    return otp;
}

/**
 * Generate booking number
 * Format: NB-YYYYMMDD-XXXXX (e.g., NB-20260203-A7B3C)
 * 
 * @returns {string} Unique booking number
 */
export function generateBookingNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5);

    return `NB-${dateStr}-${random}`;
}

/**
 * Generate slug from text
 * 
 * @param {string} text - Text to slugify
 * @param {string} [suffix] - Optional suffix (e.g., random string for uniqueness)
 * @returns {string} URL-friendly slug
 */
export function generateSlug(text, suffix = null) {
    let slug = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    if (suffix) {
        slug = `${slug}-${suffix}`;
    }

    return slug;
}

// ═══════════════════════════════════════════════════════════════════════════
// HASHING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create SHA256 hash
 * 
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
export function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create HMAC signature
 * 
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} Hex-encoded HMAC
 */
export function createHmac(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify Razorpay payment signature
 * 
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether signature is valid
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
    const data = `${orderId}|${paymentId}`;
    const expectedSignature = createHmac(data, env.RAZORPAY_KEY_SECRET);

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export default {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    getTokenExpiryDate,
    generateRandomToken,
    generateUrlSafeToken,
    generateOTP,
    generateBookingNumber,
    generateSlug,
    sha256,
    createHmac,
    verifyRazorpaySignature,
};
