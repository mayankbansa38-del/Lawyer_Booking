/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Payments Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Payment processing routes (demo checkout gateway).
 * 
 * @module modules/payments/routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { paymentLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, sendCreated, asyncHandler } from '../../utils/response.js';
import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, PaymentError, ConflictError } from '../../utils/errors.js';
import { generateBookingNumber } from '../../utils/crypto.js';
import { sendPaymentConfirmationEmail, sendPaymentReceivedEmail } from '../../utils/email.js';
import logger from '../../utils/logger.js';
import crypto from 'crypto';
import { generateMeetAndUpdateBooking } from '../../services/calendar.service.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// LIST & SUMMARY ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/payments
 * @desc    List payments for authenticated user (client or lawyer)
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit) || 20);
    const take = Math.min(50, parseInt(limit) || 20);

    // Build where clause based on role
    const where = {};

    if (req.user.role === 'LAWYER') {
        // Lawyer sees payments on their bookings
        const lawyer = await prisma.lawyer.findUnique({ where: { userId: req.user.id } });
        if (!lawyer) throw new NotFoundError('Lawyer profile');
        where.booking = { lawyerId: lawyer.id };
    } else {
        // Client sees their own payments
        where.booking = { clientId: req.user.id };
    }

    if (status) {
        where.status = status.toUpperCase();
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                booking: {
                    select: {
                        id: true,
                        bookingNumber: true,
                        scheduledDate: true,
                        scheduledTime: true,
                        duration: true,
                        meetingType: true,
                        status: true,
                        client: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true,
                            },
                        },
                        lawyer: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.payment.count({ where }),
    ]);

    return sendSuccess(res, {
        data: payments,
        pagination: {
            total,
            page: parseInt(page),
            limit: take,
            totalPages: Math.ceil(total / take),
        },
    });
}));

/**
 * @route   GET /api/v1/payments/earnings-summary
 * @desc    Get earnings summary for authenticated lawyer
 * @access  Private (Lawyer only)
 */
router.get('/earnings-summary', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const lawyer = await prisma.lawyer.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
    });

    if (!lawyer) {
        throw new NotFoundError('Lawyer profile');
    }

    // Get today's and this month's start dates
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Aggregate all stats from actual payments
    const [allTimePayments, monthlyPayments, todayPayments, completed, pending] = await Promise.all([
        // Total earnings = SUM of all COMPLETED payments
        prisma.payment.aggregate({
            where: {
                booking: { lawyerId: lawyer.id },
                status: 'COMPLETED',
            },
            _sum: { amount: true },
        }),
        // This month earnings
        prisma.payment.aggregate({
            where: {
                booking: { lawyerId: lawyer.id },
                status: 'COMPLETED',
                createdAt: { gte: startOfMonth },
            },
            _sum: { amount: true },
        }),
        // Today's earnings
        prisma.payment.aggregate({
            where: {
                booking: { lawyerId: lawyer.id },
                status: 'COMPLETED',
                createdAt: { gte: startOfToday },
            },
            _sum: { amount: true },
        }),
        prisma.payment.count({
            where: {
                booking: { lawyerId: lawyer.id },
                status: 'COMPLETED',
            },
        }),
        prisma.payment.count({
            where: {
                booking: { lawyerId: lawyer.id },
                status: 'PENDING',
            },
        }),
    ]);

    return sendSuccess(res, {
        data: {
            totalEarnings: Number(allTimePayments._sum.amount || 0),
            monthlyEarnings: Number(monthlyPayments._sum.amount || 0),
            todayEarnings: Number(todayPayments._sum.amount || 0),
            completedPayments: completed,
            pendingPayments: pending,
        },
    });
}));

// ═══════════════════════════════════════════════════════════════════════════
// CHECKOUT ROUTE (Direct booking + payment creation)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/payments/checkout
 * @desc    Create booking + payment in one step (simulated payment for demo)
 * @access  Private (Client only)
 */
