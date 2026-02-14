/**
 * User Settings Page - Enhanced
 * Premium design with better form styling and sections
 */

import { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Bell, Shield, CheckCircle, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserSettings() {
    const { user } = useAuth();
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || ''
    });
    const [notifications, setNotifications] = useState({
        email: true,
        sms: true,
        appointments: true,
        promotions: false
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSave = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 500));
        setMessage('Settings saved successfully!');
        setSaving(false);
        setTimeout(() => setMessage(''), 3000);
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

            {/* Success Message */}
            {message && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 text-green-800 border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="font-medium">{message}</p>
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
                    <img
                        src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
                        alt={user?.name}
                        className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-100"
                    />
                    <div>
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200">
                            Change Photo
                        </button>
                        <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 2MB</p>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                        <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-shadow" />
                        </div>
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
                        { key: 'email', label: 'Email notifications', desc: 'Receive updates via email' },
                        { key: 'sms', label: 'SMS notifications', desc: 'Get text message alerts' },
                        { key: 'appointments', label: 'Appointment reminders', desc: 'Never miss a consultation' },
                        { key: 'promotions', label: 'Promotional emails', desc: 'Deals and offers' }
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
                    <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
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
