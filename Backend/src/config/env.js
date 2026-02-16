/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Environment Configuration (Zod-validated)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Contract-first environment validation using Zod.
 * Process exits immediately if required variables are missing.
 * 
 * @module config/env
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schema for Environment Variables
// ─────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
    // Server Configuration
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    API_VERSION: z.string().default('v1'),

    // Database - Neon PostgreSQL (Required in production)
    DATABASE_URL: z.string().url().optional().or(z.literal('')),

    // Database - MongoDB (Optional - for analytics)
    MONGODB_URI: z.string().optional().default(''),

    // Supabase Storage
    SUPABASE_URL: z.string().url().optional().or(z.literal('')),
    SUPABASE_SERVICE_KEY: z.string().optional().default(''),
    SUPABASE_BUCKET_DOCUMENTS: z.string().default('documents'),
    SUPABASE_BUCKET_AVATARS: z.string().default('avatars'),

    // JWT Authentication (Required in production)
    JWT_SECRET: z.string().min(16).default('default-dev-secret-change-in-production'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(16).default('default-refresh-secret-change-in-production'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().optional().default(''),

    // Email Configuration
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.coerce.number().int().default(587),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    EMAIL_FROM: z.string().default('NyayBooker <noreply@nyaybooker.com>'),

    // Payment Gateway
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(9000000000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(1000000000),

    // Frontend URL
    FRONTEND_URL: z.string().default('http://localhost:5173'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('debug'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Parse and Validate Environment
// ─────────────────────────────────────────────────────────────────────────────

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('FATAL: Environment validation failed');
    console.error('═══════════════════════════════════════════════════════════════');

    for (const issue of parseResult.error.issues) {
        console.error(`  ✗ ${issue.path.join('.')}: ${issue.message}`);
    }

    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Fix the above issues in your .env file and restart.');
    console.error('═══════════════════════════════════════════════════════════════');

    process.exit(1);
}

const parsed = parseResult.data;

// ─────────────────────────────────────────────────────────────────────────────
// Production-specific Validation
// ─────────────────────────────────────────────────────────────────────────────

if (parsed.NODE_ENV === 'production') {
    const criticalErrors = [];

    if (!parsed.DATABASE_URL) {
        criticalErrors.push('DATABASE_URL is required in production');
    }
    if (parsed.JWT_SECRET.includes('default')) {
        criticalErrors.push('JWT_SECRET must not use default value in production');
    }
    if (parsed.JWT_REFRESH_SECRET.includes('default')) {
        criticalErrors.push('JWT_REFRESH_SECRET must not use default value in production');
    }

    if (criticalErrors.length > 0) {
        console.error('═══════════════════════════════════════════════════════════════');
        console.error('FATAL: Production environment check failed');
        console.error('═══════════════════════════════════════════════════════════════');
        criticalErrors.forEach(err => console.error(`  ✗ ${err}`));
        console.error('═══════════════════════════════════════════════════════════════');
        process.exit(1);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported Environment Object with Computed Properties
// ─────────────────────────────────────────────────────────────────────────────

const env = {
    ...parsed,

    // Computed properties
    get isDevelopment() {
        return this.NODE_ENV === 'development';
    },
    get isProduction() {
        return this.NODE_ENV === 'production';
    },
    get isTest() {
        return this.NODE_ENV === 'test';
    },
};

// Development warnings
if (env.isDevelopment) {
    if (env.JWT_SECRET.includes('default')) {
        console.warn('⚠️  Using default JWT_SECRET. Set a secure secret in .env');
    }
}

export default env;
