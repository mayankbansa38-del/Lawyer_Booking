/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Auth Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Authentication routes configuration.
 * 
 * @module modules/auth/routes
 */

import { Router } from 'express';
import * as controller from './controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter, passwordResetLimiter, verificationLimiter } from '../../middleware/rateLimiter.js';
import {
    registerSchema,
    registerLawyerSchema,
    loginSchema,
    verifyEmailSchema,
    resendVerificationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema,
} from './validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (No authentication required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post(
    '/register',
    authLimiter,
    validate(registerSchema),
    controller.register
);

/**
 * @route   POST /api/v1/auth/register/lawyer
 * @desc    Register a new lawyer account
 * @access  Public
 */
router.post(
    '/register/lawyer',
    authLimiter,
    validate(registerLawyerSchema),
    controller.registerLawyer
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
    '/login',
    authLimiter,
    validate(loginSchema),
    controller.login
);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Login with Google OAuth
 * @access  Public
 */
router.post(
    '/google',
    authLimiter,
    controller.googleLogin
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address with token
 * @access  Public
 */
router.post(
    '/verify-email',
    validate(verifyEmailSchema),
    controller.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post(
    '/resend-verification',
    verificationLimiter,
    validate(resendVerificationSchema),
    controller.resendVerification
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
    '/forgot-password',
    passwordResetLimiter,
    validate(forgotPasswordSchema),
    controller.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
    '/reset-password',
    passwordResetLimiter,
    validate(resetPasswordSchema),
    controller.resetPassword
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh',
    validate(refreshTokenSchema),
    controller.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout (revoke refresh token)
 * @access  Public
 */
router.post(
    '/logout',
    controller.logout
);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES (Authentication required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
    '/me',
    authenticate,
    controller.me
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.post(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    controller.changePassword
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
    '/logout-all',
    authenticate,
    controller.logoutAll
);

export default router;
