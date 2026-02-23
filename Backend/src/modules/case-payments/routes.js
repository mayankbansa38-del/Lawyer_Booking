/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Case Payment Routes
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lawyer-initiated payment requests on cases.
 * Flow: Lawyer requests → User pays (simulated) or denies → records saved.
 * Uses the same dummy gateway pattern as /payments/checkout.
 *
 * @module modules/case-payments/routes
 */

import { Router } from 'express';
import crypto from 'crypto';
import { authenticate } from '../../middleware/auth.js';
import { sendSuccess, sendCreated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, BadRequestError, PaymentError } from '../../utils/errors.js';
import { createNotification } from '../notifications/routes.js';
import logger from '../../utils/logger.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format paise as INR display string.
 * @param {number} paise - Amount in paise (integer).
 * @returns {string} e.g. "₹5,000.00"
 */
function formatPaise(paise) {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Validate the requesting user is the assigned lawyer on the case.
 * @returns {{ lawyer, caseData }} for downstream use.
 */
async function assertLawyerOnCase(prisma, caseId, userId) {
    const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
            lawyer: { select: { id: true, userId: true, user: { select: { firstName: true, lastName: true } } } },
            client: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });

    if (!caseData) throw new NotFoundError('Case');

    const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
    if (!lawyer || lawyer.id !== caseData.lawyerId) {
        throw new ForbiddenError('Only the assigned lawyer can perform this action');
    }

    return { lawyer, caseData };
}

/**
 * Validate the requesting user is the client on the case payment.
 */
async function assertClientOnPayment(prisma, paymentId, userId) {
    const payment = await prisma.casePayment.findUnique({
        where: { id: paymentId },
        include: {
            case: {
                include: {
                    client: { select: { id: true, firstName: true, lastName: true, email: true } },
                    lawyer: {
                        select: {
                            id: true,
                            userId: true,
                            user: { select: { id: true, firstName: true, lastName: true, email: true } },
                        },
                    },
                },
            },
        },
    });

    if (!payment) throw new NotFoundError('Payment request');

    if (payment.case.clientId !== userId) {
        throw new ForbiddenError('Only the case client can respond to payment requests');
    }

    return payment;
}

// Standard select for returning case payment data
const CASE_PAYMENT_SELECT = {
    id: true,
    caseId: true,
    amountInPaise: true,
    currency: true,
    status: true,
    description: true,
    requestedByLawyerId: true,
    razorpayOrderId: true,
    razorpayPaymentId: true,
    createdAt: true,
    updatedAt: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @route   GET /api/v1/case-payments/my-payments
 * @desc    List all case payments for the authenticated user (as client)
 * @access  Private
 */
router.get('/my-payments', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const payments = await prisma.casePayment.findMany({
        where: {
            case: { clientId: req.user.id },
        },
        orderBy: { createdAt: 'desc' },
        select: {
            ...CASE_PAYMENT_SELECT,
            case: {
                select: {
                    id: true,
                    title: true,
                    caseNumber: true,
                    lawyer: {
                        select: {
                            user: { select: { firstName: true, lastName: true } },
                        },
                    },
                },
            },
        },
    });

    return sendSuccess(res, { data: payments });
}));

/**
 * @route   POST /api/v1/case-payments/cases/:caseId/request
 * @desc    Lawyer creates a payment request for a case
 * @access  Private (Assigned Lawyer only)
 */
