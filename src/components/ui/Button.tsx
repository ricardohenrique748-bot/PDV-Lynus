import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shortcut?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      shortcut,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-900/20 active:bg-brand-800',
      secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:bg-transparent dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm active:bg-red-800',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm active:bg-emerald-800',
      ghost: 'hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300',
    };

    const sizes = {
      sm: 'text-xs h-8 px-3 rounded-lg gap-1.5',
      md: 'text-sm h-10 px-4 rounded-xl gap-2 font-semibold',
      lg: 'text-base h-12 px-6 rounded-xl gap-2.5 font-semibold',
      icon: 'h-10 w-10 rounded-xl p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        {shortcut && (
          <span className="ml-2 font-mono text-[10px] tracking-wider uppercase opacity-75 bg-black/15 dark:bg-white/20 px-1.5 py-0.5 rounded">
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

