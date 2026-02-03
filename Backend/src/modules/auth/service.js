/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Auth Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Authentication business logic and token management.
 * 
 * @module modules/auth/service
 */

import { getPrismaClient } from '../../config/database.js';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateRandomToken,
    generateUrlSafeToken,
    getTokenExpiryDate,
} from '../../utils/crypto.js';
import {
    AuthenticationError,
    ConflictError,
    NotFoundError,
    BadRequestError,
} from '../../utils/errors.js';
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
} from '../../utils/email.js';
import { USER_ROLES, TOKEN_EXPIRY } from '../../config/constants.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

/**
 * Register a new user
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise<{user: Object, tokens: Object}>}
 */
export async function registerUser(userData) {
    const prisma = getPrismaClient();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
    });

    if (existingUser) {
        throw new ConflictError('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
        data: {
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone || null,
            role: userData.role || USER_ROLES.USER,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
        },
    });

    // Create email verification token
    const verificationToken = generateUrlSafeToken();
    await prisma.emailVerificationToken.create({
        data: {
            email: user.email,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
    });

    // Generate auth tokens
    const tokens = await generateAuthTokens(user);

    // Send verification email (async, don't wait)
    sendVerificationEmail({
        to: user.email,
        name: user.firstName,
        token: verificationToken,
    }).catch(error => {
        logger.error('Failed to send verification email:', error);
    });

    // Log business event
    logger.logBusiness('USER_REGISTERED', { userId: user.id, email: user.email });

    return { user, tokens };
}

/**
 * Register a new lawyer
 * 
 * @param {Object} data - Lawyer registration data
 * @returns {Promise<{user: Object, lawyer: Object, tokens: Object}>}
 */
export async function registerLawyer(data) {
    const prisma = getPrismaClient();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw new ConflictError('An account with this email already exists');
    }

    // Check if bar council ID already exists
    const existingLawyer = await prisma.lawyer.findUnique({
        where: { barCouncilId: data.barCouncilId },
    });

    if (existingLawyer) {
        throw new ConflictError('A lawyer with this Bar Council ID already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user and lawyer in transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: USER_ROLES.LAWYER,
            },
        });

        // Create lawyer profile
        const lawyer = await tx.lawyer.create({
            data: {
                userId: user.id,
                barCouncilId: data.barCouncilId,
                barCouncilState: data.barCouncilState,
                enrollmentYear: data.enrollmentYear,
                city: data.city || null,
                state: data.state || null,
                verificationStatus: 'PENDING',
            },
        });

        return { user, lawyer };
    });

    // Create email verification token
    const verificationToken = generateUrlSafeToken();
    await prisma.emailVerificationToken.create({
        data: {
            email: result.user.email,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });

    // Generate auth tokens
    const tokens = await generateAuthTokens({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
    });

    // Send verification email
    sendVerificationEmail({
        to: result.user.email,
        name: result.user.firstName,
        token: verificationToken,
    }).catch(error => {
        logger.error('Failed to send verification email:', error);
    });

    logger.logBusiness('LAWYER_REGISTERED', {
        userId: result.user.id,
        lawyerId: result.lawyer.id,
        barCouncilId: data.barCouncilId,
    });

    return {
        user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            isEmailVerified: result.user.isEmailVerified,
        },
        lawyer: {
            id: result.lawyer.id,
            barCouncilId: result.lawyer.barCouncilId,
            verificationStatus: result.lawyer.verificationStatus,
        },
        tokens,
    };
}

/**
 * Login user
 * 
 * @param {Object} credentials - Login credentials
 * @returns {Promise<{user: Object, tokens: Object}>}
 */
export async function loginUser({ email, password, rememberMe = false }) {
    const prisma = getPrismaClient();

    // Find user by email
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            lawyer: {
                select: {
                    id: true,
                    verificationStatus: true,
                },
            },
        },
    });

    if (!user) {
        throw new AuthenticationError('invalidCredentials');
    }

    // Check if account is active
    if (!user.isActive) {
        throw new AuthenticationError('accountDisabled');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
        throw new AuthenticationError('invalidCredentials');
    }

    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
        },
    });

    // Generate tokens
    const tokens = await generateAuthTokens({
        id: user.id,
        email: user.email,
        role: user.role,
    }, rememberMe);

    logger.logBusiness('USER_LOGIN', { userId: user.id, email: user.email });

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            avatar: user.avatar,
            lawyer: user.lawyer ? {
                id: user.lawyer.id,
                verificationStatus: user.lawyer.verificationStatus,
            } : null,
        },
        tokens,
    };
}

/**
 * Verify email with token
 * 
 * @param {string} token - Verification token
 * @returns {Promise<Object>} User
 */
export async function verifyEmail(token) {
    const prisma = getPrismaClient();

    // Find valid token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: {
            token,
            expiresAt: { gt: new Date() },
            usedAt: null,
        },
    });

    if (!verificationToken) {
        throw new BadRequestError('Invalid or expired verification token');
    }

    // Update user and mark token as used
    const [user] = await prisma.$transaction([
        prisma.user.update({
            where: { email: verificationToken.email },
            data: {
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isEmailVerified: true,
            },
        }),
        prisma.emailVerificationToken.update({
            where: { id: verificationToken.id },
            data: { usedAt: new Date() },
        }),
    ]);

    // Send welcome email
    sendWelcomeEmail({
        to: user.email,
        name: user.firstName,
        role: user.role,
    }).catch(error => {
        logger.error('Failed to send welcome email:', error);
    });

    logger.logBusiness('EMAIL_VERIFIED', { userId: user.id });

    return user;
}

