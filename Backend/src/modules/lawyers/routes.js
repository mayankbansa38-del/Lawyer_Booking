/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Lawyers Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Lawyer management and discovery routes.
 * 
 * @module modules/lawyers/routes
 */

import { Router } from 'express';
import { authenticate, optionalAuth, requireVerifiedLawyer, authorize } from '../../middleware/auth.js';
import { searchLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, sendPaginated, asyncHandler } from '../../utils/response.js';
import { getPrismaClient } from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { parsePaginationParams, parseSortParams, buildPaginationMeta } from '../../utils/pagination.js';

const router = Router();

/**
 * @route   GET /api/v1/lawyers
 * @desc    Get all verified lawyers (public discovery)
 * @access  Public
 */
router.get('/', searchLimiter, optionalAuth, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { page, limit, skip } = parsePaginationParams(req.query);

    // Filters
    const {
        specialization,
        city,
        state,
        minRating,
        maxRate,
        minRate,
        search,
        available,
    } = req.query;

    // Build where clause
    const where = {
        verificationStatus: 'VERIFIED',
        isAvailable: available === 'false' ? undefined : true,
        user: {
            isActive: true,
        },
    };

    // Location filters
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };

    // Rating filter
    if (minRating) where.averageRating = { gte: parseFloat(minRating) };

    // Price range filters
    if (minRate || maxRate) {
        where.hourlyRate = {};
        if (minRate) where.hourlyRate.gte = parseFloat(minRate);
        if (maxRate) where.hourlyRate.lte = parseFloat(maxRate);
    }

    // Experience filters
    const { minExperience, maxExperience, minCases, maxCases } = req.query;
    if (minExperience || maxExperience) {
        where.experience = {};
        if (minExperience) where.experience.gte = parseInt(minExperience);
        if (maxExperience) where.experience.lte = parseInt(maxExperience);
    }

    // Completed Bookings (Cases Won) filters
    if (minCases || maxCases) {
        where.completedBookings = {};
        if (minCases) where.completedBookings.gte = parseInt(minCases);
        if (maxCases) where.completedBookings.lte = parseInt(maxCases);
    }

    // Specialization filter
    if (specialization) {
        where.specializations = {
            some: {
                practiceArea: {
                    slug: specialization,
                },
            },
        };
    }

    // Search filter (name, bio, headline)
    if (search) {
        where.OR = [
            { bio: { contains: search, mode: 'insensitive' } },
            { headline: { contains: search, mode: 'insensitive' } },
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
    }

    // Sorting
    const sortFields = {
        rating: 'averageRating',
        price: 'hourlyRate',
        experience: 'experience',
        reviews: 'totalReviews',
        newest: 'createdAt',
    };
    const { field: sortField, order: sortOrder } = parseSortParams(
        req.query,
        sortFields,
        'rating',
        'desc'
    );

    const [lawyers, total] = await Promise.all([
        prisma.lawyer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortField]: sortOrder },
            select: {
                id: true,
                slug: true,
                bio: true,
                headline: true,
                experience: true,
                hourlyRate: true,
                currency: true,
                city: true,
                state: true,
                averageRating: true,
                totalReviews: true,
                isAvailable: true,
                featured: true,
                completedBookings: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
                specializations: {
                    where: { isPrimary: true },
                    take: 3,
                    select: {
                        practiceArea: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.lawyer.count({ where }),
    ]);

    // Transform response
    const transformedLawyers = lawyers.map(lawyer => ({
        id: lawyer.id,
        slug: lawyer.slug,
        name: `${lawyer.user.firstName} ${lawyer.user.lastName}`,
        image: lawyer.user.avatar,
        avatar: lawyer.user.avatar,
        headline: lawyer.headline,
        description: lawyer.headline,
        experience: lawyer.experience,
        hourlyRate: lawyer.hourlyRate,
        avgCostPerCase: lawyer.hourlyRate,
        currency: lawyer.currency,
        location: lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state,
        city: lawyer.city,
        state: lawyer.state,
        rating: lawyer.averageRating ? Math.round(lawyer.averageRating * 10) / 10 : 0,
        averageRating: lawyer.averageRating,
        totalReviews: lawyer.totalReviews,
        isAvailable: lawyer.isAvailable,
        availability: lawyer.isAvailable ? 'Available' : 'Busy',
        featured: lawyer.featured,
        casesWon: lawyer.completedBookings || 0,
        completedBookings: lawyer.completedBookings,
        specialty: lawyer.specializations.map(s => s.practiceArea.name),
        specializations: lawyer.specializations.map(s => s.practiceArea),
    }));

    return sendPaginated(res, {
        data: transformedLawyers,
        total,
        page,
        limit,
    });
}));

/**
 * @route   GET /api/v1/lawyers/featured
 * @desc    Get featured lawyers
 * @access  Public
 */
