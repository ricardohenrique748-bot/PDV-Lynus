import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TenantSelector } from './TenantSelector';
import { NotificationsMenu } from './NotificationsMenu';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  ShoppingCart,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const ROUTE_CRUMBS: Record<string, { section: string; label: string }> = {
  '/pos': { section: 'Menu Principal', label: 'PDV (Frente de Caixa)' },
  '/sales': { section: 'Comercial & Estoque', label: 'Vendas & Pedidos' },
  '/inventory': { section: 'Comercial & Estoque', label: 'Produtos & Estoque' },
  '/purchases': { section: 'Comercial & Estoque', label: 'Compras & Fornecedores' },
  '/customers': { section: 'Comercial & Estoque', label: 'Clientes & CRM' },
  '/financial': { section: 'Financeiro & Controladoria', label: 'Gestão Financeira' },
  '/dre': { section: 'Financeiro & Controladoria', label: 'DRE Gerencial' },
  '/fiscal': { section: 'Financeiro & Controladoria', label: 'Módulo Fiscal' },
  '/reports': { section: 'Gestão & Auditoria', label: 'Relatórios' },
  '/settings': { section: 'Gestão & Auditoria', label: 'Configurações' },
  '/platform-admin': { section: 'Gestão & Auditoria', label: 'Administração SaaS' },
};

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { currentRole } = useTenant();
  const { theme, toggleTheme } = useTheme();

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Superadmin SaaS',
    COMPANY_ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    SUPERVISOR: 'Supervisor',
    CASHIER: 'Operador de Caixa',
    SELLER: 'Vendedor',
    FINANCIAL: 'Financeiro',
    STOCKIST: 'Estoquista',
    ACCOUNTANT: 'Contador',
  };

  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const crumb = ROUTE_CRUMBS[pathname];
  const firstName = profile?.full_name?.split(' ')[0] || 'Operador';
  const iconBtn =
    'relative w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-soft flex items-center justify-center text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-200 transition-colors';

  return (
    <header className="px-4 md:px-6 lg:px-8 pt-6 pb-2 bg-surface/90 dark:bg-slate-950/90 backdrop-blur flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onToggleSidebar} className={iconBtn} title="Alternar Menu">
          <Menu className="w-[18px] h-[18px]" />
        </button>
        <div className="min-w-0">
          {isHome ? (
            <>
              <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                Bem-vindo ao Lynus PDV
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Olá, {firstName}. Bem-vindo de volta.
              </p>
            </>
          ) : (
            <>
              <nav aria-label="Caminho" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">Início</Link>
                {crumb && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{crumb.section}</span>
                  </>
                )}
              </nav>
              <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {crumb?.label ?? 'Lynus PDV'}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Seletor Multiempresa */}
        <div className="hidden md:block">
          <TenantSelector />
        </div>

        {/* Atalho para o PDV */}
        <Link
          to="/pos"
          className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm shadow-brand-900/20 transition-all active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Frente de Caixa</span>
          <span className="font-mono text-[10px] bg-white/15 px-1.5 py-0.5 rounded-md">F2</span>
        </Link>

        {/* Tema */}
        <button
          onClick={toggleTheme}
          className={iconBtn}
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notificações */}
        <NotificationsMenu buttonClassName={iconBtn} />

        {/* Perfil */}
        <div className="flex items-center gap-2 pl-1">
          <div
            className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200 flex items-center justify-center font-bold text-sm shrink-0 ring-4 ring-white dark:ring-slate-900 shadow-soft"
            title={`${profile?.full_name || 'Operador'} • ${roleLabels[currentRole] || currentRole}`}
          >
            {profile?.full_name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="hidden xl:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {profile?.full_name || 'Operador'}
              </span>
              {profile?.is_superadmin && (
                <span title="Superadmin">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{roleLabels[currentRole] || currentRole}</p>
          </div>
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
