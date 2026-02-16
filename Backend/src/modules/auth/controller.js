/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Backend - Auth Controller
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * HTTP request handlers for authentication endpoints.
 * 
 * @module modules/auth/controller
 */

import * as authService from './service.js';
import * as oauthService from './oauth.js';
import { sendSuccess, sendCreated, asyncHandler } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';

/**
 * Register a new user account
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.registerUser(req.body);

    return sendCreated(res, {
        user,
        ...tokens,
    }, 'Registration successful. Please verify your email.');
});

/**
 * Register a new lawyer account
 * POST /api/v1/auth/register/lawyer
 */
export const registerLawyer = asyncHandler(async (req, res) => {
    const result = await authService.registerLawyer(req.body);

    return sendCreated(res, result, 'Lawyer registration successful. Please verify your email and wait for profile verification.');
});

/**
 * Login with email/username and password
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;

    const { user, tokens } = await authService.loginUser({ email, password, rememberMe });

    return sendSuccess(res, {
        data: { user, ...tokens },
        message: 'Login successful',
    });
});

/**
 * Login with Google OAuth
 * POST /api/v1/auth/google
 */
export const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({
            success: false,
            message: 'Google ID token is required',
        });
    }

    const result = await oauthService.googleLogin(idToken);

    return sendSuccess(res, {
        data: result,
        message: 'Google login successful',
    });
});

/**
 * Verify email with token
 * POST /api/v1/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await authService.verifyEmail(token);

    return sendSuccess(res, {
        data: { user },
        message: 'Email verified successfully',
    });
});

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
export const resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.resendVerificationEmail(email);

    return sendSuccess(res, {
        message: 'If an account exists with this email, a verification link has been sent.',
    });
});

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.forgotPassword(email);

    return sendSuccess(res, {
        message: 'If an account exists with this email, a password reset link has been sent.',
    });
});

/**
 * Reset password with token
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);

    return sendSuccess(res, {
        message: 'Password reset successful. You can now login with your new password.',
    });
});

/**
 * Change password (authenticated)
 * POST /api/v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);

    return sendSuccess(res, {
        message: 'Password changed successfully',
    });
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);

    return sendSuccess(res, {
        data: tokens,
        message: 'Token refreshed successfully',
    });
});

/**
 * Logout (revoke refresh token)
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    return sendSuccess(res, {
        message: 'Logged out successfully',
    });
});

/**
 * Logout from all devices
 * POST /api/v1/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);

    return sendSuccess(res, {
        message: 'Logged out from all devices successfully',
    });
});

/**
 * Get current authenticated user
 * GET /api/v1/auth/me
 */
export const me = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.id);

    return sendSuccess(res, {
        data: { user },
    });
});

export default {
    register,
    registerLawyer,
    login,
    googleLogin,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    refreshToken,
    logout,
    logoutAll,
    me,
};
