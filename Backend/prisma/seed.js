/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Database Seeder
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Seeds the database with initial data for development and testing.
 * 
 * Usage: node prisma/seed.js
 * 
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

const PRACTICE_AREAS = [
    { name: 'Criminal Law', slug: 'criminal-law', description: 'Defense and prosecution in criminal cases', icon: 'gavel', displayOrder: 1 },
    { name: 'Family Law', slug: 'family-law', description: 'Divorce, custody, adoption, and family matters', icon: 'family', displayOrder: 2 },
    { name: 'Corporate Law', slug: 'corporate-law', description: 'Business formation, contracts, and compliance', icon: 'business', displayOrder: 3 },
    { name: 'Real Estate Law', slug: 'real-estate-law', description: 'Property transactions and disputes', icon: 'home', displayOrder: 4 },
    { name: 'Intellectual Property', slug: 'intellectual-property', description: 'Patents, trademarks, and copyrights', icon: 'lightbulb', displayOrder: 5 },
    { name: 'Tax Law', slug: 'tax-law', description: 'Tax planning, disputes, and compliance', icon: 'receipt', displayOrder: 6 },
    { name: 'Immigration Law', slug: 'immigration-law', description: 'Visas, citizenship, and immigration matters', icon: 'flight', displayOrder: 7 },
    { name: 'Labor & Employment', slug: 'labor-employment', description: 'Employment contracts and workplace disputes', icon: 'work', displayOrder: 8 },
    { name: 'Civil Litigation', slug: 'civil-litigation', description: 'Civil disputes and lawsuits', icon: 'scale', displayOrder: 9 },
    { name: 'Consumer Protection', slug: 'consumer-protection', description: 'Consumer rights and product liability', icon: 'shield', displayOrder: 10 },
    { name: 'Banking & Finance', slug: 'banking-finance', description: 'Banking regulations and financial disputes', icon: 'account_balance', displayOrder: 11 },
    { name: 'Medical & Healthcare', slug: 'medical-healthcare', description: 'Medical malpractice and healthcare law', icon: 'local_hospital', displayOrder: 12 },
];

const ADMIN_USER = {
    email: 'admin@nyaybooker.com',
    password: 'Admin@123456',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN',
    isEmailVerified: true,
};

const TEST_USERS = [
    { email: 'user1@example.com', password: 'User@123456', firstName: 'Rahul', lastName: 'Sharma', phone: '+919876543210', isEmailVerified: true },
    { email: 'user2@example.com', password: 'User@123456', firstName: 'Priya', lastName: 'Patel', phone: '+919876543211', isEmailVerified: true },
    { email: 'user3@example.com', password: 'User@123456', firstName: 'Amit', lastName: 'Kumar', phone: '+919876543212', isEmailVerified: true },
];

