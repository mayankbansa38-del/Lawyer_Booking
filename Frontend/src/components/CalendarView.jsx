import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CalendarView — Availability-aware date picker.
 *
 * Props:
 *  - selectedDate: Date
 *  - onDateChange: (date: Date) => void
 *  - blockedDates: Array<{ startDate: string, endDate: string }> (UTC ISO strings from backend)
 *  - availability: Record<string, { enabled?: boolean, start: string, end: string }>
 *                  Keys MUST be lowercase day names (normalized at API boundary).
 */

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Extract 'YYYY-MM-DD' from a Date in LOCAL time, avoiding timezone drift. */
const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/** Extract 'YYYY-MM-DD' from a UTC ISO string WITHOUT timezone conversion. */
const toUTCDateString = (isoString) => {
    return isoString.slice(0, 10); // "2026-02-23T00:00:00.000Z" → "2026-02-23"
};

export default function CalendarView({ selectedDate, onDateChange, blockedDates = [], availability = {} }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date(selectedDate || Date.now());
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    // ─── Precompute blocked date SET (string keys, no timezone issues) ───
    const blockedDateSet = useMemo(() => {
        const set = new Set();
        blockedDates.forEach(period => {
            // Extract pure date strings from UTC ISO — NO timezone conversion.
            const startStr = toUTCDateString(period.startDate);
            const endStr = toUTCDateString(period.endDate);

            // Expand the range into individual date strings.
            const cursor = new Date(startStr + 'T00:00:00'); // Parse as local midnight
            const end = new Date(endStr + 'T00:00:00');
            while (cursor <= end) {
                set.add(toLocalDateString(cursor));
                cursor.setDate(cursor.getDate() + 1);
            }
        });
        return set;
    }, [blockedDates]);

    // ─── Pre-compute which day-of-week indices are enabled ───
    const enabledDays = useMemo(() => {
        const hasConfig = Object.keys(availability).length > 0;
        if (!hasConfig) return null; // null = no availability data, treat all as available
        const set = new Set();
        DAY_NAMES.forEach((name, idx) => {
            const config = availability[name];
            // Day is enabled if: config exists AND (enabled is missing OR enabled === true)
            if (config && config.enabled !== false) {
                set.add(idx);
            }
        });
        return set;
    }, [availability]);

    // ─── Today's date string (stable per render) ───
    const todayStr = useMemo(() => toLocalDateString(new Date()), []);

    // ─── Date-blocked checker ───
    const isDateBlocked = useCallback((dateStr, dayOfWeek) => {
        // 1. Check blocked periods (exact date match, timezone-safe)
        if (blockedDateSet.has(dateStr)) return true;

        // 2. Check day-of-week availability
        if (enabledDays !== null && !enabledDays.has(dayOfWeek)) return true;

        return false;
    }, [blockedDateSet, enabledDays]);

    // ─── Navigation ───
    const handlePrevMonth = () => {
        setCurrentMonth(prev => {
            const m = prev.month - 1;
            return m < 0
                ? { year: prev.year - 1, month: 11 }
                : { year: prev.year, month: m };
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => {
            const m = prev.month + 1;
            return m > 11
                ? { year: prev.year + 1, month: 0 }
                : { year: prev.year, month: m };
        });
    };

    // ─── Render grid ───
    const { year, month } = currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const selectedStr = selectedDate ? toLocalDateString(selectedDate) : null;
    const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const days = [];

    // Empty leading cells
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(<div key={`e-${i}`} className="h-10 w-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month, day).getDay();

        const isSelected = dateStr === selectedStr;
        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr; // String comparison works for YYYY-MM-DD
        const isBlocked = isDateBlocked(dateStr, dayOfWeek);
        const isDisabled = isPast || isBlocked;

        days.push(
            <button
                key={day}
                onClick={() => !isDisabled && onDateChange(new Date(year, month, day))}
                disabled={isDisabled}
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDisabled
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'hover:bg-gray-100 text-gray-700'}
                    ${isToday && !isSelected && !isDisabled ? 'text-blue-600 font-bold bg-blue-50 ring-1 ring-blue-100' : ''}
                `}
                title={isDisabled ? (isPast ? 'Past date' : 'Unavailable') : 'Available'}
            >
                {day}
            </button>
        );
    }

    return (
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm mx-auto sm:mx-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{monthLabel}</h3>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAY_HEADERS.map(d => (
                    <div key={d} className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {days}
            </div>
        </div>
    );
}
