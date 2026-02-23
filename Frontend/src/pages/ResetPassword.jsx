import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import NyayBookerLogo from "../components/NyayBookerLogo";
import * as authApi from "../services/authApi";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]|_)\S{8,}$/;

const StrengthBar = ({ password }) => {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /\d/.test(password),
        /([^\w\s]|_)/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const colors = ["bg-red-400", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];

    if (!password) return null;

    return (
        <div className="space-y-1.5 mt-1">
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : "bg-gray-200"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${score < 3 ? "text-red-500" : score < 5 ? "text-yellow-600" : "text-green-600"}`}>
                {labels[score]}
            </p>
        </div>
    );
};

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Guard: no token in URL
    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token. Please request a new password reset link.");
        }
    }, [token]);

    const validate = () => {
        if (!PASSWORD_REGEX.test(password)) {
            setError(
                "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character"
            );
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;
        if (!validate()) return;

        setIsLoading(true);
        setError("");

        try {
            await authApi.resetPassword(token, password, confirmPassword);
            setSuccess(true);
            // Auto-redirect to login after 3s
            setTimeout(() => navigate("/login", { replace: true }), 3000);
        } catch (err) {
            const msg = err?.response?.data?.message || "";
            if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
                setError("This reset link has expired or is invalid. Please request a new one.");
            } else {
                setError(msg || "Failed to reset password. Please try again.");
            }
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
                        src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop"
                        alt="Legal Office"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
                </div>
                <div className="relative z-10 p-12 flex flex-col justify-center h-full text-white">
                    <h2 className="text-4xl font-bold mb-6 leading-tight">Create a New Password</h2>
                    <p className="text-lg text-white/80 leading-relaxed max-w-md">
                        Choose a strong password to keep your account secure.
                    </p>
                    <div className="mt-8 space-y-3">
                        {[
                            "At least 8 characters long",
                            "Mix of uppercase & lowercase",
                            "At least one number",
                            "At least one special character",
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
                        <h1 className="text-2xl font-bold text-gray-900 mt-4">
                            {success ? "Password Reset!" : "Set New Password"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {success
                                ? "You'll be redirected to login shortly."
                                : "Enter your new password below"}
                        </p>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="space-y-6">
                            <div className="p-6 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center gap-3 text-center">
                                <CheckCircle2 className="w-14 h-14 text-green-500" />
                                <div>
                                    <p className="font-semibold text-green-800 text-lg">Password updated!</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        Your password has been changed successfully. Redirecting you to login...
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/login"
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-200"
                            >
                                <span>Go to Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Error */}
                            {error && (
                                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <span>{error}</span>
                                        {(error.includes("expired") || error.includes("invalid")) && (
                                            <div className="mt-2">
                                                <Link
                                                    to="/forgot-password"
                                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                                >
                                                    Request a new reset link →
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Only render form if token is present */}
                            {token && (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 ml-1">New Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                id="reset-password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                                className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                                                placeholder="Min. 8 characters"
                                                required
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <StrengthBar password={password} />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                id="reset-confirm-password"
                                                type={showConfirm ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                                                className={`w-full pl-10 pr-12 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400 text-gray-900 ${confirmPassword && password !== confirmPassword
                                                    ? "border-red-300 focus:border-red-400"
                                                    : confirmPassword && password === confirmPassword
                                                        ? "border-green-300 focus:border-green-400"
                                                        : "border-gray-200 focus:border-blue-500"
                                                    }`}
                                                placeholder="Re-enter password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                                            >
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-xs text-red-500 ml-1">Passwords don't match</p>
                                        )}
                                        {confirmPassword && password === confirmPassword && (
                                            <p className="text-xs text-green-600 ml-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Passwords match
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !password || !confirmPassword}
                                        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Resetting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Reset Password</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            <p className="text-center text-sm text-gray-600">
                                <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                                    ← Request a new link
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
