import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardRedirect
 * 
 * Handles strict redirection to role-specific dashboards.
 * Serves as the handler for the unified `/dashboard` route.
 */
export default function DashboardRedirect() {
    const { isAdmin, isLawyer, isUser, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (isLawyer) {
        return <Navigate to="/lawyer/dashboard" replace />;
    }

    if (isUser) {
        return <Navigate to="/user/dashboard" replace />;
    }

    // Fallback
    return <Navigate to="/" replace />;
}
