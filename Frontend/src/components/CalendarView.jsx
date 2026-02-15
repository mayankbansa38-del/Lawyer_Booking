import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ selectedDate, onDateChange }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (selectedDate) {
            const newMonth = new Date(selectedDate);
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (newMonth.getMonth() !== currentMonth.getMonth() || newMonth.getFullYear() !== currentMonth.getFullYear()) {
                // eslint-disable-next-line
                setCurrentMonth(newMonth);
            }
        }
    }, [selectedDate, currentMonth]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentMonth(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentMonth(newDate);
    };

    const renderDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            // Compare just date parts for "today" highlight
            const today = new Date();
            const isToday = today.getDate() === day &&
                            today.getMonth() === month &&
                            today.getFullYear() === year;

            days.push(
                <button
                    key={day}
                    onClick={() => onDateChange(date)}
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'hover:bg-gray-100 text-gray-700'}
                        ${isToday && !isSelected ? 'text-blue-600 font-bold bg-blue-50 ring-1 ring-blue-100' : ''}
                    `}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm mx-auto sm:mx-0">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
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
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {renderDays()}
            </div>
        </div>
    );
}
