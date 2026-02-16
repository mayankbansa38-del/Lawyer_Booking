/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Socket.io Handler
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Handles real-time chat via Socket.io with JWT authentication.
 * Separated from server.js for clean architecture.
 * 
 * @module socket/socketHandler
 */

import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { getPrismaClient } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Verify JWT token from socket handshake
 * @param {string} token - JWT access token
 * @returns {Object} Decoded user payload
 */
function verifySocketToken(token) {
    try {
        return jwt.verify(token, env.JWT_SECRET);
    } catch {
        return null;
    }
}

/**
 * Check if a user has access to a case
 * @param {string} userId - User ID
 * @param {string} caseId - Case ID
 * @returns {boolean}
 */
async function canAccessCase(userId, caseId) {
    const prisma = getPrismaClient();

    const userCase = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
            lawyer: { select: { userId: true } },
        },
    });

    if (!userCase) return false;

    return (
        userCase.clientId === userId ||
        userCase.lawyer.userId === userId
    );
}

/**
 * Initialize Socket.io with authentication and room-based messaging
 * @param {import('socket.io').Server} io - Socket.io server instance
 */
export function initializeSocket(io) {
    // Authentication middleware — verify JWT before allowing connection
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = verifySocketToken(token);
        if (!decoded) {
            return next(new Error('Invalid or expired token'));
        }

        socket.userId = decoded.id || decoded.userId;
        socket.userRole = decoded.role;
        next();
    });

    io.on('connection', (socket) => {
        logger.info('Socket connected', { userId: socket.userId, socketId: socket.id });

        // Join user's personal room for direct notifications
        socket.join(`user:${socket.userId}`);

        /**
         * Join a case chat room
         * Security: verifies user actually belongs to the case
         */
        socket.on('join_case', async (caseId) => {
            try {
                const hasAccess = await canAccessCase(socket.userId, caseId);

                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied to this case' });
                    return;
                }

                socket.join(`case:${caseId}`);
                socket.emit('joined_case', { caseId });
                logger.info('User joined case room', { userId: socket.userId, caseId });
            } catch (error) {
                logger.error('Error joining case', { error: error.message, caseId });
                socket.emit('error', { message: 'Failed to join case room' });
            }
        });

        /**
         * Leave a case chat room
         */
        socket.on('leave_case', (caseId) => {
            socket.leave(`case:${caseId}`);
            logger.info('User left case room', { userId: socket.userId, caseId });
        });

        /**
         * Send a message to a case
         */
        socket.on('send_message', async ({ caseId, content, type = 'TEXT', attachmentUrl }) => {
            try {
                const hasAccess = await canAccessCase(socket.userId, caseId);
                if (!hasAccess) {
                    socket.emit('error', { message: 'Access denied' });
                    return;
                }

                const prisma = getPrismaClient();

                const message = await prisma.message.create({
                    data: {
                        content: content || '',
                        type,
                        attachmentUrl,
                        senderId: socket.userId,
                        caseId,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                role: true,
                            },
                        },
                    },
                });

                const payload = {
                    id: message.id,
                    content: message.content,
                    type: message.type,
                    attachmentUrl: message.attachmentUrl,
                    sender: {
                        id: message.sender.id,
                        name: `${message.sender.firstName} ${message.sender.lastName}`,
                        avatar: message.sender.avatar,
                        role: message.sender.role,
                    },
                    isRead: false,
                    createdAt: message.createdAt,
                    caseId,
                };

                // Broadcast to everyone in the case room (including sender)
                io.to(`case:${caseId}`).emit('message_received', payload);

                logger.info('Message sent via socket', {
                    messageId: message.id,
                    caseId,
                    senderId: socket.userId,
                });
            } catch (error) {
                logger.error('Error sending message', { error: error.message, caseId });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        /**
         * Typing indicator
         */
        socket.on('typing', ({ caseId, isTyping }) => {
            socket.to(`case:${caseId}`).emit('user_typing', {
                userId: socket.userId,
                isTyping,
                caseId,
            });
        });

        /**
         * Read receipt
         */
        socket.on('mark_read', async ({ caseId }) => {
            try {
                const prisma = getPrismaClient();

                await prisma.message.updateMany({
                    where: {
                        caseId,
                        senderId: { not: socket.userId },
                        isRead: false,
                    },
                    data: {
                        isRead: true,
                        readAt: new Date(),
                    },
                });

                socket.to(`case:${caseId}`).emit('messages_read', {
                    caseId,
                    readBy: socket.userId,
                });
            } catch (error) {
                logger.error('Error marking messages read', { error: error.message });
            }
        });

        /**
         * Disconnect cleanup
         */
        socket.on('disconnect', (reason) => {
            logger.info('Socket disconnected', { userId: socket.userId, reason });
        });
    });

    return io;
}
