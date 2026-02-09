/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Health Check Routes - Kubernetes/Docker Ready
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Implements 12-Factor "Disposability" health checks:
 *   /health/live  - Is the process alive? (Liveness probe)
 *   /health/ready - Is the app ready to serve traffic? (Readiness probe)
 * 
 * @module routes/health
 */

import express from 'express';
import env from '../config/env.js';
import { prisma } from '../config/database.js';

const router = express.Router();

/**
 * Liveness probe - Is the process alive?
 * Returns 200 if the process is running.
 * Use for Kubernetes livenessProbe.
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

/**
 * Readiness probe - Is the app ready to serve traffic?
 * Returns 200 if all dependencies (DB, etc.) are connected.
 * Returns 503 if any critical dependency is unavailable.
 * Use for Kubernetes readinessProbe.
 */
router.get('/ready', async (req, res) => {
    const checks = {
        database: { status: 'unknown' },
    };

    try {
        // Check PostgreSQL connectivity
        await prisma.$queryRaw`SELECT 1`;
        checks.database = { status: 'connected' };
    } catch (error) {
        checks.database = {
            status: 'disconnected',
            error: env.isDevelopment ? error.message : 'Connection failed',
        };
    }

    const allHealthy = Object.values(checks).every(c => c.status === 'connected');

    res.status(allHealthy ? 200 : 503).json({
        status: allHealthy ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        checks,
    });
});

/**
 * Legacy /health endpoint for backward compatibility
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        probes: {
            liveness: '/health/live',
            readiness: '/health/ready',
        },
    });
});

export default router;
