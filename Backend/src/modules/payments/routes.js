/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Payments Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Payment processing routes (Razorpay integration + direct checkout).
 * 
 * @module modules/payments/routes
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.js';
import { paymentLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, sendCreated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, PaymentError } from '../../utils/errors.js';
import { verifyRazorpaySignature, createHmac } from '../../utils/crypto.js';
import { sendPaymentConfirmationEmail, sendPaymentReceivedEmail } from '../../utils/email.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
});

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
        select: { id: true, totalEarnings: true },
    });

    if (!lawyer) {
        throw new NotFoundError('Lawyer profile');
    }

    // Aggregate payment stats
    const [completed, pending] = await Promise.all([
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

    // Get this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = await prisma.payment.aggregate({
        where: {
            booking: { lawyerId: lawyer.id },
            status: 'COMPLETED',
            processedAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
    });

    return sendSuccess(res, {
        data: {
            totalEarnings: Number(lawyer.totalEarnings),
            monthlyEarnings: Number(monthlyPayments._sum.amount || 0),
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
        amount,
        clientNotes,
        paymentMethod = 'CARD',
    } = req.body;

    // Validate required fields
    if (!lawyerId || !scheduledDate || !scheduledTime || !amount) {
        throw new PaymentError('Missing required fields: lawyerId, scheduledDate, scheduledTime, amount');
    }

    // Verify lawyer exists and is verified
    const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });

    if (!lawyer || lawyer.verificationStatus !== 'VERIFIED') {
        throw new NotFoundError('Verified lawyer');
    }

    // Generate booking number: NB-YYYYMMDD-XXXX
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
    const bookingNumber = `NB-${datePart}-${randomPart}`;

    // Generate simulated gateway IDs
    const gatewayOrderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
    const gatewayPaymentId = `pay_sim_${crypto.randomBytes(8).toString('hex')}`;

    // Create booking + payment + update lawyer stats in a single transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create booking (CONFIRMED since payment is immediate)
        const booking = await tx.booking.create({
            data: {
                bookingNumber,
                clientId: req.user.id,
                lawyerId: lawyer.id,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                duration: parseInt(duration),
                meetingType,
                amount: parseFloat(amount),
                currency: 'INR',
                status: 'CONFIRMED',
                confirmedAt: new Date(),
                clientNotes: clientNotes || null,
            },
        });

        // 2. Create payment (COMPLETED since simulated)
        const payment = await tx.payment.create({
            data: {
                bookingId: booking.id,
                amount: parseFloat(amount),
                currency: 'INR',
                status: 'COMPLETED',
                method: paymentMethod,
                gatewayOrderId,
                gatewayPaymentId,
                processedAt: new Date(),
            },
        });

        // 3. Update lawyer stats
        await tx.lawyer.update({
            where: { id: lawyer.id },
            data: {
                totalBookings: { increment: 1 },
                totalEarnings: { increment: parseFloat(amount) },
            },
        });

        return { booking, payment };
    });

    // Send emails (fire-and-forget, don't block response)
    const clientName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Client';
    const lawyerName = `${lawyer.user.firstName} ${lawyer.user.lastName}`;

    // Email to client
    sendPaymentConfirmationEmail({
        to: req.user.email,
        name: clientName,
        payment: result.payment,
        booking: result.booking,
        lawyer: { name: lawyerName },
    }).catch(err => logger.error('Failed to send client payment email', { error: err.message }));

    // Email to lawyer
    sendPaymentReceivedEmail({
        to: lawyer.user.email,
        name: lawyerName,
        payment: result.payment,
        booking: result.booking,
        client: { name: clientName },
    }).catch(err => logger.error('Failed to send lawyer payment email', { error: err.message }));

    // Create in-app notifications for both
    prisma.notification.createMany({
        data: [
            {
                userId: req.user.id,
                type: 'PAYMENT_RECEIVED',
                title: 'Payment Successful',
                message: `Your payment of ₹${parseFloat(amount).toLocaleString('en-IN')} to ${lawyerName} has been processed. Booking #${bookingNumber}`,
                actionUrl: '/user/payments',
                actionLabel: 'View Payment',
            },
            {
                userId: lawyer.user.id,
                type: 'PAYMENT_RECEIVED',
                title: 'New Payment Received',
                message: `${clientName} paid ₹${parseFloat(amount).toLocaleString('en-IN')} for consultation. Booking #${bookingNumber}`,
                actionUrl: '/lawyer/earnings',
                actionLabel: 'View Earnings',
            },
        ],
    }).catch(err => logger.error('Failed to create payment notifications', { error: err.message }));

    logger.logBusiness('CHECKOUT_COMPLETED', {
        bookingId: result.booking.id,
        paymentId: result.payment.id,
        amount,
        lawyerId: lawyer.id,
        clientId: req.user.id,
    });

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

