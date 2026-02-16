/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Bookings Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Booking management routes.
 * 
 * @module modules/bookings/routes
 */

import { Router } from 'express';
import { authenticate, authorize, requireVerifiedLawyer } from '../../middleware/auth.js';
import { sendSuccess, sendCreated, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError, BookingError } from '../../utils/errors.js';
import { generateBookingNumber } from '../../utils/crypto.js';
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../../utils/email.js';
import { parsePaginationParams } from '../../utils/pagination.js';
import { createNotification } from '../notifications/routes.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * @route   POST /api/v1/bookings
 * @desc    Create a new booking
 * @access  Private
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { lawyerId, scheduledDate, scheduledTime, duration = 60, meetingType = 'VIDEO', clientNotes } = req.body;

    // Check if lawyer exists and is available
    const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        include: {
            user: {
                select: { firstName: true, lastName: true, email: true },
            },
        },
    });

    if (!lawyer) {
        throw new NotFoundError('Lawyer');
    }

    if (!lawyer.isAvailable || lawyer.verificationStatus !== 'VERIFIED') {
        throw new BookingError('lawyerUnavailable');
    }

    // Check for booking conflicts
    const existingBooking = await prisma.booking.findFirst({
        where: {
            lawyerId,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            status: { in: ['PENDING', 'CONFIRMED'] },
        },
    });

    if (existingBooking) {
        throw new BookingError('slotUnavailable');
    }

    // Check if user already has a booking at this time
    const userConflict = await prisma.booking.findFirst({
        where: {
            clientId: req.user.id,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            status: { in: ['PENDING', 'CONFIRMED'] },
        },
    });

    if (userConflict) {
        throw new BookingError('alreadyBooked');
    }

    // Create booking
    const booking = await prisma.booking.create({
        data: {
            bookingNumber: generateBookingNumber(),
            clientId: req.user.id,
            lawyerId,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            duration,
            meetingType,
            clientNotes,
            amount: lawyer.hourlyRate * (duration / 60),
            status: 'PENDING',
        },
        include: {
            lawyer: {
                include: {
                    user: { select: { firstName: true, lastName: true } },
                },
            },
        },
    });

    // Update lawyer stats
    await prisma.lawyer.update({
        where: { id: lawyerId },
        data: { totalBookings: { increment: 1 } },
    });

    logger.logBusiness('BOOKING_CREATED', {
        bookingId: booking.id,
        clientId: req.user.id,
        lawyerId,
    });

    // Send confirmation email to client (fire-and-forget)
    const lawyerName = `${lawyer.user.firstName} ${lawyer.user.lastName}`;
    sendBookingConfirmationEmail({
        to: req.user.email,
        booking: {
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            lawyerName,
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            duration: booking.duration,
            meetingType: booking.meetingType,
            amount: parseFloat(booking.amount),
        },
    }).catch(err => logger.error('Failed to send booking confirmation email', err));

    // Create in-app notification for lawyer
    createNotification({
        userId: lawyer.userId,
        type: 'BOOKING_CREATED',
        title: 'New Booking Request',
        message: `You have a new consultation booking for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}.`,
        actionUrl: '/lawyer/appointments',
        actionLabel: 'View Appointments',
        metadata: { bookingId: booking.id, clientId: req.user.id },
    }).catch(err => logger.error('Failed to create booking notification', err));

    return sendCreated(res, {
        booking: {
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            scheduledDate: booking.scheduledDate,
            scheduledTime: booking.scheduledTime,
            duration: booking.duration,
            meetingType: booking.meetingType,
            amount: booking.amount,
            status: booking.status,
            lawyer: {
                id: booking.lawyer.id,
                name: `${booking.lawyer.user.firstName} ${booking.lawyer.user.lastName}`,
            },
        },
    }, 'Booking created successfully. Please complete payment to confirm.');
}));

