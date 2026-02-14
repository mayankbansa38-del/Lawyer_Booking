/**
 * User Saved Lawyers Page - Enhanced
 * Premium card design with better hover effects
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Briefcase, Trash2, Search, Scale } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { favoritesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserSavedLawyers() {
    const { user } = useAuth();
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchFavorites() {
            if (!user?.id) return;
            try {
                const { data } = await favoritesAPI.getByUser(user.id);
                setLawyers(data);
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchFavorites();
    }, [user]);

    const handleRemove = async (lawyerId) => {
        if (!user?.id) return;
        try {
            await favoritesAPI.remove(user.id, lawyerId);
            setLawyers(prev => prev.filter(l => l.id !== lawyerId));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const filteredLawyers = lawyers.filter(l =>
        !searchQuery || l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.specialty?.[0]?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Saved Lawyers</h1>
                <p className="text-gray-500 mt-1">Your favourite advocates</p>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Saved</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{lawyers.length}</p>
                            <p className="text-xs text-gray-400 mt-1">Favourite lawyers</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
                <div className="sm:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search saved lawyers by name or speciality..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Lawyers Grid */}
            {filteredLawyers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLawyers.map(lawyer => (
                        <div key={lawyer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <img src={lawyer.image} alt={lawyer.name} className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-100 group-hover:ring-blue-100 transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{lawyer.name}</h4>
                                        <p className="text-sm text-blue-600 font-medium">{lawyer.specialty?.[0] || 'Lawyer'}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium">{lawyer.rating}</span>
                                            <span className="text-sm text-gray-400">({lawyer.casesWon} cases)</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemove(lawyer.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                        <Heart className="w-5 h-5 fill-current" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <MapPin className="w-4 h-4 text-gray-400" />{lawyer.location}
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <Briefcase className="w-4 h-4 text-gray-400" />{lawyer.experience} years experience
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <Link to={`/lawyers/${lawyer.id}`} className="flex-1 py-2.5 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200">
                                        View Profile
                                    </Link>
                                    <Link to={`/lawyers/${lawyer.id}/book`} className="flex-1 py-2.5 text-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-colors shadow-sm">
                                        Book Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={Heart} title="No saved lawyers" description="Save lawyers you like to quickly book consultations later." action={{ href: '/lawyers', label: 'Browse Lawyers' }} />
            )}
        </div>
    );
}
