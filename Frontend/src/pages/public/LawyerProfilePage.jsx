import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CalendarView from '../../components/CalendarView';
import {
    Phone, Mail, MapPin, Clock, Languages, GraduationCap, Award, Star,
    ChevronRight, Video, Calendar, CreditCard, ArrowLeft, CheckCircle,
    Heart, Share2
} from 'lucide-react';
import { lawyerAPI, favoritesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LawyerProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLawyer } = useAuth();



    const [lawyer, setLawyer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    // Calendar state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Generate next 7 days for the calendar




    useEffect(() => {
        const fetchLawyer = async () => {
            try {
                // Use lawyerAPI service
                const response = await lawyerAPI.getById(id);
                setLawyer(response.data);

                // Check if favorite
                if (isAuthenticated && user) {
                    try {
                        const favRes = await favoritesAPI.getByUser();
                        const isFav = favRes.data.some(fav => fav.id === id || fav.lawyerId === id);
                        setIsFavorite(isFav);
                    } catch (e) {
                        console.error("Error checking favorites", e);
                    }
                }
            } catch (err) {
                console.error(err);
                setError(err.message || 'Failed to load lawyer profile');
            } finally {
                setLoading(false);
            }
        };
        fetchLawyer();
    }, [id, isAuthenticated, user]);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedDate || !lawyer) return;
            setLoadingSlots(true);
            try {
                // Format date as YYYY-MM-DD
                const dateStr = selectedDate.toISOString().split('T')[0];
                // Use lawyerAPI service if available, else direct call matches pattern
                // lawyerAPI.getAvailability(id, date) is available in index.js
                const response = await lawyerAPI.getAvailability(id, dateStr);
                setAvailableSlots(response.data.slots || []);
            } catch (err) {
                console.error("Error fetching availability:", err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };
        fetchAvailability();
    }, [id, selectedDate, lawyer]);



    const toggleFavorite = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/lawyers/${id}` } });
            return;
        }

        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await favoritesAPI.remove(user.id, id);
                setIsFavorite(false);
            } else {
                await favoritesAPI.add(user.id, id);
                setIsFavorite(true);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        } finally {
            setFavoriteLoading(false);
        }
    };




    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${lawyer.name} - Lawyer Profile`,
                text: `Check out ${lawyer.name}, a ${lawyer.specialty?.[0] || 'lawyer'} on NyayBooker.`,
                url: window.location.href,
            }).catch((error) => console.log('Error sharing', error));
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handleBook = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }

        if (isLawyer) {
            alert("Lawyers cannot book appointments. Please login as a User to book.");
            return;
        }

        navigate(`/lawyers/${id}/book`, {
            state: {
                date: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
                time: selectedTime
            }
        });
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !lawyer) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-red-500">{error || 'Lawyer not found'}</p>
            <Link to="/lawyers" className="text-blue-600 hover:underline">Back to Lawyers</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Back Link */}
                    <div className="mb-6">
                        <Link to="/lawyers" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Lawyers
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Image */}
                        <div className="relative">
                            <img
                                src={lawyer.image || `https://ui-avatars.com/api/?name=${lawyer.name}&background=random`}
                                alt={lawyer.name}
                                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                            />
                            {lawyer.isAvailable && (
                                <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-white shadow-sm flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Available
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{lawyer.name}</h1>
                                    <p className="text-lg text-gray-500 font-medium mt-1">{lawyer.headline || 'Legal Professional'}</p>
                                </div>

                                {/* Action Buttons (Favorites & Share) */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={toggleFavorite}
                                        disabled={favoriteLoading}
                                        className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                                        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                                        title="Share Profile"
                                    >
                                        <Share2 className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-4 md:gap-8">
                                <div className="flex items-center gap-2">
                                    <div className="bg-yellow-50 p-2 rounded-lg">
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Rating</p>
                                        <p className="text-base font-bold text-gray-900">{lawyer.rating} <span className="text-xs text-gray-400 font-normal">({lawyer.totalReviews})</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                        <Award className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Experience</p>
                                        <p className="text-base font-bold text-gray-900">{lawyer.experience || 0} Years</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-50 p-2 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Cases Won</p>
                                        <p className="text-base font-bold text-gray-900">{lawyer.casesWon || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions (Desktop) */}
                        <div className="hidden md:block">
                            <button
                                onClick={() => document.getElementById('booking-calendar').scrollIntoView({ behavior: 'smooth' })}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                Book Appointment
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Tabs */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex border-b border-gray-100">
                                {['about', 'experience', 'education', 'reviews'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-4 text-sm font-semibold transition-all relative ${activeTab === tab
                                            ? 'text-blue-600 bg-blue-50/30'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 md:p-8">
                                {activeTab === 'about' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">About {lawyer.firstName}</h3>
                                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{lawyer.bio || lawyer.description || 'No description available.'}</p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">Practice Areas</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {lawyer.specialty?.map((s, i) => (
                                                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {lawyer.languages && (
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <Languages className="w-5 h-5 text-gray-400" /> Languages
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {lawyer.languages.map((lang, i) => (
                                                        <span key={i} className="text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'experience' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* Assuming we might have experience data later, for now show placeholder or parse form bio if possible */}
                                        <div className="flex gap-4">
                                            <div className="mt-1">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Legal Practice</h4>
                                                <p className="text-gray-600">{lawyer.experience} Years of Experience</p>
                                                <p className="text-sm text-gray-500 mt-1">Specializing in {lawyer.specialty?.join(', ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'education' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {(lawyer.qualifications || lawyer.education)?.length > 0 ? (
                                            (lawyer.qualifications || lawyer.education).map((edu, idx) => (
                                                <div key={idx} className="flex gap-4 group">
                                                    <div className="mt-1 relative">
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                            <GraduationCap className="w-5 h-5" />
                                                        </div>
                                                        {idx !== (lawyer.qualifications || lawyer.education).length - 1 && (
                                                            <div className="absolute top-10 left-1/2 w-px h-full bg-gray-200 -translate-x-1/2" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                                        <p className="text-gray-600 font-medium">{edu.institution}</p>
                                                        <p className="text-sm text-gray-500">{edu.year}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">Education details not listed.</p>
                                        )}

                                        {lawyer.barCouncilId && (
                                            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-4">
                                                <div className="p-2 bg-green-100 rounded-lg text-green-700">
                                                    <Award className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-green-800">Bar Council Verified</p>
                                                    <p className="text-sm text-green-700">ID: {lawyer.barCouncilId}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {lawyer.recentReviews?.length > 0 ? (
                                            lawyer.recentReviews.map((review) => (
                                                <div key={review.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={review.author.avatar || `https://ui-avatars.com/api/?name=${review.author.name}`}
                                                                alt={review.author.name}
                                                                className="w-10 h-10 rounded-full"
                                                            />
                                                            <div>
                                                                <p className="font-bold text-gray-900">{review.author.name}</p>
                                                                <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{review.content}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500">No reviews yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Booking Calendar Section */}
                        <div id="booking-calendar" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-blue-600" />
                                Book Appointment
                            </h3>

                            {/* Availability Calendar */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-6">Check Availability</h3>
                                <CalendarView
                                    selectedDate={selectedDate}
                                    onDateChange={(date) => {
                                        setSelectedDate(date);
                                        setSelectedTime(null);
                                    }}
                                />
                            </div>

                            {/* Time Slots */}
                            {selectedDate && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                        Available Slots for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </h4>
                                    {loadingSlots ? (
                                        <div className="flex justify-center py-4">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                            {availableSlots.map((slot, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedTime(slot.time)}
                                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border
                                                        ${selectedTime === slot.time
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:text-blue-600'
                                                        }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic border border-dashed border-gray-200 rounded-lg p-4 text-center">
                                            No slots available for this date.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Book Button */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleBook}
                                    className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 active:scale-99"
                                >
                                    <span>Book Appointment</span>
                                </button>
                                <p className="text-center text-xs text-gray-400 mt-3">
                                    Instant confirmation • Free cancellation 24h before
                                </p></div>
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Fee Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Consultation Fee</p>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-3xl font-bold text-gray-900">₹{lawyer.consultationFee?.toLocaleString('en-IN')}</span>
                                        <span className="text-gray-500 font-medium">/ session</span>
                                    </div>
                                </div>
                                <div className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1.5 rounded-lg">
                                    Available Now
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Video className="w-4 h-4" />
                                    </div>
                                    <span>Video Consultation</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span>60 Minutes Duration</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Languages className="w-4 h-4" />
                                    </div>
                                    <span>{lawyer.languages?.join(', ')}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => document.getElementById('booking-calendar').scrollIntoView({ behavior: 'smooth' })}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-black transition-colors"
                            >
                                Check Availability
                            </button>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                            <div className="space-y-4 text-sm">
                                <a href={`tel:${lawyer.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-blue-600 group transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    {lawyer.phone}
                                </a>
                                <a href={`mailto:${lawyer.email}`} className="flex items-center gap-3 text-gray-600 hover:text-blue-600 group transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center text-gray-400 group-hover:text-blue-600 transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    {lawyer.email}
                                </a>
                                <div className="flex items-center gap-3 text-gray-600 group">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    {lawyer.location}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
