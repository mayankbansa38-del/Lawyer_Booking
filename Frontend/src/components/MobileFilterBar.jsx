import { useState } from 'react';
import { Search, MapPin, Briefcase, Trophy, DollarSign, Clock, BookOpen, X, ChevronDown, Filter } from 'lucide-react';
import { DualRangeSlider } from './DualRangeSlider';
import { locations, specialties, availabilityOptions } from '../constants/filters';

export function MobileFilterBar({ filters, setFilters, totalResults, onClear }) {
    const [isOpen, setIsOpen] = useState(false);
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

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const activeFilterCount =
        filters.locations.length +
        filters.specialties.length +
        filters.availability.length +
        (filters.experienceRange[0] > 0 || filters.experienceRange[1] < 25 ? 1 : 0) +
        (filters.casesWonRange[0] > 0 || filters.casesWonRange[1] < 350 ? 1 : 0) +
        (filters.costRange[0] > 0 || filters.costRange[1] < 25000 ? 1 : 0);

    return (
        <>
            {/* Sticky Bar */}
            <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 shadow-sm lg:hidden transition-all">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-700 transition-colors active:scale-95"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <div className="text-sm font-medium text-gray-500 whitespace-nowrap">
                        {totalResults} <span className="hidden sm:inline">Lawyers</span> found
                    </div>
                </div>
            </div>

            {/* Filter Modal/Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex flex-col">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="absolute inset-x-0 bottom-0 top-[10vh] bg-white rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-600" />
                                Filter Lawyers
                            </h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                            {/* Search */}
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                    <Search className="w-4 h-4 text-blue-500" />
                                    Search
                                </label>
                                <input
                                    type="text"
                                    placeholder="Name, location, specialty..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                                />
                            </div>

                            {/* Location */}
                            <div className="border-b border-gray-100 pb-4">
                                <button onClick={() => toggleSection('location')} className="flex items-center justify-between w-full py-2">
                                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        Location
                                        {filters.locations.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filters.locations.length}</span>}
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.location ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedSections.location && (
                                    <div className="grid grid-cols-2 gap-2 mt-3 pl-1">
                                        {locations.map(location => (
                                            <label key={location} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${filters.locations.includes(location) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={filters.locations.includes(location)}
                                                    onChange={() => handleCheckboxChange('locations', location)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700 truncate">{location.split(',')[0]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Specialty */}
                            <div className="border-b border-gray-100 pb-4">
                                <button onClick={() => toggleSection('specialty')} className="flex items-center justify-between w-full py-2">
                                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                                        <BookOpen className="w-4 h-4 text-gray-500" />
                                        Specialty
                                        {filters.specialties.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{filters.specialties.length}</span>}
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.specialty ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedSections.specialty && (
                                    <div className="space-y-2 mt-3 pl-1">
                                        {specialties.map(item => (
                                            <label key={item.value} className="flex items-center gap-3 py-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.specialties.includes(item.value)}
                                                    onChange={() => handleCheckboxChange('specialties', item.value)}
                                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                                />
                                                <span className="text-sm text-gray-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Experience */}
                            <div className="border-b border-gray-100 pb-4">
                                <button onClick={() => toggleSection('experience')} className="flex items-center justify-between w-full py-2">
                                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                                        <Briefcase className="w-4 h-4 text-gray-500" />
                                        Experience (years)
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.experience ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedSections.experience && (
                                    <div className="mt-4 px-2">
                                        <DualRangeSlider
                                            min={0}
                                            max={25}
                                            value={filters.experienceRange}
                                            onChange={(value) => setFilters({ ...filters, experienceRange: value })}
                                        />
                                        <div className="mt-2 flex justify-between text-sm text-gray-600 font-medium">
                                            <span>{filters.experienceRange[0]} yrs</span>
                                            <span>{filters.experienceRange[1]} yrs</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cost */}
                            <div className="border-b border-gray-100 pb-4">
                                <button onClick={() => toggleSection('cost')} className="flex items-center justify-between w-full py-2">
                                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        Avg Cost (₹)
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.cost ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedSections.cost && (
                                    <div className="mt-4 px-2">
                                        <DualRangeSlider
                                            min={0}
                                            max={25000}
                                            step={1000}
                                            value={filters.costRange}
                                            onChange={(value) => setFilters({ ...filters, costRange: value })}
                                        />
                                        <div className="mt-2 flex justify-between text-sm text-gray-600 font-medium">
                                            <span>₹{filters.costRange[0].toLocaleString('en-IN')}</span>
                                            <span>₹{filters.costRange[1].toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Bottom Actions */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex gap-3 pb-8">
                            <button
                                onClick={() => {
                                    onClear();
                                    setIsOpen(false);
                                }}
                                className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex-[2] py-3 px-4 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            >
                                Show {totalResults} Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
