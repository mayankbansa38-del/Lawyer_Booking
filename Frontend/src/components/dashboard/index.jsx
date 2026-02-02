/**
 * Shared Dashboard Components
 * Reusable UI components for both Lawyer and User dashboards
 * 
 * @module components/dashboard
 */

import { Link } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Calendar, Clock,
    MapPin, Phone, Mail, FileText, ChevronRight,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

/**
 * StatCard - Display statistics with trend indicator
 */
export function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) {
    const isPositive = trend === 'up';

    return (
        <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {Icon && (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                )}
            </div>
            {trendValue && (
                <div className={`flex items-center gap-1 mt-3 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{trendValue}% from last month</span>
                </div>
            )}
        </div>
    );
}

/**
 * AppointmentCard - Display appointment information
 */
export function AppointmentCard({ appointment, showClient = true, showLawyer = false, onAction }) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
        completed: 'bg-blue-100 text-blue-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const StatusIcon = {
        pending: AlertCircle,
        confirmed: CheckCircle,
        completed: CheckCircle,
        cancelled: XCircle
    }[appointment.status];

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                <img
                    src={showClient ? appointment.clientImage : appointment.lawyerImage}
                    alt={showClient ? appointment.clientName : appointment.lawyerName}
                    className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                            {showClient ? appointment.clientName : appointment.lawyerName}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[appointment.status]}`}>
                            <StatusIcon className="w-3 h-3" />
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{appointment.caseType}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(appointment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appointment.time}
                        </span>
                    </div>
                </div>
            </div>
            {appointment.status === 'pending' && onAction && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                        onClick={() => onAction('confirm', appointment.id)}
                        className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => onAction('reject', appointment.id)}
                        className="flex-1 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                        Reject
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * ClientCard - Display client information
 */
export function ClientCard({ client, onClick }) {
    return (
        <div
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                <img
                    src={client.image}
                    alt={client.name}
                    className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{client.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{client.location}</span>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
                <div>
                    <span className="text-gray-500">Appointments</span>
                    <p className="font-semibold text-gray-900">{client.totalAppointments}</p>
                </div>
                <div>
                    <span className="text-gray-500">Active Cases</span>
                    <p className="font-semibold text-gray-900">{client.activeCases}</p>
                </div>
            </div>
        </div>
    );
}

/**
 * CaseCard - Display case information
 */
export function CaseCard({ caseData, onClick }) {
    const priorityColors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800'
    };

    const statusColors = {
        active: 'bg-blue-100 text-blue-800',
        pending: 'bg-yellow-100 text-yellow-800',
        closed: 'bg-gray-100 text-gray-800'
    };

    return (
        <div
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{caseData.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{caseData.caseNumber}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[caseData.status]}`}>
                    {caseData.status.charAt(0).toUpperCase() + caseData.status.slice(1)}
                </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[caseData.priority]}`}>
                    {caseData.priority.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">{caseData.type}</span>
            </div>
            {caseData.nextHearing && (
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Next hearing: {new Date(caseData.nextHearing).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
            )}
        </div>
    );
}

/**
 * NotificationCard - Display notification
 */
export function NotificationCard({ notification, onMarkRead }) {
    const typeIcons = {
        appointment: Calendar,
        reminder: Clock,
        case: FileText,
        payment: CheckCircle
    };
    const Icon = typeIcons[notification.type] || AlertCircle;

    return (
        <div className={`p-4 rounded-xl border transition-colors ${notification.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <Icon className={`w-5 h-5 ${notification.read ? 'text-gray-500' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                {!notification.read && onMarkRead && (
                    <button
                        onClick={() => onMarkRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Mark read
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * EmptyState - Display when no data available
 */
export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-gray-500 mt-1 max-w-sm">{description}</p>
            {action && (
                <Link
                    to={action.href}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {action.label}
                </Link>
            )}
        </div>
    );
}

/**
 * PageHeader - Consistent page header for dashboard pages
 */
export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
    );
}