/**
 * Resend verification email
 * 
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resendVerificationEmail(email) {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true, isEmailVerified: true },
    });

    if (!user) {
        // Don't reveal if email exists
        return;
    }

    if (user.isEmailVerified) {
        throw new BadRequestError('Email is already verified');
    }

    // Delete old tokens
    await prisma.emailVerificationToken.deleteMany({
        where: { email },
    });

    // Create new token
    const token = generateUrlSafeToken();
    await prisma.emailVerificationToken.create({
        data: {
            email: user.email,
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });

    // Send email
    await sendVerificationEmail({
        to: user.email,
        name: user.firstName,
        token,
    });

    logger.logBusiness('VERIFICATION_EMAIL_RESENT', { userId: user.id });
}

/**
 * Request password reset
 * 
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function forgotPassword(email) {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true },
    });

    if (!user) {
        // Don't reveal if email exists
        return;
    }

    // Delete old reset tokens
    await prisma.passwordResetToken.deleteMany({
        where: { email },
    });

    // Create new token
    const token = generateUrlSafeToken();
    await prisma.passwordResetToken.create({
        data: {
            email: user.email,
            token,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
    });

    // Send email
    await sendPasswordResetEmail({
        to: user.email,
        name: user.firstName,
        token,
    });

    logger.logBusiness('PASSWORD_RESET_REQUESTED', { userId: user.id });
}

/**
 * Reset password with token
 * 
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function resetPassword(token, newPassword) {
    const prisma = getPrismaClient();

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
            token,
            expiresAt: { gt: new Date() },
            usedAt: null,
        },
    });

    if (!resetToken) {
        throw new BadRequestError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
        prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword },
        }),
        prisma.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        }),
        // Revoke all refresh tokens for security
        prisma.refreshToken.updateMany({
            where: {
                user: { email: resetToken.email },
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        }),
    ]);

    logger.logBusiness('PASSWORD_RESET', { email: resetToken.email });
}

/**
 * Change password (for authenticated users)
 * 
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function changePassword(userId, currentPassword, newPassword) {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
        throw new BadRequestError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    });

    logger.logBusiness('PASSWORD_CHANGED', { userId });
}

/**
 * Refresh access token
 * 
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
export async function refreshAccessToken(refreshToken) {
    const prisma = getPrismaClient();

    // Verify refresh token
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new AuthenticationError('tokenInvalid');
    }

    // Find token in database
    const storedToken = await prisma.refreshToken.findFirst({
        where: {
            token: refreshToken,
            userId: decoded.userId,
            isRevoked: false,
            expiresAt: { gt: new Date() },
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                },
            },
        },
    });

    if (!storedToken) {
        throw new AuthenticationError('tokenInvalid');
    }

    if (!storedToken.user.isActive) {
        throw new AuthenticationError('accountDisabled');
    }

    // Revoke old token (token rotation)
    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
            isRevoked: true,
            revokedAt: new Date(),
        },
    });

    // Generate new tokens
    const tokens = await generateAuthTokens(storedToken.user);

    return tokens;
}

/**
 * Logout user (revoke refresh token)
 * 
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise<void>}
 */
export async function logout(refreshToken) {
    const prisma = getPrismaClient();

    await prisma.refreshToken.updateMany({
        where: {
            token: refreshToken,
            isRevoked: false,
        },
        data: {
            isRevoked: true,
            revokedAt: new Date(),
        },
    });
}

/**
 * Logout from all devices
 * 
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function logoutAll(userId) {
    const prisma = getPrismaClient();

    await prisma.refreshToken.updateMany({
        where: {
            userId,
            isRevoked: false,
        },
        data: {
            isRevoked: true,
            revokedAt: new Date(),
        },
    });

    logger.logBusiness('LOGOUT_ALL', { userId });
}

/**
 * Get current user profile
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export async function getCurrentUser(userId) {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            createdAt: true,
            lawyer: {
                select: {
                    id: true,
                    barCouncilId: true,
                    barCouncilState: true,
                    verificationStatus: true,
                    bio: true,
                    headline: true,
                    experience: true,
                    hourlyRate: true,
                    averageRating: true,
                    totalReviews: true,
                    isAvailable: true,
                },
            },
        },
    });

    if (!user) {
        throw new NotFoundError('User');
    }

    return user;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate authentication tokens (access + refresh)
 * 
 * @param {Object} user - User object
 * @param {boolean} [extendedRefresh=false] - Use extended refresh token expiry
 * @returns {Promise<{accessToken: string, refreshToken: string, expiresAt: Date}>}
 */
async function generateAuthTokens(user, extendedRefresh = false) {
    const prisma = getPrismaClient();

    // Generate access token
    const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });

    // Generate unique token ID for refresh token
    const tokenId = generateRandomToken(16);

    // Calculate expiry
    const refreshExpiresIn = extendedRefresh ? '30d' : env.JWT_REFRESH_EXPIRES_IN;
    const refreshExpiresAt = getTokenExpiryDate(refreshExpiresIn);

    // Generate refresh token
    const refreshToken = generateRefreshToken({
        userId: user.id,
        tokenId,
    });

    // Store refresh token
    await prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: refreshExpiresAt,
        },
    });

    // Calculate access token expiry
    const accessExpiresAt = getTokenExpiryDate(env.JWT_EXPIRES_IN);

    return {
        accessToken,
        refreshToken,
        expiresAt: accessExpiresAt,
    };
}

export default {
    registerUser,
    registerLawyer,
    loginUser,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshAccessToken,
    logout,
    logoutAll,
    getCurrentUser,
};
