/**
 * Email Verification Page
 * Handles verification token from URL and displays status
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import apiClient from '../services/apiClient';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // loading, success, error, no-token
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('no-token');
            return;
        }

        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        setStatus('loading');
        try {
            const response = await apiClient.post('/auth/verify-email', { token });
            setStatus('success');
            setMessage(response.data.message || 'Email verified successfully!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Verification failed. The link may have expired.');
        }
    };

    const handleResend = async () => {
        if (!email) return;

        setIsResending(true);
        try {
            await apiClient.post('/auth/resend-verification', { email });
            setMessage('Verification email sent! Please check your inbox.');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to resend email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
                    {/* Loading State */}
                    {status === 'loading' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h1>
                            <p className="text-gray-500">Please wait while we verify your email address...</p>
                        </>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
                            <p className="text-gray-500 mb-6">{message}</p>
                            <p className="text-sm text-gray-400 mb-4">Redirecting to login...</p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
                            >
                                Continue to Login
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
                            <p className="text-gray-500 mb-6">{message}</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Resend verification email</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            onClick={handleResend}
                                            disabled={isResending || !email}
                                            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isResending ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <Link
                                    to="/login"
                                    className="inline-block text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}

                    {/* No Token State */}
                    {status === 'no-token' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                                <Mail className="w-10 h-10 text-blue-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                            <p className="text-gray-500 mb-6">
                                We've sent a verification link to your email address. Click the link to verify your account.
                            </p>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-blue-800">
                                    <strong>Didn't receive the email?</strong><br />
                                    Check your spam folder or enter your email below to resend.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={handleResend}
                                        disabled={isResending || !email}
                                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        {isResending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resend'}
                                    </button>
                                </div>

                                <Link
                                    to="/login"
                                    className="inline-block text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
