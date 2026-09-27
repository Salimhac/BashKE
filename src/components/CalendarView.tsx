import React, { useState } from 'react';
import type { PublicUser } from '../types';
import { Cake, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

interface CalendarViewProps {
  users: PublicUser[];
  todayDate: string; // YYYY-MM-DD
  onSelectUser: (user: PublicUser) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  users,
  todayDate,
  onSelectUser,
}) => {
  // Parse today's date: YYYY-MM-DD
  const [todayYear, todayMonthStr, todayDayStr] = (todayDate || '2026-09-24').split('-');
  const initialMonth = parseInt(todayMonthStr || '9', 10) - 1;
  const initialYear = parseInt(todayYear || '2026', 10);
  const initialDay = parseInt(todayDayStr || '24', 10);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Month formatted as 2-digit MM
  const monthFormatted = String(currentMonth + 1).padStart(2, '0');

  // Match users whose birthday falls in this month
  const celebrantsByDay: Record<number, PublicUser[]> = {};
  users.forEach((u) => {
    if (u.birthMonth === currentMonth + 1 && u.birthDay) {
      if (!celebrantsByDay[u.birthDay]) celebrantsByDay[u.birthDay] = [];
      celebrantsByDay[u.birthDay].push(u);
    }
  });

  const selectedDateString = selectedDay
    ? `${currentYear}-${monthFormatted}-${String(selectedDay).padStart(2, '0')}`
    : null;

  const celebrantsOnSelectedDay = selectedDay ? celebrantsByDay[selectedDay] || [] : [];
  const isSelectedDayToday = selectedDateString === todayDate;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Community Horizon</span>
            <span aria-hidden="true">·</span>
            <span>Annual Celebration Map</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-serif-display text-stone-900 mt-0.5 sm:mt-1">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(initialMonth);
              setCurrentYear(initialYear);
              setSelectedDay(initialDay);
            }}
            className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-stone-100">
        {/* Calendar Grid (col-span-2) */}
        <div className="lg:col-span-2 p-3 sm:p-6">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-400 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-11 sm:h-14 rounded-lg sm:rounded-xl bg-stone-50/50" />
            ))}

            {/* Actual Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateString = `${currentYear}-${monthFormatted}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateString === todayDate;
              const isSelected = selectedDay === dayNum;
              const celebrants = celebrantsByDay[dayNum] || [];
              const hasCelebrants = celebrants.length > 0;

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`relative h-11 sm:h-14 p-1 sm:p-1.5 rounded-lg sm:rounded-xl text-left flex flex-col justify-between transition-all border ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-300/40'
                      : isToday
                      ? 'border-amber-300 bg-amber-50/20 hover:bg-amber-50/40'
                      : 'border-stone-100 hover:border-stone-200 hover:bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[10px] sm:text-xs font-medium tabular-nums ${
                        isToday
                          ? 'w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px] sm:text-[11px]'
                          : isSelected
                          ? 'text-amber-900 font-bold'
                          : 'text-stone-700'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {hasCelebrants && (
                      <span className="text-[9px] sm:text-[10px] text-amber-700 font-medium flex items-center gap-0.5">
                        <Cake className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
                        <span className="tabular-nums">{celebrants.length}</span>
                      </span>
                    )}
                  </div>

                  {hasCelebrants ? (
                    <div className="text-[9px] sm:text-[10px] text-stone-600 truncate font-sans hidden sm:block">
                      {celebrants[0].displayName}
                      {celebrants.length > 1 && ` +${celebrants.length - 1}`}
                    </div>
                  ) : (
                    <div />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cake className="w-3 h-3 text-amber-600" />
              <span>Celebrating Member</span>
            </div>
          </div>
        </div>

        {/* Selected Day Details Panel (col-span-1) */}
        <div className="p-4 sm:p-6 bg-stone-50/40 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-stone-200/70">
              <span className="text-xs text-stone-400 font-mono uppercase">Day Details</span>
              <h3 className="text-base sm:text-lg font-bold font-serif-display text-stone-900 mt-0.5">
                {selectedDay ? `${MONTH_NAMES[currentMonth]} ${selectedDay}, ${currentYear}` : 'Select a date'}
              </h3>
              {isSelectedDayToday && (
                <div className="mt-1 text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Today</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                Celebrating Members ({celebrantsOnSelectedDay.length})
              </div>

              {celebrantsOnSelectedDay.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                  <p>No member birthdays recorded on this date.</p>
                  <p className="text-[11px] text-stone-400">
                    Select days with birthday cake markers to view celebrants.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {celebrantsOnSelectedDay.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => onSelectUser(u)}
                      className="p-3 bg-white rounded-xl border border-stone-200/80 hover:border-amber-300 hover:shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-stone-900 truncate">
                          {u.displayName}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {u.isBirthdayToday ? 'Celebrating today!' : 'Upcoming celebration'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 whitespace-nowrap active:scale-95 cursor-pointer shrink-0"
                      >
                        <span>View Board</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200/70 text-[11px] text-stone-500 leading-relaxed">
            Birthday boards unlock automatically on each member's actual birthday date to celebrate together with sincere wishes.
          </div>
        </div>
      </div>
    </div>
  );
};
