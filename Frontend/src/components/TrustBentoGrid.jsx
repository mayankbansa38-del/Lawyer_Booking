import React from 'react';
import { Shield, Star, Lock, Calendar, CheckCircle2, TrendingUp, Gavel, User } from 'lucide-react';

const BentoCard = ({ title, description, className, children, icon: Icon }) => (
    <div className={`bg-white rounded-xl border border-zinc-200 p-6 flex flex-col justify-between hover:border-zinc-300 hover:shadow-md transition-all duration-300 group ${className}`}>
        <div>
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                    <Icon className="w-5 h-5 text-zinc-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">{title}</h3>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-[90%] mb-0">
                {description}
            </p>
        </div>
        <div className="mt-0 w-full bg-zinc-50 rounded-lg border border-zinc-100 overflow-hidden relative min-h-[120px] flex items-center justify-center">
            {/* Widget Container with subtle inner shadow/grid pattern optional */}
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
            {children}
        </div>
    </div>
);

const TrustBentoGrid = () => {
    return (
        <section className="py-24 bg-zinc-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">
                        Built for <span className="text-blue-600">Trust & Excellence</span>
                    </h2>
                    <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                        Experience the new standard in legal services. Verified professionals, secure consultations, and transparent pricing.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">

                    {/* Card 1: Expert Legal Counsel */}
                    <BentoCard
                        title="Expert Legal Counsel"
                        description="Connect with top-tier advocates tailored to your specific legal needs."
                        icon={Gavel}
                        className="md:col-span-2 lg:col-span-1"
                    >
                        {/* Widget: Mini Lawyer Profile */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-zinc-200 w-[90%] max-w-[280px] hover:scale-[1.02] transition-transform">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=100&h=100&fit=crop" alt="Advocate" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-zinc-900">Adv. Sharma</p>
                                    <p className="text-xs text-zinc-500">Corporate Law • 15 Yrs</p>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-full flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Available
                                </span>
                                <div className="flex items-center gap-0.5 text-yellow-500 text-xs font-bold ml-auto">
                                    <Star className="w-3 h-3 fill-current" /> 4.9
                                </div>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Card 2: Verified Profiles */}
                    <BentoCard
                        title="100% Verified Profiles"
                        description="Every lawyer is vetted manually to ensure valid credentials and bar council registration."
                        icon={CheckCircle2}
                    >
                        {/* Widget: Verified Badge UI */}
                        <div className="relative flex flex-col items-center justify-center p-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10">
                                <Shield className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-100/50 rounded-full animate-pulse"></div>
                            <div className="mt-4 bg-white px-3 py-1 rounded-full border border-zinc-200 shadow-sm flex items-center gap-1.5 z-10">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs font-semibold text-zinc-700">Credential Verified</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Card 3: 5-Star Reviews */}
                    <BentoCard
                        title="Client-First Experience"
                        description="Our platform ensures transparent communication and high satisfaction rates."
                        icon={Star}
                    >
                        {/* Widget: Review Snippet */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 w-[85%] rotate-[-2deg] hover:rotate-0 transition-transform">
                            <div className="flex text-yellow-500 gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                            </div>
                            <p className="text-xs text-zinc-600 italic">"The consultation was incredibly professional. Found the perfect lawyer in minutes."</p>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="w-5 h-5 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500">VP</div>
                                <span className="text-[10px] text-zinc-400">Verified Patient</span>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Card 4: Instant Booking */}
                    <BentoCard
                        title="Instant Booking"
                        description="Skip the phone tag. View real-time availability and book slots instantly."
                        icon={Calendar}
                        className="lg:col-span-2"
                    >
                        {/* Widget: Calendar UI */}
                        <div className="flex gap-4 items-center justify-center">
                            <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-3 w-[140px] hidden sm:block">
                                <div className="text-xs font-semibold text-center text-zinc-400 mb-2">August 2026</div>
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Mock Calendar Grid */}
                                    {Array.from({ length: 14 }).map((_, i) => (
                                        <div key={i} className={`h-4 rounded-sm ${i === 8 ? 'bg-blue-600' : 'bg-zinc-100'}`}></div>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 flex flex-col gap-2 w-[180px]">
                                <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 mb-1">
                                    <span>Tomorrow</span>
                                    <span className="text-blue-600">3 Slots</span>
                                </div>
                                <button className="w-full py-1.5 text-xs bg-blue-50 text-blue-700 font-medium rounded border border-blue-100 hover:bg-blue-100 transition-colors">10:00 AM</button>
                                <button className="w-full py-1.5 text-xs bg-white text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors">02:30 PM</button>
                                <button className="w-full py-1.5 text-xs bg-white text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors">04:15 PM</button>
                            </div>
                        </div>
                    </BentoCard>

                    {/* Card 5: Confidential */}
                    <BentoCard
                        title="Fully Confidential"
                        description="Your legal matters are private. We use bank-grade encryption for all data."
                        icon={Lock}
                    >
                        {/* Widget: Encryption Lock */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-3">
                                <Lock className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> E2E Encrypted
                            </div>
                        </div>
                    </BentoCard>

                    {/* Card 6: Affordable Plans */}
                    <BentoCard
                        title="Transparent Pricing"
                        description="No hidden fees. See consultation charges upfront before you book."
                        icon={TrendingUp}
                    >
                        {/* Widget: Price Tag/Chart */}
                        <div className="flex flex-col items-center w-full px-6">
                            <div className="w-full flex items-end gap-2 h-16 justify-center mb-2">
                                <div className="w-8 bg-zinc-200 rounded-t-md h-[40%]"></div>
                                <div className="w-8 bg-zinc-300 rounded-t-md h-[60%]"></div>
                                <div className="w-8 bg-zinc-800 rounded-t-md h-[100%] relative group cursor-pointer">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        ₹500
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-px bg-zinc-200"></div>
                            <div className="mt-2 text-xs font-semibold text-zinc-500">Market Standard Pricing</div>
                        </div>
                    </BentoCard>

                </div>
            </div>
        </section>
    );
};

export default TrustBentoGrid;
