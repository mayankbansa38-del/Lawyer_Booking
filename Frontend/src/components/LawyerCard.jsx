import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Trophy, DollarSign, Star } from 'lucide-react';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=3b82f6&color=fff&bold=true&size=160';

export function LawyerCard({ lawyer }) {
  const availabilityColor = {
    'Available': 'bg-green-100 text-green-800',
    'Limited': 'bg-yellow-100 text-yellow-800',
    'Busy': 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden h-full flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={lawyer.image || `${DEFAULT_AVATAR}&name=${encodeURIComponent(lawyer.name || 'Lawyer')}`}
            alt={lawyer.name}
            className="w-20 h-20 rounded-full object-cover shrink-0"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `${DEFAULT_AVATAR}&name=${encodeURIComponent(lawyer.name || 'L')}`;
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 mb-1 truncate" title={lawyer.name}>{lawyer.name}</h3>
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 shrink-0" />
              <span className="text-sm font-medium text-gray-700">{lawyer.rating}</span>
            </div>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${availabilityColor[lawyer.availability]}`}>
              {lawyer.availability}
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
          {lawyer.description}
        </p>

        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">{lawyer.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{lawyer.experience} years experience</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Trophy className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{lawyer.casesWon} cases won</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
            <span>₹{lawyer.avgCostPerCase.toLocaleString('en-IN')} avg. per case</span>
          </div>
        </div>

        <div className="border-t pt-4 mt-auto">
          <p className="text-xs text-gray-500 mb-2">Specialties</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {lawyer.specialty.slice(0, 3).map((spec, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md truncate max-w-[150px]"
              >
                {spec}
              </span>
            ))}
            {lawyer.specialty.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">+{lawyer.specialty.length - 3}</span>
            )}
          </div>

          <Link
            to={`/lawyers/${lawyer.id}`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors block text-center"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    </div>
  );
}
