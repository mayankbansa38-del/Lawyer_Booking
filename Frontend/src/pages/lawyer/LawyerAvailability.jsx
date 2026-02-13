/**
 * Lawyer Availability Settings
 * Set working hours and manage time slots
 */

import { useState, useEffect } from 'react';
import { Clock, Save, Plus, X, Calendar } from 'lucide-react';
import { PageHeader } from '../../components/dashboard';
import { lawyerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

export default function LawyerAvailability() {
    const { user } = useAuth();
    const [workingHours, setWorkingHours] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [blockedDates, setBlockedDates] = useState([]);
    const [newBlockedDate, setNewBlockedDate] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const { data } = await lawyerAPI.getById(user?.lawyer?.id || user?.id);
                setWorkingHours(data.workingHours || {});
            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const toggleDay = (day) => {
        setWorkingHours(prev => prev[day] ? { ...prev, [day]: null } : { ...prev, [day]: { start: '09:00', end: '18:00' } });
    };

    const updateHours = (day, field, value) => {
        setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const addBlockedDate = () => {
        if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
            setBlockedDates(prev => [...prev, newBlockedDate]);
            setNewBlockedDate('');
        }
    };

    const removeBlockedDate = (date) => {
        setBlockedDates(prev => prev.filter(d => d !== date));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await lawyerAPI.updateProfile(user?.lawyer?.id || user?.id, { workingHours });
            setMessage({ type: 'success', text: 'Availability updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <PageHeader
                title="Availability Settings"
                subtitle="Manage your working hours and blocked dates"
                actions={
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                }
            />

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {/* Working Hours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" /> Working Hours
                </h3>
                <div className="space-y-3">
                    {DAYS.map(day => (
                        <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                                <input
                                    type="checkbox"
                                    checked={!!workingHours[day]}
                                    onChange={() => toggleDay(day)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className={`font-medium ${workingHours[day] ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {DAY_LABELS[day]}
                                </span>
                            </label>

                            {workingHours[day] ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={workingHours[day].start}
                                        onChange={(e) => updateHours(day, 'start', e.target.value)}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-400">to</span>
                                    <input
                                        type="time"
                                        value={workingHours[day].end}
                                        onChange={(e) => updateHours(day, 'end', e.target.value)}
                                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-gray-400">Closed</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Blocked Dates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" /> Blocked Dates
                </h3>
                <p className="text-sm text-gray-500 mb-4">Block specific dates when you are unavailable for appointments.</p>

                <div className="flex gap-2 mb-4">
                    <input
                        type="date"
                        value={newBlockedDate}
                        onChange={(e) => setNewBlockedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={addBlockedDate} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>

                {blockedDates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {blockedDates.map(date => (
                            <span key={date} className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                                {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                <button onClick={() => removeBlockedDate(date)} className="hover:text-red-900">
                                    <X className="w-4 h-4" />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">No blocked dates</p>
                )}
            </div>
        </div>
    );
}
