import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X, AlertTriangle, PackageCheck, DollarSign, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

type NotificationType = 'warning' | 'success' | 'finance' | 'info';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
}

const STORAGE_KEY = 'lynus.notifications';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const SEED: AppNotification[] = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Estoque baixo',
    message: '5 produtos estão abaixo do estoque mínimo.',
    date: minutesAgo(12),
    read: false,
    link: '/inventory',
  },
  {
    id: 'n2',
    type: 'success',
    title: 'NF-e de entrada processada',
    message: 'NF #4490 (Ambev S.A.) lançada no estoque.',
    date: minutesAgo(95),
    read: false,
    link: '/purchases',
  },
  {
    id: 'n3',
    type: 'finance',
    title: 'Contas a pagar vencendo',
    message: '3 títulos vencem nos próximos 2 dias.',
    date: minutesAgo(60 * 5),
    read: false,
    link: '/financial',
  },
];

const icons: Record<NotificationType, { icon: React.ElementType; cls: string }> = {
  warning: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400' },
  success: { icon: PackageCheck, cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' },
  finance: { icon: DollarSign, cls: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400' },
  info: { icon: Info, cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
};

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppNotification[];
  } catch {
    /* ignore */
  }
  return SEED;
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? 's' : ''}`;
}

export function NotificationsMenu({ buttonClassName }: { buttonClassName: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(load);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = (id: string) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const remove = (id: string) => setItems((prev) => prev.filter((n) => n.id !== id));
  const clearAll = () => setItems([]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
        title="Notificações"
        aria-expanded={open}
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Notificações</p>
              <p className="text-[11px] text-slate-400">
                {unread > 0 ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia'}
              </p>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  disabled={unread === 0}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Ler todas
                </button>
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                  title="Limpar todas as notificações"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Nenhuma notificação</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((n) => {
                  const { icon: Icon, cls } = icons[n.type];
                  const content = (
                    <div className="flex gap-3">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cls)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 pr-5">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {n.title}
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.date)}</p>
                      </div>
                    </div>
                  );
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        'relative group px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                        !n.read && 'bg-brand-50/40 dark:bg-slate-800/30'
                      )}
                    >
                      {n.link ? (
                        <Link
                          to={n.link}
                          onClick={() => {
                            markRead(n.id);
                            setOpen(false);
                          }}
                          className="block"
                        >
                          {content}
                        </Link>
                      ) : (
                        <button onClick={() => markRead(n.id)} className="block w-full text-left">
                          {content}
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="absolute top-3 right-3 p-1 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 dark:text-slate-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        title="Remover notificação"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
