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
/**
 * @route   GET /api/v1/lawyers/profile
 * @desc    Get current updated lawyer profile
 * @access  Private/Lawyer
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    if (req.user.role !== 'LAWYER') {
        throw new ForbiddenError('Access denied. Only lawyers can access this route.');
    }

    const lawyer = await prisma.lawyer.findUnique({
        where: { userId: req.user.id },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatar: true,
                    isEmailVerified: true,
                    createdAt: true
                },
            },
            specializations: {
                include: {
                    practiceArea: true,
                },
                orderBy: { isPrimary: 'desc' },
            },
            qualifications: {
                orderBy: { year: 'desc' },
            },
            reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            },
            blockedPeriods: true,
        },
    });

    if (!lawyer) {
        throw new NotFoundError('Lawyer profile not found');
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
        consultationFee: parseFloat(lawyer.consultationFee) || parseFloat(lawyer.hourlyRate) || 0,
        avgCostPerCase: lawyer.hourlyRate,
        currency: lawyer.currency,
        location: lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state,
        city: lawyer.city,
        state: lawyer.state,
        address: lawyer.address,
        barCouncilId: lawyer.barCouncilId,
        barCouncilState: lawyer.barCouncilState,
        enrollmentYear: lawyer.enrollmentYear,
        languages: lawyer.languages,
        email: lawyer.user.email,
        phone: lawyer.user.phone,
        rating: lawyer.averageRating ? Math.round(lawyer.averageRating * 10) / 10 : 0,
        averageRating: lawyer.averageRating,
        totalReviews: lawyer.totalReviews,
        casesWon: lawyer.completedBookings || 0,
        completedConsultations: lawyer.completedBookings,
        isAvailable: lawyer.isAvailable,
        availability: lawyer.availability || {},
        availabilityStatus: lawyer.isAvailable ? 'Available' : 'Busy',
        blockedPeriods: lawyer.blockedPeriods || [],
        verificationStatus: lawyer.verificationStatus,
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
        createdAt: lawyer.user.createdAt,
    };

    return sendSuccess(res, { data: transformed });
}));

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
        const specs = specialization.split(',');
        where.specializations = {
            some: {
                practiceArea: {
                    slug: { in: specs },
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
        availabilityStatus: lawyer.isAvailable ? 'Available' : 'Busy',
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
        availability: lawyer.availability || {},
        availabilityStatus: 'Available', // Featured are usually available
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
            consultationFee: true,
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
                    email: true,
                    phone: true,
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
            blockedPeriods: true,
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
        consultationFee: parseFloat(lawyer.consultationFee) || parseFloat(lawyer.hourlyRate) || 0,
        avgCostPerCase: lawyer.hourlyRate,
        currency: lawyer.currency,
        location: lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state,
        city: lawyer.city,
        state: lawyer.state,
        barCouncilId: lawyer.barCouncilId,
        barCouncilState: lawyer.barCouncilState,
        enrollmentYear: lawyer.enrollmentYear,
        languages: lawyer.languages,
        email: lawyer.user.email,
        phone: lawyer.user.phone,
        rating: lawyer.averageRating ? Math.round(lawyer.averageRating * 10) / 10 : 0,
        averageRating: lawyer.averageRating,
        totalReviews: lawyer.totalReviews,
        completedConsultations: lawyer.completedBookings,
        isAvailable: lawyer.isAvailable,
        availability: lawyer.availability || {}, // Return actual availability object (schedule)
        availabilityStatus: lawyer.isAvailable ? 'Available' : 'Busy', // New field for status string
        blockedPeriods: lawyer.blockedPeriods || [],
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

    // Date handling
    const targetDateStr = date || new Date().toISOString().split('T')[0];
    const targetDate = new Date(targetDateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch existing bookings AND blocked periods
    const [existingBookings, blockedPeriods] = await Promise.all([
        prisma.booking.findMany({
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
        }),
        prisma.blockedPeriod.findMany({
            where: {
                lawyerId: id,
                // Check for any overlap with the target day
                OR: [
                    {
                        startDate: { lte: endOfDay },
                        endDate: { gte: startOfDay },
                    }
                ]
            },
            select: {
                startDate: true,
                endDate: true,
            }
        })
    ]);

    // Parse availability and generate slots (dynamic)
    const availability = lawyer.availability || {};
    const dayOfWeek = targetDate.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = availability[dayNames[dayOfWeek]];

    let availableSlots = [];

    // Check if day is enabled and has start/end times
    if (daySchedule && (daySchedule.enabled === true || daySchedule.enabled === undefined) && daySchedule.start && daySchedule.end) {
        const start = parseInt(daySchedule.start.split(':')[0]);
        const end = parseInt(daySchedule.end.split(':')[0]);

        // Generate slots
        for (let hour = start; hour < end; hour++) {
            // Basic 60 min slots matching DEFAULT_BOOKING_DURATION
            const time = `${hour.toString().padStart(2, '0')}:00`;
            const slotStart = new Date(startOfDay);
            slotStart.setHours(hour, 0, 0, 0);

            const slotEnd = new Date(startOfDay);
            slotEnd.setHours(hour + 1, 0, 0, 0);

            // 1. Check against Bookings
            // bookedTimes set contains 'HH:MM' strings from DB
            // We'll construct a check later or do it here.
            // Let's rely on string comparison for bookings as before, consistent with existing logic

            // 2. Check against Blocked Periods
            // A slot is blocked if it overlaps with any blocked period
            const isBlocked = blockedPeriods.some(bp => {
                const bpStart = new Date(bp.startDate);
                const bpEnd = new Date(bp.endDate);
                // Overlap condition: (StartA < EndB) && (EndA > StartB)
                return slotStart < bpEnd && slotEnd > bpStart;
            });

            if (!isBlocked) {
                availableSlots.push({
                    time,
                    endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                    available: true
                });
            }
        }
    }

    // Filter booked slots
    // Convert booked times to simple "HH:MM" format for comparison
    const bookedTimeStrings = new Set(existingBookings.map(b => {
        // Assuming scheduledTime is saved as full ISO string or we parse it
        // The previous code did `new Date(b.scheduledTime)`. If it's just "HH:mm" string in DB, this might fail or be weird.
        // Prisma schema says scheduledTime is DateTime.
        // If it's a string like "10:00", `new Date("10:00")` is invalid.
        // It should probably be:
        if (b.scheduledTime.includes('T')) {
            const d = new Date(b.scheduledTime);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }
        return b.scheduledTime.substring(0, 5); // "10:00"
    }));

    availableSlots = availableSlots.filter(slot => !bookedTimeStrings.has(slot.time));

    return sendSuccess(res, {
        data: {
            date: targetDateStr,
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
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    if (req.user.role !== 'LAWYER') {
        throw new ForbiddenError('Access denied. Only lawyers can update their profile.');
    }

    const {
        firstName, lastName, phone, // User fields
        bio, headline, hourlyRate, consultationFee, city, state, address, availability, languages, experience, // Lawyer fields
        specializations // Array of practice area names or slugs
    } = req.body;

    // Use transaction to update all related data
    const updatedLawyer = await prisma.$transaction(async (tx) => {
        // 1. Update User details
        if (firstName || lastName || phone) {
            await tx.user.update({
                where: { id: req.user.id },
                data: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    phone: phone || undefined,
                }
            });
        }

        // 2. Update Lawyer details
        const lawyer = await tx.lawyer.update({
            where: { userId: req.user.id },
            data: {
                bio: bio !== undefined ? bio : undefined,
                headline: headline !== undefined ? headline : undefined,
                hourlyRate: hourlyRate !== undefined ? hourlyRate : undefined,
                consultationFee: consultationFee !== undefined ? consultationFee : undefined,
                city: city !== undefined ? city : undefined,
                state: state !== undefined ? state : undefined,
                address: address !== undefined ? address : undefined,
                availability: availability !== undefined ? availability : undefined,
                languages: languages !== undefined ? languages : undefined,
                experience: experience !== undefined ? parseInt(experience) : undefined,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        });

        // 3. Update Specializations (if provided)
        if (specializations && Array.isArray(specializations)) {
            // Delete existing
            await tx.lawyerSpecialization.deleteMany({
                where: { lawyerId: lawyer.id }
            });

            // Find practice areas
            const practiceAreas = await tx.practiceArea.findMany({
                where: {
                    OR: [
                        { name: { in: specializations, mode: 'insensitive' } },
                        { slug: { in: specializations, mode: 'insensitive' } }
                    ]
                }
            });

            // Create new connections
            if (practiceAreas.length > 0) {
                await tx.lawyerSpecialization.createMany({
                    data: practiceAreas.map((pa, index) => ({
                        lawyerId: lawyer.id,
                        practiceAreaId: pa.id,
                        isPrimary: index === 0 // First one is primary
                    }))
                });
            }
        }

        return lawyer;
    });

    return sendSuccess(res, {
        data: updatedLawyer,
        message: 'Profile updated successfully'
    });
}));

/**
 * @route   PUT /api/v1/lawyers/me/payment-credentials
 * @desc    Update lawyer payment acceptance credentials (bank/UPI)
 * @access  Private/Lawyer
 */