router.get('/featured', asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);

    const lawyers = await prisma.lawyer.findMany({
        where: {
            verificationStatus: 'VERIFIED',
            featured: true,
            isAvailable: true,
            user: { isActive: true },
        },
        take: limit,
        orderBy: [
            { featuredOrder: 'asc' },
            { averageRating: 'desc' },
        ],
        select: {
            id: true,
            slug: true,
            headline: true,
            experience: true,
            hourlyRate: true,
            currency: true,
            city: true,
            state: true,
            averageRating: true,
            totalReviews: true,
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                },
            },
            completedBookings: true,
            specializations: {
                where: { isPrimary: true },
                take: 1,
                select: {
                    practiceArea: {
                        select: { name: true, slug: true },
                    },
                },
            },
        },
    });

    const transformed = lawyers.map(lawyer => ({
        id: lawyer.id,
        slug: lawyer.slug,
        name: `${lawyer.user.firstName} ${lawyer.user.lastName}`,
        image: lawyer.user.avatar,
        avatar: lawyer.user.avatar,
        headline: lawyer.headline,
        description: lawyer.headline,
        experience: lawyer.experience,
        hourlyRate: lawyer.hourlyRate,
        avgCostPerCase: lawyer.hourlyRate,
        currency: lawyer.currency,
        location: lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state,
        rating: lawyer.averageRating ? Math.round(lawyer.averageRating * 10) / 10 : 0,
        averageRating: lawyer.averageRating,
        totalReviews: lawyer.totalReviews,
        casesWon: lawyer.completedBookings || 0,
        completedBookings: lawyer.completedBookings,
        specialty: lawyer.specializations[0]?.practiceArea?.name ? [lawyer.specializations[0].practiceArea.name] : [],
        primarySpecialization: lawyer.specializations[0]?.practiceArea?.name || null,
        availability: 'Available', // Featured are usually available
    }));

    return sendSuccess(res, { data: transformed });
}));

/**
 * @route   GET /api/v1/lawyers/practice-areas
 * @desc    Get all practice areas
 * @access  Public
 */
router.get('/practice-areas', asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    const practiceAreas = await prisma.practiceArea.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            _count: {
                select: {
                    lawyers: {
                        where: {
                            lawyer: {
                                verificationStatus: 'VERIFIED',
                                isAvailable: true,
                            },
                        },
                    },
                },
            },
        },
    });

    const transformed = practiceAreas.map(pa => ({
        id: pa.id,
        name: pa.name,
        slug: pa.slug,
        description: pa.description,
        icon: pa.icon,
        lawyerCount: pa._count.lawyers,
    }));

    return sendSuccess(res, { data: transformed });
}));

/**
 * @route   GET /api/v1/lawyers/:slugOrId
 * @desc    Get lawyer by slug or ID
 * @access  Public
 */
router.get('/:slugOrId', optionalAuth, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { slugOrId } = req.params;

    // Determine if it's a UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const lawyer = await prisma.lawyer.findFirst({
        where: isUuid
            ? { id: slugOrId, verificationStatus: 'VERIFIED' }
            : { slug: slugOrId, verificationStatus: 'VERIFIED' },
        select: {
            id: true,
            slug: true,
            bio: true,
            headline: true,
            experience: true,
            hourlyRate: true,
            currency: true,
            city: true,
            state: true,
            address: true,
            barCouncilId: true,
            barCouncilState: true,
            enrollmentYear: true,
            languages: true,
            averageRating: true,
            totalReviews: true,
            totalBookings: true,
            completedBookings: true,
            isAvailable: true,
            availability: true,
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    isEmailVerified: true,
                },
            },
            specializations: {
                select: {
                    isPrimary: true,
                    yearsExperience: true,
                    practiceArea: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            icon: true,
                        },
                    },
                },
                orderBy: { isPrimary: 'desc' },
            },
            qualifications: {
                select: {
                    id: true,
                    degree: true,
                    institution: true,
                    year: true,
                },
                orderBy: { year: 'desc' },
            },
            reviews: {
                where: { isPublished: true, isHidden: false },
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    rating: true,
                    title: true,
                    content: true,
                    createdAt: true,
                    lawyerResponse: true,
                    respondedAt: true,
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            },
        },
    });

    if (!lawyer) {
        throw new NotFoundError('Lawyer');
    }

    // Transform response
    const transformed = {
        id: lawyer.id,
        slug: lawyer.slug,
        name: `${lawyer.user.firstName} ${lawyer.user.lastName}`,
        firstName: lawyer.user.firstName,
        lastName: lawyer.user.lastName,
        image: lawyer.user.avatar,
        avatar: lawyer.user.avatar,
        bio: lawyer.bio,
        headline: lawyer.headline,
        description: lawyer.headline,
        experience: lawyer.experience,
        hourlyRate: lawyer.hourlyRate,
        avgCostPerCase: lawyer.hourlyRate,
        currency: lawyer.currency,
        location: lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state,
        city: lawyer.city,
        state: lawyer.state,
        barCouncilId: lawyer.barCouncilId,
        barCouncilState: lawyer.barCouncilState,
        enrollmentYear: lawyer.enrollmentYear,
        languages: lawyer.languages,
        rating: lawyer.averageRating ? Math.round(lawyer.averageRating * 10) / 10 : 0,
        averageRating: lawyer.averageRating,
        totalReviews: lawyer.totalReviews,
        casesWon: lawyer.completedBookings || 0,
        completedConsultations: lawyer.completedBookings,
        isAvailable: lawyer.isAvailable,
        availability: lawyer.isAvailable ? 'Available' : 'Busy',
        specialty: lawyer.specializations.map(s => s.practiceArea.name),
        specializations: lawyer.specializations.map(s => ({
            ...s.practiceArea,
            isPrimary: s.isPrimary,
            yearsExperience: s.yearsExperience,
        })),
        qualifications: lawyer.qualifications,
        recentReviews: lawyer.reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            content: r.content,
            createdAt: r.createdAt,
            lawyerResponse: r.lawyerResponse,
            respondedAt: r.respondedAt,
            author: {
                name: `${r.author.firstName} ${r.author.lastName.charAt(0)}.`,
                avatar: r.author.avatar,
            },
        })),
    };

    return sendSuccess(res, { data: transformed });
}));

