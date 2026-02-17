/**
 * API Service Layer — All endpoints wired to real backend
 * @module services/api
 */

import apiClient from '../apiClient';


export const lawyerAPI = {
    async getProfile() {
        const response = await apiClient.get('/lawyers/profile');
        return response.data;
    },

    async getAll(filters = {}) {
        const params = {};
        if (filters.limit) params.limit = filters.limit;
        if (filters.page) params.page = filters.page;
        if (filters.search) params.search = filters.search;
        if (filters.locations && filters.locations.length) {
            const [cityParam, stateParam] = filters.locations[0].split(',').map(s => s.trim());
            if (cityParam) params.city = cityParam;
            if (stateParam) params.state = stateParam;
        }
        if (filters.specialties && filters.specialties.length) params.specialization = filters.specialties.join(',');
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

    async updateProfile(lawyerId, data) {
        // Map frontend fields to backend expected fields
        const nameParts = data.name ? data.name.split(' ') : [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const payload = {
            firstName,
            lastName,
            phone: data.phone,
            bio: data.description, // 'description' mapped to 'bio'
            headline: data.headline,
            hourlyRate: data.hourlyRate || data.avgCostPerCase, // hourlyRate as avg cost per case
            consultationFee: data.consultationFee, // Explicit consultation fee
            city: data.city || data.location?.split(',')[0]?.trim(),
            state: data.state || data.location?.split(',')[1]?.trim(),
            languages: data.languages,
            experience: data.experience,
            specializations: data.specialty, // Array of specialty names
            availability: data.availability,
        };

        const response = await apiClient.put('/lawyers/profile', payload);
        return { data: response.data.data };
    },

    async getPracticeAreas() {
        const response = await apiClient.get('/lawyers/practice-areas');
        return response.data;
    },

    async getAnalytics(lawyerId) {
        const response = await apiClient.get('/analytics/hybrid-dashboard', {
            params: { lawyerId }
        });
        return response.data;
    },

    async updatePaymentCredentials(data) {
        const response = await apiClient.put('/lawyers/me/payment-credentials', data);
        return response.data;
    },

    async getPaymentCredentials() {
        // Payment credentials come from the lawyer profile
        const response = await apiClient.get('/lawyers/profile');
        const lawyer = response.data?.data;
        return {
            data: {
                bankAccountName: lawyer?.bankAccountName || '',
                bankAccountNumber: lawyer?.bankAccountNumber || '',
                bankIfscCode: lawyer?.bankIfscCode || '',
                upiId: lawyer?.upiId || '',
            },
        };
    },

    async getFeatured(limit = 6) {
        const response = await apiClient.get('/lawyers/featured', { params: { limit } });
        return response.data?.data || response.data || [];
    },

    async getReviews(lawyerId, page = 1, limit = 10) {
        const response = await apiClient.get(`/reviews/lawyer/${lawyerId}`, { params: { page, limit } });
        return response.data;
    },

    async getAvailability(lawyerId, date) {
        const response = await apiClient.get(`/lawyers/${lawyerId}/availability`, { params: { date } });
        return response.data;
    },
};

export const appointmentAPI = {
    async getAll(filters = {}) {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.upcoming) params.upcoming = filters.upcoming;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;

        const response = await apiClient.get('/bookings', { params });
        return response.data;
    },

    async getLawyerBookings(filters = {}) {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.date) params.date = filters.date;

        const response = await apiClient.get('/bookings/lawyer', { params });
        return response.data;
    },

    async getById(id) {
        const response = await apiClient.get(`/bookings/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await apiClient.post('/bookings', data);
        return response.data;
    },

    async confirm(id) {
        const response = await apiClient.put(`/bookings/${id}/confirm`);
        return response.data;
    },

    async cancel(id, reason) {
        const response = await apiClient.put(`/bookings/${id}/cancel`, { reason });
        return response.data;
    },

    async complete(id) {
        const response = await apiClient.put(`/bookings/${id}/complete`);
        return response.data;
    },
};

export const caseAPI = {
    async getAll(filters = {}) {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;

        const response = await apiClient.get('/cases', { params });
        return response.data;
    },

    async getById(id) {
        const response = await apiClient.get(`/cases/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await apiClient.post('/cases', data);
        return response.data;
    },

    async update(id, data) {
        const response = await apiClient.put(`/cases/${id}`, data);
        return response.data;
    },

    async getHistory(id, page = 1, limit = 20) {
        const response = await apiClient.get(`/cases/${id}/history`, { params: { page, limit } });
        return response.data;
    },
};

export const clientAPI = {
    async getByLawyer() {
        // Derived from bookings — get unique clients from lawyer's bookings
        const response = await apiClient.get('/bookings/lawyer', { params: { limit: 100 } });
        const bookings = response.data?.data || [];
        const clientMap = new Map();
        bookings.forEach(b => {
            if (b.client && !clientMap.has(b.client.id)) {
                clientMap.set(b.client.id, {
                    ...b.client,
                    totalAppointments: bookings.filter(x => x.client?.id === b.client.id).length,
                });
            }
        });
        return { data: Array.from(clientMap.values()), total: clientMap.size };
    },
};

export const paymentAPI = {
    async createOrder(bookingId) {
        const response = await apiClient.post('/payments/create-order', { bookingId });
        return response.data;
    },

    async verify(data) {
        const response = await apiClient.post('/payments/verify', data);
        return response.data;
    },

    async getAll(filters = {}) {
        const params = {};
        if (filters.status) params.status = filters.status;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;

        const response = await apiClient.get('/payments', { params });
        return response.data;
    },

    async getById(id) {
        const response = await apiClient.get(`/payments/${id}`);
        return response.data;
    },

    async checkout(data) {
        const response = await apiClient.post('/payments/checkout', data);
        return response.data;
    },

    async requestRefund(paymentId, data) {
        const response = await apiClient.post(`/payments/${paymentId}/refund`, data);
        return response.data;
    },

    async getEarningsSummary() {
        const response = await apiClient.get('/payments/earnings-summary');
        return response.data;
    },
};

export const notificationAPI = {
    async getAll() {
        const response = await apiClient.get('/notifications');
        return response.data;
    },

    async getUnreadCount() {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },

    async markAsRead(id) {
        const response = await apiClient.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await apiClient.put('/notifications/read-all');
        return response.data;
    },

    async delete(id) {
        const response = await apiClient.delete(`/notifications/${id}`);
        return response.data;
    },

    async deleteAll() {
        const response = await apiClient.delete('/notifications');
        return response.data;
    },
};

export const documentAPI = {
    async getAll(filters = {}) {
        const params = {};
        if (filters.type) params.type = filters.type;
        if (filters.page) params.page = filters.page;

        const response = await apiClient.get('/documents', { params });
        return response.data;
    },

    async getById(id) {
        const response = await apiClient.get(`/documents/${id}`);
        return response.data;
    },

    async upload(formData) {
        const response = await apiClient.post('/documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    async download(id) {
        const response = await apiClient.get(`/documents/${id}/download`, {
            responseType: 'blob',
        });
        return response;
    },

    async update(id, data) {
        const response = await apiClient.put(`/documents/${id}`, data);
        return response.data;
    },

    async delete(id) {
        const response = await apiClient.delete(`/documents/${id}`);
        return response.data;
    },

    async share(id, data) {
        const response = await apiClient.post(`/documents/${id}/share`, data);
        return response.data;
    },

    async getByCase(caseId) {
        const response = await apiClient.get('/documents', { params: { caseId } });
        return response.data;
    },
};

export const favoritesAPI = {
    async getByUser() {
        const response = await apiClient.get('/users/saved-lawyers');
        return { data: response.data?.data || [] };
    },
    async add(_userId, lawyerId) {
        const response = await apiClient.post(`/users/saved-lawyers/${lawyerId}`);
        return response.data;
    },
    async remove(_userId, lawyerId) {
        const response = await apiClient.delete(`/users/saved-lawyers/${lawyerId}`);
        return response.data;
    },
};

export const chatAPI = {
    async getConversations() {
        const response = await apiClient.get('/chat/conversations');
        return response.data;
    },

    async getMessages(caseId, page = 1, limit = 50) {
        const response = await apiClient.get(`/chat/${caseId}/messages`, { params: { page, limit } });
        return response.data;
    },

    async sendMessage(caseId, data) {
        const response = await apiClient.post(`/chat/${caseId}/messages`, data);
        return response.data;
    },

    async markRead(caseId) {
        const response = await apiClient.put(`/chat/${caseId}/messages/read`);
        return response.data;
    },
};

export const userAPI = {
    async getProfile() {
        const response = await apiClient.get('/users/profile');
        return response.data;
    },

    async updateProfile(data) {
        const response = await apiClient.put('/users/profile', data);
        return response.data;
    },

    async getById(id) {
        const response = await apiClient.get(`/users/${id}`);
        return response.data;
    },
};

export default { lawyer: lawyerAPI, appointment: appointmentAPI, case: caseAPI, client: clientAPI, payment: paymentAPI, notification: notificationAPI, document: documentAPI, favorites: favoritesAPI, chat: chatAPI, user: userAPI };
