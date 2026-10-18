import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { appointments, cases } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startingDayOfWeek = monthStart.getDay();
  const previousMonthDays = Array(startingDayOfWeek).fill(null);
  const allDays = [...previousMonthDays, ...daysInMonth];

  // Get appointments and case dates for the current month
  const dayEvents = useMemo(() => {
    const events: Record<string, { appointments: number; cases: number }> = {};
    
    // Count appointments per day
    appointments.forEach((apt) => {
      const dateStr = format(new Date(apt.date), 'yyyy-MM-dd');
      if (!events[dateStr]) events[dateStr] = { appointments: 0, cases: 0 };
      
      // All appointments are regular appointments now
      events[dateStr].appointments++;
    });
    
    // Count case next dates per day
    cases.forEach((c) => {
      const dateStr = format(new Date(c.nextDate), 'yyyy-MM-dd');
      if (!events[dateStr]) events[dateStr] = { appointments: 0, cases: 0 };
      events[dateStr].cases++;
    });
    
    return events;
  }, [appointments, cases, currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cardBg = theme === 'light'
    ? 'bg-white border-gray-200'
    : 'bg-[#18181b] border-white/10';
  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-400';
  const hoverBg = theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/10';

  return (
    <div className={`${cardBg} rounded-sm p-6 border`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`font-display text-lg font-semibold ${textPrimary}`}>{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            className={`p-1.5 ${hoverBg} rounded-sm transition-colors`}
          >
            <ChevronLeft size={18} strokeWidth={1.75} className={textSecondary} />
          </button>
          <button
            onClick={handleNextMonth}
            className={`p-1.5 ${hoverBg} rounded-sm transition-colors`}
          >
            <ChevronRight size={18} strokeWidth={1.75} className={textSecondary} />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map((day) => (
          <div key={day} className={`text-center text-xs font-semibold ${textSecondary} uppercase tracking-wide py-2`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, index) => {
          const dateStr = day ? format(day, 'yyyy-MM-dd') : '';
          const events = dateStr ? dayEvents[dateStr] : null;
          const hasEvents = events && (events.appointments > 0 || events.cases > 0);
          
          return (
            <div
              key={index}
              onClick={() => {
                if (day) {
                  navigate(`/events/${dateStr}`);
                }
              }}
              className={`aspect-square flex flex-col items-center justify-center rounded-sm text-sm font-mono-ui transition-colors duration-200 cursor-pointer relative group ${
                day === null
                  ? 'text-gray-600 cursor-default'
                  : isToday(day)
                    ? (theme === 'light' ? 'bg-gray-900 text-white font-semibold border border-gray-900' : 'bg-white/20 text-white font-semibold border border-white/30')
                    : isSameMonth(day, currentDate)
                      ? `${textPrimary} ${hoverBg} ${hasEvents ? (theme === 'light' ? 'border border-gray-300' : 'border border-white/20') : ''}`
                      : 'text-gray-600'
              }`}
            >
              <span className="relative z-10">{day ? format(day, 'd') : ''}</span>
              {hasEvents && day && (
                <div className="absolute bottom-1 flex gap-0.5 z-10 flex-wrap justify-center">
                  {events.appointments > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${events.appointments} appointment(s)`} />
                  )}
                  {events.cases > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${events.cases} case date(s)`} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend and Today indicator */}
      <div className={`mt-4 pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-cyber-blue/20'} space-y-3`}>
        {/* Add Event Button */}
        <button
          onClick={() => navigate('/appointments')}
          className={`w-full font-semibold text-sm py-3 rounded-sm transition-colors duration-150 border flex items-center justify-center gap-2 mb-3 ${
            theme === 'light' ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
          }`}
        >
          <CalendarIcon size={16} strokeWidth={1.75} />
          Add New Event
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className={`text-xs font-mono-ui ${textSecondary}`}>{format(new Date(), 'dd MMM yyyy').toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className={textSecondary}>Appointments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className={textSecondary}>Case Dates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