const TEST_LAWYERS = [
    {
        user: {
            email: 'advocate.singh@example.com',
            password: 'Lawyer@123456',
            firstName: 'Vikram',
            lastName: 'Singh',
            phone: '+919876543220',
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'DL/1234/2015',
            barCouncilState: 'Delhi',
            enrollmentYear: 2015,
            bio: 'Experienced criminal defense attorney with over 9 years of practice. Specialized in bail matters, criminal appeals, and white-collar crimes. Successfully represented clients in over 500 cases.',
            headline: 'Senior Criminal Defense Advocate | High Court Practitioner',
            experience: 9,
            hourlyRate: 3000,
            consultationFee: 1500,
            city: 'New Delhi',
            state: 'Delhi',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['criminal-law', 'civil-litigation'],
        },
    },
    {
        user: {
            email: 'advocate.mehra@example.com',
            password: 'Lawyer@123456',
            firstName: 'Anjali',
            lastName: 'Mehra',
            phone: '+919876543221',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'MH/5678/2018',
            barCouncilState: 'Maharashtra',
            enrollmentYear: 2018,
            bio: 'Passionate family law practitioner dedicated to helping families through difficult times. Expertise in divorce, custody, and adoption cases with a compassionate approach.',
            headline: 'Family Law Specialist | Mediator',
            experience: 6,
            hourlyRate: 2500,
            consultationFee: 1000,
            city: 'Mumbai',
            state: 'Maharashtra',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['family-law', 'civil-litigation'],
        },
    },
    {
        user: {
            email: 'advocate.reddy@example.com',
            password: 'Lawyer@123456',
            firstName: 'Suresh',
            lastName: 'Reddy',
            phone: '+919876543222',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'KA/9012/2012',
            barCouncilState: 'Karnataka',
            enrollmentYear: 2012,
            bio: 'Corporate law expert with extensive experience in startups, M&A, and venture capital transactions. Advised over 100 companies from startups to Fortune 500.',
            headline: 'Corporate & Startup Attorney | VC Legal Expert',
            experience: 12,
            hourlyRate: 5000,
            consultationFee: 2500,
            city: 'Bangalore',
            state: 'Karnataka',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            featured: true,
            featuredOrder: 1,
            specializations: ['corporate-law', 'intellectual-property'],
        },
    },
    {
        user: {
            email: 'advocate.gupta@example.com',
            password: 'Lawyer@123456',
            firstName: 'Neha',
            lastName: 'Gupta',
            phone: '+919876543223',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'TN/3456/2016',
            barCouncilState: 'Tamil Nadu',
            enrollmentYear: 2016,
            bio: 'Real estate law specialist with deep knowledge of property registration, title verification, and dispute resolution. Helped clients secure investments worth over ₹500 crores.',
            headline: 'Real Estate & Property Law Expert',
            experience: 8,
            hourlyRate: 2000,
            consultationFee: 800,
            city: 'Chennai',
            state: 'Tamil Nadu',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['real-estate-law', 'banking-finance'],
        },
    },
    {
        user: {
            email: 'advocate.khan@example.com',
            password: 'Lawyer@123456',
            firstName: 'Imran',
            lastName: 'Khan',
            phone: '+919876543224',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'UP/7890/2019',
            barCouncilState: 'Uttar Pradesh',
            enrollmentYear: 2019,
            bio: 'Young and dynamic tax law practitioner. Specializes in GST, income tax disputes, and international taxation. Certified by ICAI.',
            headline: 'Tax Law & GST Consultant',
            experience: 5,
            hourlyRate: 1800,
            consultationFee: 500,
            city: 'Lucknow',
            state: 'Uttar Pradesh',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            specializations: ['tax-law', 'corporate-law'],
        },
    },
    {
        user: {
            email: 'advocate.rao@example.com',
            password: 'Lawyer@123456',
            firstName: 'Lakshmi',
            lastName: 'Rao',
            phone: '+919876543225',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
        },
        lawyer: {
            barCouncilId: 'AP/2345/2010',
            barCouncilState: 'Andhra Pradesh',
            enrollmentYear: 2010,
            bio: 'Immigration law veteran with expertise in US, UK, Canada, and Australia visas. Former consulate consultant with over 14 years of experience.',
            headline: 'Immigration & Visa Specialist | Former Consulate Advisor',
            experience: 14,
            hourlyRate: 4000,
            consultationFee: 2000,
            city: 'Hyderabad',
            state: 'Telangana',
            isAvailable: true,
            verificationStatus: 'VERIFIED',
            featured: true,
            featuredOrder: 2,
            specializations: ['immigration-law'],
        },
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// SEEDING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function seedPracticeAreas() {
    console.log('🌱 Seeding practice areas...');

    for (const area of PRACTICE_AREAS) {
        await prisma.practiceArea.upsert({
            where: { slug: area.slug },
            update: area,
            create: area,
        });
    }

    console.log(`✅ ${PRACTICE_AREAS.length} practice areas seeded`);
}

async function seedAdmin() {
    console.log('🌱 Seeding admin user...');

    const hashedPassword = await hashPassword(ADMIN_USER.password);

    await prisma.user.upsert({
        where: { email: ADMIN_USER.email },
        update: {},
        create: {
            ...ADMIN_USER,
            password: hashedPassword,
        },
    });

    console.log('✅ Admin user seeded');
}

async function seedTestUsers() {
    console.log('🌱 Seeding test users...');

    for (const user of TEST_USERS) {
        const hashedPassword = await hashPassword(user.password);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                ...user,
                password: hashedPassword,
                role: 'USER',
            },
        });
    }

    console.log(`✅ ${TEST_USERS.length} test users seeded`);
}

