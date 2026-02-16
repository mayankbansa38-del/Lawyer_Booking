/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Database Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pure configuration module for database clients.
 * 
 * ARCHITECTURE:
 * - Creates and exports database client singletons
 * - NO lifecycle management (no process.on, no retries)
 * - NO diagnostics (health checks live in utils/health.js)
 * - Follows Single Responsibility Principle
 * 
 * Lifecycle management (connect/disconnect/signals) → server.js
 * Health checks → utils/health.js
 * 
 * @module config/database
 */

import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

// ═══════════════════════════════════════════════════════════════════════════
// PRISMA CLIENT (Neon PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PERFORMANCE OPTIMIZATION NOTES:
 * 
 * 1. CONNECTION STRING (CRITICAL):
 *    Use Neon's POOLING connection string, NOT direct:
 *    ❌ postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db
 *    ✅ postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/db?pgbouncer=true
 *    
 *    The pooler URL reduces connection overhead and prevents "DEALLOCATE ALL" spam.
 * 
 * 2. BATCHING (Reduce Network Round-Trips):
 *    Instead of:
 *      const users = await prisma.user.findMany();
 *      const lawyers = await prisma.lawyer.findMany();
 *      const bookings = await prisma.booking.findMany();
 *    
 *    Use $transaction to batch:
 *      const [users, lawyers, bookings] = await prisma.$transaction([
 *        prisma.user.findMany(),
 *        prisma.lawyer.findMany(),
 *        prisma.booking.findMany(),
 *      ]);
 *    
 *    This cuts latency by 3x (one round-trip instead of three).
 * 
 * 3. GEOGRAPHIC LATENCY:
 *    - If developing locally in India and DB is in us-east-1 → 500ms ping
 *    - Solution: Use local PostgreSQL for dev (docker run postgres)
 *    - Production: Ensure DB region matches app region
 */

/**
 * Global Prisma singleton pattern
 * Prevents multiple instances in:
 * - Dev environments with HMR (Hot Module Reloading)
 * - Serverless environments (Lambda/Vercel)
 * 
 * This is the industry-standard pattern from Prisma docs.
 */
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
    log: env.isDevelopment
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ]
        : [{ level: 'error', emit: 'stdout' }],

    datasources: {
        db: {
            url: env.DATABASE_URL,
        },
    },

    // NOTE: transactionOptions CANNOT be set globally in the constructor.
    // Set them per-transaction instead:
    // await prisma.$transaction([...], { maxWait: 5000, timeout: 10000 })
});

// Development query logging - ONLY slow queries to reduce noise
if (env.isDevelopment) {
    prisma.$on('query', (e) => {
        // Only log queries that take longer than 100ms (performance issues)
        // Filters out noisy DEALLOCATE ALL, COMMIT, BEGIN statements
        const SLOW_QUERY_THRESHOLD_MS = 100;

        if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
            logger.warn(`🐌 Slow Query Detected (${e.duration}ms):`, {
                query: e.query,
                params: e.params,
                duration: `${e.duration}ms`,
            });
        }
    });

    // Store in global to prevent multiple instances during HMR
    globalForPrisma.prisma = prisma;
}

// ═══════════════════════════════════════════════════════════════════════════
// MONGOOSE (MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MongoDB connection options
 * 
 * REMOVED: family: 4 (IPv4 forcing)
 * Reason: Band-aid fix. Let DNS resolution work naturally.
 * If you have IPv6 issues in prod, fix at infrastructure level.
 */
export const mongooseOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// Event handlers for MongoDB connection
mongoose.connection.on('connected', () => {
    logger.info('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    logger.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️  MongoDB disconnected');
});

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTION HELPERS (Minimal, No Retry Logic)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Connect to all databases
 * 
 * WHY NO RETRY LOGIC?
 * - Let orchestration layer (Docker/K8s/Systemd) handle restarts
 * - Fail fast on startup if DB is unreachable
 * - Retry loops mask infrastructure problems
 * 
 * If Prisma connection fails here, let it crash.
 * Your container orchestrator will restart it.
 * 
 * @returns {Promise<void>}
 */
export async function connectAllDatabases() {
    logger.info('📡 Connecting to databases...');

    const connections = [];

    // 1. MongoDB (optional)
    if (env.MONGODB_URI) {
        connections.push(
            mongoose.connect(env.MONGODB_URI, mongooseOptions)
        );
    } else {
        logger.warn('⚠️  MONGODB_URI not set, skipping MongoDB');
    }

    // 2. Prisma (PostgreSQL)
    // Explicit $connect() for "fail fast" on startup.
    // Without this, Prisma connects lazily on first query,
    // and you won't know your DB is down until a user tries to log in.
    connections.push(prisma.$connect());

    // Wait for all connections
    await Promise.all(connections);

    logger.info('✅ All databases connected');
}

/**
 * Disconnect from all databases
 * Called during graceful shutdown in server.js
 * 
 * @returns {Promise<void>}
 */
export async function disconnectAllDatabases() {
    logger.info('🔌 Disconnecting from databases...');

    await Promise.all([
        prisma.$disconnect(),
        mongoose.disconnect(),
    ]);

    logger.info('✅ All databases disconnected');
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (For Backward Compatibility)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @deprecated Use `prisma` export directly instead
 * Kept for backward compatibility with existing code
 */
export function getPrismaClient() {
    return prisma;
}

/**
 * @deprecated Use mongoose.connection directly
 * Kept for backward compatibility
 */
export function getMongoConnection() {
    return mongoose.connection;
}

/**
 * Get MongoDB connection status
 * @returns {string} Connection status
 */
export function getMongoDBStatus() {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    return states[mongoose.connection.readyState] || 'unknown';
}

export default {
    prisma,
    getPrismaClient,
    connectAllDatabases,
    disconnectAllDatabases,
    getMongoDBStatus,
    getMongoConnection,
};
