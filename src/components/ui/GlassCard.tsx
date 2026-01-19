import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6'
};

// Renamed from GlassCard but keeping export name for compatibility
export function GlassCard({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md'
}: CardProps) {
  const baseClasses = hover ? 'card-interactive' : 'card';
  const paddingClass = paddingClasses[padding];

  return (
    <div
      className={`${baseClasses} ${paddingClass} ${className}`}
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
  subtitle?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', icon, subtitle }: StatCardProps) {
  const changeConfig = {
    positive: {
      color: 'text-[var(--color-positive)]',
      bg: 'bg-[var(--color-positive-bg)]',
      Icon: TrendingUp
    },
    negative: {
      color: 'text-[var(--color-negative)]',
      bg: 'bg-[var(--color-negative-bg)]',
      Icon: TrendingDown
    },
    neutral: {
      color: 'text-[var(--color-accent)]',
      bg: 'bg-[var(--color-accent-bg)]',
      Icon: null
    }
  };

  const config = changeConfig[changeType];

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeType === 'positive' ? 'positive' : changeType === 'negative' ? 'negative' : ''}`}>
          {config.Icon && <config.Icon className="w-3.5 h-3.5" />}
          {change}
        </div>
      )}
      {subtitle && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