// ═══════════════════════════════════════════════════════════════════════════
// RAZORPAY ROUTES (existing)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create Razorpay order for booking
 * @access  Private
 */
router.post('/create-order', authenticate, paymentLimiter, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { bookingId } = req.body;

    // Get booking
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
    });

    if (!booking) {
        throw new NotFoundError('Booking');
    }

    if (booking.clientId !== req.user.id) {
        throw new ForbiddenError('Not authorized');
    }

    // Check if already paid
    if (booking.payment?.status === 'COMPLETED') {
        throw new PaymentError('alreadyPaid');
    }

    // Create Razorpay order
    const amountInPaise = Math.round(Number(booking.amount) * 100);
    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: booking.currency,
        receipt: `booking_${booking.bookingNumber}`,
        notes: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
        },
    });

    // Create or update payment record
    if (booking.payment) {
        await prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
                gatewayOrderId: order.id,
                status: 'PROCESSING',
            },
        });
    } else {
        await prisma.payment.create({
            data: {
                bookingId: booking.id,
                amount: booking.amount,
                currency: booking.currency,
                status: 'PROCESSING',
                gatewayOrderId: order.id,
            },
        });
    }

    return sendCreated(res, {
        data: {
            orderId: order.id,
            amount: amountInPaise,
            currency: booking.currency,
            key: env.RAZORPAY_KEY_ID,
        },
    });
}));

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay payment signature
 * @access  Private
 */
router.post('/verify', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const isValid = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    );

    if (!isValid) {
        throw new PaymentError('failed');
    }

    // Find payment by order ID with full booking details
    const payment = await prisma.payment.findUnique({
        where: { gatewayOrderId: razorpay_order_id },
        include: {
            booking: {
                include: {
                    lawyer: {
                        include: {
                            user: { select: { id: true, firstName: true, lastName: true, email: true } },
                        },
                    },
                    client: { select: { id: true, email: true, firstName: true, lastName: true } },
                },
            },
        },
    });

    if (!payment) {
        throw new NotFoundError('Payment');
    }

    if (payment.booking.clientId !== req.user.id) {
        throw new ForbiddenError('Not authorized');
    }

    // Update payment, booking, and lawyer earnings in a single transaction
    await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                gatewayPaymentId: razorpay_payment_id,
                gatewaySignature: razorpay_signature,
                processedAt: new Date(),
            },
        }),
        prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
        }),
        prisma.lawyer.update({
            where: { id: payment.booking.lawyerId },
            data: {
                totalEarnings: { increment: Number(payment.amount) },
                totalBookings: { increment: 1 },
            },
        }),
    ]);

    // Send emails (fire-and-forget)
    const clientName = `${payment.booking.client.firstName} ${payment.booking.client.lastName}`.trim();
    const lawyerName = `${payment.booking.lawyer.user.firstName} ${payment.booking.lawyer.user.lastName}`.trim();

    sendPaymentConfirmationEmail({
        to: payment.booking.client.email,
        name: clientName,
        payment,
        booking: payment.booking,
        lawyer: { name: lawyerName },
    }).catch(err => logger.error('Failed to send client payment email', { error: err.message }));

    sendPaymentReceivedEmail({
        to: payment.booking.lawyer.user.email,
        name: lawyerName,
        payment,
        booking: payment.booking,
        client: { name: clientName },
    }).catch(err => logger.error('Failed to send lawyer payment email', { error: err.message }));

    // In-app notifications
    prisma.notification.createMany({
        data: [
            {
                userId: payment.booking.client.id,
                type: 'PAYMENT_RECEIVED',
                title: 'Payment Successful',
                message: `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} has been verified.`,
                actionUrl: '/user/payments',
                actionLabel: 'View Payment',
            },
            {
                userId: payment.booking.lawyer.user.id,
                type: 'PAYMENT_RECEIVED',
                title: 'New Payment Received',
                message: `${clientName} paid ₹${Number(payment.amount).toLocaleString('en-IN')} for consultation.`,
                actionUrl: '/lawyer/earnings',
                actionLabel: 'View Earnings',
            },
        ],
    }).catch(err => logger.error('Failed to create notifications', { error: err.message }));

    logger.logBusiness('PAYMENT_COMPLETED', {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
    });

    return sendSuccess(res, {
        message: 'Payment verified successfully',
        bookingId: payment.bookingId,
    });
}));

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Razorpay webhook handler
 * @access  Public (verified by signature)
 */
