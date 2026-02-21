/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Video Meeting Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Generates Jitsi Meet links for confirmed video bookings.
 * Zero config — works out of the box, no API keys needed.
 *
 * @module services/calendar
 */

import { getPrismaClient } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Generates a unique, deterministic Jitsi Meet room URL for a booking.
 *
 * @param {string} bookingId - The booking UUID
 * @returns {string} A Jitsi Meet URL
 */
export function createMeetingLink(bookingId) {
    const roomId = bookingId.replace(/[^a-zA-Z0-9]/g, '');
    return `https://meet.jit.si/NyayBooker_${roomId}`;
}

/**
 * Generates a meeting link and updates the booking record.
 * Call AFTER the DB transaction that sets status=CONFIRMED.
 * Fire-and-forget — failures are logged, never crash the flow.
 *
 * @param {object} params
 * @param {string} params.bookingId
 */
export async function generateMeetAndUpdateBooking({ bookingId }) {
    try {
        const meetLink = createMeetingLink(bookingId);
        const prisma = getPrismaClient();

        await prisma.booking.update({
            where: { id: bookingId },
            data: { meetingLink: meetLink },
        });

        logger.info('Booking updated with meeting link', { bookingId, meetLink });
    } catch (error) {
        logger.error('generateMeetAndUpdateBooking failed', {
            bookingId,
            error: error.message,
        });
    }
}
