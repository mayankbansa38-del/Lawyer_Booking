/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Frontend - API Client
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Axios-based API client with authentication interceptors.
 * 
 * @module services/apiClient
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000, // 10 seconds - reduced for faster failure detection
    headers: {
        'Content-Type': 'application/json',
    },
});

// Configure automatic retries for transient failures
axiosRetry(apiClient, {
    retries: 2, // Retry failed requests up to 2 times
    retryDelay: axiosRetry.exponentialDelay, // Exponential backoff (1s, 2s)
    retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response?.status >= 500 && error.response?.status < 600);
    },
});

// Token management
const TOKEN_KEY = 'nyaybooker_access_token';
const REFRESH_TOKEN_KEY = 'nyaybooker_refresh_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if a JWT token is expired by decoding its payload (no library needed).
 * Returns true if the token is expired or malformed.
 * @param {string} token - JWT token string
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds, Date.now() is in milliseconds
        // Add 30s buffer so we don't use a token that's about to expire
        return (payload.exp * 1000) < (Date.now() + 30000);
    } catch {
        // Malformed token — treat as expired
        return true;
    }
};

// Request interceptor - add auth token (with expiry pre-check)
apiClient.interceptors.request.use(
    async (config) => {
        const token = getAccessToken();
        if (token) {
            if (isTokenExpired(token)) {
                // Token expired — try refresh before sending the request
                const refreshToken = getRefreshToken();
                if (refreshToken) {
                    try {
                        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                        setTokens(accessToken, newRefreshToken);
                        config.headers.Authorization = `Bearer ${accessToken}`;
                    } catch {
                        clearTokens();
                        return Promise.reject(new Error('Session expired'));
                    }
                } else {
                    clearTokens();
                    return Promise.reject(new Error('Session expired'));
                }
            } else {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        // Skip for login requests to allow form error handling
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/login')) {
            if (isRefreshing) {
                // Queue the request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                setTokens(accessToken, newRefreshToken);

                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
