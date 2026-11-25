import { useId } from 'react';
import { cn } from '@/utils/cn';

interface LogoMarkProps {
  className?: string;
}

/** Ícone: barras ascendentes azuis com seta de crescimento */
export function LogoMark({ className }: LogoMarkProps) {
  const id = useId().replace(/:/g, '');
  const grad = `lynus-bar-${id}`;

  return (
    <svg viewBox="0 0 48 40" className={cn('lynus-mark w-10 h-8 overflow-visible text-sky-600 dark:text-sky-200', className)} aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7cc4ff" />
          <stop offset="55%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#0b4f9c" />
        </linearGradient>
      </defs>
      <rect className="lynus-bar" x="2" y="27" width="7" height="11" rx="1" fill={`url(#${grad})`} />
      <rect className="lynus-bar" x="12" y="21" width="7" height="17" rx="1" fill={`url(#${grad})`} />
      <rect className="lynus-bar" x="22" y="15" width="7" height="23" rx="1" fill={`url(#${grad})`} />
      <rect className="lynus-bar" x="32" y="8" width="7" height="30" rx="1" fill={`url(#${grad})`} />
      {/* Seta de crescimento */}
      <path
        className="lynus-arrow"
        pathLength={1}
        d="M3 22 L14 15 L24 10 L36 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path className="lynus-arrow-head" d="M32.5 2.2 L38.5 1.8 L36.2 7.2 Z" fill="currentColor" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Mostra apenas o ícone (ex.: sidebar recolhida) */
  iconOnly?: boolean;
  size?: 'sm' | 'lg';
  /** Animação de entrada (barras sobem, seta é desenhada, texto desliza) + brilho contínuo */
  animated?: boolean;
  /** Ícone acima do texto, tudo centralizado (ex.: tela de login) */
  stacked?: boolean;
}

/** Logo completa: LYNUS / PDV */
export function Logo({ className, iconOnly = false, size = 'sm', animated = true, stacked = false }: LogoProps) {
  const isLg = size === 'lg';
  const markSize = isLg ? 'w-14 h-12' : 'w-10 h-8';

  if (iconOnly) {
    return (
      <div className={cn(animated && 'lynus-logo-animated', className)}>
        <LogoMark className={markSize} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center',
        stacked ? 'flex-col gap-3' : isLg ? 'gap-3' : 'gap-2',
        animated && 'lynus-logo-animated',
        className
      )}
    >
      <LogoMark className={cn('shrink-0', markSize)} />
      <div className={cn('flex flex-col leading-none', stacked && 'items-stretch text-center')}>
        <span
          className={cn(
            'lynus-name font-bold text-slate-800 dark:text-white tracking-[0.12em]',
            // compensa o espaçamento extra após a última letra para centralizar de verdade
            stacked && 'pl-[0.12em]',
            isLg ? 'text-3xl' : 'text-xl'
          )}
        >
          LYNUS
        </span>
        <span
          className={cn(
            'lynus-tag font-semibold text-orange-500 dark:text-orange-400 tracking-[0.45em]',
            stacked && 'pl-[0.45em]',
            !animated && 'border-t border-slate-600/70',
            isLg ? 'mt-1 pt-1 text-sm' : 'mt-0.5 pt-0.5 text-[10px]'
          )}
        >
          PDV
        </span>
      </div>
    </div>
  );
}
