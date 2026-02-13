/**
 * Lawyer Documents Page
 * Manage case files and documents
 */

import { useState, useEffect } from 'react';
import { FileText, Upload, Search, Folder, Download, Trash2, Eye } from 'lucide-react';
import { PageHeader, EmptyState } from '../../components/dashboard';
import { documentAPI, caseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const categoryColors = {
    'Legal Document': 'bg-blue-100 text-blue-700',
    'Evidence': 'bg-green-100 text-green-700',
    'Court Document': 'bg-purple-100 text-purple-700',
    'Other': 'bg-gray-100 text-gray-700'
};

export default function LawyerDocuments() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCase, setSelectedCase] = useState('all');

    useEffect(() => {
        async function fetchData() {
            try {
                const [docsRes, casesRes] = await Promise.all([
                    documentAPI.getByLawyer(user?.lawyer?.id || user?.id),
                    caseAPI.getAll({ lawyerId: user?.lawyer?.id || user?.id })
                ]);
                setDocuments(docsRes.data);
                setCases(casesRes.data);
            } catch (error) {
                console.error('Error fetching documents:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [user]);

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCase = selectedCase === 'all' || doc.caseId === selectedCase;
        return matchesSearch && matchesCase;
    });

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
    }

    return (
        <div>
            <PageHeader
                title="Documents"
                subtitle={`${documents.length} files`}
                actions={
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                        <Upload className="w-4 h-4" /> Upload
                    </button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={selectedCase}
                    onChange={(e) => setSelectedCase(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value="all">All Cases</option>
                    {cases.map(c => (
                        <option key={c.id} value={c.id}>{c.caseNumber}</option>
                    ))}
                </select>
            </div>

            {/* Documents Grid */}
            {filteredDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocs.map(doc => (
                        <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                                    <p className="text-sm text-gray-500">{doc.size}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[doc.category] || categoryColors['Other']}`}>
                                    {doc.category}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t flex items-center gap-2">
                                <button className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1">
                                    <Eye className="w-4 h-4" /> View
                                </button>
                                <button className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                                    <Download className="w-4 h-4" /> Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={FileText} title="No documents found" description="Upload your first document or adjust your filters." />
            )}
        </div>
    );
}
