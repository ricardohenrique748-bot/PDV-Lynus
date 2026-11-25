import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Package,
  Truck,
  DollarSign,
  PieChart,
  FileText,
  Users,
  Settings,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
  superadminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const location = useLocation();
  const { isSuperadmin } = useAuth();
  const { currentRole } = useTenant();

  const sections: NavSection[] = [
    {
      title: 'Menu Principal',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'PDV (Frente de Caixa)', href: '/pos', icon: ShoppingCart, badge: 'F2' },
      ],
    },
    {
      title: 'Comercial & Estoque',
      items: [
        { label: 'Vendas & Pedidos', href: '/sales', icon: TrendingUp },
        { label: 'Produtos & Estoque', href: '/inventory', icon: Package },
        { label: 'Compras & Fornecedores', href: '/purchases', icon: Truck },
        { label: 'Clientes & CRM', href: '/customers', icon: Users },
      ],
    },
    {
      title: 'Financeiro & Controladoria',
      items: [
        { label: 'Gestão Financeira', href: '/financial', icon: DollarSign },
        { label: 'DRE Gerencial', href: '/dre', icon: PieChart },
        { label: 'Módulo Fiscal', href: '/fiscal', icon: FileText },
      ],
    },
    {
      title: 'Gestão & Auditoria',
      items: [
        { label: 'Relatórios', href: '/reports', icon: Layers },
        { label: 'Configurações', href: '/settings', icon: Settings },
        { label: 'Administração SaaS', href: '/platform-admin', icon: Shield, superadminOnly: true },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300 z-40 shrink-0 select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logotipo */}
      <div className={cn('h-20 flex items-center', isCollapsed ? 'justify-center px-2' : 'px-6')}>
        <Logo iconOnly={isCollapsed} />
      </div>

      {/* Menu de Navegação com Scroll */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.superadminOnly && !isSuperadmin) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 group relative',
                      isCollapsed && 'justify-center',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-900/40 dark:text-brand-200'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] shrink-0 transition-colors',
                        isActive
                          ? 'text-brand-600 dark:text-brand-300'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                      )}
                    />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.5 rounded-md font-semibold',
                              isActive
                                ? 'bg-white text-brand-700 dark:bg-brand-800 dark:text-brand-100'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Rodapé da Sidebar */}
      {!isCollapsed && (
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">© Lynus PDV 2026</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Online</span>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Automação comercial e frente de caixa para todos os tipos de negócio.
          </p>
        </div>
      )}
    </aside>
  );
}
