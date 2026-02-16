/**
 * Lawyer Calendar View
 * Monthly calendar showing all scheduled appointments
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { PageHeader } from '../../components/dashboard';
import { appointmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function LawyerCalendar() {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            try {
                const { data } = await appointmentAPI.getAll({ lawyerId: user?.lawyer?.id || user?.id });
                setAppointments(data);
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchAppointments();
    }, [user]);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        // Previous month padding
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, date: null });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAppointments = appointments.filter(a => a.date === date);
            days.push({ day, date, appointments: dayAppointments });
        }

        return days;
    }, [currentDate, appointments]);

    const selectedAppointments = useMemo(() => {
        if (!selectedDate) return [];
        return appointments.filter(a => a.date === selectedDate);
    }, [selectedDate, appointments]);

    const navigateMonth = (direction) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <PageHeader title="Calendar" subtitle="View your schedule at a glance" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                Today
                            </button>
                            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Days header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => item.date && setSelectedDate(item.date)}
                                disabled={!item.day}
                                className={`
                  relative min-h-[80px] p-2 rounded-lg text-left transition-colors
                  ${!item.day ? 'bg-transparent' : 'hover:bg-gray-50'}
                  ${item.date === today ? 'bg-blue-50 border-2 border-blue-200' : 'border border-transparent'}
                  ${item.date === selectedDate ? 'ring-2 ring-blue-500' : ''}
                `}
                            >
                                {item.day && (
                                    <>
                                        <span className={`text-sm font-medium ${item.date === today ? 'text-blue-600' : 'text-gray-900'}`}>
                                            {item.day}
                                        </span>
                                        {item.appointments?.length > 0 && (
                                            <div className="mt-1 space-y-1">
                                                {item.appointments.slice(0, 2).map((apt, i) => (
                                                    <div key={i} className={`text-xs px-1.5 py-0.5 rounded truncate ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {apt.time}
                                                    </div>
                                                ))}
                                                {item.appointments.length > 2 && (
                                                    <div className="text-xs text-gray-500">+{item.appointments.length - 2} more</div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected day details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {selectedDate
                            ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
                            : 'Select a date'
                        }
                    </h3>

                    {selectedDate ? (
                        selectedAppointments.length > 0 ? (
                            <div className="space-y-3">
                                {selectedAppointments.map(apt => (
                                    <div key={apt.id} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <img src={apt.clientImage} alt={apt.clientName} className="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{apt.clientName}</p>
                                                <p className="text-xs text-gray-500">{apt.caseType}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{apt.time}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No appointments on this day</p>
                        )
                    ) : (
                        <p className="text-gray-500 text-center py-8">Click on a date to view appointments</p>
                    )}
                </div>
            </div>
        </div>
    );
}
