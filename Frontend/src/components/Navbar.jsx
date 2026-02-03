import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, User, LogIn, LogOut, LayoutDashboard, Settings,
  ChevronDown, Shield, Scale, UserCircle, Bell
} from 'lucide-react';
import NyayBookerLogo from "./NyayBookerLogo";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin, isLawyer } = useAuth();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/lawyers", label: "Find Lawyers" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isLawyer) return '/lawyer/dashboard';
    return '/user/dashboard';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleConfig = () => {
    if (isAdmin) return {
      text: 'Administrator',
      color: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      textColor: 'text-red-700',
      icon: Shield
    };
    if (isLawyer) return {
      text: 'Legal Professional',
      color: 'from-indigo-500 to-purple-600',
      bg: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      icon: Scale
    };
    return {
      text: 'Client',
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: UserCircle
    };
  };

  const roleConfig = getRoleConfig();
  const RoleIcon = roleConfig.icon;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
            <NyayBookerLogo size={44} className="group-hover:scale-105 transition-transform duration-300" />
            <div className="hidden sm:flex flex-col">
              <span className="text-lg font-bold text-[#0c1f3f] leading-tight">
                Nyay<span className="text-[#cfa052]">Booker</span>
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                Elite Legal Appointments
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive(link.path)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              /* Profile Dropdown */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                >
                  {/* Avatar */}
                  <div className="relative">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleConfig.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {getUserInitials()}
                      </div>
                    )}
                    {/* Online indicator */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>

                  {/* Name & Role */}
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-900 leading-tight">
                      {user?.firstName} {user?.lastName?.charAt(0)}.
                    </span>
                    <span className={`text-xs font-medium ${roleConfig.textColor} leading-tight`}>
                      {roleConfig.text}
                    </span>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Premium Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header with gradient */}
                    <div className={`bg-gradient-to-r ${roleConfig.color} p-4`}>
                      <div className="flex items-center gap-3">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.firstName} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/30" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
                            {getUserInitials()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-base truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-white/80 truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <RoleIcon className="w-4 h-4 text-white/80" />
                        <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                          {roleConfig.text}
                        </span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
                      <div className="bg-white p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">0</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Bookings</p>
                      </div>
                      <div className="bg-white p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">0</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Reviews</p>
                      </div>
                      <div className="bg-white p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {user?.isEmailVerified ? '✓' : '−'}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Verified</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <LayoutDashboard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Dashboard</p>
                          <p className="text-xs text-gray-500">View your overview</p>
                        </div>
                      </Link>

                      <Link
                        to={isLawyer ? "/lawyer/profile" : "/user/settings"}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <Settings className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Settings</p>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </Link>

                      <Link
                        to="/user/notifications"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                          <Bell className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Notifications</p>
                          <p className="text-xs text-gray-500">View updates</p>
                        </div>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="p-2 pt-0 border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                          <LogOut className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold">Sign Out</p>
                          <p className="text-xs text-red-400">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Signup Buttons */
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-[600px] pb-4" : "max-h-0"}`}>
          <div className="pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 text-base font-medium rounded-lg transition-all ${isActive(link.path)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-3">
            {isAuthenticated ? (
              <>
                {/* Mobile Profile Card */}
                <div className={`mx-2 p-4 rounded-2xl bg-gradient-to-r ${roleConfig.color}`}>
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.firstName} className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg">
                        {getUserInitials()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">{user?.firstName} {user?.lastName}</p>
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-xs text-white/80">{roleConfig.text}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-2 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 mx-2 w-[calc(100%-16px)] px-4 py-3 text-base font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-2 px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  Login to Your Account
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 mx-2 px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Create Free Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
