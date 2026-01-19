import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6'
};

export function GlassCard({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md'
}: GlassCardProps) {
  const baseClasses = 'glass transition-all duration-200';
  const hoverClasses = hover ? 'glass-hover cursor-pointer' : '';
  const paddingClass = paddingClasses[padding];

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${paddingClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: ReactNode;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon }: StatCardProps) {
  const changeColorClass = {
    positive: 'text-positive',
    negative: 'text-negative',
    neutral: 'text-neutral'
  }[changeType];

  return (
    <GlassCard className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">{label}</span>
        {icon && <span className="text-white/30">{icon}</span>}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {change && (
        <div className={`text-sm font-medium ${changeColorClass}`}>
          {change}
        </div>
      )}
    </GlassCard>
  );
}
