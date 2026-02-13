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
import { getDatabaseHealth } from '../utils/health.js';

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
    try {
        const health = await getDatabaseHealth();
        const isReady = health.overall === 'healthy';

        res.status(isReady ? 200 : 503).json({
            status: isReady ? 'ready' : 'not ready',
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
            version: process.env.npm_package_version || '1.0.0',
            databases: {
                postgresql: {
                    status: health.postgresql.status,
                    latency: health.postgresql.latency,
                    ...(env.isDevelopment && health.postgresql.error && { error: health.postgresql.error }),
                },
                mongodb: {
                    status: health.mongodb.status,
                    latency: health.mongodb.latency,
                    ...(env.isDevelopment && health.mongodb.error && { error: health.mongodb.error }),
                },
            },
        });
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: env.isDevelopment ? error.message : 'Health check failed',
        });
    }
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
