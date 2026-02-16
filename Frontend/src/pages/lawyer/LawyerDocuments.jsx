/**
 * Lawyer Documents Page
 * Manage case files and documents
 */

import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Search, Download, Trash2, Eye, X, AlertCircle } from 'lucide-react';
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
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({ title: '', caseId: '', documentType: 'Legal Document' });
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchData();
    }, [user]);

    async function fetchData() {
        try {
            const [docsRes, casesRes] = await Promise.all([
                documentAPI.getAll(),
                caseAPI.getAll()
            ]);
            setDocuments(docsRes.data || []);
            setCases(casesRes.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', uploadData.title || selectedFile.name);
            if (uploadData.caseId) formData.append('caseId', uploadData.caseId);
            formData.append('documentType', uploadData.documentType);

            await documentAPI.upload(formData);
            setShowUploadModal(false);
            setSelectedFile(null);
            setUploadData({ title: '', caseId: '', documentType: 'Legal Document' });
            await fetchData(); // Refresh list
        } catch (error) {
            console.error('Error uploading document:', error);
            alert(error.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await documentAPI.download(doc.id);
            // Create blob URL and trigger download
            const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.originalName || doc.title || 'document';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Download failed. Please try again.');
        }
    };

    const handleView = async (doc) => {
        try {
            const response = await documentAPI.download(doc.id);
            const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Error viewing document:', error);
            alert('Could not open document.');
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Delete "${doc.title || doc.originalName}"?`)) return;
        try {
            await documentAPI.delete(doc.id);
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Delete failed. Please try again.');
        }
    };

    const filteredDocs = documents.filter(doc => {
        const name = doc.title || doc.originalName || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
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
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                        <Upload className="w-4 h-4" /> Upload
                    </button>
                }
            />

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                            <button onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                {selectedFile && <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData(d => ({ ...d, title: e.target.value }))}
                                    placeholder="Document title"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Case (optional)</label>
                                <select
                                    value={uploadData.caseId}
                                    onChange={(e) => setUploadData(d => ({ ...d, caseId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    <option value="">No case</option>
                                    {cases.map(c => (
                                        <option key={c.id} value={c.id}>{c.caseNumber || c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                                <select
                                    value={uploadData.documentType}
                                    onChange={(e) => setUploadData(d => ({ ...d, documentType: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                >
                                    <option>Legal Document</option>
                                    <option>Evidence</option>
                                    <option>Court Document</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    <h4 className="font-medium text-gray-900 truncate">{doc.title || doc.originalName}</h4>
                                    <p className="text-sm text-gray-500">{doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—'}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(doc)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[doc.documentType] || categoryColors['Other']}`}>
                                    {doc.documentType || 'Other'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t flex items-center gap-2">
                                <button
                                    onClick={() => handleView(doc)}
                                    className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <Eye className="w-4 h-4" /> View
                                </button>
                                <button
                                    onClick={() => handleDownload(doc)}
                                    className="flex-1 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
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
