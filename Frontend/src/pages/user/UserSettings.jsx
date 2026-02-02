/**
 * User Settings Page
 * Profile settings and preferences
 */

import { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Bell, Shield } from 'lucide-react';
import { PageHeader } from '../../components/dashboard';
import { useAuth } from '../../context/mockAuth';

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

    return (
        <div className="max-w-2xl">
            <PageHeader
                title="Settings"
                subtitle="Manage your account"
                actions={
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                }
            />

            {message && <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-800">{message}</div>}

            {/* Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-gray-400" /> Profile Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-gray-400" /> Notification Preferences</h3>
                <div className="space-y-3">
                    {[
                        { key: 'email', label: 'Email notifications' },
                        { key: 'sms', label: 'SMS notifications' },
                        { key: 'appointments', label: 'Appointment reminders' },
                        { key: 'promotions', label: 'Promotional emails' }
                    ].map(item => (
                        <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                            <span className="text-gray-700">{item.label}</span>
                            <input type="checkbox" checked={notifications[item.key]} onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                        </label>
                    ))}
                </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-gray-400" /> Security</h3>
                <button className="w-full py-3 text-left px-4 bg-gray-50 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                    Change Password
                </button>
            </div>
        </div>
    );
}
