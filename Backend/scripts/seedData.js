
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import {
    connectAllDatabases,
    disconnectAllDatabases,
    getPrismaClient,
    getMongoConnection
} from '../src/config/database.js';
import { USER_ROLES as ROLES, BOOKING_STATUS } from '../src/config/constants.js';

// Load environment variables
dotenv.config();

const prisma = getPrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// MONGODB SCHEMAS (Copied from src/modules/analytics/service.js)
// ═══════════════════════════════════════════════════════════════════════════

const pageViewSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    sessionId: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    referrer: String,
    userAgent: String,
    ip: String,
    country: String,
    city: String,
    device: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String,
    os: String,
    duration: Number, // seconds
    timestamp: { type: Date, default: Date.now, index: true },
});

const eventSchema = new mongoose.Schema({
    userId: { type: String, index: true },
    sessionId: String,
    event: { type: String, required: true, index: true },
    category: { type: String, index: true },
    properties: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now, index: true },
});

const searchLogSchema = new mongoose.Schema({
    userId: String,
    query: { type: String, required: true },
    filters: mongoose.Schema.Types.Mixed,
    resultsCount: Number,
    selectedResultId: String,
    selectedResultPosition: Number,
    timestamp: { type: Date, default: Date.now, index: true },
});

const apiLogSchema = new mongoose.Schema({
    requestId: String,
    userId: String,
    method: { type: String, required: true },
    path: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    duration: Number, // milliseconds
    ip: String,
    userAgent: String,
    error: String,
    timestamp: { type: Date, default: Date.now, index: true },
});

const dailyMetricsSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true, index: true },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    newUsers: { type: Number, default: 0 },
    bookingsCreated: { type: Number, default: 0 },
    bookingsCompleted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 },
    topPages: [{ path: String, views: Number }],
    topLawyers: [{ lawyerId: String, bookings: Number }],
    conversionRate: { type: Number, default: 0 },
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function subDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEEDING LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function seed() {
    console.log('Starting database seeding...');

    try {
        await connectAllDatabases();
        const mongoConn = getMongoConnection();

        // Register models
        const PageView = mongoConn.model('PageView', pageViewSchema);
        const Event = mongoConn.model('Event', eventSchema);
        const SearchLog = mongoConn.model('SearchLog', searchLogSchema);
        const ApiLog = mongoConn.model('ApiLog', apiLogSchema);
        const DailyMetrics = mongoConn.model('DailyMetrics', dailyMetricsSchema);

        // 1. CLEAR EXISTING DATA
        console.log('🧹 Clearing existing data...');

        // Clear Mongo
        await Promise.all([
            PageView.deleteMany({}),
            Event.deleteMany({}),
            SearchLog.deleteMany({}),
            ApiLog.deleteMany({}),
            DailyMetrics.deleteMany({}),
        ]);
        console.log('   - MongoDB cleared');

        // Clear Postgres (Order matters due to foreign keys)
        await prisma.notification.deleteMany({});
        await prisma.document.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.lawyer.deleteMany({});
        await prisma.user.deleteMany({});
        console.log('   - PostgreSQL cleared');

        // 2. CREATE CLIENT USERS
        console.log('👥 Creating client users...');
        const clientUsers = [];
        const passwordHash = await bcrypt.hash('password123', 10);

        const clientsData = [
            { name: 'Amit Kumar', email: 'amit@example.com' },
            { name: 'Priya Singh', email: 'priya@example.com' },
            { name: 'Rohan Gupta', email: 'rohan@example.com' },
            { name: 'Sneha Patel', email: 'sneha@example.com' },
            { name: 'Vikram Malhotra', email: 'vikram@example.com' }
        ];

        for (const client of clientsData) {
            const [firstName, lastName] = client.name.split(' ');
            const user = await prisma.user.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: client.email,
                    password: passwordHash,
                    role: ROLES.USER,
                    isEmailVerified: true,
                    isActive: true
                }
            });
            clientUsers.push(user);
        }
        console.log(`   - Created ${clientUsers.length} client users`);

        // 2a. CREATE PRACTICE AREAS
        console.log('📚 Creating practice areas...');
        const practiceAreasData = [
            { name: 'Criminal Defense', slug: 'criminal-defense' },
            { name: 'Family Law', slug: 'family-law' },
            { name: 'Corporate Law', slug: 'corporate-law' },
            { name: 'Property Dispute', slug: 'property-dispute' },
            { name: 'Cyber Crime', slug: 'cyber-crime' }
        ];

        const practiceAreas = [];
        for (const area of practiceAreasData) {
            const pa = await prisma.practiceArea.upsert({
                where: { slug: area.slug },
                update: {},
                create: {
                    name: area.name,
                    slug: area.slug,
                    description: `Legal services related to ${area.name}`,
                    isActive: true
                }
            });
            practiceAreas.push(pa);
        }
        console.log(`   - Created/Found ${practiceAreas.length} practice areas`);

        // 3. CREATE PRIMARY LAWYER (Rahul Sharma)
        console.log('👨‍⚖️ Creating primary lawyer...');
        const lawyerUser = await prisma.user.create({
            data: {
                firstName: 'Rahul',
                lastName: 'Sharma',
                email: 'rahul@nyay.com',
                password: passwordHash,
                role: ROLES.LAWYER,
                isEmailVerified: true,
                isActive: true,
                lawyer: {
                    create: {
                        experience: 12,
                        hourlyRate: 2500, // ₹2500/hr
                        bio: 'Senior advocate with over 12 years of experience in High Court. Specialized in criminal defense and complex family disputes.',
                        barCouncilId: 'MAH/1234/2012',
                        barCouncilState: 'Maharashtra',
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        enrollmentYear: 2012,
                        availability: {
                            mon: ['10:00-18:00'],
                            tue: ['10:00-18:00'],
                            wed: ['10:00-18:00'],
                            thu: ['10:00-18:00'],
                            fri: ['10:00-18:00']
                        },
                        verificationStatus: 'VERIFIED',
                        averageRating: 4.8,
                        totalReviews: 0,
                        specializations: {
                            create: [
                                { practiceAreaId: practiceAreas[0].id, isPrimary: true, yearsExperience: 12 },
                                { practiceAreaId: practiceAreas[1].id, isPrimary: false, yearsExperience: 8 }
                            ]
                        }
                    }
                }
            },
            include: {
                lawyer: true
            }
        });
        const lawyerId = lawyerUser.lawyer.id;
        console.log(`   - Created Lawyer: ${lawyerUser.firstName} ${lawyerUser.lastName} (${lawyerUser.email})`);

        // 4. CREATE PAST & FUTURE BOOKINGS + REVIEWS + PAYMENTS
        console.log('📅 Creating bookings, payments, and reviews...');
        const bookings = [];
        let totalEarnings = 0;
        let reviewCount = 0;
        let totalRating = 0;

        // Generate 50 bookings over the last 6 months and next 1 month
        for (let i = 0; i < 50; i++) {
            const isPast = Math.random() > 0.3; // 70% past bookings
            const client = getRandomElement(clientUsers);

            let bookingDate;
            let status;

            if (isPast) {
                // Booking in the last 180 days
                bookingDate = subDays(new Date(), getRandomInt(1, 180));
                status = Math.random() > 0.1 ? BOOKING_STATUS.COMPLETED : BOOKING_STATUS.CANCELLED;
            } else {
                // Booking in the future
                bookingDate = subDays(new Date(), -getRandomInt(1, 30)); // Negative days = future
                status = Math.random() > 0.5 ? BOOKING_STATUS.CONFIRMED : BOOKING_STATUS.PENDING;
            }

            // Create Booking
            const booking = await prisma.booking.create({
                data: {
                    bookingNumber: `BK${Date.now()}${i}`,
                    clientId: client.id,
                    lawyerId: lawyerId,
                    scheduledDate: bookingDate,
                    scheduledTime: '14:00', // Simplified
                    duration: 60,
                    status: status,
                    amount: 2500,
                    clientNotes: 'Legal consultation regarding property dispute.'
                }
            });

            // If Completed, Create Payment and maybe Review
            if (status === BOOKING_STATUS.COMPLETED) {
                // Payment
                await prisma.payment.create({
                    data: {
                        bookingId: booking.id,
                        amount: 2500,
                        status: 'COMPLETED', // Use PaymentStatus enum string if possible, or mapping
                        method: 'UPI', // Use PaymentMethod enum string
                        gatewayPaymentId: `TXN${Date.now()}${i}`,
                        createdAt: bookingDate
                    }
                });
                totalEarnings += 2500;

                // Review (60% chance)
                if (Math.random() > 0.4) {
                    const rating = getRandomInt(4, 5); // Mostly good ratings
                    await prisma.review.create({
                        data: {
                            bookingId: booking.id,
                            authorId: client.id,
                            lawyerId: lawyerId,
                            rating: rating,
                            content: getRandomElement([
                                'Excellent advice, very helpful.',
                                'Professional and knowledgeable.',
                                'Solved my issue quickly.',
                                'Highly recommended advocate.',
                                'Great experience.'
                            ]),
                            createdAt: subDays(bookingDate, -1) // Reviewed 1 day later
                        }
                    });
                    reviewCount++;
                    totalRating += rating;
                }
            }
        }

        // Update Lawyer Stats
        if (reviewCount > 0) {
            await prisma.lawyer.update({
                where: { id: lawyerId },
                data: {
                    averageRating: totalRating / reviewCount,
                    totalReviews: reviewCount
                }
            });
        }
        console.log(`   - Created Bookings & Reviews. Total Earnings: ₹${totalEarnings}`);


        // 5. GENERATE ANALYTICS DATA (MongoDB)
        console.log('Generating analytics data...');

        const analyticsData = [];
        const eventsData = [];
        const today = new Date();

        // Loop over last 6 months (180 days)
        for (let i = 180; i >= 0; i--) {
            const date = subDays(today, i);

            // Base traffic + trend factor (older dates have less traffic)
            // Trend: 0.2 at 180 days ago -> 1.0 at today
            const trendFactor = 0.2 + (0.8 * (180 - i) / 180);

            // Daily Page Views: Random base * trend
            const dailyViews = Math.floor(getRandomInt(5, 20) * trendFactor);

            for (let j = 0; j < dailyViews; j++) {
                // Page View
                analyticsData.push({
                    userId: getRandomElement(clientUsers).id, // Sometimes logged in
                    sessionId: `sess_${Date.now()}_${i}_${j}`,
                    path: `/lawyer/${lawyerId}`,
                    referrer: 'google.com',
                    device: getRandomElement(['desktop', 'mobile']),
                    timestamp: new Date(date.getTime() + getRandomInt(0, 86400000)) // Random time in day
                });

                // Events (Conversion: View -> Click Book)
                if (Math.random() > 0.7) { // 30% click booking
                    eventsData.push({
                        userId: getRandomElement(clientUsers).id,
                        sessionId: `sess_${Date.now()}_${i}_${j}`,
                        event: 'book_button_click',
                        category: 'conversion',
                        properties: { lawyerId: lawyerId },
                        timestamp: new Date(date.getTime() + getRandomInt(0, 86400000))
                    });
                }
            }
        }

        // Insert in batches
        await PageView.insertMany(analyticsData);
        await Event.insertMany(eventsData);

        console.log(`   - Generated ${analyticsData.length} page views`);
        console.log(`   - Generated ${eventsData.length} events`);

        console.log('Seeding completed successfully!');

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await disconnectAllDatabases();
    }
}

// Run seeding
seed();
