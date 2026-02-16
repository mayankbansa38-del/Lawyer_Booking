/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - MongoDB Analytics Seeder
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Seeds MongoDB with analytics data (page views, events, search logs,
 * API logs, daily metrics). This script is independent of PostgreSQL
 * seeding — it only needs MongoDB access.
 * 
 * It fetches existing lawyer/user IDs from PostgreSQL via Prisma,
 * then generates realistic analytics data in MongoDB.
 * 
 * Usage: node scripts/seedMongo.js
 * 
 * @module scripts/seedMongo
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// MONGODB SCHEMAS
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
    duration: Number,
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
    duration: Number,
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
// HELPERS
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

const SEARCH_QUERIES = [
    'criminal lawyer', 'divorce attorney', 'property dispute',
    'corporate lawyer', 'tax consultant', 'cyber crime lawyer',
    'family court', 'bail lawyer', 'contract review', 'ip lawyer'
];

const REFERRERS = [
    'google.com', 'bing.com', 'direct', 'facebook.com',
    'twitter.com', 'linkedin.com', 'whatsapp.com'
];

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const OS_LIST = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];

const API_PATHS = [
    '/api/v1/lawyers', '/api/v1/lawyers/featured', '/api/v1/auth/login',
    '/api/v1/bookings', '/api/v1/reviews', '/api/v1/practice-areas'
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEEDING LOGIC
// ═══════════════════════════════════════════════════════════════════════════

async function seedMongo() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  MongoDB Analytics Seeder');
    console.log('═══════════════════════════════════════════════════');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI not set in .env — aborting.');
        process.exit(1);
    }

    // Step 1: Fetch existing IDs from PostgreSQL
    console.log('\n[1/4] Fetching existing user/lawyer IDs from PostgreSQL...');
    const prisma = new PrismaClient();
    let userIds = [];
    let lawyerIds = [];

    try {
        const users = await prisma.user.findMany({
            where: { role: 'USER', isActive: true },
            select: { id: true },
            take: 20,
        });
        userIds = users.map(u => u.id);

        const lawyers = await prisma.lawyer.findMany({
            where: { verificationStatus: 'VERIFIED' },
            select: { id: true },
            take: 20,
        });
        lawyerIds = lawyers.map(l => l.id);
    } catch (err) {
        console.warn('  Could not fetch from PostgreSQL:', err.message);
        console.warn('  Using placeholder IDs for analytics data.');
        userIds = ['user-placeholder-1', 'user-placeholder-2'];
        lawyerIds = ['lawyer-placeholder-1'];
    } finally {
        await prisma.$disconnect();
    }

    console.log(`  Found ${userIds.length} users, ${lawyerIds.length} lawyers.`);

    if (lawyerIds.length === 0) {
        console.warn('  No lawyers found. Run `npm run seed:pg` first.');
        lawyerIds = ['lawyer-fallback'];
    }

    // Step 2: Connect to MongoDB
    console.log('\n[2/4] Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        family: 4,
    });
    console.log('  Connected.');

    // Register models
    const PageView = mongoose.connection.model('PageView', pageViewSchema);
    const Event = mongoose.connection.model('Event', eventSchema);
    const SearchLog = mongoose.connection.model('SearchLog', searchLogSchema);
    const ApiLog = mongoose.connection.model('ApiLog', apiLogSchema);
    const DailyMetrics = mongoose.connection.model('DailyMetrics', dailyMetricsSchema);

    // Step 3: Clear existing analytics
    console.log('\n[3/4] Clearing existing analytics data...');
    await Promise.all([
        PageView.deleteMany({}),
        Event.deleteMany({}),
        SearchLog.deleteMany({}),
        ApiLog.deleteMany({}),
        DailyMetrics.deleteMany({}),
    ]);
    console.log('  Cleared.');

    // Step 4: Generate analytics
    console.log('\n[4/4] Generating analytics data (180 days)...');

    const pageViews = [];
    const events = [];
    const searchLogs = [];
    const apiLogs = [];
    const dailyMetrics = [];
    const today = new Date();

    for (let i = 180; i >= 0; i--) {
        const date = subDays(today, i);
        const trendFactor = 0.2 + (0.8 * (180 - i) / 180);
        const dailyViews = Math.floor(getRandomInt(5, 25) * trendFactor);
        const dailyUnique = Math.floor(dailyViews * 0.6);

        // Page Views
        for (let j = 0; j < dailyViews; j++) {
            const lawyerId = getRandomElement(lawyerIds);
            const path = Math.random() > 0.3
                ? `/lawyer/${lawyerId}`
                : getRandomElement(['/lawyers', '/', '/about', '/contact']);

            pageViews.push({
                userId: Math.random() > 0.4 ? getRandomElement(userIds) : null,
                sessionId: `sess_${Date.now()}_${i}_${j}`,
                path,
                referrer: getRandomElement(REFERRERS),
                device: getRandomElement(['desktop', 'mobile', 'tablet']),
                browser: getRandomElement(BROWSERS),
                os: getRandomElement(OS_LIST),
                duration: getRandomInt(5, 300),
                timestamp: new Date(date.getTime() + getRandomInt(0, 86400000)),
            });

            // Conversion events (30% click booking)
            if (Math.random() > 0.7) {
                events.push({
                    userId: getRandomElement(userIds),
                    sessionId: `sess_${Date.now()}_${i}_${j}`,
                    event: 'book_button_click',
                    category: 'conversion',
                    properties: { lawyerId },
                    timestamp: new Date(date.getTime() + getRandomInt(0, 86400000)),
                });
            }
        }

        // Search Logs (2-8 per day)
        const dailySearches = Math.floor(getRandomInt(2, 8) * trendFactor);
        for (let j = 0; j < dailySearches; j++) {
            searchLogs.push({
                userId: getRandomElement(userIds),
                query: getRandomElement(SEARCH_QUERIES),
                filters: { city: getRandomElement(['Mumbai', 'Delhi', 'Bangalore', 'Chennai']) },
                resultsCount: getRandomInt(1, 20),
                selectedResultId: Math.random() > 0.5 ? getRandomElement(lawyerIds) : null,
                selectedResultPosition: getRandomInt(1, 5),
                timestamp: new Date(date.getTime() + getRandomInt(0, 86400000)),
            });
        }

        // API Logs (10-50 per day)
        const dailyApiCalls = Math.floor(getRandomInt(10, 50) * trendFactor);
        for (let j = 0; j < dailyApiCalls; j++) {
            apiLogs.push({
                requestId: `req_${Date.now()}_${i}_${j}`,
                userId: Math.random() > 0.5 ? getRandomElement(userIds) : null,
                method: getRandomElement(['GET', 'GET', 'GET', 'POST', 'PUT']),
                path: getRandomElement(API_PATHS),
                statusCode: getRandomElement([200, 200, 200, 200, 201, 400, 401, 500]),
                duration: getRandomInt(20, 800),
                timestamp: new Date(date.getTime() + getRandomInt(0, 86400000)),
            });
        }

        // Daily Metrics summary
        const bookingsCreated = Math.floor(getRandomInt(0, 5) * trendFactor);
        const bookingsCompleted = Math.floor(bookingsCreated * 0.7);
        dailyMetrics.push({
            date,
            pageViews: dailyViews,
            uniqueVisitors: dailyUnique,
            newUsers: Math.floor(getRandomInt(0, 3) * trendFactor),
            bookingsCreated,
            bookingsCompleted,
            revenue: bookingsCompleted * getRandomInt(1500, 5000),
            averageSessionDuration: getRandomInt(30, 180),
            topPages: [
                { path: '/lawyers', views: Math.floor(dailyViews * 0.4) },
                { path: '/', views: Math.floor(dailyViews * 0.3) },
            ],
            topLawyers: lawyerIds.slice(0, 3).map(id => ({
                lawyerId: id,
                bookings: getRandomInt(0, 3),
            })),
            conversionRate: Math.random() * 0.15,
        });
    }

    // Batch insert
    const BATCH_SIZE = 1000;
    for (let i = 0; i < pageViews.length; i += BATCH_SIZE) {
        await PageView.insertMany(pageViews.slice(i, i + BATCH_SIZE));
    }
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
        await Event.insertMany(events.slice(i, i + BATCH_SIZE));
    }
    await SearchLog.insertMany(searchLogs);
    await ApiLog.insertMany(apiLogs);
    await DailyMetrics.insertMany(dailyMetrics);

    console.log(`\n  Page Views:     ${pageViews.length}`);
    console.log(`  Events:         ${events.length}`);
    console.log(`  Search Logs:    ${searchLogs.length}`);
    console.log(`  API Logs:       ${apiLogs.length}`);
    console.log(`  Daily Metrics:  ${dailyMetrics.length}`);
    console.log('\nMongoDB analytics seeding complete!');

    await mongoose.connection.close();
}

seedMongo().catch(err => {
    console.error('MongoDB seeding failed:', err);
    process.exit(1);
});
