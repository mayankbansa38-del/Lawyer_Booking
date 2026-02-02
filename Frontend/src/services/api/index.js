/**
 * API Service Layer
 * @module services/api
 */

import {
    mockLawyers, mockUsers, mockAppointments, mockCases,
    mockPayments, mockNotifications, mockReviews, mockDocuments,
    mockAnalytics, mockFavorites, generateTimeSlots
} from '../mockData';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const lawyerAPI = {
    async getAll(filters = {}) {
        await delay();
        let lawyers = [...mockLawyers];
        if (filters.specialty) lawyers = lawyers.filter(l => l.specialty.includes(filters.specialty));
        if (filters.location) lawyers = lawyers.filter(l => l.location === filters.location);
        if (filters.availability) lawyers = lawyers.filter(l => l.availability === filters.availability);
        return { data: lawyers, total: lawyers.length };
    },

    async getById(id) {
        await delay();
        const lawyer = mockLawyers.find(l => l.id === id);
        if (!lawyer) throw new Error('Lawyer not found');
        return { data: lawyer };
    },

    async getReviews(lawyerId) {
        await delay();
        const reviews = mockReviews.filter(r => r.lawyerId === lawyerId);
        return { data: reviews, total: reviews.length };
    },

    async getAvailability(lawyerId, date) {
        await delay();
        return { data: generateTimeSlots(date, lawyerId) };
    },

    async updateProfile(lawyerId, data) {
        await delay();
        const idx = mockLawyers.findIndex(l => l.id === lawyerId);
        if (idx === -1) throw new Error('Lawyer not found');
        mockLawyers[idx] = { ...mockLawyers[idx], ...data };
        return { data: mockLawyers[idx] };
    },

    async getAnalytics(lawyerId) {
        await delay();
        return { data: { ...mockAnalytics, lawyerId } };
    }
};

export const appointmentAPI = {
    async getAll({ userId, lawyerId, status }) {
        await delay();
        let apts = [...mockAppointments];
        if (userId) apts = apts.filter(a => a.clientId === userId);
        if (lawyerId) apts = apts.filter(a => a.lawyerId === lawyerId);
        if (status) apts = apts.filter(a => a.status === status);
        return { data: apts.sort((a, b) => new Date(b.date) - new Date(a.date)), total: apts.length };
    },

    async getById(id) {
        await delay();
        const apt = mockAppointments.find(a => a.id === id);
        if (!apt) throw new Error('Appointment not found');
        return { data: apt };
    },

    async create(data) {
        await delay();
        const newApt = { id: `apt${mockAppointments.length + 1}`, ...data, status: 'pending', createdAt: new Date().toISOString() };
        mockAppointments.push(newApt);
        return { data: newApt };
    },

    async updateStatus(id, status) {
        await delay();
        const idx = mockAppointments.findIndex(a => a.id === id);
        if (idx === -1) throw new Error('Appointment not found');
        mockAppointments[idx].status = status;
        return { data: mockAppointments[idx] };
    }
};

export const caseAPI = {
    async getAll({ clientId, lawyerId, status }) {
        await delay();
        let cases = [...mockCases];
        if (clientId) cases = cases.filter(c => c.clientId === clientId);
        if (lawyerId) cases = cases.filter(c => c.lawyerId === lawyerId);
        if (status) cases = cases.filter(c => c.status === status);
        return { data: cases, total: cases.length };
    },

    async getById(id) {
        await delay();
        const c = mockCases.find(c => c.id === id);
        if (!c) throw new Error('Case not found');
        return { data: c };
    }
};

export const clientAPI = {
    async getByLawyer(lawyerId) {
        await delay();
        const clientIds = [...new Set(mockAppointments.filter(a => a.lawyerId === lawyerId).map(a => a.clientId))];
        const clients = clientIds.map(cid => {
            const user = mockUsers.find(u => u.id === cid);
            const apts = mockAppointments.filter(a => a.clientId === cid && a.lawyerId === lawyerId);
            const cases = mockCases.filter(c => c.clientId === cid && c.lawyerId === lawyerId);
            return { ...user, totalAppointments: apts.length, activeCases: cases.filter(c => c.status === 'active').length };
        });
        return { data: clients, total: clients.length };
    }
};

export const paymentAPI = {
    async getAll({ clientId, lawyerId, status }) {
        await delay();
        let pays = [...mockPayments];
        if (clientId) pays = pays.filter(p => p.clientId === clientId);
        if (lawyerId) pays = pays.filter(p => p.lawyerId === lawyerId);
        if (status) pays = pays.filter(p => p.status === status);
        return { data: pays.sort((a, b) => new Date(b.date) - new Date(a.date)), total: pays.length };
    },

    async getEarningsSummary(lawyerId) {
        await delay();
        const pays = mockPayments.filter(p => p.lawyerId === lawyerId && p.status === 'completed');
        return {
            data: {
                totalEarnings: pays.reduce((s, p) => s + p.lawyerEarnings, 0),
                thisMonth: pays.filter(p => new Date(p.date).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.lawyerEarnings, 0),
                totalTransactions: pays.length
            }
        };
    }
};

export const notificationAPI = {
    async getAll(userId, userType = 'client') {
        await delay();
        const notifs = mockNotifications.filter(n => userType === 'lawyer' ? (n.userId === userId && n.userType === 'lawyer') : (n.userId === userId && !n.userType));
        return { data: notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), unreadCount: notifs.filter(n => !n.read).length };
    },

    async markAsRead(id) {
        await delay();
        const n = mockNotifications.find(n => n.id === id);
        if (n) n.read = true;
        return { success: true };
    }
};

export const documentAPI = {
    async getByCase(caseId) {
        await delay();
        return { data: mockDocuments.filter(d => d.caseId === caseId) };
    },

    async getByLawyer(lawyerId) {
        await delay();
        const caseIds = mockCases.filter(c => c.lawyerId === lawyerId).map(c => c.id);
        return { data: mockDocuments.filter(d => caseIds.includes(d.caseId)) };
    }
};

export const favoritesAPI = {
    async getByUser(userId) {
        await delay();
        const favs = mockFavorites.filter(f => f.userId === userId);
        return { data: favs.map(f => ({ ...mockLawyers.find(l => l.id === f.lawyerId), favoritedAt: f.addedAt })) };
    },

    async add(userId, lawyerId) {
        await delay();
        if (!mockFavorites.find(f => f.userId === userId && f.lawyerId === lawyerId)) {
            mockFavorites.push({ id: `fav${mockFavorites.length + 1}`, userId, lawyerId, addedAt: new Date().toISOString().split('T')[0] });
        }
        return { success: true };
    },

    async remove(userId, lawyerId) {
        await delay();
        const idx = mockFavorites.findIndex(f => f.userId === userId && f.lawyerId === lawyerId);
        if (idx !== -1) mockFavorites.splice(idx, 1);
        return { success: true };
    }
};

export const userAPI = {
    async getById(id) {
        await delay();
        const user = mockUsers.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return { data: user };
    }
};

export default { lawyer: lawyerAPI, appointment: appointmentAPI, case: caseAPI, client: clientAPI, payment: paymentAPI, notification: notificationAPI, document: documentAPI, favorites: favoritesAPI, user: userAPI };
