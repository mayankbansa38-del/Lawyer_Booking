/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NyayBooker Frontend - Authentication Context
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Real authentication context with JWT and Google OAuth support.
 * 
 * @module context/AuthContext
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../services/authApi';
import { getAccessToken, clearTokens, isTokenExpired } from '../services/apiClient';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application and provides authentication context
 */
export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing token on mount
    useEffect(() => {
        const controller = new AbortController();

        const initAuth = async () => {
            const token = getAccessToken();

            if (token) {
                // Skip API call if token is already expired — avoids wasted round-trip
                if (isTokenExpired(token)) {
                    clearTokens();
                    setIsLoading(false);
                    return;
                }

                try {
                    const userData = await authApi.getCurrentUser({ signal: controller.signal });
                    if (!controller.signal.aborted) {
                        setUser(userData);
                        setIsAuthenticated(true);
                    }
                } catch (err) {
                    if (controller.signal.aborted) return; // Unmounted — skip state updates
                    clearTokens();
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            if (!controller.signal.aborted) {
                setIsLoading(false);
            }
        };

        initAuth();

        return () => controller.abort(); // Cleanup on unmount
    }, []);

    /**
     * Login with email/username and password
     */
    const login = useCallback(async (email, password, rememberMe = false) => {
        setError(null);
        try {
            const { user } = await authApi.login(email, password, rememberMe);
            setUser(user);
            setIsAuthenticated(true);
            return { success: true, user };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);

    /**
     * Login with Google OAuth
     */
    const googleLogin = useCallback(async (idToken) => {
        setError(null);
        try {
            const { user } = await authApi.googleLogin(idToken);
            setUser(user);
            setIsAuthenticated(true);
            return { success: true, user };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Google login failed.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);

    /**
     * Register new user
     */
    const register = useCallback(async (userData) => {
        setError(null);
        try {
            const { user } = await authApi.register(userData);
            setUser(user);
            setIsAuthenticated(true);
            return { success: true, user };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Registration failed.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);

    /**
     * Register new lawyer
     */
    const registerLawyer = useCallback(async (lawyerData) => {
        setError(null);
        try {
            const { user, lawyer } = await authApi.registerLawyer(lawyerData);
            setUser({ ...user, lawyer });
            setIsAuthenticated(true);
            return { success: true, user, lawyer };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Lawyer registration failed.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    }, []);

    /**
     * Logout
     */
    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    /**
     * Refresh user data
     */
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
            return userData;
        } catch (err) {
            console.error('Failed to refresh user:', err);
            return null;
        }
    }, []);

    // Helper computed properties
    const role = user?.role || null;
    const isLawyer = role === 'LAWYER';
    const isUser = role === 'USER';
    const isAdmin = role === 'ADMIN';

    const value = {
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        googleLogin,
        register,
        registerLawyer,
        logout,
        refreshUser,
        role,
        isLawyer,
        isUser,
        isAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
