/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Database Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Manages connections to:
 * - Neon PostgreSQL (via Prisma)
 * - MongoDB (via Mongoose)
 * 
 * Uses singleton pattern for efficient connection management.
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
 * Prisma Client singleton instance
 * Reuses the same instance across the application for connection efficiency
 */
let prisma = null;

/**
 * Get or create Prisma client instance
 * @returns {PrismaClient} Prisma client instance
 */
export function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient({
            log: env.isDevelopment
                ? [
                    { level: 'query', emit: 'event' },
                    { level: 'error', emit: 'stdout' },
                    { level: 'warn', emit: 'stdout' },
                ]
                : [{ level: 'error', emit: 'stdout' }],

            // Connection pool settings for Neon
            datasources: {
                db: {
                    url: env.DATABASE_URL,
                },
            },
        });

        // Log queries in development
        if (env.isDevelopment) {
            prisma.$on('query', (e) => {
                logger.debug(`Query: ${e.query}`, {
                    duration: `${e.duration}ms`,
                    params: e.params,
                });
            });
        }


    }

    return prisma;
}

/**
 * Connect to PostgreSQL database via Prisma
 * @returns {Promise<void>}
 */
export async function connectPrisma() {
    try {
        const client = getPrismaClient();
        await client.$connect();
        logger.info('✅ Connected to Neon PostgreSQL via Prisma');
    } catch (error) {
        logger.error('❌ Failed to connect to PostgreSQL:', error);
        throw error;
    }
}

/**
 * Disconnect Prisma client
 * @returns {Promise<void>}
 */
export async function disconnectPrisma() {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
        logger.info('Disconnected from PostgreSQL');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MONGOOSE (MongoDB)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MongoDB connection options
 */
const mongooseOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
};

/**
 * Connect to MongoDB
 * @returns {Promise<typeof mongoose>}
 */
export async function connectMongoDB() {
    if (!env.MONGODB_URI) {
        logger.warn('⚠️  MONGODB_URI not set, skipping MongoDB connection');
        return null;
    }

    try {
        // Set up connection event handlers
        mongoose.connection.on('connected', () => {
            logger.info('✅ Connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            logger.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        // Connect to MongoDB
        await mongoose.connect(env.MONGODB_URI, mongooseOptions);

        return mongoose;
    } catch (error) {
        logger.error('❌ Failed to connect to MongoDB:', error);
        throw error;
    }
}

/**
 * Get active MongoDB connection
 * @returns {mongoose.Connection} Mongoose connection
 */
export function getMongoConnection() {
    return mongoose.connection;
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export async function disconnectMongoDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('Disconnected from MongoDB');
    }
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

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED DATABASE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Connect to all databases
 * @returns {Promise<void>}
 */
export async function connectAllDatabases() {
    logger.info('Connecting to databases...');

    const connections = await Promise.allSettled([
        connectPrisma(),
        connectMongoDB(),
    ]);

    // Check for failures
    const failures = connections.filter(c => c.status === 'rejected');

    if (failures.length > 0) {
        failures.forEach(f => logger.error('Database connection failed:', f.reason));

        // Only throw if Prisma (primary DB) failed
        if (connections[0].status === 'rejected') {
            throw new Error('Primary database (PostgreSQL) connection failed');
        }
    }

    logger.info('Database connections established');
}

/**
 * Disconnect from all databases
 * @returns {Promise<void>}
 */
export async function disconnectAllDatabases() {
    logger.info('Disconnecting from databases...');

    await Promise.allSettled([
        disconnectPrisma(),
        disconnectMongoDB(),
    ]);

    logger.info('All database connections closed');
}

/**
 * Check database health
 * @returns {Promise<Object>} Health status of all databases
 */
export async function checkDatabaseHealth() {
    const health = {
        postgresql: { status: 'unknown', latency: null },
        mongodb: { status: 'unknown', latency: null },
    };

    // Check PostgreSQL
    try {
        const start = Date.now();
        await getPrismaClient().$queryRaw`SELECT 1`;
        health.postgresql = {
            status: 'healthy',
            latency: `${Date.now() - start}ms`,
        };
    } catch (error) {
        health.postgresql = {
            status: 'unhealthy',
            error: error.message,
        };
    }

    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
        try {
            const start = Date.now();
            await mongoose.connection.db.admin().ping();
            health.mongodb = {
                status: 'healthy',
                latency: `${Date.now() - start}ms`,
            };
        } catch (error) {
            health.mongodb = {
                status: 'unhealthy',
                error: error.message,
            };
        }
    } else {
        health.mongodb = {
            status: 'disconnected',
        };
    }

    return health;
}

// Export Prisma client for direct use
export { prisma };

export default {
    getPrismaClient,
    connectPrisma,
    disconnectPrisma,
    connectMongoDB,
    disconnectMongoDB,
    connectAllDatabases,
    disconnectAllDatabases,
    checkDatabaseHealth,
    getMongoDBStatus,
    getMongoConnection,
};