router.post('/checkout', authenticate, paymentLimiter, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const {
        lawyerId,
        scheduledDate,
        scheduledTime,
        duration = 60,
        meetingType = 'VIDEO',
        clientNotes,
        paymentMethod = 'CARD',
    } = req.body;

    // Validate required fields (amount is NOT accepted from client — zero-trust)
    if (!lawyerId || !scheduledDate || !scheduledTime) {
        throw new PaymentError('Missing required fields: lawyerId, scheduledDate, scheduledTime');
    }

    // Generate simulated gateway IDs
    const gatewayOrderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
    const gatewayPaymentId = `pay_sim_${crypto.randomBytes(8).toString('hex')}`;

    // Serializable transaction: prevents TOCTOU race conditions on concurrent bookings
    let result;
    let lawyer;
    try {
        result = await prisma.$transaction(async (tx) => {
            // 1. Server-side pricing: fetch authoritative rate from DB
            lawyer = await tx.lawyer.findUnique({
                where: { id: lawyerId },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            });

            if (!lawyer || lawyer.verificationStatus !== 'VERIFIED') {
                throw new NotFoundError('Verified lawyer');
            }

            // Zero-trust: compute amount from DB, never from client
            const computedAmount = parseFloat(lawyer.consultationFee || lawyer.hourlyRate) * (parseInt(duration) / 60);

            // 2. Conflict check inside transaction (defense-in-depth with DB unique constraint)
            const conflict = await tx.booking.findFirst({
                where: {
                    lawyerId,
                    scheduledDate: new Date(scheduledDate),
                    scheduledTime,
                    status: { in: ['PENDING', 'CONFIRMED'] },
                },
            });
            if (conflict) {
                throw new ConflictError('This time slot is no longer available');
            }

            // 3. Create booking (CONFIRMED since payment is immediate)
            const booking = await tx.booking.create({
                data: {
                    bookingNumber: generateBookingNumber(),
                    clientId: req.user.id,
                    lawyerId: lawyer.id,
                    scheduledDate: new Date(scheduledDate),
                    scheduledTime,
                    duration: parseInt(duration),
                    meetingType,
                    amount: computedAmount,
                    currency: 'INR',
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                    clientNotes: clientNotes || null,
                },
            });

            // 4. Create payment (COMPLETED since simulated)
            const payment = await tx.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: computedAmount,
                    currency: 'INR',
                    status: 'COMPLETED',
                    method: paymentMethod,
                    gatewayOrderId,
                    gatewayPaymentId,
                    processedAt: new Date(),
                },
            });

            // 5. Update lawyer stats atomically
            await tx.lawyer.update({
                where: { id: lawyer.id },
                data: {
                    totalBookings: { increment: 1 },
                    totalEarnings: { increment: computedAmount },
                },
            });

            return { booking, payment, computedAmount };
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
    } catch (err) {
        // DB unique constraint (P2002) → 409 Conflict
        if (err.code === 'P2002') {
            throw new ConflictError('This time slot is no longer available');
        }
        throw err;
    }

    // Fire-and-forget: emails (don't block response)
    const clientName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Client';
    const lawyerName = `${lawyer.user.firstName} ${lawyer.user.lastName}`;

    sendPaymentConfirmationEmail({
        to: req.user.email,
        name: clientName,
        payment: result.payment,
        booking: result.booking,
        lawyer: { name: lawyerName },
    }).catch(err => logger.error('Failed to send client payment email', { error: err.message }));

    sendPaymentReceivedEmail({
        to: lawyer.user.email,
        name: lawyerName,
        payment: result.payment,
        booking: result.booking,
        client: { name: clientName },
    }).catch(err => logger.error('Failed to send lawyer payment email', { error: err.message }));

    // Fire-and-forget: in-app notifications
    prisma.notification.createMany({
        data: [
            {
                userId: req.user.id,
                type: 'PAYMENT_RECEIVED',
                title: 'Payment Successful',
                message: `Your payment of ₹${result.computedAmount.toLocaleString('en-IN')} to ${lawyerName} has been processed. Booking #${result.booking.bookingNumber}`,
                actionUrl: '/user/payments',
                actionLabel: 'View Payment',
            },
            {
                userId: lawyer.user.id,
                type: 'PAYMENT_RECEIVED',
                title: 'New Payment Received',
                message: `${clientName} paid ₹${result.computedAmount.toLocaleString('en-IN')} for consultation. Booking #${result.booking.bookingNumber}`,
                actionUrl: '/lawyer/earnings',
                actionLabel: 'View Earnings',
            },
        ],
    }).catch(err => logger.error('Failed to create payment notifications', { error: err.message }));

    logger.logBusiness('CHECKOUT_COMPLETED', {
        bookingId: result.booking.id,
        paymentId: result.payment.id,
        amount: result.computedAmount,
        lawyerId: lawyer.id,
        clientId: req.user.id,
    });

    // Generate meeting link for video bookings (fire-and-forget)
    if (result.booking.meetingType === 'VIDEO') {
        generateMeetAndUpdateBooking({ bookingId: result.booking.id })
            .catch(err => logger.error('Meet link generation failed (checkout)', err));
    }

    return sendCreated(res, {
        message: 'Payment successful! Booking confirmed.',
        data: {
            booking: {
                id: result.booking.id,
                bookingNumber: result.booking.bookingNumber,
                scheduledDate: result.booking.scheduledDate,
                scheduledTime: result.booking.scheduledTime,
                duration: result.booking.duration,
                meetingType: result.booking.meetingType,
                status: result.booking.status,
            },
            payment: {
                id: result.payment.id,
                amount: Number(result.payment.amount),
                status: result.payment.status,
                method: result.payment.method,
                transactionId: result.payment.gatewayPaymentId,
            },
            lawyerName,
        },
    });
}));


/**
 * @route   GET /api/v1/payments/:id
 * @desc    Get payment details (full, for transaction card)
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: {
            booking: {
                select: {
                    id: true,
                    bookingNumber: true,
                    scheduledDate: true,
                    scheduledTime: true,
                    duration: true,
                    meetingType: true,
                    status: true,
                    clientId: true,
                    lawyerId: true,
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            avatar: true,
                        },
                    },
                    lawyer: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!payment) {
        throw new NotFoundError('Payment');
    }

    // Check authorization: client, lawyer, or admin
    const isClient = payment.booking.clientId === req.user.id;
    // Use already-included data instead of extra DB query
    const isLawyer = payment.booking.lawyer?.user?.email && req.user.id === payment.booking.lawyer.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('Not authorized');
    }

    return sendSuccess(res, { data: payment });
}));

export default router;
