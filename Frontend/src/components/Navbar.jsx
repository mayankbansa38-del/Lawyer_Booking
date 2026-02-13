import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, User, LogIn, LogOut, LayoutDashboard, Settings,
  ChevronDown, Shield, Scale, UserCircle, Bell
} from 'lucide-react';
import NyayBookerLogo from "./NyayBookerLogo";
import { useAuth } from "../context/AuthContext";

import ProfileDropdown from "./ProfileDropdown";
import LogoHover from "./LogoHover";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin, isLawyer, isLoading } = useAuth();




  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/lawyers", label: "Find Lawyers" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    return '/dashboard';
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

  const currentRole = isAdmin ? 'admin' : isLawyer ? 'lawyer' : 'user';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <LogoHover />
          </div>

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
            {isLoading ? (
              /* Loading Skeleton */
              <div className="flex items-center gap-3">
                <div className="w-32 h-10 bg-gray-100 rounded-xl animate-pulse" />
                <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              /* Profile Dropdown */
              <ProfileDropdown
                user={user}
                role={currentRole}
                onLogout={handleLogout}
              />
            ) : (
              /* Login/Signup Buttons */
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200"
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
                  className="flex items-center justify-center gap-2 mx-2 px-4 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
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
