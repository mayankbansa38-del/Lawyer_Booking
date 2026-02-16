import { useState, useEffect } from "react";
import { LawyerCard } from "../components/LawyerCard";
import { FilterSidebar } from "../components/FilterSidebar";
import { MobileFilterBar } from "../components/MobileFilterBar";
import { useLocation } from "react-router-dom";
import { lawyerAPI } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";

const AllLawyers = () => {
    const location = useLocation();
    const [filters, setFilters] = useState({
        search: '',
        locations: [],
        experienceRange: [0, 25],
        casesWonRange: [0, 350],
        specialties: [],
        costRange: [0, 25000],
        availability: []
    });

    const [lawyers, setLawyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalResults, setTotalResults] = useState(0);

    // Debounce filter changes to avoid spamming the API on every keystroke
    const debouncedFilters = useDebounce(filters, 400);

    useEffect(() => {
        if (location.state?.specialty) {
            const spec = location.state.specialty;
            if (spec === 'All') {
                setFilters(prev => ({ ...prev, specialties: [] }));
            } else {
                setFilters(prev => ({ ...prev, specialties: [spec] }));
            }
        }
    }, [location.state]);

    useEffect(() => {
        const fetchLawyers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await lawyerAPI.getAll(debouncedFilters);
                setLawyers(response.data);
                setTotalResults(response.total);
            } catch (err) {
                console.error('Error fetching lawyers:', err);
                setError('Failed to load lawyers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchLawyers();
    }, [debouncedFilters]);

    const clearFilters = () => {
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Mobile Sticky Filter Bar */}
            <MobileFilterBar
                filters={filters}
                setFilters={setFilters}
                totalResults={totalResults}
                onClear={clearFilters}
            />

            {/* Desktop Sidebar */}
            <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                totalResults={totalResults}
            />

            {/* Main Content */}
            <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 hidden lg:block">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Lawyer</h1>
                        <p className="text-gray-600">
                            Showing {lawyers.length} of {totalResults} lawyers
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 text-lg mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Retry
                            </button>
                        </div>
                    ) : lawyers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No lawyers match your current filters.</p>
                            <button
                                onClick={clearFilters}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {lawyers.map(lawyer => (
                                <LawyerCard key={lawyer.id} lawyer={lawyer} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AllLawyers;