router.post('/webhook', asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    // Verify webhook signature using raw body bytes
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || !req.rawBody) {
        logger.logSecurity('WEBHOOK_MISSING_SIG_OR_BODY', { ip: req.ip });
        return res.status(400).json({ error: 'Invalid request' });
    }

    const expectedSignature = createHmac(req.rawBody.toString('utf8'), env.RAZORPAY_KEY_SECRET);

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        logger.logSecurity('INVALID_WEBHOOK_SIGNATURE', { ip: req.ip });
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    logger.info('Razorpay webhook received', { event });

    switch (event) {
        case 'payment.captured': {
            const payment = payload.payment.entity;
            await handlePaymentCaptured(prisma, payment);
            break;
        }
        case 'payment.failed': {
            const payment = payload.payment.entity;
            await handlePaymentFailed(prisma, payment);
            break;
        }
        case 'refund.processed': {
            const refund = payload.refund.entity;
            await handleRefundProcessed(prisma, refund);
            break;
        }
        default:
            logger.info('Unhandled webhook event', { event });
    }

    return res.json({ received: true });
}));

/**
 * Handle payment captured webhook
 */
async function handlePaymentCaptured(prisma, paymentData) {
    const payment = await prisma.payment.findUnique({
        where: { gatewayOrderId: paymentData.order_id },
        include: { booking: true },
    });

    if (!payment || payment.status === 'COMPLETED') return;

    await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                gatewayPaymentId: paymentData.id,
                processedAt: new Date(),
                method: mapPaymentMethod(paymentData.method),
            },
        }),
        prisma.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'CONFIRMED', confirmedAt: new Date() },
        }),
        prisma.lawyer.update({
            where: { id: payment.booking.lawyerId },
            data: {
                totalEarnings: { increment: Number(payment.amount) },
                totalBookings: { increment: 1 },
            },
        }),
    ]);

    logger.logBusiness('PAYMENT_CAPTURED_WEBHOOK', { paymentId: payment.id });
}

/**
 * Handle payment failed webhook
 */
async function handlePaymentFailed(prisma, paymentData) {
    const payment = await prisma.payment.findUnique({
        where: { gatewayOrderId: paymentData.order_id },
    });

    if (!payment) return;

    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: paymentData.error_description || 'Payment failed',
        },
    });

    logger.logBusiness('PAYMENT_FAILED_WEBHOOK', { paymentId: payment.id });
}

/**
 * Handle refund processed webhook
 */
async function handleRefundProcessed(prisma, refundData) {
    const payment = await prisma.payment.findFirst({
        where: { gatewayPaymentId: refundData.payment_id },
    });

    if (!payment) return;

    const refundedAmount = refundData.amount / 100;

    await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: refundedAmount >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
            refundedAmount,
            refundedAt: new Date(),
            refundId: refundData.id,
        },
    });

    logger.logBusiness('REFUND_PROCESSED_WEBHOOK', {
        paymentId: payment.id,
        refundAmount: refundedAmount,
    });
}

/**
 * Map Razorpay payment method to our enum
 */
function mapPaymentMethod(method) {
    const methodMap = {
        card: 'CARD',
        upi: 'UPI',
        netbanking: 'NET_BANKING',
        wallet: 'WALLET',
    };
    return methodMap[method] || 'CARD';
}

/**
 * @route   POST /api/v1/payments/:id/refund
 * @desc    Request refund for payment
 * @access  Private/Admin
 */
router.post('/:id/refund', authenticate, authorize('ADMIN'), asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { amount, reason } = req.body;

    const payment = await prisma.payment.findUnique({
        where: { id: req.params.id },
    });

    if (!payment) {
        throw new NotFoundError('Payment');
    }

    if (payment.status !== 'COMPLETED') {
        throw new PaymentError('notRefundable');
    }

    const refundAmount = amount || Number(payment.amount);
    const refundAmountPaise = Math.round(refundAmount * 100);

    try {
        const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
            amount: refundAmountPaise,
            notes: { reason },
        });

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: refundAmount >= Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
                refundedAmount: refundAmount,
                refundedAt: new Date(),
                refundId: refund.id,
                refundReason: reason,
            },
        });

        logger.logBusiness('REFUND_INITIATED', {
            paymentId: payment.id,
            refundId: refund.id,
            amount: refundAmount,
        });

        return sendSuccess(res, {
            data: { refundId: refund.id, amount: refundAmount },
            message: 'Refund initiated successfully',
        });
    } catch (error) {
        logger.error('Refund failed', { paymentId: payment.id, error: error.message });
        throw new PaymentError('refundFailed');
    }
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
    const isLawyer = await prisma.lawyer.findFirst({
        where: { userId: req.user.id, id: payment.booking.lawyerId },
    });
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('Not authorized');
    }

    return sendSuccess(res, { data: payment });
}));

export default router;