async function seedTestLawyers() {
    console.log('🌱 Seeding test lawyers...');

    // Get practice areas
    const practiceAreaMap = {};
    const areas = await prisma.practiceArea.findMany();
    areas.forEach(a => { practiceAreaMap[a.slug] = a.id; });

    for (const data of TEST_LAWYERS) {
        const hashedPassword = await hashPassword(data.user.password);

        // Create or update user
        const user = await prisma.user.upsert({
            where: { email: data.user.email },
            update: {
                avatar: data.user.avatar
            },
            create: {
                ...data.user,
                password: hashedPassword,
                role: 'LAWYER',
                isEmailVerified: true,
            },
        });

        // Create or update lawyer
        const lawyer = await prisma.lawyer.upsert({
            where: { userId: user.id },
            update: {
                bio: data.lawyer.bio,
                headline: data.lawyer.headline,
                verificationStatus: data.lawyer.verificationStatus,
                consultationFee: data.lawyer.consultationFee || data.lawyer.hourlyRate,
                featured: data.lawyer.featured,
                featuredOrder: data.lawyer.featuredOrder,
            },
            create: {
                userId: user.id,
                barCouncilId: data.lawyer.barCouncilId,
                barCouncilState: data.lawyer.barCouncilState,
                enrollmentYear: data.lawyer.enrollmentYear,
                bio: data.lawyer.bio,
                headline: data.lawyer.headline,
                experience: data.lawyer.experience,
                hourlyRate: data.lawyer.hourlyRate,
                consultationFee: data.lawyer.consultationFee || data.lawyer.hourlyRate,
                city: data.lawyer.city,
                state: data.lawyer.state,
                isAvailable: data.lawyer.isAvailable,
                verificationStatus: data.lawyer.verificationStatus,
                verifiedAt: data.lawyer.verificationStatus === 'VERIFIED' ? new Date() : null,
                featured: data.lawyer.featured || false,
                featuredOrder: data.lawyer.featuredOrder,
                availability: {
                    monday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    tuesday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    wednesday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    thursday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }, { time: '14:00', duration: 60 }, { time: '15:00', duration: 60 }],
                    friday: [{ time: '09:00', duration: 60 }, { time: '10:00', duration: 60 }],
                    saturday: [],
                    sunday: [],
                },
            },
        });

        // Create specializations
        if (data.lawyer.specializations) {
            for (let i = 0; i < data.lawyer.specializations.length; i++) {
                const slug = data.lawyer.specializations[i];
                const practiceAreaId = practiceAreaMap[slug];

                if (practiceAreaId) {
                    await prisma.lawyerSpecialization.upsert({
                        where: {
                            lawyerId_practiceAreaId: {
                                lawyerId: lawyer.id,
                                practiceAreaId,
                            },
                        },
                        update: {},
                        create: {
                            lawyerId: lawyer.id,
                            practiceAreaId,
                            isPrimary: i === 0,
                            yearsExperience: data.lawyer.experience,
                        },
                    });
                }
            }
        }
    }

    console.log(`✅ ${TEST_LAWYERS.length} test lawyers seeded`);
}

