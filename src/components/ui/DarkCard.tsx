import React from 'react';
import { cn } from '../../lib/utils';

interface DarkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const DarkCard: React.FC<DarkCardProps> = ({ children, className, glow, ...props }) => {
  return (
    <div 
      className={cn(
        "glass-card p-6 transition-all duration-300",
        glow && "amber-glow border-brand-accent/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