/**
 * @route   GET /api/v1/bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, upcoming } = req.query;

    const where = {
        clientId: req.user.id,
    };

    if (status) {
        where.status = status.toUpperCase();
    }

    if (upcoming === 'true') {
        where.scheduledDate = { gte: new Date() };
        where.status = { in: ['PENDING', 'CONFIRMED'] };
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { scheduledDate: 'asc' },
            include: {
                lawyer: {
                    select: {
                        id: true,
                        slug: true,
                        hourlyRate: true,
                        user: {
                            select: { firstName: true, lastName: true, avatar: true },
                        },
                        specializations: {
                            where: { isPrimary: true },
                            take: 1,
                            select: { practiceArea: { select: { name: true } } },
                        },
                    },
                },
                payment: {
                    select: { status: true, amount: true },
                },
                review: {
                    select: { id: true, rating: true },
                },
            },
        }),
        prisma.booking.count({ where }),
    ]);

    const transformed = bookings.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        scheduledDate: b.scheduledDate,
        scheduledTime: b.scheduledTime,
        duration: b.duration,
        meetingType: b.meetingType,
        status: b.status,
        amount: b.amount,
        meetingLink: b.meetingLink,
        lawyer: {
            id: b.lawyer.id,
            slug: b.lawyer.slug,
            name: `${b.lawyer.user.firstName} ${b.lawyer.user.lastName}`,
            avatar: b.lawyer.user.avatar,
            specialization: b.lawyer.specializations[0]?.practiceArea?.name || null,
        },
        payment: b.payment ? { status: b.payment.status } : null,
        hasReview: !!b.review,
    }));

    return sendPaginated(res, {
        data: transformed,
        total,
        page,
        limit,
    });
}));

/**
 * @route   GET /api/v1/bookings/lawyer
 * @desc    Get lawyer's bookings
 * @access  Private/Lawyer
 */
router.get('/lawyer', authenticate, requireVerifiedLawyer, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);
    const { status, date } = req.query;

    const where = {
        lawyer: { userId: req.user.id },
    };

    if (status) {
        where.status = status.toUpperCase();
    }

    if (date) {
        const targetDate = new Date(date);
        where.scheduledDate = {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        };
    }

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            skip,
            take: limit,
            orderBy: { scheduledDate: 'asc' },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
                payment: {
                    select: { status: true },
                },
            },
        }),
        prisma.booking.count({ where }),
    ]);

    return sendPaginated(res, {
        data: bookings.map(b => ({
            id: b.id,
            bookingNumber: b.bookingNumber,
            scheduledDate: b.scheduledDate,
            scheduledTime: b.scheduledTime,
            duration: b.duration,
            meetingType: b.meetingType,
            status: b.status,
            amount: b.amount,
            meetingLink: b.meetingLink,
            clientNotes: b.clientNotes,
            client: b.client,
            paymentStatus: b.payment?.status || null,
        })),
        total,
        page,
        limit,
    });
}));

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
            client: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatar: true,
                },
            },
            lawyer: {
                select: {
                    id: true,
                    slug: true,
                    hourlyRate: true,
                    user: {
                        select: { firstName: true, lastName: true, avatar: true, email: true },
                    },
                },
            },
            payment: true,
            review: true,
        },
    });

    if (!booking) {
        throw new NotFoundError('Booking');
    }

    // Check authorization
    const isClient = booking.clientId === req.user.id;
    const isLawyer = booking.lawyer.user && req.user.lawyerId === booking.lawyerId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('You do not have access to this booking');
    }

    return sendSuccess(res, { data: booking });
}));

/**
 * @route   PUT /api/v1/bookings/:id/confirm
 * @desc    Confirm booking (Lawyer)
 * @access  Private/Lawyer
 */
