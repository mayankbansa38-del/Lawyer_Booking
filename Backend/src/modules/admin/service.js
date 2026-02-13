/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend -Admin Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Business logic for admin operations.
 * 
 * @module modules/admin/service
 */

import prisma from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import logger from '../../utils/logger.js';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  USER MANAGEMENT                                                         */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Get all users
 */
export const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    logger.info(`Retrieved ${users.length} users for admin`);
    return users;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
};

/**
 * Update user status
 */
export const updateUserStatus = async (userId, isActive) => {
    // Check if user exists
    await getUserById(userId);

    const user = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
        },
    });

    logger.info(`User ${userId} status updated to ${isActive ? 'active' : 'inactive'}`);
    return user;
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
    // Check if user exists
    await getUserById(userId);

    // Delete user (will cascade to related lawyer profile if exists)
    await prisma.user.delete({
        where: { id: userId },
    });

    logger.info(`User ${userId} deleted by admin`);
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  LAWYER MANAGEMENT                                                       */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Get all lawyers
 */
export const getAllLawyers = async () => {
    const lawyers = await prisma.lawyer.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    logger.info(`Retrieved ${lawyers.length} lawyers for admin`);
    return lawyers;
};

/**
 * Get pending lawyer verifications
 */
export const getPendingLawyers = async () => {
    const lawyers = await prisma.lawyer.findMany({
        where: {
            verificationStatus: 'PENDING',
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    logger.info(`Retrieved ${lawyers.length} pending lawyer verifications`);
    return lawyers;
};

/**
 * Get lawyer by ID
 */
export const getLawyerById = async (lawyerId) => {
    const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                },
            },
        },
    });

    if (!lawyer) {
        throw new AppError('Lawyer not found', 404);
    }

    return lawyer;
};

/**
 * Verify or reject lawyer
 */
export const verifyLawyer = async (lawyerId, status, notes = null) => {
    // Validate status
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
        throw new AppError('Invalid verification status', 400);
    }

    // Check if lawyer exists
    await getLawyerById(lawyerId);

    const lawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
            verificationStatus: status,
            verificationNotes: notes,
            verifiedAt: status === 'VERIFIED' ? new Date() : null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    logger.info(`Lawyer ${lawyerId} ${status.toLowerCase()} by admin`);
    return lawyer;
};

/**
 * Update lawyer details
 */
export const updateLawyer = async (lawyerId, updateData) => {
    // Check if lawyer exists
    await getLawyerById(lawyerId);

    const lawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    logger.info(`Lawyer ${lawyerId} updated by admin`);
    return lawyer;
};

/**
 * Delete lawyer
 */
export const deleteLawyer = async (lawyerId) => {
    // Check if lawyer exists
    await getLawyerById(lawyerId);

    // Delete lawyer profile
    await prisma.lawyer.delete({
        where: { id: lawyerId },
    });

    logger.info(`Lawyer ${lawyerId} deleted by admin`);
};
