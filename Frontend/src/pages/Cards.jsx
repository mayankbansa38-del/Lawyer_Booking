import { useState, useEffect } from 'react';
import { MapPin, Phone, Trophy, Clock, Star, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lawyerAPI } from '../services/api/index.js';

// ═══════════════════════════════════════════════════════════════════════════
// Skeleton loader for lawyer cards
// ═══════════════════════════════════════════════════════════════════════════

const LawyerCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
    <div className="relative">
      <div className="h-32 bg-gray-200" />
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-20 h-20 rounded-full bg-gray-300 border-4 border-white" />
    </div>
    <div className="pt-12 pb-6 px-6">
      <div className="text-center mb-4">
        <div className="h-5 bg-gray-200 rounded w-36 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// LawyerCard component (reusable)
// ═══════════════════════════════════════════════════════════════════════════

const LawyerCard = ({ lawyer }) => {
  const navigate = useNavigate();

  // Determine display values with fallbacks
  const displayName = lawyer.name || `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim();
  const displayType = lawyer.primarySpecialization || lawyer.specialty?.[0] || lawyer.headline || 'Lawyer';
  const displayImage = lawyer.image || lawyer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=200`;
  const displayLocation = lawyer.location || (lawyer.city && lawyer.state ? `${lawyer.city}, ${lawyer.state}` : lawyer.city || lawyer.state || 'India');
  const displayRating = lawyer.rating || lawyer.averageRating || 0;
  const displayCases = lawyer.casesWon || lawyer.completedBookings || 0;
  const displayExperience = lawyer.experience ? `${lawyer.experience} Yrs` : 'N/A';
  const isAvailable = lawyer.isAvailable !== undefined ? lawyer.isAvailable : lawyer.availability === 'Available';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      {/* Header with gradient cover */}
      <div className="relative shrink-0">
        <div className="h-32 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600" />

        {/* Status Badge */}
        <span className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${isAvailable
          ? 'bg-green-100/90 text-green-800'
          : 'bg-red-100/90 text-red-800'
          }`}>
          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {isAvailable ? 'Available' : 'Busy'}
        </span>

        {/* Avatar */}
        <img
          className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
          src={displayImage}
          alt={displayName}
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff&size=200`;
          }}
        />
      </div>

      {/* Card Body */}
      <div className="pt-12 pb-6 px-6 flex flex-col flex-1">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1" title={displayName}>{displayName}</h3>
          <p className="text-sm text-blue-600 font-medium line-clamp-1">{displayType}</p>
        </div>

        <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2 min-h-[40px]">
          {lawyer.description || lawyer.bio || `Experienced ${displayType} ready to help with your legal needs.`}
        </p>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{displayLocation}</span>
          </div>
          {lawyer.hourlyRate > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-gray-400 text-xs font-medium">₹</span>
              <span>{Number(lawyer.hourlyRate).toLocaleString('en-IN')}/hr</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center justify-center p-2 bg-blue-50 rounded-lg text-center h-full">
            <Trophy className="w-4 h-4 text-blue-600 mb-1" />
            <div className="text-sm font-semibold text-gray-900 leading-tight">{displayCases}+</div>
            <div className="text-[10px] text-gray-500">Wins</div>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-blue-50 rounded-lg text-center h-full">
            <Clock className="w-4 h-4 text-blue-600 mb-1" />
            <div className="text-sm font-semibold text-gray-900 leading-tight">{displayExperience}</div>
            <div className="text-[10px] text-gray-500">Exp</div>
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-yellow-50 rounded-lg text-center h-full">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mb-1" />
            <div className="text-sm font-semibold text-gray-900 leading-tight">{displayRating}</div>
            <div className="text-[10px] text-gray-500">Rating</div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/lawyers/${lawyer.slug || lawyer.id}`)}
          className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
        >
          Book Consultation
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// TopLawyers section — fetches from API with fallback
// ═══════════════════════════════════════════════════════════════════════════

const FALLBACK_LAWYERS = [
  {
    id: 'fallback-1',
    name: "Adv. Rahul Sharma",
    headline: "Criminal Lawyer",
    primarySpecialization: "Criminal Lawyer",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&q=80",
    isAvailable: true,
    rating: 4.8,
    casesWon: 150,
    experience: 12,
    location: "Shimla, HP",
    description: "Specializing in criminal defense with a proven track record in high-profile cases.",
    hourlyRate: 2500,
  },
  {
    id: 'fallback-2',
    name: "Adv. Neha Verma",
    headline: "Family Lawyer",
    primarySpecialization: "Family Lawyer",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
    isAvailable: true,
    rating: 4.9,
    casesWon: 120,
    experience: 10,
    location: "Dharamshala, HP",
    description: "Compassionate family law expert focused on amicable resolutions and child welfare.",
    hourlyRate: 2000,
  },
  {
    id: 'fallback-3',
    name: "Adv. Aman Gupta",
    headline: "Corporate Lawyer",
    primarySpecialization: "Corporate Lawyer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
    isAvailable: false,
    rating: 4.7,
    casesWon: 200,
    experience: 15,
    location: "Mandi, HP",
    description: "Corporate law specialist with extensive M&A and compliance expertise.",
    hourlyRate: 3500,
  },
  {
    id: 'fallback-4',
    name: "Adv. Riya Malhotra",
    headline: "Property Lawyer",
    primarySpecialization: "Property Lawyer",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
    isAvailable: true,
    rating: 4.6,
    casesWon: 95,
    experience: 8,
    location: "Kangra, HP",
    description: "Real estate law expert helping clients navigate property transactions smoothly.",
    hourlyRate: 1800,
  },
];

const TopLawyers = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchFeatured() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all verified lawyers instead of just featured ones
        // Limit to 4 to show a good mix
        const response = await lawyerAPI.getAll({ limit: 4 });
        const data = response.data; // getAll returns { data: [...], total: ... }

        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setLawyers(data);
          } else {
            // No lawyers in DB yet — use fallback
            setLawyers(FALLBACK_LAWYERS);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch lawyers, using fallback:', err.message);
        if (isMounted) {
          setLawyers(FALLBACK_LAWYERS);
          setError(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFeatured();

    return () => { isMounted = false; };
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Top Lawyers to Book</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simply browse through our trusted and verified lawyers available for consultation.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <LawyerCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:underline font-medium"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {lawyers.map((lawyer) => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export { LawyerCard, LawyerCardSkeleton };
export default TopLawyers;