async function seedSampleBookingsAndReviews() {
    console.log('🌱 Seeding sample bookings and reviews...');

    const users = await prisma.user.findMany({ where: { role: 'USER' } });
    const lawyers = await prisma.lawyer.findMany({ where: { verificationStatus: 'VERIFIED' } });

    if (users.length === 0 || lawyers.length === 0) {
        console.log('⏭️ Skipping bookings/reviews - no users or lawyers found');
        return;
    }

    let bookingsCreated = 0;
    let reviewsCreated = 0;

    for (const user of users) {
        // Create 1-2 completed bookings per user
        const numBookings = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < numBookings && i < lawyers.length; i++) {
            const lawyer = lawyers[i % lawyers.length];
            const bookingNumber = `NYB${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // Random date in the past month
            const daysAgo = Math.floor(Math.random() * 30) + 1;
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() - daysAgo);

            const booking = await prisma.booking.create({
                data: {
                    bookingNumber,
                    clientId: user.id,
                    lawyerId: lawyer.id,
                    scheduledDate,
                    scheduledTime: '10:00',
                    duration: 60,
                    meetingType: Math.random() > 0.5 ? 'VIDEO' : 'IN_PERSON',
                    status: 'COMPLETED',
                    amount: lawyer.hourlyRate,
                    confirmedAt: scheduledDate,
                    completedAt: scheduledDate,
                },
            });

            bookingsCreated++;

            // Create payment
            await prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: lawyer.hourlyRate,
                    status: 'COMPLETED',
                    method: 'UPI',
                    gatewayOrderId: `order_${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
                    gatewayPaymentId: `pay_${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
                    processedAt: scheduledDate,
                },
            });

            // Create review (70% chance)
            if (Math.random() > 0.3) {
                const ratings = [4, 4, 4, 5, 5, 5, 5, 3];
                const rating = ratings[Math.floor(Math.random() * ratings.length)];

                const reviewTitles = [
                    'Excellent experience!',
                    'Very helpful consultation',
                    'Professional and knowledgeable',
                    'Highly recommended',
                    'Good advice received',
                    'Great advocate',
                ];

                const reviewContents = [
                    'The advocate was very professional and explained everything clearly. Would definitely recommend.',
                    'Got great legal advice. The consultation was worth every rupee. Very satisfied with the service.',
                    'Very knowledgeable about the subject matter. Answered all my questions patiently.',
                    'Excellent service! The lawyer took time to understand my case thoroughly.',
                    'Professional approach and practical solutions. Happy with the consultation.',
                    'The advocate provided clear guidance on my legal matter. Will consult again if needed.',
                ];

                await prisma.review.create({
                    data: {
                        bookingId: booking.id,
                        authorId: user.id,
                        lawyerId: lawyer.id,
                        rating,
                        title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
                        content: reviewContents[Math.floor(Math.random() * reviewContents.length)],
                        isVerified: true,
                        isPublished: true,
                    },
                });

                reviewsCreated++;
            }
        }
    }

    // Update lawyer ratings
    for (const lawyer of lawyers) {
        const aggregation = await prisma.review.aggregate({
            where: { lawyerId: lawyer.id, isPublished: true },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: {
                averageRating: aggregation._avg.rating || 0,
                totalReviews: aggregation._count.rating || 0,
                completedBookings: { increment: aggregation._count.rating },
            },
        });
    }

    console.log(`✅ ${bookingsCreated} bookings and ${reviewsCreated} reviews seeded`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           NyayBooker Database Seeder                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    try {
        await seedPracticeAreas();
        await seedAdmin();
        await seedTestUsers();
        await seedTestLawyers();
        await seedSampleBookingsAndReviews();

        console.log('');
        console.log('✅ Database seeding completed successfully!');
        console.log('');
        console.log('Test Credentials:');
        console.log('─────────────────');
        console.log('Admin:  admin@nyaybooker.com / Admin@123456');
        console.log('User:   user1@example.com / User@123456');
        console.log('Lawyer: advocate.singh@example.com / Lawyer@123456');
        console.log('');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
