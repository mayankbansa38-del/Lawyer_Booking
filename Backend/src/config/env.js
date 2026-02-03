/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Environment Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Centralized environment variable management with validation.
 * All environment variables should be accessed through this module.
 * 
 * @module config/env
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Environment configuration object
 * All environment variables are validated on startup
 */
const env = {
    // ─────────────────────────────────────────────────────────────────────────
    // Server Configuration
    // ─────────────────────────────────────────────────────────────────────────
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 5000,
    API_VERSION: process.env.API_VERSION || 'v1',

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

    // ─────────────────────────────────────────────────────────────────────────
    // Database - Neon PostgreSQL
    // ─────────────────────────────────────────────────────────────────────────
    DATABASE_URL: process.env.DATABASE_URL || '',

    // ─────────────────────────────────────────────────────────────────────────
    // Database - MongoDB
    // ─────────────────────────────────────────────────────────────────────────
    MONGODB_URI: process.env.MONGODB_URI || '',

    // ─────────────────────────────────────────────────────────────────────────
    // Supabase Storage
    // ─────────────────────────────────────────────────────────────────────────
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
    SUPABASE_BUCKET_DOCUMENTS: process.env.SUPABASE_BUCKET_DOCUMENTS || 'documents',
    SUPABASE_BUCKET_AVATARS: process.env.SUPABASE_BUCKET_AVATARS || 'avatars',

    // ─────────────────────────────────────────────────────────────────────────
    // JWT Authentication
    // ─────────────────────────────────────────────────────────────────────────
    JWT_SECRET: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

    // ─────────────────────────────────────────────────────────────────────────
    // Google OAuth
    // ─────────────────────────────────────────────────────────────────────────
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

    // ─────────────────────────────────────────────────────────────────────────
    // Email Configuration
    // ─────────────────────────────────────────────────────────────────────────
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    EMAIL_FROM: process.env.EMAIL_FROM || 'NyayBooker <noreply@nyaybooker.com>',

    // ─────────────────────────────────────────────────────────────────────────
    // Payment Gateway
    // ─────────────────────────────────────────────────────────────────────────
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',

    // ─────────────────────────────────────────────────────────────────────────
    // Rate Limiting
    // ─────────────────────────────────────────────────────────────────────────
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

    // ─────────────────────────────────────────────────────────────────────────
    // Frontend URL
    // ─────────────────────────────────────────────────────────────────────────
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // ─────────────────────────────────────────────────────────────────────────
    // Logging
    // ─────────────────────────────────────────────────────────────────────────
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};

/**
 * Required environment variables for production
 */
const requiredInProduction = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
];

/**
 * Validate environment variables
 * Throws an error if required variables are missing in production
 */
function validateEnv() {
    if (env.isProduction) {
        const missing = requiredInProduction.filter(key => !env[key]);

        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables in production: ${missing.join(', ')}`
            );
        }
    }

    // Validate PORT is a valid number
    if (isNaN(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
        throw new Error('PORT must be a valid port number (1-65535)');
    }

    // Warn about default secrets in development
    if (env.isDevelopment) {
        if (env.JWT_SECRET.includes('default')) {
            console.warn('⚠️  Using default JWT_SECRET. Set a secure secret in .env');
        }
    }
}

// Validate on module load
validateEnv();

export default env;
