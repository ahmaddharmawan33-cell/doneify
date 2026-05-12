import React from 'react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface DeadlinePickerProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

const DAYS = [
  { label: 'Sen', value: 1 },
  { label: 'Sel', value: 2 },
  { label: 'Rab', value: 3 },
  { label: 'Kam', value: 4 },
  { label: 'Jum', value: 5 },
  { label: 'Sab', value: 6 },
  { label: 'Min', value: 0 },
];

export function DeadlinePicker({ value, onChange, className }: DeadlinePickerProps) {
  const [showCustom, setShowCustom] = React.useState(false);

  const setDay = (dayIndex: number) => {
    const now = new Date();
    const result = new Date(now);
    const currentDay = now.getDay(); // 0 is Sunday
    
    let diff = dayIndex - currentDay;
    if (diff < 0) diff += 7; // If day passed, set to next week
    
    result.setDate(now.getDate() + diff);
    result.setHours(23, 59, 0, 0);
    onChange(result.toISOString().slice(0, 16));
    setShowCustom(false);
  };

  const isSelected = (dayIndex: number) => {
    if (!value) return false;
    const d = new Date(value);
    return d.getDay() === dayIndex && !showCustom;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {DAYS.map((day) => (
          <button
            key={day.label}
            type="button"
            onClick={() => setDay(day.value)}
            className={cn(
              "flex-1 min-w-[45px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
              isSelected(day.value)
                ? "bg-amber-500 border-amber-500 text-brand-background shadow-lg shadow-amber-500/20"
                : "bg-brand-surface border-brand-border text-brand-text-secondary hover:border-amber-500/50"
            )}
          >
            {day.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2",
            showCustom
              ? "bg-amber-500 border-amber-500 text-brand-background shadow-lg shadow-amber-500/20"
              : "bg-brand-surface border-brand-border text-brand-text-secondary hover:border-amber-500/50"
          )}
        >
          <CalendarIcon size={12} />
          <span>Custom</span>
        </button>
      </div>

      {showCustom && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-brand-background border border-brand-border rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
          />
        </motion.div>
      )}
    </div>
  );
}
