import React from 'react';
import { cn } from '@/utils/cn';

type Tone = 'brand' | 'emerald' | 'amber' | 'red' | 'sky' | 'violet';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  hint?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}

/** Card de indicador (KPI) usado no topo das páginas */
export function StatCard({ label, value, icon: Icon, tone = 'brand', hint, onClick, active }: StatCardProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl bg-white dark:bg-slate-900 shadow-soft p-4 flex items-center gap-4 transition-all',
        onClick && 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-900/5',
        active && 'ring-2 ring-brand-500/40'
      )}
    >
      <span className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', tones[tone])}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight mt-0.5 truncate">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{hint}</p>}
      </div>
    </Comp>
  );
}

/** Avatar quadrado com iniciais e cor estável por texto */
const avatarTones = [
  'bg-brand-50 text-brand-700',
  'bg-sky-50 text-sky-700',
  'bg-amber-50 text-amber-700',
  'bg-violet-50 text-violet-700',
  'bg-emerald-50 text-emerald-700',
  'bg-rose-50 text-rose-700',
];

export function InitialsAvatar({ text, seed, className }: { text: string; seed?: string; className?: string }) {
  const key = seed ?? text;
  const hash = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  const initials = text
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 dark:bg-slate-800 dark:text-slate-200',
        avatarTones[hash % avatarTones.length],
        className
      )}
    >
      {initials || '?'}
    </span>
  );
}
