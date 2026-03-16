import React, { useState } from 'react';
import { Download, FileText, Scale, Gavel, Search, Bell, ChevronRight, Calendar, Landmark } from 'lucide-react';

const notifications = [
    {
        id: 1,
        title: "Guidelines for virtual hearings in civil matters",
        source: "Supreme Court",
        date: "March 2, 2026",
        icon: Scale,
        type: "Guideline",
    },
    {
        id: 2,
        title: "Revised roster for listing of regular hearing matters",
        source: "Himachal Pradesh HC",
        date: "February 28, 2026",
        icon: Gavel,
        type: "Roster",
    },
    {
        id: 3,
        title: "Standard Operating Procedure for e-Filing 3.0",
        source: "Tribunals",
        date: "February 25, 2026",
        icon: FileText,
        type: "SOP",
    },
    {
        id: 4,
        title: "Circular regarding physical functioning of lower courts",
        source: "Supreme Court",
        date: "February 20, 2026",
        icon: Landmark,
        type: "Circular",
    },
    {
        id: 5,
        title: "Practice directions for commercial disputes resolution",
        source: "Himachal Pradesh HC",
        date: "February 15, 2026",
        icon: Scale,
        type: "Directive",
    },
    {
        id: 6,
        title: "Notification on revised court fees for tribunals",
        source: "Tribunals",
        date: "February 10, 2026",
        icon: FileText,
        type: "Notification",
    },
];

const sourceColors = {
    "Supreme Court": {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-100",
        dot: "bg-red-500",
        iconBg: "group-hover:bg-red-50",
        iconText: "group-hover:text-red-600",
        iconBorder: "group-hover:border-red-100",
        hoverShadow: "hover:shadow-red-100/60",
        hoverBorder: "hover:border-red-200",
    },
    "Himachal Pradesh HC": {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-100",
        dot: "bg-emerald-500",
        iconBg: "group-hover:bg-emerald-50",
        iconText: "group-hover:text-emerald-600",
        iconBorder: "group-hover:border-emerald-100",
        hoverShadow: "hover:shadow-emerald-100/60",
        hoverBorder: "hover:border-emerald-200",
    },
    "Tribunals": {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-100",
        dot: "bg-amber-500",
        iconBg: "group-hover:bg-amber-50",
        iconText: "group-hover:text-amber-600",
        iconBorder: "group-hover:border-amber-100",
        hoverShadow: "hover:shadow-amber-100/60",
        hoverBorder: "hover:border-amber-200",
    },
};

const filterIcons = {
    "All": Bell,
    "Supreme Court": Landmark,
    "Himachal Pradesh HC": Gavel,
    "Tribunals": FileText,
};

const LegalNotifications = () => {
    const [filter, setFilter] = useState("All");
    const filters = ["All", "Supreme Court", "Himachal Pradesh HC", "Tribunals"];

    const filteredNotifications = filter === "All"
        ? notifications
        : notifications.filter(n => n.source === filter);

    return (
        <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50/80 to-white relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/20 rounded-full blur-3xl translate-y-1/2" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <div className="mb-10 sm:mb-14 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wider mb-5">
                        <Bell className="w-3.5 h-3.5" />
                        Legal Updates
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3 tracking-tight leading-tight">
                        Latest <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Notifications & Orders</span>
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                        Stay updated with the latest court orders, circulars, and notifications from all major courts and tribunals.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
                    {filters.map((f) => {
                        const FilterIcon = filterIcons[f];
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`group/btn flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${filter === f
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-105"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                            >
                                <FilterIcon className={`w-3.5 h-3.5 ${filter === f ? 'text-blue-100' : 'text-slate-400 group-hover/btn:text-slate-500'}`} />
                                {f}
                            </button>
                        );
                    })}
                </div>

                {/* List View */}
                <div className="flex flex-col gap-3 sm:gap-4">
                    {filteredNotifications.map((notification, index) => {
                        const colors = sourceColors[notification.source];
                        return (
                            <div
                                key={notification.id}
                                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 bg-white/80 backdrop-blur-sm border border-slate-200/80 p-4 sm:p-5 rounded-2xl transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl ${colors.hoverShadow} ${colors.hoverBorder} cursor-pointer`}
                                style={{ animationDelay: `${index * 80}ms` }}
                            >
                                {/* Hover gradient overlay */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-50/0 via-blue-50/0 to-indigo-50/0 group-hover:from-blue-50/40 group-hover:via-transparent group-hover:to-indigo-50/30 transition-all duration-500 pointer-events-none" />

                                {/* Left Icon Container */}
                                <div className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 flex items-center justify-center ${colors.iconBg} ${colors.iconText} ${colors.iconBorder} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                                    <notification.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>

                                {/* Center Content */}
                                <div className="relative flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${colors.bg} ${colors.text} border ${colors.border} text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                            {notification.source}
                                        </span>
                                        <span className={`inline-block px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] sm:text-xs font-medium rounded-full border border-slate-100`}>
                                            {notification.type}
                                        </span>
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug group-hover:text-slate-900 transition-colors mb-1">
                                        {notification.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-xs font-medium">{notification.date}</span>
                                    </div>
                                </div>

                                {/* Right Action Button */}
                                <div className="relative w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 flex justify-end sm:flex-shrink-0">
                                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-300 group-hover:from-blue-700 group-hover:to-indigo-700">
                                        <Download className="w-4 h-4" />
                                        <span>Download PDF</span>
                                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA */}
                <div className="mt-10 sm:mt-12 text-center">
                    <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 rounded-full transition-all duration-300 hover:shadow-md hover:shadow-blue-100/50 group/cta">
                        View All Notifications
                        <ChevronRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default LegalNotifications;
