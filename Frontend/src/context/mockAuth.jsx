/**
 * Mock Authentication Context
 * UI-only state management for user authentication.
 * No actual auth - just switches between user types for demo purposes.
 * 
 * @module context/mockAuth
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { mockLawyers, mockUsers } from '../services/mockData';

const AuthContext = createContext(null);

/**
 * Mock user data for different roles
 */
const mockCurrentUsers = {
    User: {
        id: 'u1',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 98111 22333',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh',
        location: 'Shimla, HP',
        role: 'User'
    },
    Lawyer: {
        id: '1',
        name: 'Adv. Rahul Sharma',
        email: 'rahul.sharma@nyaybooker.com',
        phone: '+91 98765 43210',
        image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop',
        location: 'Shimla, HP',
        role: 'Lawyer'
    },
    Admin: {
        id: 'admin1',
        name: 'Admin User',
        email: 'admin@nyaybooker.com',
        phone: '+91 98000 00000',
        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        location: 'Shimla, HP',
        role: 'Admin'
    }
};

/**
 * AuthProvider Component
 * Wraps the application and provides authentication context
 */
export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);

    /**
     * Mock login function
     * @param {string} userRole - 'User', 'Lawyer', or 'Admin'
     * @param {string} email - Email (not validated in mock)
     * @param {string} password - Password (not validated in mock)
     */
    const login = useCallback((userRole, email, password) => {
        // In real implementation, this would validate credentials
        const mockUser = mockCurrentUsers[userRole];
        if (mockUser) {
            setUser(mockUser);
            setRole(userRole);
            setIsAuthenticated(true);
            return { success: true, user: mockUser };
        }
        return { success: false, error: 'Invalid credentials' };
    }, []);

    /**
     * Mock logout function
     */
    const logout = useCallback(() => {
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
    }, []);

    /**
     * Switch role (for demo purposes)
     * @param {string} newRole - 'User', 'Lawyer', or 'Admin'
     */
    const switchRole = useCallback((newRole) => {
        const mockUser = mockCurrentUsers[newRole];
        if (mockUser) {
            setUser(mockUser);
            setRole(newRole);
            setIsAuthenticated(true);
        }
    }, []);

    /**
     * Get full user data (for profile pages)
     */
    const getFullUserData = useCallback(() => {
        if (!user) return null;

        if (role === 'Lawyer') {
            return mockLawyers.find(l => l.id === user.id) || user;
        } else if (role === 'User') {
            return mockUsers.find(u => u.id === user.id) || user;
        }
        return user;
    }, [user, role]);

    const value = {
        isAuthenticated,
        user,
        role,
        login,
        logout,
        switchRole,
        getFullUserData,
        isLawyer: role === 'Lawyer',
        isUser: role === 'User',
        isAdmin: role === 'Admin'
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
