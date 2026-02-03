/**
 * Booking Page
 * Schedule a consultation with a lawyer
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, Video, MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { lawyerAPI, appointmentAPI } from '../../services/api';
import { generateTimeSlots } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';

const CONSULTATION_TYPES = [
    { id: 'video', label: 'Video Consultation', icon: Video, description: 'Online video call' },
    { id: 'inperson', label: 'In-Person', icon: MapPin, description: 'Visit the office' }
];

export default function BookingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [booking, setBooking] = useState({
        type: 'video',
        date: '',
        time: '',
        notes: ''
    });
    const [timeSlots, setTimeSlots] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Generate dates for next 14 days
    const availableDates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        return date.toISOString().split('T')[0];
    });

    useEffect(() => {
        async function fetchLawyer() {
            try {
                const { data } = await lawyerAPI.getById(id);
                setLawyer(data);
            } catch (error) {
                console.error('Error fetching lawyer:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLawyer();
    }, [id]);

    useEffect(() => {
        if (booking.date) {
            const slots = generateTimeSlots(booking.date, id);
            setTimeSlots(slots);
        }
    }, [booking.date, id]);

    const handleDateChange = (date) => {
        setBooking({ ...booking, date, time: '' });
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setSubmitting(true);
        try {
            await appointmentAPI.create({
                lawyerId: id,
                userId: user.id,
                date: booking.date,
                time: booking.time,
                type: booking.type,
                notes: booking.notes,
                caseType: 'General Consultation'
            });
            setSuccess(true);
        } catch (error) {
            console.error('Error creating appointment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600 mb-6">Your consultation with {lawyer.name} is scheduled.</p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            {booking.time}
                        </div>
                    </div>
                    <Link to="/user/appointments" className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-block">
                        View My Appointments
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to={`/lawyers/${id}`} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Book Consultation</h1>
                        <p className="text-gray-600">Schedule with {lawyer.name}</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {s}
                            </div>
                            {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        {/* Step 1: Consultation Type */}
                        {step === 1 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Consultation Type</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {CONSULTATION_TYPES.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setBooking({ ...booking, type: type.id })}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${booking.type === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                        >
                                            <type.icon className={`w-8 h-8 mb-2 ${booking.type === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <h3 className="font-medium text-gray-900">{type.label}</h3>
                                            <p className="text-sm text-gray-500">{type.description}</p>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setStep(2)} className="mt-6 w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                    Continue
                                </button>
                            </div>
                        )}

                        {/* Step 2: Date & Time */}
                        {step === 2 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>

                                {/* Date Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose a date</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {availableDates.map(date => {
                                            const d = new Date(date);
                                            return (
                                                <button
                                                    key={date}
                                                    onClick={() => handleDateChange(date)}
                                                    className={`flex-shrink-0 w-16 p-3 rounded-lg border-2 text-center transition-all ${booking.date === date ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    <p className="text-xs text-gray-500">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                                                    <p className="text-lg font-semibold text-gray-900">{d.getDate()}</p>
                                                    <p className="text-xs text-gray-500">{d.toLocaleDateString('en-IN', { month: 'short' })}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                {booking.date && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Choose a time</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {timeSlots.map(slot => (
                                                <button
                                                    key={slot.time}
                                                    disabled={!slot.available}
                                                    onClick={() => setBooking({ ...booking, time: slot.time })}
                                                    className={`py-2.5 rounded-lg text-sm font-medium transition-all ${!slot.available ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                                            booking.time === slot.time ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                        Back
                                    </button>
                                    <button onClick={() => setStep(3)} disabled={!booking.date || !booking.time} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirm */}
                        {step === 3 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm Booking</h2>

                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <img src={lawyer.image} alt={lawyer.name} className="w-16 h-16 rounded-xl object-cover" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{lawyer.name}</h3>
                                            <p className="text-sm text-gray-600">{lawyer.specialty?.[0]}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            {booking.type === 'video' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                            {booking.type === 'video' ? 'Video Call' : 'In-Person'}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            {booking.time}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <CreditCard className="w-4 h-4" />
                                            ₹{lawyer.consultationFee?.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                                    <textarea
                                        value={booking.notes}
                                        onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Describe your legal issue briefly..."
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                        Back
                                    </button>
                                    <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                        {submitting ? 'Booking...' : 'Confirm Booking'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
                        <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <img src={lawyer.image} alt={lawyer.name} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                                <p className="font-medium text-gray-900">{lawyer.name}</p>
                                <p className="text-sm text-gray-500">{lawyer.specialty?.[0]}</p>
                            </div>
                        </div>
                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Consultation Fee</span>
                                <span className="font-medium">₹{lawyer.consultationFee?.toLocaleString('en-IN')}</span>
                            </div>
                            {booking.date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Date</span>
                                    <span className="font-medium">{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            )}
                            {booking.time && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Time</span>
                                    <span className="font-medium">{booking.time}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
