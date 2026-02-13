/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Database Health Check Utilities
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dedicated diagnostics module for database health monitoring.
 * Used by /health/ready endpoint for Kubernetes readiness probes.
 * 
 * SEPARATION OF CONCERNS:
 * - config/database.js → Configuration (creates clients)
 * - utils/health.js    → Diagnostics (checks health)
 * - routes/health.js   → HTTP endpoints (exposes health)
 * 
 * @module utils/health
 */

import mongoose from 'mongoose';
import { prisma } from '../config/database.js';

/**
 * Check PostgreSQL health via Prisma
 * 
 * Uses SELECT 1 for minimal overhead.
 * Faster than $queryRaw with actual data.
 * 
 * @returns {Promise<Object>} Health status with latency
 */
export async function checkPostgreSQLHealth() {
    const health = {
        status: 'unknown',
        latency: null,
        error: null,
    };

    try {
        const start = Date.now();
        await prisma.$executeRaw`SELECT 1`;
        health.status = 'healthy';
        health.latency = `${Date.now() - start}ms`;
    } catch (error) {
        health.status = 'unhealthy';
        health.error = error.message;
    }

    return health;
}

/**
 * Check MongoDB health
 * 
 * Uses admin().ping() for connectivity test.
 * Only runs if mongoose is connected.
 * 
 * @returns {Promise<Object>} Health status with latency
 */
export async function checkMongoDBHealth() {
    const health = {
        status: 'unknown',
        latency: null,
        error: null,
    };

    // Check connection state first
    if (mongoose.connection.readyState !== 1) {
        health.status = 'disconnected';
        return health;
    }

    try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        health.status = 'healthy';
        health.latency = `${Date.now() - start}ms`;
    } catch (error) {
        health.status = 'unhealthy';
        health.error = error.message;
    }

    return health;
}

/**
 * Check all database health statuses
 * 
 * Used by /health/ready endpoint to determine
 * if the application is ready to serve traffic.
 * 
 * @returns {Promise<Object>} Combined health status
 */
export async function getDatabaseHealth() {
    const [postgresql, mongodb] = await Promise.all([
        checkPostgreSQLHealth(),
        checkMongoDBHealth(),
    ]);

    return {
        postgresql,
        mongodb,
        overall: postgresql.status === 'healthy' && mongodb.status === 'healthy'
            ? 'healthy'
            : 'degraded',
    };
}

export default {
    checkPostgreSQLHealth,
    checkMongoDBHealth,
    getDatabaseHealth,
};
