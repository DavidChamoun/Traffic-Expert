import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'neutral'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-blue-50/60',
          border: 'border-blue-100',
          iconBg: 'bg-primary-50 text-primary-600',
          text: 'text-primary-950',
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/50',
          border: 'border-emerald-100',
          iconBg: 'bg-emerald-50 text-emerald-600',
          text: 'text-emerald-950',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/50',
          border: 'border-amber-100',
          iconBg: 'bg-amber-50 text-amber-600',
          text: 'text-amber-950',
        };
      case 'danger':
        return {
          bg: 'bg-rose-50/50',
          border: 'border-rose-100',
          iconBg: 'bg-rose-50 text-rose-600',
          text: 'text-rose-950',
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          iconBg: 'bg-gray-100 text-gray-700',
          text: 'text-gray-900',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`p-5 rounded-xl border ${styles.border} ${styles.bg} shadow-xs transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold mt-1 tracking-tight ${styles.text}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.iconBg} shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