router.put('/:id/confirm', authenticate, requireVerifiedLawyer, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { meetingLink } = req.body;

    const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: true,
            client: { select: { email: true, firstName: true } },
        },
    });

    if (!booking) {
        throw new NotFoundError('Booking');
    }

    if (booking.lawyer.userId !== req.user.id) {
        throw new ForbiddenError('Not authorized to confirm this booking');
    }

    if (booking.status !== 'PENDING') {
        throw new BookingError('generic');
    }

    const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
            status: 'CONFIRMED',
            confirmedAt: new Date(),
            meetingLink: meetingLink || undefined,
        },
    });

    // Send confirmation email
    sendBookingConfirmationEmail({
        to: booking.client.email,
        name: booking.client.firstName,
        booking: {
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            date: booking.scheduledDate.toLocaleDateString(),
            time: booking.scheduledTime,
            duration: booking.duration,
            meetingType: booking.meetingType,
            meetingLink,
        },
        lawyer: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            specialization: 'Legal Consultant',
        },
    }).catch(e => logger.error('Failed to send confirmation email', e));

    // Notify client in-app
    createNotification({
        userId: booking.clientId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your consultation on ${booking.scheduledDate.toLocaleDateString()} at ${booking.scheduledTime} has been confirmed.`,
        actionUrl: '/user/appointments',
        actionLabel: 'View Appointments',
        metadata: { bookingId: booking.id },
    }).catch(e => logger.error('Failed to create confirm notification', e));

    logger.logBusiness('BOOKING_CONFIRMED', { bookingId: booking.id });

    return sendSuccess(res, {
        data: updated,
        message: 'Booking confirmed successfully',
    });
}));

/**
 * @route   PUT /api/v1/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.put('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: {
            lawyer: { include: { user: { select: { id: true } } } },
            client: { select: { email: true, firstName: true } },
        },
    });

    if (!booking) {
        throw new NotFoundError('Booking');
    }

    // Authorization
    const isClient = booking.clientId === req.user.id;
    const isLawyer = booking.lawyer.user.id === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isLawyer && !isAdmin) {
        throw new ForbiddenError('Not authorized to cancel this booking');
    }

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
        throw new BookingError('alreadyCancelled');
    }

    const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: req.user.id,
            cancellationReason: reason,
        },
    });

    // Send cancellation email
    sendBookingCancellationEmail({
        to: booking.client.email,
        name: booking.client.firstName,
        booking: {
            bookingNumber: booking.bookingNumber,
            date: booking.scheduledDate.toLocaleDateString(),
            time: booking.scheduledTime,
        },
        reason,
    }).catch(e => logger.error('Failed to send cancellation email', e));

    // Notify the other party in-app
    const notifyUserId = isClient ? booking.lawyer.user.id : booking.clientId;
    createNotification({
        userId: notifyUserId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: `Booking #${booking.bookingNumber} for ${booking.scheduledDate.toLocaleDateString()} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        actionUrl: isClient ? '/lawyer/appointments' : '/user/appointments',
        actionLabel: 'View Appointments',
        metadata: { bookingId: booking.id, cancelledBy: req.user.id },
    }).catch(e => logger.error('Failed to create cancel notification', e));

    logger.logBusiness('BOOKING_CANCELLED', {
        bookingId: booking.id,
        cancelledBy: req.user.id,
        reason,
    });

    return sendSuccess(res, {
        data: updated,
        message: 'Booking cancelled successfully',
    });
}));

/**
 * @route   PUT /api/v1/bookings/:id/complete
 * @desc    Mark booking as completed (Lawyer)
 * @access  Private/Lawyer
 */
router.put('/:id/complete', authenticate, requireVerifiedLawyer, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { lawyerNotes } = req.body;

    const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
        include: { lawyer: true },
    });

    if (!booking) {
        throw new NotFoundError('Booking');
    }

    if (booking.lawyer.userId !== req.user.id) {
        throw new ForbiddenError('Not authorized');
    }

    if (booking.status !== 'CONFIRMED') {
        throw new BookingError('generic');
    }

    // Update booking and lawyer stats in transaction
    const [updated] = await prisma.$transaction([
        prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                lawyerNotes: lawyerNotes || undefined,
            },
        }),
        prisma.lawyer.update({
            where: { id: booking.lawyerId },
            data: {
                completedBookings: { increment: 1 },
                totalEarnings: { increment: booking.amount },
            },
        }),
    ]);

    logger.logBusiness('BOOKING_COMPLETED', { bookingId: booking.id });

    return sendSuccess(res, {
        data: updated,
        message: 'Booking marked as completed',
    });
}));

export default router;
