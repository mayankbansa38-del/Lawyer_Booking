/**
 * Public Lawyer Profile Page
 * Detailed lawyer view with booking CTA
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Star, MapPin, Briefcase, Clock, Phone, Mail, Award, Languages,
    Calendar, ChevronRight, Heart, Share2, CheckCircle, GraduationCap
} from 'lucide-react';
import { lawyerAPI, favoritesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function LawyerProfilePage() {
    const { id } = useParams();
    const { user, isAuthenticated } = useAuth();
    const [lawyer, setLawyer] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('about');

    useEffect(() => {
        async function fetchLawyer() {
            try {
                const { data } = await lawyerAPI.getById(id);
                setLawyer(data);
                if (isAuthenticated && user) {
                    const { data: favs } = await favoritesAPI.getByUser(user.id);
                    setIsFavorite(favs.some(f => f.id === id));
                }
            } catch (error) {
                console.error('Error fetching lawyer:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchLawyer();
    }, [id, user, isAuthenticated]);

    const toggleFavorite = async () => {
        if (!isAuthenticated) return;
        try {
            if (isFavorite) {
                await favoritesAPI.remove(user.id, id);
            } else {
                await favoritesAPI.add(user.id, id);
            }
            setIsFavorite(!isFavorite);
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!lawyer) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Lawyer not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <img
                            src={lawyer.image}
                            alt={lawyer.name}
                            className="w-40 h-40 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                        />
                        <div className="flex-1">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <h1 className="text-3xl font-bold">{lawyer.name}</h1>
                                    <p className="text-blue-200 mt-1">{lawyer.specialty?.join(' • ') || 'Legal Professional'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleFavorite} className={`p-3 rounded-full transition-colors ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>
                                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                    </button>
                                    <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {lawyer.rating} Rating
                                </span>
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
                                    <Briefcase className="w-4 h-4" /> {lawyer.experience} Years
                                </span>
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
                                    <CheckCircle className="w-4 h-4" /> {lawyer.casesWon}+ Cases Won
                                </span>
                                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full">
                                    <MapPin className="w-4 h-4" /> {lawyer.location}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-6">
                                <Link
                                    to={`/lawyers/${id}/book`}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <Calendar className="w-5 h-5" /> Book Consultation
                                </Link>
                                <a href={`tel:${lawyer.phone}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 font-medium rounded-lg transition-colors flex items-center gap-2">
                                    <Phone className="w-5 h-5" /> Call Now
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex border-b">
                                {['about', 'education', 'reviews'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:text-gray-900'}`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6">
                                {activeTab === 'about' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                                            <p className="text-gray-600 leading-relaxed">{lawyer.description}</p>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3">Practice Areas</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {lawyer.specialty?.map(s => (
                                                    <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {lawyer.languages && (
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Languages className="w-5 h-5 text-gray-400" /> Languages</h3>
                                                <p className="text-gray-600">{lawyer.languages.join(', ')}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'education' && (
                                    <div className="space-y-4">
                                        {lawyer.education?.map((edu, idx) => (
                                            <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                                <GraduationCap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{edu.degree}</h4>
                                                    <p className="text-gray-600">{edu.institution}</p>
                                                    <p className="text-sm text-gray-500">{edu.year}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {lawyer.barNumber && (
                                            <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                                                <Award className="w-6 h-6 text-green-600" />
                                                <div>
                                                    <p className="font-medium text-green-800">Bar Council Registration</p>
                                                    <p className="text-green-700">{lawyer.barNumber}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'reviews' && (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="p-4 border border-gray-100 rounded-lg">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} alt="" className="w-10 h-10 rounded-full" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">Client {i}</p>
                                                        <div className="flex items-center gap-1">{[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}</div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 text-sm">Excellent lawyer. Very professional and understanding. Handled my case with great care.</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Consultation Fee */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Consultation Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Consultation Fee</span>
                                    <span className="font-semibold text-gray-900">₹{lawyer.consultationFee?.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Avg Case Cost</span>
                                    <span className="font-medium text-gray-700">₹{lawyer.avgCostPerCase?.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                            <Link to={`/lawyers/${id}/book`} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                                Book Now <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Contact */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                            <div className="space-y-3 text-sm">
                                <a href={`tel:${lawyer.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-blue-600">
                                    <Phone className="w-5 h-5 text-gray-400" /> {lawyer.phone}
                                </a>
                                <a href={`mailto:${lawyer.email}`} className="flex items-center gap-3 text-gray-600 hover:text-blue-600">
                                    <Mail className="w-5 h-5 text-gray-400" /> {lawyer.email}
                                </a>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <MapPin className="w-5 h-5 text-gray-400" /> {lawyer.location}
                                </div>
                            </div>
                        </div>

                        {/* Working Hours */}
                        {lawyer.workingHours && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-gray-400" /> Working Hours</h3>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(lawyer.workingHours).map(([day, hours]) => (
                                        <div key={day} className="flex items-center justify-between">
                                            <span className="text-gray-600 capitalize">{day}</span>
                                            <span className="text-gray-900">{hours ? `${hours.start} - ${hours.end}` : 'Closed'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
