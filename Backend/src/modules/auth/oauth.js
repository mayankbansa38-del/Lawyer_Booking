/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Google OAuth Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles Google OAuth token verification and user creation/login.
 * 
 * @module modules/auth/oauth
 */

import { OAuth2Client } from 'google-auth-library';
import { getPrismaClient } from '../../config/database.js';
import { generateAccessToken, generateRefreshToken, generateUrlSafeToken } from '../../utils/crypto.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and return user payload
 * 
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object>} Google user payload
 */
export async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        return {
            googleId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            firstName: payload.given_name || payload.name?.split(' ')[0] || 'User',
            lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
            picture: payload.picture,
        };
    } catch (error) {
        logger.error('Google token verification failed:', error);
        throw new Error('Invalid Google token');
    }
}

/**
 * Login or register user via Google OAuth
 * 
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object>} User data and tokens
 */
export async function googleLogin(idToken) {
    const prisma = getPrismaClient();

    // Verify the Google token
    const googleUser = await verifyGoogleToken(idToken);

    // Find existing user by email
    let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        include: {
            lawyer: {
                select: {
                    id: true,
                    verificationStatus: true,
                },
            },
        },
    });

    if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: googleUser.googleId,
                    isEmailVerified: true, // Google verified the email
                    avatar: user.avatar || googleUser.picture,
                    lastLoginAt: new Date(),
                },
                include: {
                    lawyer: {
                        select: {
                            id: true,
                            verificationStatus: true,
                        },
                    },
                },
            });
        } else {
            // Just update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
        }
    } else {
        // Create new user
        user = await prisma.user.create({
            data: {
                email: googleUser.email,
                googleId: googleUser.googleId,
                firstName: googleUser.firstName,
                lastName: googleUser.lastName,
                avatar: googleUser.picture,
                isEmailVerified: true, // Google verified the email
                role: 'USER',
                lastLoginAt: new Date(),
                password: crypto.randomUUID(), // Placeholder for OAuth users
            },
            include: {
                lawyer: {
                    select: {
                        id: true,
                        verificationStatus: true,
                    },
                },
            },
        });

        logger.info(`New user created via Google OAuth: ${user.email}`);
    }

    // Check if user is active
    if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
    }

    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    // Create refresh token
    const refreshTokenId = generateUrlSafeToken(16);
    const refreshToken = generateRefreshToken({
        userId: user.id,
        tokenId: refreshTokenId,
    });

    // Store refresh token
    await prisma.refreshToken.create({
        data: {
            id: refreshTokenId,
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
    });

    logger.logBusiness('GOOGLE_LOGIN', {
        userId: user.id,
        email: user.email,
        isNewUser: !user.googleId,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            lawyer: user.lawyer,
        },
        accessToken,
        refreshToken,
    };
}

export default {
    verifyGoogleToken,
    googleLogin,
};