router.post('/cases/:caseId/request', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { caseId } = req.params;
    const { amount, description } = req.body;

    // Validate amount (expect amount in rupees from frontend, convert to paise)
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        throw new BadRequestError('Amount must be a positive number (in rupees)');
    }
    if (!description || !description.trim()) {
        throw new BadRequestError('Description is required');
    }

    const amountInPaise = Math.round(Number(amount) * 100);

    // Verify lawyer owns this case
    const { lawyer, caseData } = await assertLawyerOnCase(prisma, caseId, req.user.id);

    // Cannot request payment on closed/resolved/rejected cases
    if (['CLOSED', 'RESOLVED', 'REJECTED'].includes(caseData.status)) {
        throw new BadRequestError(`Cannot request payment on a ${caseData.status.toLowerCase()} case`);
    }

    const payment = await prisma.casePayment.create({
        data: {
            caseId,
            amountInPaise,
            currency: 'INR',
            description: description.trim(),
            requestedByLawyerId: lawyer.id,
        },
        select: CASE_PAYMENT_SELECT,
    });

    // Notify the client
    const lawyerName = `${caseData.lawyer.user.firstName} ${caseData.lawyer.user.lastName}`;
    createNotification({
        userId: caseData.clientId,
        type: 'PAYMENT_REQUEST_RECEIVED',
        title: 'Payment Requested',
        message: `${lawyerName} has requested a payment of ${formatPaise(amountInPaise)} for case "${caseData.title}"`,
        actionUrl: `/user/cases/${caseId}`,
        actionLabel: 'View Payment Request',
        metadata: { casePaymentId: payment.id, caseId, amountInPaise },
    }).catch(err => logger.error('Failed to create payment request notification', { error: err.message }));

    logger.logBusiness('CASE_PAYMENT_REQUESTED', {
        casePaymentId: payment.id,
        caseId,
        lawyerId: lawyer.id,
        amountInPaise,
    });

    return sendCreated(res, {
        message: 'Payment request sent to client',
        data: payment,
    });
}));

/**
 * @route   GET /api/v1/case-payments/cases/:caseId
 * @desc    List all payment requests for a case
 * @access  Private (Client or Assigned Lawyer)
 */
router.get('/cases/:caseId', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { caseId } = req.params;

    // Verify access
    const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
            lawyer: { select: { id: true, userId: true } },
        },
    });

    if (!caseData) throw new NotFoundError('Case');

    const isClient = caseData.clientId === req.user.id;
    const isLawyer = caseData.lawyer.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('You do not have access to this case');
    }

    const payments = await prisma.casePayment.findMany({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        select: CASE_PAYMENT_SELECT,
    });

    return sendSuccess(res, { data: payments });
}));

/**
 * @route   PUT /api/v1/case-payments/:paymentId/deny
 * @desc    Client denies a payment request
 * @access  Private (Case Client only)
 */
router.put('/:paymentId/deny', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { paymentId } = req.params;

    const payment = await assertClientOnPayment(prisma, paymentId, req.user.id);

    if (payment.status !== 'REQUESTED') {
        throw new BadRequestError(`Cannot deny a payment with status "${payment.status}"`);
    }

    const updated = await prisma.casePayment.update({
        where: { id: paymentId },
        data: { status: 'DENIED' },
        select: CASE_PAYMENT_SELECT,
    });

    // Notify the lawyer
    const clientName = `${payment.case.client.firstName} ${payment.case.client.lastName}`;
    createNotification({
        userId: payment.case.lawyer.user.id,
        type: 'PAYMENT_REQUESTED',
        title: 'Payment Request Denied',
        message: `${clientName} has denied your payment request of ${formatPaise(payment.amountInPaise)} for case "${payment.case.title}"`,
        actionUrl: `/lawyer/cases/${payment.caseId}`,
        actionLabel: 'View Case',
        metadata: { casePaymentId: paymentId, caseId: payment.caseId },
    }).catch(err => logger.error('Failed to create payment denied notification', { error: err.message }));

    logger.logBusiness('CASE_PAYMENT_DENIED', { casePaymentId: paymentId });

    return sendSuccess(res, { message: 'Payment request denied', data: updated });
}));

/**
 * @route   POST /api/v1/case-payments/:paymentId/pay
 * @desc    Client pays a requested payment (simulated dummy gateway)
 * @access  Private (Case Client only)
 *
 * Flow: REQUESTED → PROCESSING → COMPLETED (all in one step via dummy gateway)
 */
