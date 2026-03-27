import { Link } from "react-router-dom";
import { ArrowRight } from 'lucide-react';
import lawyer_booking from "../assets/Website Photo/lawyer_booking.png";
import heroSlide2 from "../assets/Website Photo/hero_slide_2.png";
import heroSlide3 from "../assets/Website Photo/hero_slide_3.png";
import heroSlide4 from "../assets/Website Photo/hero_slide_4.png";
import Speciality from "./Speciality";
import Cards from "./Cards";
import LegalNotifications from "../components/LegalNotifications";

// Import Swiper React components and modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const Home = () => {




  return (
    <>
      {/* Hero Section */}
      <section className="relative mx-4 sm:mx-6 lg:mx-12 my-4 sm:my-8 px-6 sm:px-12 lg:px-16 py-6 sm:py-10 lg:py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Background gradient orb */}
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle,rgba(96,165,250,0.15)_0%,transparent_70%)] animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left Content */}
          <div className="flex-[0.85] w-full lg:max-w-[360px] text-center lg:text-left">


            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.8rem] font-black leading-tight bg-gradient-to-br from-slate-50 to-blue-400 bg-clip-text text-transparent mb-6">
              Find Your Perfect <br className="hidden sm:block" />
              Legal Expert
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed">
              Connect with verified, top-rated lawyers specializing in your legal needs.
              Book consultations instantly and get the justice you deserve.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/lawyers" className="group px-5 sm:px-7 py-3 sm:py-3.5 w-full sm:w-auto min-w-[160px] text-base font-bold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/40 hover:from-amber-500 hover:to-amber-600 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap">
                Find a Lawyer
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="px-5 sm:px-7 py-3 sm:py-3.5 w-full sm:w-auto min-w-[160px] text-base font-semibold rounded-lg border-2 border-white/20 text-white hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap">
                Learn More
              </Link>
            </div>

          </div>

          {/* Right Image */}
          <div className="flex-[1.7] w-full lg:max-w-[830px] flex justify-center lg:justify-end">
            <div className="relative w-full">
              <Swiper
                spaceBetween={0}
                centeredSlides={true}
                autoplay={{
                  delay: 2500,
                  disableOnInteraction: false,
                }}
                effect="fade"
                pagination={false}
                navigation={false}
                modules={[Autoplay, Pagination, EffectFade]}
                className="w-full h-[350px] sm:h-[420px] lg:h-[480px] rounded-3xl shadow-2xl border-2 border-blue-400/30 overflow-hidden"
              >
                <SwiperSlide className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <img
                    src={lawyer_booking}
                    alt="Legal Consultation"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </SwiperSlide>
                <SwiperSlide className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <img
                    src={heroSlide2}
                    alt="Lawyer Team"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </SwiperSlide>
                <SwiperSlide className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <img
                    src={heroSlide3}
                    alt="Justice Scale"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </SwiperSlide>
                <SwiperSlide className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                  <img
                    src={heroSlide4}
                    alt="Legal Consultation"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Notifications & Court Orders */}
      <LegalNotifications />

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
