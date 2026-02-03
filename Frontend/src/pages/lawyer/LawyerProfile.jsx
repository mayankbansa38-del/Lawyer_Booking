/**
 * Lawyer Profile Management Page
 * Edit bio, photo, specialties, and rates
 */

import { useState, useEffect } from 'react';
import { Camera, Save, Plus, X, MapPin, Phone, Mail, Briefcase, Award, Languages, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/dashboard';
import { lawyerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const specialtyOptions = [
    'Criminal Lawyer', 'Family Lawyer', 'Corporate Lawyer', 'Property Lawyer',
    'Cyber Lawyer', 'Civil Lawyer', 'Immigration Law', 'Human Rights', 'Real Estate Law', 'Tax Law'
];

const languageOptions = ['Hindi', 'English', 'Punjabi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali'];

export default function LawyerProfile() {
    const { user, getFullUserData } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        async function fetchProfile() {
            try {
                const { data } = await lawyerAPI.getById(user?.id || '1');
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [user]);

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
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

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await lawyerAPI.updateProfile(profile.id, profile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
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
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Profile Photo & Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="relative">
                        <img src={profile.image} alt={profile.name} className="w-32 h-32 rounded-2xl object-cover" />
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" value={profile.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="email" value={profile.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input type="tel" value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professional Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-gray-400" />Professional Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={profile.location} onChange={(e) => handleChange('location', e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input type="number" value={profile.experience} onChange={(e) => handleChange('experience', parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Description</label>
                    <textarea value={profile.description} onChange={(e) => handleChange('description', e.target.value)} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe your expertise and experience..." />
                </div>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-gray-400" />Specialties</h3>
                <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map(specialty => (
                        <button key={specialty} onClick={() => handleSpecialtyToggle(specialty)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${profile.specialty?.includes(specialty) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {specialty}
                        </button>
                    ))}
                </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Languages className="w-5 h-5 text-gray-400" />Languages</h3>
                <div className="flex flex-wrap gap-2">
                    {languageOptions.map(lang => (
                        <button key={lang} onClick={() => handleLanguageToggle(lang)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${profile.languages?.includes(lang) ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fees */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-gray-400" />Consultation Fees</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                        <input type="number" value={profile.consultationFee} onChange={(e) => handleChange('consultationFee', parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Avg Cost Per Case (₹)</label>
                        <input type="number" value={profile.avgCostPerCase} onChange={(e) => handleChange('avgCostPerCase', parseInt(e.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
