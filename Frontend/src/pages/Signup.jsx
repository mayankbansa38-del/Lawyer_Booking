import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Phone, Building2, ArrowRight, Eye, EyeOff, CheckCircle2, Sparkles, Loader2, AlertCircle, Scale, User } from 'lucide-react';
import { SIGNUP_ROLES } from '../constants/roles';
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { register, registerLawyer, googleLogin, error: authError } = useAuth();

  const [state, setState] = useState("User");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", barNumber: "", barState: "", specialization: ""
  });

  const roles = SIGNUP_ROLES;

  const benefits = [
    "Access to verified legal experts",
    "Secure & confidential consultations",
    "Easy appointment scheduling",
    "24/7 customer support"
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (state === "Lawyer" && !formData.barNumber.trim()) {
      setError("Bar registration number is required for lawyers");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      let result;

      // Sanitize phone: keep only digits and leading + 
      // "91 98765 43210" -> "+919876543210"
      const sanitizedPhone = formData.phone
        ? formData.phone.replace(/[^\d+]/g, '').replace(/^(\+)?/, '+')
        : undefined;

      if (state === "Lawyer") {
        result = await registerLawyer({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: sanitizedPhone || undefined,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          barCouncilId: formData.barNumber,
          barCouncilState: formData.barState || "Delhi",
          enrollmentYear: new Date().getFullYear(),
        });
      } else {
        result = await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: sanitizedPhone || undefined,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }

      if (result.success) {
        // Redirect to verify email page - email verification is required
        navigate("/verify-email");
      } else {
        setError(result.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        navigate("/user/dashboard");
      } else {
        setError(result.error || "Google sign-up failed");
      }
    } catch (err) {
      setError("Google sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up was cancelled or failed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
      </div>

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left - Benefits (hidden on mobile) */}
        <div className="hidden lg:block text-white p-8">
          <h2 className="text-4xl font-bold mb-4">Join Nyay Booker Today</h2>
          <p className="text-slate-300 text-lg mb-8">Connect with experienced lawyers and get the legal help you deserve.</p>

          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-slate-200">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=lawyer1" alt="User" className="w-12 h-12 rounded-full border-2 border-white/20" />
              <div>
                <p className="font-semibold text-white">Nyay Booker</p>
                <p className="text-sm text-slate-400">Legal Platform</p>
              </div>
            </div>
            <p className="text-slate-300 italic">"Nyay Booker made finding the right lawyer so easy. The whole process was seamless and professional."</p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-3 shadow-lg shadow-blue-500/30">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-1 text-sm">Start your legal journey today</p>
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error || authError}</p>
            </div>
          )}

          {/* Role Selector */}
          <div className="mb-5">
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setState(role.id)}
                    disabled={isLoading}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${state === role.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${state === role.id ? "text-blue-600" : "text-gray-500"}`} />
                    <p className={`text-sm font-semibold ${state === role.id ? "text-blue-700" : "text-gray-700"}`}>{role.label}</p>
                    <p className={`text-xs ${state === role.id ? "text-blue-500" : "text-gray-400"}`}>{role.desc}</p>
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
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                    placeholder="John"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                    placeholder="Doe"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {state === "Lawyer" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Bar Registration No.</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <input
                      type="text" name="barNumber" value={formData.barNumber} onChange={handleChange}
                      placeholder="DEL/12345/2020"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Bar Council State</label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                    <select
                      name="barState" value={formData.barState} onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                      disabled={isLoading}
                    >
                      <option value="">Select state</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" id="terms" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required disabled={isLoading} />
              <label htmlFor="terms" className="text-xs text-gray-600">
                I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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

          <p className="text-center text-gray-600 mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
