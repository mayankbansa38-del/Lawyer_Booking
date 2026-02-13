import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, AlertCircle, Scale, ShieldCheck } from 'lucide-react';
import { LOGIN_ROLES } from '../constants/roles';
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin, error: authError } = useAuth();

  const [state, setState] = useState("User");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roles = LOGIN_ROLES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Use email as-is for User/Lawyer, or "admin" for Admin role
      const loginEmail = state === "Admin" ? (email || "admin") : email;

      const result = await login(loginEmail, password);

      if (result.success) {
        // Navigate based on role
        const userRole = result.user.role;
        if (userRole === "ADMIN") {
          navigate("/admin");
        } else if (userRole === "LAWYER") {
          navigate("/lawyer");
        } else {
          navigate("/user");
        }
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setIsSubmitting(true);

    try {
      const result = await googleLogin(credentialResponse.credential);

      if (result.success) {
        const userRole = result.user.role;
        if (userRole === "LAWYER") {
          navigate("/lawyer");
        } else {
          navigate("/user");
        }
      } else {
        setError(result.error || "Google login failed.");
      }
    } catch {
      setError("Google login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
              <Scale className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Sign in to continue to Nyay Booker</p>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error || authError}</p>
            </div>
          )}

          {/* Role Selector */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Login as</p>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setState(role.id)} aria-pressed={state === role.id}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${state === role.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${state === role.id ? "text-blue-600" : "text-gray-500"
                      }`} />
                    <p className={`text-xs font-semibold ${state === role.id ? "text-blue-700" : "text-gray-700"
                      }`}>{role.label}</p>
                    <p className={`text-[10px] ${state === role.id ? "text-blue-500" : "text-gray-400"
                      }`}>{role.desc}</p>
                    {state === role.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {state === "Admin" ? "Username or Email" : "Email Address"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email" type={state === "Admin" ? "text" : "email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={state === "Admin" ? "admin" : "you@example.com"}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password" type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider - Only show for non-admin */}
          {state !== "Admin" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="signin_with"
                />
              </div>
            </>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-white/60 text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Secure Login
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> 256-bit SSL
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
