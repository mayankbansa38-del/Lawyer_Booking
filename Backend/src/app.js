/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Express Application Setup
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Express app configuration with all middleware and routes.
 * 
 * @module app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { requestLogger, requestId } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Import route modules
import authRoutes from './modules/auth/routes.js';
import userRoutes from './modules/users/routes.js';
import lawyerRoutes from './modules/lawyers/routes.js';
import bookingRoutes from './modules/bookings/routes.js';
import adminRoutes from './modules/admin/routes.js';
import paymentRoutes from './modules/payments/routes.js';
import documentRoutes from './modules/documents/routes.js';
import reviewRoutes from './modules/reviews/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import analyticsRoutes from './modules/analytics/routes.js';
import caseRoutes from './modules/cases/routes.js';
import chatRoutes from './modules/chat/routes.js';
import auditRoutes from './modules/audit/routes.js';
import healthRoutes from './routes/health.js';

/**
 * Create and configure Express application
 * @returns {import('express').Application} Express app
 */
export function createApp() {
    const app = express();

    // ─────────────────────────────────────────────────────────────────────────
    // Trust proxy (for rate limiting behind reverse proxy)
    // ─────────────────────────────────────────────────────────────────────────
    app.set('trust proxy', 1);

    // ─────────────────────────────────────────────────────────────────────────
    // Security Middleware
    // ─────────────────────────────────────────────────────────────────────────

    // Helmet - Security headers
    app.use(helmet({
        contentSecurityPolicy: env.isProduction,
        crossOriginEmbedderPolicy: false,
    }));

    // CORS
    app.use(cors({
        origin: env.FRONTEND_URL.includes(',')
            ? env.FRONTEND_URL.split(',').map(url => url.trim())
            : env.FRONTEND_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // ─────────────────────────────────────────────────────────────────────────
    // Request Processing Middleware
    // ─────────────────────────────────────────────────────────────────────────

    // Request ID
    app.use(requestId);

    // Request logging
    app.use(requestLogger);

    // Body parsing — preserve raw body for webhook signature verification
    app.use(express.json({
        limit: '10mb',
        verify: (req, _res, buf) => {
            // Save raw body buffer for routes that need HMAC verification
            if (req.originalUrl?.includes('/payments/webhook')) {
                req.rawBody = buf;
            }
        },
    }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ─────────────────────────────────────────────────────────────────────────
    // Rate Limiting
    // ─────────────────────────────────────────────────────────────────────────

    // Apply rate limiting to all API routes
    app.use('/api', apiLimiter);

    // ─────────────────────────────────────────────────────────────────────────
    // Health Check Endpoints (/health, /health/live, /health/ready)
    // ─────────────────────────────────────────────────────────────────────────

    app.use('/health', healthRoutes);

    // ─────────────────────────────────────────────────────────────────────────
    // API Routes
    // ─────────────────────────────────────────────────────────────────────────

    const apiPrefix = `/api/${env.API_VERSION}`;

    // Mount route modules
    app.use(`${apiPrefix}/auth`, authRoutes);
    app.use(`${apiPrefix}/users`, userRoutes);
    app.use(`${apiPrefix}/lawyers`, lawyerRoutes);
    app.use(`${apiPrefix}/bookings`, bookingRoutes);
    app.use(`${apiPrefix}/payments`, paymentRoutes);
    app.use(`${apiPrefix}/documents`, documentRoutes);
    app.use(`${apiPrefix}/reviews`, reviewRoutes);
    app.use(`${apiPrefix}/notifications`, notificationRoutes);
    app.use(`${apiPrefix}/analytics`, analyticsRoutes);
    app.use(`${apiPrefix}/cases`, caseRoutes);
    app.use(`${apiPrefix}/chat`, chatRoutes);
    app.use(`${apiPrefix}/audit`, auditRoutes);
    app.use(`${apiPrefix}/admin`, adminRoutes);

    // API info endpoint
    app.get(apiPrefix, (req, res) => {
        res.json({
            name: 'NyayBooker API',
            version: env.API_VERSION,
            description: 'Legal booking platform API',
            documentation: `${env.FRONTEND_URL}/api-docs`,
            endpoints: {
                auth: `${apiPrefix}/auth`,
                users: `${apiPrefix}/users`,
                lawyers: `${apiPrefix}/lawyers`,
                bookings: `${apiPrefix}/bookings`,
                payments: `${apiPrefix}/payments`,
                documents: `${apiPrefix}/documents`,
                reviews: `${apiPrefix}/reviews`,
                notifications: `${apiPrefix}/notifications`,
                analytics: `${apiPrefix}/analytics`,
                cases: `${apiPrefix}/cases`,
                chat: `${apiPrefix}/chat`,
                audit: `${apiPrefix}/audit`,
                admin: `${apiPrefix}/admin`,
            },
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Error Handling
    // ─────────────────────────────────────────────────────────────────────────

    // 404 handler for undefined routes
    app.use(notFoundHandler);

    // Global error handler
    app.use(errorHandler);

    logger.info('Express app configured successfully');

    return app;
}

export default createApp;
