import React, { useState } from 'react';
import { Download, FileText, Scale, Gavel, Search, Bell, ChevronRight, Calendar, Landmark } from 'lucide-react';
import causeListPdf from '../assets/Notification PDF/Causelist031320261773388784.pdf';
import motorAccidentPdf from '../assets/Notification PDF/Motor Accident Claim.pdf';
import lettersAdjournmentPdf from '../assets/Notification PDF/letters seeking adjournment.pdf';
import seniorAdvocatePdf from '../assets/Notification PDF/Advocates as Senior Advocate.pdf';
import reclaimSCStatusPdf from '../assets/Notification PDF/Reclaim SC Status.pdf';

const notifications = [
    {
        id: 1,
        title: "Circular regarding procedure/modalities relating to circulation of letters seeking adjournment",
        source: "Supreme Court",
        date: "March 18, 2026",
        icon: Scale,
        type: "Circular",
        description: "Official circular detailing the new modalities for seeking adjournments via circulation of letters.",
        pdfUrl: lettersAdjournmentPdf,
    },
    {
        id: 2,
        title: "Causelist of Lok Adalat to be held on 14th March, 2026.",
        source: "Himachal Pradesh HC",
        date: "March 13, 2026",
        icon: FileText,
        type: "Causelist",
        description: "Official causelist for the upcoming Lok Adalat.",
        pdfUrl: causeListPdf,
    },
    {
        id: 3,
        title: "Suggestions/views of other stakeholders in the proposal of designation of Advocates as Senior Advocates",
        source: "Supreme Court",
        date: "February 20, 2026",
        icon: Landmark,
        type: "Proposal",
        description: "Request for suggestions and views regarding the designation of Advocates as Senior Advocates.",
        pdfUrl: seniorAdvocatePdf,
    },
    {
        id: 4,
        title: "Redistribute/reattach district wise Police Stations of the Civil and Sessions Division, Kullu to the Motor Accident Claim Tribunal(s)",
        source: "Himachal Pradesh HC",
        date: "March 16, 2026",
        icon: Scale,
        type: "Directive",
        description: "Official directive regarding redistribution of police stations to Motor Accident Claim Tribunals.",
        pdfUrl: motorAccidentPdf,
    },
    {
        id: 5,
        title: "Converted Dalit Reclaim Scheduled Caste Status After Re-Conversion",
        source: "Supreme Court",
        date: "March 16, 2026",
        icon: Landmark,
        type: "Notification",
        description: "Supreme Court notification regarding reclaiming Scheduled Caste status after re-conversion.",
        pdfUrl: reclaimSCStatusPdf,
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
};

const filterIcons = {
    "All": Bell,
    "Supreme Court": Landmark,
    "Himachal Pradesh HC": Gavel,
};

const LegalNotifications = () => {
    const [filter, setFilter] = useState("All");
    const filters = ["All", "Supreme Court", "Himachal Pradesh HC"];

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
                        Stay updated with the latest court orders, circulars, and notifications from all major courts.
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
                                    {notification.description && (
                                        <p className="text-xs sm:text-sm text-slate-500 mb-2 line-clamp-2">
                                            {notification.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-xs font-medium">{notification.date}</span>
                                    </div>
                                </div>

                                {/* Right Action Button */}
                                <div className="relative w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 flex justify-end sm:flex-shrink-0">
                                    <a
                                        href={notification.pdfUrl || "#"}
                                        target={notification.pdfUrl ? "_blank" : undefined}
                                        rel={notification.pdfUrl ? "noopener noreferrer" : undefined}
                                        onClick={(e) => {
                                            if (!notification.pdfUrl) {
                                                e.preventDefault();
                                                alert("PDF document is currently unavailable.");
                                            }
                                        }}
                                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 font-semibold text-xs sm:text-sm rounded-xl transition-all duration-300 ${notification.pdfUrl
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 group-hover:from-blue-700 group-hover:to-indigo-700"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>View PDF</span>
                                        {notification.pdfUrl && <ChevronRight className="w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default LegalNotifications;
