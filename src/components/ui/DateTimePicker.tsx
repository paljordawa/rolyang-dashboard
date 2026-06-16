'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from './button';

interface DateTimePickerProps {
  value: string | null;
  onChange: (val: string | null) => void;
  label?: string;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date & time...'
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for calendar navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  // Local state for time inputs (hour/minute in local time)
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize inputs from value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setHours(String(d.getHours()).padStart(2, '0'));
        setMinutes(String(d.getMinutes()).padStart(2, '0'));
        setCurrentMonth(d);
      }
    }
  }, [value]);

  // Handle click outside to close the picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay(); // 0 is Sunday, 6 is Saturday
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(year, month, day);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: string) => {
    const padded = val.padStart(2, '0');
    if (type === 'hours') {
      setHours(padded);
    } else {
      setMinutes(padded);
    }

    // Update the selected datetime if we already have a selected date
    const baseDate = value ? new Date(value) : new Date();
    const newDate = new Date(baseDate);
    newDate.setHours(type === 'hours' ? parseInt(val) : parseInt(hours));
    newDate.setMinutes(type === 'minutes' ? parseInt(val) : parseInt(minutes));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate.toISOString());
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  // Generate calendar days
  const daysInCurrentMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const dayCells = [];

  // Prev month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    dayCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    dayCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month filler days
  const totalCells = dayCells.length > 35 ? 42 : 35;
  const remainingCells = totalCells - dayCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    dayCells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  // Check if a cell date matches the selected date
  const isSelected = (cellDate: Date) => {
    if (!value) return false;
    const selected = new Date(value);
    return (
      cellDate.getDate() === selected.getDate() &&
      cellDate.getMonth() === selected.getMonth() &&
      cellDate.getFullYear() === selected.getFullYear()
    );
  };

  // Check if cell is today
  const isToday = (cellDate: Date) => {
    const today = new Date();
    return (
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear()
    );
  };

  const formattedDisplay = () => {
    if (!value) return placeholder;
    const d = new Date(value);
    if (isNaN(d.getTime())) return placeholder;
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Generate hours array (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  // Generate minutes array (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative w-full flex flex-col gap-1.5" ref={containerRef}>
      {label && <label className="text-xs font-semibold text-zinc-400">{label}</label>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-black/40 border border-white/10 hover:border-white/20 transition-all rounded-lg cursor-pointer h-10 select-none text-sm text-white"
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarDays className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className={!value ? 'text-zinc-500' : 'text-zinc-100 font-medium'}>
            {formattedDisplay()}
          </span>
        </div>
        {value && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[105%] left-0 z-50 w-[290px] p-4 bg-zinc-950/95 border border-white/10 backdrop-blur-md rounded-xl shadow-2xl animate-in fade-in-50 slide-in-from-top-2 duration-150">
          
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-zinc-400 hover:text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekdayNames.map((name) => (
              <span key={name} className="text-[10px] font-bold text-zinc-500 uppercase">
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayCells.map((cell, idx) => {
              const selected = isSelected(cell.date);
              const today = isToday(cell.date);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => cell.isCurrentMonth && handleDaySelect(cell.day)}
                  disabled={!cell.isCurrentMonth}
                  className={`
                    h-7 text-xs flex items-center justify-center font-medium rounded-lg transition-all
                    ${!cell.isCurrentMonth ? 'text-zinc-700 cursor-default' : 'text-zinc-300'}
                    ${cell.isCurrentMonth && !selected && 'hover:bg-indigo-500/20 hover:text-white'}
                    ${today && cell.isCurrentMonth && !selected ? 'border border-indigo-500/40 text-indigo-400' : ''}
                    ${selected ? 'bg-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Time Picker Footer */}
          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-500" /> Time
            </span>
            <div className="flex items-center gap-1">
              <select
                value={hours}
                onChange={(e) => handleTimeChange('hours', e.target.value)}
                className="bg-black/40 border border-white/10 text-white rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-indigo-500"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h} className="bg-zinc-950 text-white">
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-500">:</span>
              <select
                value={minutes}
                onChange={(e) => handleTimeChange('minutes', e.target.value)}
                className="bg-black/40 border border-white/10 text-white rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-indigo-500"
              >
                {minuteOptions.map((m) => (
                  <option key={m} value={m} className="bg-zinc-950 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 text-[10px] px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
