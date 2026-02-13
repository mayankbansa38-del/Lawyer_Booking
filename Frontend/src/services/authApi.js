/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Frontend - Auth API Service
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Authentication API calls.
 * 
 * @module services/authApi
 */

import apiClient, { setTokens, clearTokens } from './apiClient';

/**
 * Login with email/username and password
 */
export async function login(email, password, rememberMe = false) {
    const response = await apiClient.post('/auth/login', {
        email,
        password,
        rememberMe,
    });

    const { user, accessToken, refreshToken } = response.data.data;
    setTokens(accessToken, refreshToken);

    return { user, accessToken, refreshToken };
}

/**
 * Login with Google OAuth
 */
export async function googleLogin(idToken) {
    const response = await apiClient.post('/auth/google', { idToken });

    const { user, accessToken, refreshToken } = response.data.data;
    setTokens(accessToken, refreshToken);

    return { user, accessToken, refreshToken };
}

/**
 * Register new user
 */
export async function register(userData) {
    const response = await apiClient.post('/auth/register', userData);

    const { user, accessToken, refreshToken } = response.data.data;
    setTokens(accessToken, refreshToken);

    return { user, accessToken, refreshToken };
}

/**
 * Register new lawyer
 */
export async function registerLawyer(lawyerData) {
    const response = await apiClient.post('/auth/register/lawyer', lawyerData);

    const { user, lawyer, tokens } = response.data.data;
    setTokens(tokens.accessToken, tokens.refreshToken);

    return { user, lawyer };
}

/**
 * Get current user profile
 * @param {Object} [options] - Axios request options (e.g. { signal })
 */
export async function getCurrentUser(options = {}) {
    const response = await apiClient.get('/auth/me', options);
    return response.data.data.user;
}

/**
 * Logout
 */
export async function logout() {
    try {
        await apiClient.post('/auth/logout');
    } catch (error) {
        // Ignore errors on logout
        console.error('Logout error:', error);
    } finally {
        clearTokens();
    }
}

/**
 * Verify email
 */
export async function verifyEmail(token) {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
}

/**
 * Reset password
 */
export async function resetPassword(token, password, confirmPassword) {
    const response = await apiClient.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
    });
    return response.data;
}

export default {
    login,
    googleLogin,
    register,
    registerLawyer,
    getCurrentUser,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
};
