/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Payments Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Payment processing routes (Razorpay integration).
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
        throw new ForbiddenError('Not authorized to pay for this booking');
    }

    if (booking.payment?.status === 'COMPLETED') {
        throw new PaymentError('alreadyPaid');
    }

    // Create Razorpay order
    const amount = Math.round(Number(booking.amount) * 100); // Amount in paise

    const order = await razorpay.orders.create({
        amount,
        currency: booking.currency,
        receipt: booking.bookingNumber,
        notes: {
            bookingId: booking.id,
            userId: req.user.id,
        },
    });

    // Create or update payment record
    const payment = await prisma.payment.upsert({
        where: { bookingId },
        create: {
            bookingId,
            amount: booking.amount,
            currency: booking.currency,
            status: 'PENDING',
            gatewayOrderId: order.id,
        },
        update: {
            gatewayOrderId: order.id,
            status: 'PENDING',
        },
    });

    logger.logBusiness('PAYMENT_ORDER_CREATED', {
        bookingId,
        orderId: order.id,
        amount: booking.amount,
    });

    return sendCreated(res, {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingNumber: booking.bookingNumber,
        keyId: env.RAZORPAY_KEY_ID,
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

    // Find payment by order ID
    const payment = await prisma.payment.findUnique({
        where: { gatewayOrderId: razorpay_order_id },
        include: {
            booking: {
                include: {
                    lawyer: true,
                    client: { select: { email: true, firstName: true } },
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

    // Update payment and booking status
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
    ]);

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

    // Verify webhook signature using raw body bytes (not re-serialized JSON)
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || !req.rawBody) {
        logger.logSecurity('WEBHOOK_MISSING_SIG_OR_BODY', { ip: req.ip });
        return res.status(400).json({ error: 'Invalid request' });
    }

    const expectedSignature = createHmac(req.rawBody.toString('utf8'), env.RAZORPAY_KEY_SECRET);

    // Timing-safe comparison to prevent side-channel attacks
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

    const refundedAmount = refundData.amount / 100; // Convert from paise

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
 * @desc    Get payment details
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
                    clientId: true,
                    lawyerId: true,
                },
            },
        },
    });

    if (!payment) {
        throw new NotFoundError('Payment');
    }

    // Check authorization
    if (payment.booking.clientId !== req.user.id && req.user.role !== 'ADMIN') {
        throw new ForbiddenError('Not authorized');
    }

    return sendSuccess(res, { data: payment });
}));

export default router;
