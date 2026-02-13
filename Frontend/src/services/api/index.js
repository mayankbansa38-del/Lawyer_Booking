/**
 * API Service Layer
 * @module services/api
 */

import {
    mockLawyers, mockUsers, mockAppointments, mockCases,
    mockPayments, mockNotifications, mockReviews, mockDocuments,
    mockAnalytics, mockFavorites, generateTimeSlots
} from '../mockData';
import apiClient from '../apiClient';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const lawyerAPI = {
    async getAll(filters = {}) {
        const params = {};
        if (filters.search) params.search = filters.search;
        if (filters.locations && filters.locations.length) params.city = filters.locations[0]; // Simple filter for now
        if (filters.specialties && filters.specialties.length) params.specialization = filters.specialties[0];
        if (filters.costRange) {
            params.minRate = filters.costRange[0];
            params.maxRate = filters.costRange[1];
        }
        if (filters.experienceRange) {
            params.minExperience = filters.experienceRange[0];
            params.maxExperience = filters.experienceRange[1];
        }
        if (filters.casesWonRange) {
            params.minCases = filters.casesWonRange[0];
            params.maxCases = filters.casesWonRange[1];
        }
        if (filters.availability && filters.availability.length) {
            params.available = filters.availability.includes('Available');
        }

        const response = await apiClient.get('/lawyers', { params });

        // Transform backend data to frontend model
        const lawyers = response.data.data.map(lawyer => ({
            id: lawyer.id,
            name: lawyer.name,
            image: lawyer.avatar || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop', // Fallback
            location: `${lawyer.city || ''}, ${lawyer.state || ''}`.replace(/^, /, '').replace(/, $/, '') || 'India',
            experience: lawyer.experience,
            casesWon: lawyer.completedBookings || 0,
            specialty: lawyer.specializations ? lawyer.specializations.map(s => s.name) : [],
            avgCostPerCase: parseFloat(lawyer.hourlyRate),
            availability: lawyer.isAvailable ? 'Available' : 'Busy',
            rating: lawyer.averageRating || 0,
            description: lawyer.headline || lawyer.bio || 'Experienced Lawyer'
        }));

        return { data: lawyers, total: response.data.total };
    },

    async getById(id) {
        try {
            const { data } = await apiClient.get(`/lawyers/${id}`);
            const lawyer = data.data;

            return {
                data: {
                    ...lawyer,
                    image: lawyer.avatar,
                    specialty: lawyer.specializations?.map(s => s.name) || [],
                    casesWon: lawyer.completedConsultations,
                    location: lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state || 'Location not available',
                }
            };
        } catch (error) {
            console.error('Error fetching lawyer details:', error);
            throw error;
        }
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
        // data contains frontend fields: specialty, languages, etc.
        // We need to map them to backend expected fields.
        // Backend expects: bio, headline, hourlyRate, city, state, address, availability, languages.
        // Frontend sends 'profile' object which has specific structure.

        const payload = {
            bio: data.description, // 'description' mapped to 'bio'
            headline: data.headline, // if exists
            hourlyRate: data.avgCostPerCase, // mapped
            city: data.location?.split(',')[0]?.trim(), // simple parsing if location is string
            state: data.location?.split(',')[1]?.trim(),
            languages: data.languages,
            // specializations: handled separately or ignored for now?
        };

        const response = await apiClient.put('/lawyers/profile', payload);
        return { data: response.data.data };
    },

    async getAnalytics(lawyerId) {
        const response = await apiClient.get('/analytics/hybrid-dashboard', {
            params: { lawyerId }
        });
        return response.data;
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
