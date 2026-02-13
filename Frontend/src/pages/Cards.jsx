import { MapPin, Phone, Trophy, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const lawyers = [
  {
    id: '1',
    name: "Adv. Rahul Sharma",
    type: "Criminal Lawyer",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&h=300&fit=crop",
    available: true,
    rating: 4.8,
    cases: 150,
    experience: "12 Yrs",
    email: "rahul.sharma@firm.com",
    phone: "+91 98765 43210",
    location: "Shimla, HP",
    about: "Specializing in criminal defense with a proven track record in high-profile cases.",
    specializations: ["Criminal Defense", "White Collar Crime", "Appeals"],
  },
  {
    id: '2',
    name: "Adv. Neha Verma",
    type: "Family Lawyer",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=300&fit=crop",
    available: true,
    rating: 4.9,
    cases: 120,
    experience: "10 Yrs",
    email: "neha.verma@firm.com",
    phone: "+91 98765 43211",
    location: "Dharamshala, HP",
    about: "Compassionate family law expert focused on amicable resolutions and child welfare.",
    specializations: ["Divorce", "Child Custody", "Adoption"],
  },
  {
    id: '3',
    name: "Adv. Aman Gupta",
    type: "Corporate Lawyer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=300&fit=crop",
    available: false,
    rating: 4.7,
    cases: 200,
    experience: "15 Yrs",
    email: "aman.gupta@firm.com",
    phone: "+91 98765 43212",
    location: "Mandi, HP",
    about: "Corporate law specialist with extensive M&A and compliance expertise.",
    specializations: ["M&A", "Corporate Compliance", "Contract Law"],
  },
  {
    id: '4',
    name: "Adv. Riya Malhotra",
    type: "Property Lawyer",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
    cover: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=300&fit=crop",
    available: true,
    rating: 4.6,
    cases: 95,
    experience: "8 Yrs",
    email: "riya.malhotra@firm.com",
    phone: "+91 98765 43213",
    location: "Kangra, HP",
    about: "Real estate law expert helping clients navigate property transactions smoothly.",
    specializations: ["Property Disputes", "Real Estate", "Verification"],
  },
];

const LawyerCard = ({ lawyer }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header with cover image */}
      <div className="relative">
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${lawyer.cover || lawyer.image})` }}
        />

        {/* Status Badge */}
        <span className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${lawyer.available
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          <span className={`w-2 h-2 rounded-full ${lawyer.available ? 'bg-green-500' : 'bg-red-500'}`} />
          {lawyer.available ? 'Available' : 'Booked'}
        </span>

        {/* Avatar */}
        <img
          className="absolute left-1/2 -translate-x-1/2 -bottom-10 w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
          src={lawyer.image}
          alt={lawyer.name}
        />
      </div>

      {/* Card Body */}
      <div className="pt-12 pb-6 px-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{lawyer.name}</h3>
          <p className="text-sm text-blue-600 font-medium">{lawyer.type}</p>
        </div>

        <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2">{lawyer.about}</p>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{lawyer.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{lawyer.phone}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Trophy className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-gray-900">{lawyer.cases}+</div>
              <div className="text-xs text-gray-500">Wins</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-sm font-semibold text-gray-900">{lawyer.experience}</div>
              <div className="text-xs text-gray-500">Exp</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <div>
              <div className="text-sm font-semibold text-gray-900">{lawyer.rating}</div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate(`/lawyers/${lawyer.id}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Book Consultation
        </button>
      </div>
    </div>
  );
};

const TopLawyers = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Top Lawyers to Book</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Simply browse through our trusted and verified lawyers available for consultation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {lawyers.map((lawyer, index) => (
            <LawyerCard key={index} lawyer={lawyer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopLawyers;
