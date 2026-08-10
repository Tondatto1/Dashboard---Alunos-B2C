import React from 'react';
import { Status } from '../types';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: Status;
  onClick?: (e: React.MouseEvent) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const STATUS_CONFIG: Record<Status, {
  label: string;
  bg: string;
  text: string;
  border: string;
  hover: string;
  icon: React.ElementType;
}> = {
  pendente: {
    label: 'Pendente',
    bg: 'bg-amber-100/90',
    text: 'text-amber-950 font-extrabold',
    border: 'border-amber-300',
    hover: 'hover:bg-amber-200 hover:border-amber-400',
    icon: AlertCircle,
  },
  em_progresso: {
    label: 'Em Progresso',
    bg: 'bg-blue-100/90',
    text: 'text-blue-950 font-extrabold',
    border: 'border-blue-300',
    hover: 'hover:bg-blue-200 hover:border-blue-400',
    icon: Clock,
  },
  concluido: {
    label: 'Concluído',
    bg: 'bg-emerald-100/90',
    text: 'text-emerald-950 font-extrabold',
    border: 'border-emerald-300',
    hover: 'hover:bg-emerald-200 hover:border-emerald-400',
    icon: CheckCircle2,
  },
};

export function StatusBadge({
  status,
  onClick,
  interactive = true,
  size = 'md',
  showLabel = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] font-extrabold gap-1',
    md: 'px-3 py-1.5 text-xs font-extrabold gap-1.5',
    lg: 'px-4 py-2 text-sm font-extrabold gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      id={`status-badge-${status}`}
      className={`
        inline-flex items-center justify-center rounded-full border shadow-2xs transition-all duration-150 select-none
        ${config.bg} ${config.text} ${config.border}
        ${interactive ? `${config.hover} cursor-pointer active:scale-95 hover:shadow-xs` : 'cursor-default'}
        ${sizeClasses}
      `}
      title={interactive ? `Clique para alterar status (Atual: ${config.label})` : config.label}
    >
      <Icon className={`${iconSizes} shrink-0 opacity-90`} />
      {showLabel && <span className="whitespace-nowrap tracking-tight">{config.label}</span>}
    </button>
  );
}
