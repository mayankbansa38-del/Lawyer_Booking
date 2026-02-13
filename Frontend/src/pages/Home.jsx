import { Link } from "react-router-dom";
import { ArrowRight, Users, Scale, Clock, Shield, Star, CheckCircle2, Briefcase, Award, TrendingUp, HeartHandshake } from 'lucide-react';
import lawyer_booking from "../assets/lawyer_booking.png";
import Speciality from "./Speciality";
import Cards from "./Cards";
import TrustBentoGrid from "../components/TrustBentoGrid";

const Home = () => {
  const stats = [
    { value: "10K+", label: "Happy Clients", icon: Users },
    { value: "500+", label: "Expert Lawyers", icon: Scale },
    { value: "98%", label: "Success Rate", icon: TrendingUp },
    { value: "24/7", label: "Support", icon: Clock },
  ];



  return (
    <>
      {/* Hero Section */}
      <section className="relative mx-4 sm:mx-6 lg:mx-12 my-6 sm:my-12 px-6 sm:px-12 lg:px-16 py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Background gradient orb */}
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(96,165,250,0.15)_0%,transparent_70%)] animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm text-blue-200 mb-6 border border-white/10">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Trusted by 10,000+ clients nationwide</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight bg-gradient-to-br from-slate-50 to-blue-400 bg-clip-text text-transparent mb-6">
              Find Your Perfect <br className="hidden sm:block" />
              Legal Expert
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Connect with verified, top-rated lawyers specializing in your legal needs.
              Book consultations instantly and get the justice you deserve.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/lawyers" className="group px-8 py-4 text-base sm:text-lg font-bold rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/40 hover:from-amber-500 hover:to-amber-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2">
                Find a Lawyer
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="px-8 py-4 text-base sm:text-lg font-semibold rounded-xl border-2 border-white/20 text-white hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                Learn More
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span className="text-2xl sm:text-3xl font-black text-white">{stat.value}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-400">{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Image */}
          <div className="flex-1 flex justify-center w-full max-w-md lg:max-w-none">
            <div className="relative">
              <img
                src={lawyer_booking}
                alt="Legal Consultation"
                className="w-full h-auto rounded-3xl shadow-2xl border-2 border-blue-400/30 hover:scale-[1.02] transition-transform duration-500"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white rounded-xl p-3 sm:p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">500+ Verified</p>
                    <p className="text-xs text-gray-500">Expert Lawyers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <TrustBentoGrid />

      {/* Trust Banner */}
      <section className="px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Ready to get started?</h3>
              <p className="text-slate-400 text-sm sm:text-base">Join thousands of satisfied clients who found their perfect legal match.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/signup" className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all text-center">
                Create Free Account
              </Link>
              <Link to="/lawyers" className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-center">
                Browse Lawyers
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Speciality />
      <Cards />
    </>
  );
};

export default Home;
