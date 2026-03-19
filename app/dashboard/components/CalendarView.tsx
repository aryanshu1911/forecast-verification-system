'use client';

import React from 'react';

interface CalendarDay {
  date: string;
  day: number;
  hasData: boolean;
  accuracy?: number;
}

interface CalendarViewProps {
  month: number; // 6 for June
  year: number;  // 2025
  availableDates: string[]; // Array of dates with data (YYYY-MM-DD)
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export default function CalendarView({
  month,
  year,
  availableDates,
  selectedDate,
  onDateSelect
}: CalendarViewProps) {
  
  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasData = availableDates.includes(dateStr);
      
      days.push({
        date: dateStr,
        day,
        hasData,
        accuracy: undefined // Will be populated if needed
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  
  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  // Ensure year and month are valid numbers
  const validYear = Number.isFinite(year) ? year : new Date().getFullYear();
  const validMonth = Number.isFinite(month) && month >= 1 && month <= 12 ? month : 1;
  const firstDayOfWeek = new Date(validYear, validMonth - 1, 1).getDay();
  
  // Create empty cells for days before month starts (ensure valid array length)
  const emptyCellCount = Number.isFinite(firstDayOfWeek) && firstDayOfWeek >= 0 ? firstDayOfWeek : 0;
  const emptyCells = Array(emptyCellCount).fill(null);

  const getDateClassName = (day: CalendarDay) => {
    const baseClasses = "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all cursor-pointer";
    
    if (!day.hasData) {
      return `${baseClasses} bg-gray-100 text-gray-900 font-bold cursor-not-allowed opacity-50`;
    }
    
    if (selectedDate === day.date) {
      return `${baseClasses} bg-blue-600 text-white shadow-lg scale-105`;
    }
    
    // Default: has data but not selected
    return `${baseClasses} bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[month - 1]} {year}
        </h2>
        <p className="text-sm text-black font-bold mt-1">
          Click on a date to view detailed verification results
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-bold text-black py-2"
          >
            {dayName}
          </div>
        ))}

        {/* Empty cells before month starts */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => (
          <div
            key={day.date}
            className={getDateClassName(day)}
            onClick={() => day.hasData && onDateSelect(day.date)}
          >
            <span>{day.day}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200"></div>
          <span className="text-black font-bold">Has Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-blue-600 bg-blue-600"></div>
          <span className="text-black font-bold">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-gray-300 bg-white"></div>
          <span className="text-black font-bold">No Data</span>
        </div>
      </div>
    </div>
  );
}
