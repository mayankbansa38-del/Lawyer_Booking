import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import NyayBookerLogo from "../components/NyayBookerLogo";
import * as authApi from "../services/authApi";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await authApi.forgotPassword(email);
            // Always show success — backend intentionally doesn't reveal if email exists
            setSuccess(true);
        } catch {
            // Non-retryable server errors only (network down, 500, etc.)
            setError("Something went wrong. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white font-sans">
            {/* Left Side */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
                        alt="Legal Background"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                </div>
                <div className="relative z-10 p-12 flex flex-col justify-center h-full text-white">
                    <h2 className="text-4xl font-bold mb-6 leading-tight">Reset Your Password</h2>
                    <p className="text-lg text-white/80 leading-relaxed max-w-md">
                        Enter your registered email address and we'll send you a secure link to reset your password.
                    </p>
                    <div className="mt-8 space-y-3">
                        {[
                            "Secure, one-time reset link",
                            "Link expires in 1 hour",
                            "Sends to your registered email",
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-white/90">
                                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50/50">
                <div className="w-full max-w-[420px] space-y-8">

                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-2">
                        <NyayBookerLogo size={60} />
                        <h1 className="text-2xl font-bold text-gray-900 mt-4">Forgot Password?</h1>
                        <p className="text-sm text-gray-500">
                            {success
                                ? "Check your inbox for the reset link."
                                : "No worries — we'll send you a reset link"}
                        </p>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="space-y-6">
                            <div className="p-5 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center gap-3 text-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                                <div>
                                    <p className="font-semibold text-green-800 text-base">Email sent!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        If <span className="font-medium">{email}</span> is registered, you'll receive a
                                        password reset link within a few minutes.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-sm text-blue-700 space-y-1">
                                <p className="font-medium">Didn't receive it?</p>
                                <ul className="list-disc pl-4 space-y-1 text-blue-600">
                                    <li>Check your spam / junk folder</li>
                                    <li>The link expires in 1 hour</li>
                                    <li>
                                        <button
                                            onClick={() => { setSuccess(false); setEmail(""); }}
                                            className="underline hover:text-blue-800 font-medium"
                                        >
                                            Try again with another email
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <Link
                                to="/login"
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700 ml-1">
                                        Registered Email
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                                            placeholder="you@example.com"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send Reset Link</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-600">
                                Remember your password?{" "}
                                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
