import React from 'react';
import { cn } from '../../lib/utils';

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  className?: string;
  showText?: boolean;
}

export const StatBar: React.FC<StatBarProps> = ({ 
  label, 
  value, 
  max, 
  color, 
  className,
  showText = true 
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-semibold text-brand-accent uppercase tracking-widest">{label}</span>
        {showText && <span className="text-xs font-mono text-brand-text-secondary">{value}/{max}</span>}
      </div>
      <div className="h-1.5 w-full bg-brand-border rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
