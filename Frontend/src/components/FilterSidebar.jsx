import { useState } from 'react';
import { Search, MapPin, Briefcase, Trophy, DollarSign, Clock, BookOpen, X, ChevronDown, Filter } from 'lucide-react';
import { DualRangeSlider } from './DualRangeSlider';

const locations = [
  'Bilaspur, HP',
  'Shimla, HP',
  'Mandi, HP',
  'Kangra, HP',
  'Dharamshala, HP',
  'Kullu, HP',
  'Solan, HP',
  'Hamirpur, HP'
];

const specialties = [
  'Criminal Lawyer',
  'Family Lawyer',
  'Corporate Lawyer',
  'Property Lawyer',
  'Cyber Lawyer',
  'Civil Lawyer',
  'Immigration Law',
  'Human Rights',
  'Real Estate Law',
  'Tax Law'
];

const availabilityOptions = ['Available', 'Limited', 'Busy'];

export function FilterSidebar({ filters, setFilters, totalResults }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    experience: false,
    casesWon: false,
    specialty: true,
    cost: false,
    availability: false
  });

  const handleCheckboxChange = (category, value) => {
    setFilters({
      ...filters,
      [category]: filters[category].includes(value)
        ? filters[category].filter((item) => item !== value)
        : [...filters[category], value]
    });
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      locations: [],
      experienceRange: [0, 25],
      casesWonRange: [0, 350],
      specialties: [],
      costRange: [0, 25000],
      availability: []
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters =
    filters.search ||
    filters.locations.length > 0 ||
    filters.specialties.length > 0 ||
    filters.availability.length > 0 ||
    filters.experienceRange[0] > 0 ||
    filters.experienceRange[1] < 25 ||
    filters.casesWonRange[0] > 0 ||
    filters.casesWonRange[1] < 350 ||
    filters.costRange[0] > 0 ||
    filters.costRange[1] < 25000;

  const activeFilterCount =
    filters.locations.length +
    filters.specialties.length +
    filters.availability.length +
    (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 25 ? 1 : 0) +
    (filters.casesWonRange[0] > 0 || filters.casesWonRange[1] < 350 ? 1 : 0) +
    (filters.costRange[0] > 0 || filters.costRange[1] < 25000 ? 1 : 0);

  /* 
   * This was previously a component defined inside another component, which causes
   * focus loss on re-renders because React treats it as a new component type.
   * Changing it to a render function fixes the issue.
   */
  const renderFilterContent = () => (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4" />
          Search
        </label>
        <input
          type="text"
          placeholder="Search by name, location, specialty..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Location - Collapsible */}
      <div className="mb-4 border-b pb-4">
        <button onClick={() => toggleSection('location')} className="flex items-center justify-between w-full text-left">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="w-4 h-4" />
            Location
            {filters.locations.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filters.locations.length}</span>
            )}
          </label>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.location && (
          <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
            {locations.map(location => (
              <label key={location} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.locations.includes(location)}
                  onChange={() => handleCheckboxChange('locations', location)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Experience - Collapsible */}
      <div className="mb-4 border-b pb-4">
        <button onClick={() => toggleSection('experience')} className="flex items-center justify-between w-full text-left">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Briefcase className="w-4 h-4" />
            Experience (years)
          </label>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.experience ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.experience && (
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="25"
                value={filters.experienceRange[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  experienceRange: [e.target.value === '' ? '' : Number(e.target.value), filters.experienceRange[1]]
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                max="25"
                value={filters.experienceRange[1]}
                onChange={(e) => setFilters({
                  ...filters,
                  experienceRange: [filters.experienceRange[0], e.target.value === '' ? '' : Number(e.target.value)]
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <DualRangeSlider
              min={0}
              max={25}
              value={[Number(filters.experienceRange[0]), Number(filters.experienceRange[1])]}
              onChange={(value) => setFilters({ ...filters, experienceRange: value })}
            />
          </div>
        )}
      </div>

      {/* Cases Won - Collapsible */}
      <div className="mb-4 border-b pb-4">
        <button onClick={() => toggleSection('casesWon')} className="flex items-center justify-between w-full text-left">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Trophy className="w-4 h-4" />
            Cases Won
          </label>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.casesWon ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.casesWon && (
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="350"
                value={filters.casesWonRange[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  casesWonRange: [e.target.value === '' ? '' : Number(e.target.value), filters.casesWonRange[1]]
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                max="350"
                value={filters.casesWonRange[1]}
                onChange={(e) => setFilters({
                  ...filters,
                  casesWonRange: [filters.casesWonRange[0], e.target.value === '' ? '' : Number(e.target.value)]
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <DualRangeSlider
              min={0}
              max={350}
              value={[Number(filters.casesWonRange[0]), Number(filters.casesWonRange[1])]}
              onChange={(value) => setFilters({ ...filters, casesWonRange: value })}
            />
          </div>
        )}
      </div>

      {/* Specialty - Collapsible */}
      <div className="mb-4 border-b pb-4">
        <button onClick={() => toggleSection('specialty')} className="flex items-center justify-between w-full text-left">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <BookOpen className="w-4 h-4" />
            Specialty
            {filters.specialties.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filters.specialties.length}</span>
            )}
          </label>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.specialty ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.specialty && (
          <div className="space-y-2 max-h-48 overflow-y-auto mt-3">
            {specialties.map(specialty => (
              <label key={specialty} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.specialties.includes(specialty)}
                  onChange={() => handleCheckboxChange('specialties', specialty)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{specialty}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Average Cost - Collapsible */}
      <div className="mb-4 border-b pb-4">
        <button onClick={() => toggleSection('cost')} className="flex items-center justify-between w-full text-left">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="w-4 h-4" />
            Avg Cost Per Case (₹)
          </label>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.cost ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.cost && (
          <div className="space-y-3 mt-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="25000"
                step="1000"
                value={filters.costRange[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  costRange: [e.target.value === '' ? '' : Number(e.target.value), filters.costRange[1]]
                })}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min="0"
                max="25000"
                step="1000"
                value={filters.costRange[1]}
                onChange={(e) => setFilters({
                  ...filters,
                  costRange: [filters.costRange[0], e.target.value === '' ? '' : Number(e.target.value)]
                })}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <DualRangeSlider
              min={0}
              max={25000}
              step={1000}
              value={[Number(filters.costRange[0]), Number(filters.costRange[1])]}
              onChange={(value) => setFilters({ ...filters, costRange: value })}
            />
            <p className="text-xs text-gray-500">
              ₹{filters.costRange[0].toLocaleString('en-IN')} - ₹{filters.costRange[1].toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>

      {/* Availability - Collapsible */}
      <div className="mb-4">
        <button onClick={() => toggleSection('availability')} className="flex items-center justify-between w-full text-left">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4" />
            Availability
          </label>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.availability ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.availability && (
          <div className="space-y-2 mt-3">
            {availabilityOptions.map(option => (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.availability.includes(option)}
                  onChange={() => handleCheckboxChange('availability', option)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalResults}</span> lawyers found
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden sticky top-0 z-20 bg-white border-b p-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFilterContent()}
            <div className="sticky bottom-0 bg-white border-t p-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Show {totalResults} Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto sticky top-0">
        {renderFilterContent()}
      </aside>
    </>
  );
}