/**
 * @route   GET /api/v1/lawyers/:id/availability
 * @desc    Get lawyer's available time slots
 * @access  Public
 */
router.get('/:id/availability', asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { id } = req.params;
    const { date } = req.query; // YYYY-MM-DD format

    const lawyer = await prisma.lawyer.findUnique({
        where: { id },
        select: {
            id: true,
            availability: true,
            isAvailable: true,
        },
    });

    if (!lawyer) {
        throw new NotFoundError('Lawyer');
    }

    if (!lawyer.isAvailable) {
        return sendSuccess(res, { data: { slots: [], message: 'Lawyer is not available' } });
    }

    // Get existing bookings for the date
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const existingBookings = await prisma.booking.findMany({
        where: {
            lawyerId: id,
            scheduledDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: {
            scheduledTime: true,
            duration: true,
        },
    });

    // Parse availability and generate slots (simplified)
    const availability = lawyer.availability || {};
    const dayOfWeek = new Date(date || Date.now()).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = availability[dayNames[dayOfWeek]] || [];

    // Generate available slots
    const bookedTimes = new Set(existingBookings.map(b => b.scheduledTime));
    const availableSlots = daySchedule.filter(slot => !bookedTimes.has(slot.time));

    return sendSuccess(res, {
        data: {
            date: date || new Date().toISOString().split('T')[0],
            slots: availableSlots,
            bookedSlots: existingBookings.length,
        }
    });
}));

/**
 * @route   PUT /api/v1/lawyers/profile
 * @desc    Update lawyer profile (own profile)
 * @access  Private/Lawyer
 */
router.put('/profile', authenticate, requireVerifiedLawyer, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { bio, headline, hourlyRate, city, state, address, availability, languages } = req.body;

    const lawyer = await prisma.lawyer.update({
        where: { userId: req.user.id },
        data: {
            bio: bio !== undefined ? bio : undefined,
            headline: headline !== undefined ? headline : undefined,
            hourlyRate: hourlyRate !== undefined ? hourlyRate : undefined,
            city: city !== undefined ? city : undefined,
            state: state !== undefined ? state : undefined,
            address: address !== undefined ? address : undefined,
            availability: availability !== undefined ? availability : undefined,
            languages: languages !== undefined ? languages : undefined,
        },
        select: {
            id: true,
            bio: true,
            headline: true,
            hourlyRate: true,
            city: true,
            state: true,
            isAvailable: true,
        },
    });

    return sendSuccess(res, {
        data: lawyer,
        message: 'Profile updated successfully',
    });
}));

/**
 * @route   PUT /api/v1/lawyers/availability
 * @desc    Update lawyer availability status
 * @access  Private/Lawyer
 */
router.put('/availability', authenticate, requireVerifiedLawyer, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();
    const { isAvailable } = req.body;

    const lawyer = await prisma.lawyer.update({
        where: { userId: req.user.id },
        data: { isAvailable: Boolean(isAvailable) },
        select: { id: true, isAvailable: true },
    });

    return sendSuccess(res, {
        data: lawyer,
        message: `Availability ${isAvailable ? 'enabled' : 'disabled'}`,
    });
}));

export default router;