router.put('/me/payment-credentials', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    if (req.user.role !== 'LAWYER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only lawyers can update their payment credentials.',
        });
    }

    const { bankAccountName, bankAccountNumber, bankIfscCode, upiId } = req.body;

    // At least one credential must be provided
    if (!bankAccountName && !bankAccountNumber && !bankIfscCode && !upiId) {
        return res.status(400).json({
            success: false,
            message: 'At least one payment credential field is required',
        });
    }

    const updateData = {};
    if (bankAccountName !== undefined) updateData.bankAccountName = bankAccountName;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankIfscCode !== undefined) updateData.bankIfscCode = bankIfscCode ? bankIfscCode.toUpperCase() : null;
    if (upiId !== undefined) updateData.upiId = upiId;

    const lawyer = await prisma.lawyer.update({
        where: { userId: req.user.id },
        data: updateData,
        select: {
            id: true,
            bankAccountName: true,
            bankAccountNumber: true,
            bankIfscCode: true,
            upiId: true,
        },
    });

    return sendSuccess(res, {
        data: lawyer,
        message: 'Payment credentials updated successfully',
    });
}));

/**
 * @route   PUT /api/v1/lawyers/availability
 * @desc    Update lawyer availability status
 * @access  Private/Lawyer
 */
router.put('/availability', authenticate, asyncHandler(async (req, res) => {

    const prisma = getPrismaClient();

    if (req.user.role !== 'LAWYER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only lawyers can update their availability.',
        });
    }

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

/**
 * @route   POST /api/v1/lawyers/blocked-dates
 * @desc    Add a blocked period
 * @access  Private/Lawyer
 */
router.post('/blocked-dates', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    if (req.user.role !== 'LAWYER') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }


    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure end date covers the full day
    end.setHours(23, 59, 59, 999);


    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format.' });
    }

    if (start > end) {
        return res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
    }

    const lawyer = await prisma.lawyer.findUnique({ where: { userId: req.user.id } });

    const blockedPeriod = await prisma.blockedPeriod.create({
        data: {
            lawyerId: lawyer.id,
            startDate: start,
            endDate: end,
            reason
        }
    });

    return sendSuccess(res, {
        data: blockedPeriod,
        message: 'Blocked period added successfully'
    });
}));

/**
 * @route   DELETE /api/v1/lawyers/blocked-dates/:id
 * @desc    Remove a blocked period
 * @access  Private/Lawyer
 */
router.delete('/blocked-dates/:id', authenticate, asyncHandler(async (req, res) => {
    const prisma = getPrismaClient();

    if (req.user.role !== 'LAWYER') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { id } = req.params;

    const blockedPeriod = await prisma.blockedPeriod.findUnique({
        where: { id },
        include: { lawyer: true }
    });

    if (!blockedPeriod) {
        return res.status(404).json({ success: false, message: 'Blocked period not found.' });
    }

    if (blockedPeriod.lawyer.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to delete this blocked period.' });
    }

    await prisma.blockedPeriod.delete({ where: { id } });

    return sendSuccess(res, {
        message: 'Blocked period removed successfully'
    });
}));

export default router;
