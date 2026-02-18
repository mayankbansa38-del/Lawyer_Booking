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
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            try {
                // Use getLawyerBookings to ensure we get lawyer-specific data
                const { data } = await appointmentAPI.getLawyerBookings();

                // Transform data for calendar
                const formattedData = data.map(apt => ({
                    ...apt,
                    date: apt.scheduledDate, // Ensure date matches calendar key
                    time: apt.scheduledTime,
                    clientName: apt.client ? `${apt.client.firstName} ${apt.client.lastName}` : 'Unknown Client',
                    clientImage: apt.client?.avatar,
                    caseType: apt.meetingType === 'VIDEO' ? 'Video Consultation' : 'In-Person Meeting',
                    caseDetail: apt.clientNotes || 'Legal Consultation',
                    status: apt.status,
                    duration: apt.duration || 60
                }));

                setAppointments(formattedData);
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
            const dayAppointments = appointments.filter(a => {
                const aptDate = typeof a.date === 'string'
                    ? a.date.split('T')[0]
                    : new Date(a.date).toISOString().split('T')[0];
                return aptDate === date;
            });
            days.push({ day, date, appointments: dayAppointments });
        }

        return days;
    }, [currentDate, appointments]);

    const selectedAppointments = useMemo(() => {
        if (!selectedDate) return [];
        return appointments.filter(a => {
            const aptDate = typeof a.date === 'string'
                ? a.date.split('T')[0]
                : new Date(a.date).toISOString().split('T')[0];
            return aptDate === selectedDate;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }, [selectedDate, appointments]);

    const totalHours = useMemo(() => {
        if (!selectedAppointments.length) return 0;
        return selectedAppointments.reduce((acc, curr) => acc + (curr.duration || 60), 0) / 60;
    }, [selectedAppointments]);

    const navigateMonth = (direction) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const isToday = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        return dateString === today;
    };

    const formatSelectedDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    return (
        <div className="h-[calc(100vh-100px)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* ── LEFT: Calendar Grid (9 columns) ── */}
                <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Manage your schedule and bookings</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl">
                            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                                Today
                            </button>
                            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all">
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="w-px h-6 bg-gray-200 mx-2" />
                            <div className="flex text-xs font-medium text-gray-500 gap-2">
                                <span className="text-blue-600 bg-white shadow-sm px-3 py-1.5 rounded-lg cursor-pointer">Month</span>
                                <span className="hover:text-gray-900 px-3 py-1.5 cursor-pointer">Week</span>
                                <span className="hover:text-gray-900 px-3 py-1.5 cursor-pointer">Day</span>
                            </div>
                        </div>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-gray-100 pb-2 mb-2">
                        {DAYS.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 grid-rows-6 gap-px bg-gray-100 flex-1 border border-gray-100 rounded-lg overflow-hidden">
                        {calendarDays.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => item.date && setSelectedDate(item.date)}
                                className={`
                                    relative bg-white p-2 min-h-[100px] hover:bg-gray-50/50 transition-colors cursor-pointer group
                                    ${!item.day ? 'bg-gray-50/30' : ''}
                                    ${item.date === selectedDate ? 'bg-blue-50/30' : ''}
                                `}
                            >
                                {item.day && (
                                    <>
                                        {/* Date Number */}
                                        <span className={`
                                            w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1
                                            ${isToday(item.date) ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-500 group-hover:text-gray-900'}
                                            ${item.date === selectedDate && !isToday(item.date) ? 'bg-blue-100 text-blue-700' : ''}
                                        `}>
                                            {item.day}
                                        </span>

                                        {/* Appointment Pills */}
                                        <div className="space-y-1">
                                            {item.appointments?.slice(0, 3).map((apt, i) => (
                                                <div
                                                    key={i}
                                                    className={`
                                                        text-[10px] px-1.5 py-0.5 rounded truncate font-medium border
                                                        ${apt.status === 'CONFIRMED'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : apt.status === 'PENDING'
                                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        }
                                                    `}
                                                    title={`${apt.clientName} (${apt.time})`}
                                                >
                                                    {apt.clientName.split(' ')[0]} ({apt.time})
                                                </div>
                                            ))}
                                            {item.appointments?.length > 3 && (
                                                <div className="text-[10px] text-gray-400 px-1">+{item.appointments.length - 3} more</div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Timeline Panel (3 columns) ── */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
                    {/* Timeline Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-lg font-bold text-gray-900">{formatSelectedDate(selectedDate)}</h4>
                        </div>
                        <p className="text-sm text-gray-500">{selectedAppointments.length} Appointments scheduled</p>
                    </div>

                    {/* Timeline List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {loading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                        ) : selectedAppointments.length > 0 ? (
                            <>
                                {selectedAppointments.map((apt, index) => (
                                    <div key={index} className="relative pl-6 border-l-2 border-blue-100 last:border-0 pb-6 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-blue-500" />

                                        <span className="text-xs font-semibold text-gray-400 block mb-2">{apt.time}</span>

                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`
                                                    text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide
                                                    ${apt.meetingType === 'VIDEO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
                                                `}>
                                                    {apt.meetingType === 'VIDEO' ? 'Video Call' : 'In-Office'}
                                                </span>
                                                {apt.status === 'PENDING' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Pending</span>}
                                            </div>

                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                    {apt.clientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-gray-900 text-sm">{apt.clientName}</h5>
                                                    <p className="text-xs text-gray-500 truncate max-w-[140px]">{apt.caseDetail}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-200">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{apt.time} - {calculateEndTime(apt.time, apt.duration)}</span>
                                            </div>

                                            {apt.meetingType === 'VIDEO' && apt.status === 'CONFIRMED' && (
                                                <button className="mt-3 w-full py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                                    Join Meeting
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Lunch Break Visual (Static for Design) */}
                                <div className="text-center py-4">
                                    <span className="inline-block px-4 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-400 border border-gray-100">
                                        Lunch Break (1:00 PM - 2:00 PM)
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Clock className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">No appointments</p>
                                <p className="text-xs text-gray-400 mt-1">Free day!</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Stats */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Hours booked:</span>
                            <span className="font-bold text-gray-900">{Math.floor(totalHours)}h {Math.round((totalHours % 1) * 60)}m</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to calculate end time
function calculateEndTime(startTime, durationMinutes) {
    if (!startTime) return '';
    const [time, period] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes + durationMinutes);

    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
