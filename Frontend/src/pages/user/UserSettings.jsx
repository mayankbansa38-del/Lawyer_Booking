/**
 * User Settings Page - Enhanced
 * Premium design with better form styling, sections, and field validations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Save, Bell, Shield, CheckCircle, Camera, AlertCircle } from 'lucide-react';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AvatarUpload from '../../components/common/AvatarUpload';

export default function UserSettings() {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [errors, setErrors] = useState({});

    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        location: '',
        email: '',
    });

    const [notifications, setNotifications] = useState({
        emailBooking: true,
        emailReminder: true,
        emailPromo: false,
        sms: false, // UI placeholder, not yet supported by backend
    });

    useEffect(() => {
        if (user) {
            setProfile({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                location: user.location || '',
                email: user.email || '',
            });
        }
    }, [user]);

    // --- Validation ---
    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    const validate = () => {
        const newErrors = {};

        // First Name
        if (!profile.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (!nameRegex.test(profile.firstName.trim())) {
            newErrors.firstName = 'Only letters and spaces allowed';
        } else if (profile.firstName.trim().length < 2) {
            newErrors.firstName = 'Minimum 2 characters required';
        } else if (profile.firstName.trim().length > 50) {
            newErrors.firstName = 'Maximum 50 characters allowed';
        }

        // Last Name
        if (!profile.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (!nameRegex.test(profile.lastName.trim())) {
            newErrors.lastName = 'Only letters and spaces allowed';
        } else if (profile.lastName.trim().length < 2) {
            newErrors.lastName = 'Minimum 2 characters required';
        } else if (profile.lastName.trim().length > 50) {
            newErrors.lastName = 'Maximum 50 characters allowed';
        }

        // Phone
        if (!profile.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(profile.phone.trim())) {
            newErrors.phone = 'Enter a valid 10-digit phone number';
        }

        // Location
        if (!profile.location.trim()) {
            newErrors.location = 'Location is required';
        } else if (profile.location.trim().length < 2) {
            newErrors.location = 'Minimum 2 characters required';
        } else if (profile.location.trim().length > 100) {
            newErrors.location = 'Maximum 100 characters allowed';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle field change with live error clearing
    const handleChange = (field, value) => {
        setProfile({ ...profile, [field]: value });
        // Clear the error for this field as user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Restrict name input: only letters and spaces
    const handleNameChange = (field, value) => {
        const filtered = value.replace(/[^a-zA-Z\s]/g, '');
        handleChange(field, filtered);
    };

    // Restrict phone input: only digits, max 10
    const handlePhoneChange = (value) => {
        const filtered = value.replace(/[^0-9]/g, '').slice(0, 10);
        handleChange('phone', filtered);
    };

    const handleSave = async () => {
        setMessage({ type: '', text: '' });
        if (!validate()) {
            setMessage({ type: 'error', text: 'Please fix the errors below before saving.' });
            return;
        }

        setSaving(true);
        try {
            await userAPI.updateProfile({
                firstName: profile.firstName.trim(),
                lastName: profile.lastName.trim(),
                phone: profile.phone.trim(),
                location: profile.location.trim(),
            });
            // Refresh auth context with updated user data
            if (refreshUser) await refreshUser();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    // Inline error helper
    const FieldError = ({ error }) => {
        if (!error) return null;
        return (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
            </p>
        );
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    // Input border style based on error state
    const inputClass = (field) =>
        `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm transition-shadow ${errors[field] ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-blue-500'
        }`;

    const inputWithIconClass = (field) =>
        `w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-sm transition-shadow ${errors[field] ? 'border-red-300 focus:ring-red-400 bg-red-50/30' : 'border-gray-200 focus:ring-blue-500'
        }`;

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your account preferences</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Success / Error Message */}
            {message.text && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {message.type === 'success'
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <AlertCircle className="w-5 h-5 text-red-500" />
                    }
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            {/* Profile Photo */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Profile Photo</h3>
                </div>
                <div className="flex items-center gap-5">
                    <AvatarUpload
                        initialImage={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
                        size="lg" // w-32 h-32
                        // eslint-disable-next-line no-unused-vars
                        onUploadSuccess={(url) => {
                            setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
                        }}
                    />
                    <div>
                        <h4 className="font-medium text-gray-900">Change Profile Photo</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Click the camera icon to upload. <br />
                            JPG, PNG or GIF. Max 2MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Profile Information</h3>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => handleNameChange('firstName', e.target.value)}
                                placeholder="e.g. Rahul"
                                maxLength={50}
                                className={inputClass('firstName')}
                            />
                            <FieldError error={errors.firstName} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => handleNameChange('lastName', e.target.value)}
                                placeholder="e.g. Sharma"
                                maxLength={50}
                                className={inputClass('lastName')}
                            />
                            <FieldError error={errors.lastName} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" value={profile.email} disabled className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed outline-none text-sm" />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400">Email cannot be changed here</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="e.g. 9876543210"
                                maxLength={10}
                                className={inputWithIconClass('phone')}
                            />
                        </div>
                        <FieldError error={errors.phone} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="e.g. New Delhi, India"
                                maxLength={100}
                                className={inputWithIconClass('location')}
                            />
                        </div>
                        <FieldError error={errors.location} />
                    </div>
                </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                </div>
                <div className="space-y-1">
                    {[
                        { key: 'emailBooking', label: 'Booking confirmations', desc: 'Receive updates via email' },
                        { key: 'sms', label: 'SMS notifications', desc: 'Get text message alerts' },
                        { key: 'emailReminder', label: 'Appointment reminders', desc: 'Never miss a consultation' },
                        { key: 'emailPromo', label: 'Promotional emails', desc: 'Deals and offers' }
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                            <ToggleSwitch checked={notifications[item.key]} onChange={(val) => setNotifications({ ...notifications, [item.key]: val })} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Security</h3>
                </div>
                <div className="space-y-3">
                    <button onClick={() => navigate('/forgot-password')} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
                        <div>
                            <p className="font-medium text-sm">Change Password</p>
                            <p className="text-xs text-gray-500 mt-0.5">Update your account password</p>
                        </div>
                        <span className="text-xs text-gray-400">→</span>
                    </button>
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
                        <div>
                            <p className="font-medium text-sm">Two-Factor Authentication</p>
                            <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-lg">Coming Soon</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
