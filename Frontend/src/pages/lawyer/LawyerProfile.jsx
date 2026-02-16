/**
 * Lawyer Profile Settings
 * Manage professional information and availability
 */

import { useState, useEffect } from 'react';
import { Camera, Save, MapPin, Phone, Mail, Briefcase, Award, Languages, DollarSign, Clock } from 'lucide-react';
import { PageHeader } from '../../components/dashboard';
import { lawyerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';


const languageOptions = ['Hindi', 'English', 'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_AVAILABILITY = DAYS.reduce((acc, day) => {
    acc[day] = { enabled: day !== 'Sunday', start: '09:00', end: '17:00' };
    return acc;
}, {});

export default function LawyerProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
    const [practiceAreas, setPracticeAreas] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                if (!user) return;

                const [{ data: profileData }, { data: areasData }] = await Promise.all([
                    lawyerAPI.getProfile(),
                    lawyerAPI.getPracticeAreas()
                ]);

                // If city or state are missing but we have a location string, try to parse it
                if (profileData.location && profileData.location !== 'Location not available') {
                    if (!profileData.city && !profileData.state) {
                        const parts = profileData.location.split(',');
                        if (parts.length > 0) profileData.city = parts[0].trim();
                        if (parts.length > 1) profileData.state = parts[1].trim();
                    }
                }

                setProfile(profileData);
                setPracticeAreas(areasData);

                if (profileData.availability && typeof profileData.availability === 'object') {
                    setAvailability(prev => ({ ...prev, ...profileData.availability }));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const handleChange = (field, value) => {
        // Handle number inputs specifically to allow clearing them (empty string)
        if (['experience', 'consultationFee', 'hourlyRate'].includes(field)) {
            if (value === '' || value === null) {
                setProfile(prev => ({ ...prev, [field]: '' }));
                return;
            }
            const numValue = parseInt(value);
            setProfile(prev => ({ ...prev, [field]: isNaN(numValue) ? '' : numValue }));
        } else {
            setProfile(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSpecialtyToggle = (specialty) => {
        const current = profile.specialty || [];
        const updated = current.includes(specialty)
            ? current.filter(s => s !== specialty)
            : [...current, specialty];
        handleChange('specialty', updated);
    };

    const handleLanguageToggle = (language) => {
        const current = profile.languages || [];
        const updated = current.includes(language)
            ? current.filter(l => l !== language)
            : [...current, language];
        handleChange('languages', updated);
    };

    const handleAvailabilityToggle = (day) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled },
        }));
    };

    const handleAvailabilityTime = (day, field, value) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await lawyerAPI.updateProfile(profile.id, {
                ...profile,
                availability,
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create FormData
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            // Upload to backend
            // Assuming endpoint exists based on user routes or standard convention
            // If specific endpoint unknown, we'll try '/users/avatar' or '/lawyers/profile/avatar'
            // For now, let's use a standard pattern and if it fails we debug.
            // Actually, let's assume we update the profile with the image URL if the backend handles upload separately
            // OR we post to an upload endpoint. 
            // Let's try to upload to /users/me/avatar if it exists, or just send the file to updateProfile if it supports multipart.
            // Given the previous code didn't show upload logic, I'll assume we need to add handling.
            // Let's try a common pattern: POST /users/avatar

            const response = await apiClient.post('/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update profile with new image URL
            setProfile(prev => ({ ...prev, image: response.data.data.avatar }));
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        } catch (error) {
            console.error('Error uploading image:', error);
            setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-16">
                <h3 className="text-lg font-semibold text-gray-900">Profile not found</h3>
                <p className="text-gray-500 mt-1">Could not load your profile data.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="My Profile"
                subtitle="Manage your professional information"
                actions={
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
                    </button>
                }
            />

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Photo & Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="relative">
                        <img src={profile.image || '/default-avatar.png'} alt={profile.name} className="w-32 h-32 rounded-2xl object-cover bg-gray-100" />
                        <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors cursor-pointer">
                            <Camera className="w-5 h-5" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                        </label>
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" value={profile.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={profile.email || ''} disabled className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" value={profile.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professional Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gray-400" />Professional Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={profile.city || ''} onChange={(e) => handleChange('city', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="City" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={profile.state || ''} onChange={(e) => handleChange('state', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="State" />
                        </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input type="number" value={profile.experience || 0} onChange={(e) => handleChange('experience', parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
                    <textarea value={profile.description || ''} onChange={(e) => handleChange('description', e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe your expertise and experience..." />
                </div>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-gray-400" />Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                    {practiceAreas.map(area => (
                        <button key={area.id} onClick={() => handleSpecialtyToggle(area.name)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${profile.specialty?.includes(area.name) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {area.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-gray-400" />Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                    {languageOptions.map(lang => (
                        <button key={lang} onClick={() => handleLanguageToggle(lang)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${profile.languages?.includes(lang) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-400" />Consultation Fees
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                        <input type="number" value={profile.consultationFee || 0} onChange={(e) => handleChange('consultationFee', parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹)</label>
                        <input type="number" value={profile.hourlyRate || 0} onChange={(e) => handleChange('hourlyRate', parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            {/* Availability Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />Availability Schedule
                </h3>
                <p className="text-sm text-gray-500 mb-4">Set your available days and hours for client bookings.</p>
                <div className="space-y-3">
                    {DAYS.map(day => (
                        <div key={day} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${availability[day].enabled ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <label className="flex items-center gap-3 min-w-[140px] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availability[day].enabled}
                                    onChange={() => handleAvailabilityToggle(day)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className={`font-medium text-sm ${availability[day].enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {day}
                                </span>
                            </label>
                            {availability[day].enabled ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <input
                                        type="time"
                                        value={availability[day].start}
                                        onChange={(e) => handleAvailabilityTime(day, 'start', e.target.value)}
                                        className="px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                    <span className="text-gray-400">to</span>
                                    <input
                                        type="time"
                                        value={availability[day].end}
                                        onChange={(e) => handleAvailabilityTime(day, 'end', e.target.value)}
                                        className="px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400 italic">Unavailable</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