router.post('/:paymentId/pay', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { paymentId } = req.params;

    const payment = await assertClientOnPayment(prisma, paymentId, req.user.id);

    if (payment.status !== 'REQUESTED' && payment.status !== 'PROCESSING') {
        throw new BadRequestError(`Cannot pay a payment with status "${payment.status}"`);
    }

    // Simulated gateway IDs (dummy payment)
    const gatewayOrderId = `case_order_${crypto.randomBytes(8).toString('hex')}`;
    const gatewayPaymentId = `case_pay_${crypto.randomBytes(8).toString('hex')}`;

    // Atomic transaction: mark payment completed + update lawyer earnings
    const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.casePayment.update({
            where: { id: paymentId },
            data: {
                status: 'COMPLETED',
                razorpayOrderId: gatewayOrderId,
                razorpayPaymentId: gatewayPaymentId,
            },
            select: CASE_PAYMENT_SELECT,
        });

        // Update lawyer's total earnings
        const amountInRupees = payment.amountInPaise / 100;
        await tx.lawyer.update({
            where: { id: payment.case.lawyer.id },
            data: {
                totalEarnings: { increment: amountInRupees },
            },
        });

        return result;
    });

    // Notify both parties
    const clientName = `${payment.case.client.firstName} ${payment.case.client.lastName}`;
    const lawyerName = `${payment.case.lawyer.user.firstName} ${payment.case.lawyer.user.lastName}`;

    // Notify lawyer: payment received
    createNotification({
        userId: payment.case.lawyer.user.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `${clientName} has paid ${formatPaise(payment.amountInPaise)} for case "${payment.case.title}"`,
        actionUrl: `/lawyer/cases/${payment.caseId}`,
        actionLabel: 'View Payment',
        metadata: { casePaymentId: paymentId, caseId: payment.caseId, amountInPaise: payment.amountInPaise },
    }).catch(err => logger.error('Failed to create payment received notification', { error: err.message }));

    // Notify client: payment confirmation
    createNotification({
        userId: payment.case.client.id,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Successful',
        message: `Your payment of ${formatPaise(payment.amountInPaise)} to ${lawyerName} for case "${payment.case.title}" was successful`,
        actionUrl: `/user/cases/${payment.caseId}`,
        actionLabel: 'View Receipt',
        metadata: { casePaymentId: paymentId, caseId: payment.caseId, amountInPaise: payment.amountInPaise },
    }).catch(err => logger.error('Failed to create payment confirmation notification', { error: err.message }));

    logger.logBusiness('CASE_PAYMENT_COMPLETED', {
        casePaymentId: paymentId,
        caseId: payment.caseId,
        amountInPaise: payment.amountInPaise,
        lawyerId: payment.case.lawyer.id,
        clientId: payment.case.client.id,
    });

    return sendSuccess(res, {
        message: 'Payment successful!',
        data: updated,
    });
}));

/**
 * @route   GET /api/v1/case-payments/:paymentId
 * @desc    Get a single case payment detail
 * @access  Private (Client or Assigned Lawyer)
 */
router.get('/:paymentId', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { paymentId } = req.params;

    const payment = await prisma.casePayment.findUnique({
        where: { id: paymentId },
        include: {
            case: {
                select: {
                    id: true,
                    title: true,
                    caseNumber: true,
                    clientId: true,
                    lawyer: {
                        select: {
                            id: true,
                            userId: true,
                            user: { select: { firstName: true, lastName: true } },
                        },
                    },
                    client: { select: { id: true, firstName: true, lastName: true } },
                },
            },
        },
    });

    if (!payment) throw new NotFoundError('Payment request');

    const isClient = payment.case.clientId === req.user.id;
    const isLawyer = payment.case.lawyer.userId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('Not authorized');
    }

    return sendSuccess(res, { data: payment });
}));

export default router;
