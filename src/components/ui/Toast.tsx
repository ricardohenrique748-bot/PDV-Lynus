import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = Date.now() + Math.random();
    set({ toasts: [...get().toasts, { id, kind, message }] });
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Avisos rápidos: toast.success('Salvo!') */
export const toast = {
  success: (m: string) => useToastStore.getState().push('success', m),
  error: (m: string) => useToastStore.getState().push('error', m),
  info: (m: string) => useToastStore.getState().push('info', m),
};

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const tones = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-brand-600',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 w-[calc(100%-2.5rem)] max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className="flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-brand-900/10 border border-slate-100 dark:border-slate-800 px-4 py-3 animate-in fade-in slide-in-from-bottom-2"
          >
            <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', tones[t.kind])} />
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" title="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
