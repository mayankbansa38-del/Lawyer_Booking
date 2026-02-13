/**
 * User Saved Lawyers Page
 * View and manage favorite lawyers
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { favoritesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function UserSavedLawyers() {
    const { user } = useAuth();
    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div>
            <PageHeader title="Saved Lawyers" subtitle={`${lawyers.length} lawyers saved`} />

            {lawyers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lawyers.map(lawyer => (
                        <div key={lawyer.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <img src={lawyer.image} alt={lawyer.name} className="w-16 h-16 rounded-xl object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 truncate">{lawyer.name}</h4>
                                        <p className="text-sm text-blue-600">{lawyer.specialty?.[0] || 'Lawyer'}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium">{lawyer.rating}</span>
                                            <span className="text-sm text-gray-400">({lawyer.casesWon} cases)</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemove(lawyer.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Heart className="w-5 h-5 fill-current" />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />{lawyer.location}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-gray-400" />{lawyer.experience} years experience
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t flex gap-2">
                                    <Link to={`/lawyers/${lawyer.id}`} className="flex-1 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        View Profile
                                    </Link>
                                    <Link to={`/lawyers/${lawyer.id}/book`} className="flex-1 py-2 text-center text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
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
