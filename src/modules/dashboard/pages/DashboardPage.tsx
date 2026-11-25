import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import {
  ShoppingCart,
  Plus,
  FileCheck,
  CreditCard,
  QrCode,
  Banknote,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Download,
  BarChart3,
  Wifi,
  CalendarDays,
  ChevronDown,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDataStore } from '@/store/useDataStore';

export function DashboardPage() {
  const { currentCompany, currentBranch } = useTenant();
  const { profile } = useAuth();
  const { sales, products } = useDataStore();

  const kpiData = {
    monthlyRevenue: 148560.0,
    revenueGrowth: '+12,5%',
    salesCount: 1420,
    grossProfit: 62400.0,
    grossMarginPercent: 42.0,
    cashBalance: 12580.0,
    lowStockCount: products.filter((p) => p.stock <= p.minStock).length,
  };

  const paymentStats = [
    { method: 'PIX Instantâneo', amount: 62450.0, percent: 42, icon: QrCode, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' },
    { method: 'Cartão de Crédito', amount: 51200.0, percent: 34, icon: CreditCard, tone: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10' },
    { method: 'Cartão de Débito', amount: 22800.0, percent: 15, icon: CreditCard, tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10' },
    { method: 'Dinheiro em Espécie', amount: 12110.0, percent: 9, icon: Banknote, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' },
  ];

const recentSales = sales.slice(0, 6).map((s) => ({    id: s.id,    client: s.client,    items: s.items.reduce((a, i) => a + i.quantity, 0),    total: s.total,    method: s.payment,    time: new Date(s.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),    fiscal: s.status === 'COMPLETED' ? 'Concluída' : s.status === 'QUOTE' ? 'Orçamento' : 'Cancelada',    status: s.status,  }));

  const now = new Date();
  const today = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const hour = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const quickActions = [
    { label: 'Abrir PDV', to: '/pos', icon: ShoppingCart },
    { label: 'Produto', to: '/inventory', icon: Plus },
    { label: 'Relatórios', to: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ===== Caixa do dia (cartão) ===== */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Caixa do Dia</CardTitle>
          <button className="text-slate-400 hover:text-slate-600" title="Mais opções">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </CardHeader>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Cartão visual */}
          <div className="relative w-full sm:w-[300px] shrink-0 pt-3 pr-3">
            <div className="absolute top-0 right-0 left-6 bottom-3 rounded-2xl bg-brand-300/60 dark:bg-brand-800/60" />
            <div className="relative h-[170px] rounded-2xl p-5 text-white overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-900/20">
              <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between text-[11px] font-medium text-white/80">
                <span>{currentCompany?.trade_name || 'Lynus PDV'}</span>
                <span>{currentBranch?.name || 'Filial Principal'}</span>
              </div>
              <div className="relative mt-5 flex items-center gap-3">
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
                <Wifi className="w-4 h-4 rotate-90 text-white/80" />
              </div>
              <div className="relative mt-3 text-xl font-bold tracking-wide">
                {formatCurrency(kpiData.cashBalance)}
              </div>
              <div className="relative mt-2 flex items-end justify-between text-[11px] text-white/80">
                <span>
                  Operador: <strong className="text-white">{profile?.full_name?.split(' ')[0] || 'Caixa'}</strong>
                </span>
                <span className="font-black italic text-sm text-white">CAIXA 01</span>
              </div>
            </div>
          </div>

          {/* Indicadores rápidos + novo caixa */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            <MiniStat label="Vendas no mês" value={`${formatNumber(kpiData.salesCount, 0)}`} />
            <MiniStat
              label="Ticket médio"
              value={formatCurrency(kpiData.monthlyRevenue / kpiData.salesCount)}
            />
            <MiniStat
              label="Estoque baixo"
              value={`${kpiData.lowStockCount} itens`}
              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
            />
            <Link
              to="/pos"
              className="group rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-2 p-3 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-soft flex items-center justify-center text-slate-400 group-hover:text-brand-600">
                <Plus className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Abrir Caixa</span>
            </Link>
          </div>
        </div>
      </Card>

      {/* ===== Faturamento total ===== */}
      <Card className="flex flex-col items-center text-center">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">Faturamento do Mês</p>
        <p className="mt-4 text-3xl font-extrabold text-brand-700 dark:text-brand-300 tracking-tight">
          {formatCurrency(kpiData.monthlyRevenue)}
        </p>
        <p className="mt-2 text-xs text-slate-400">
          {today} • {hour}
        </p>
        <Badge variant="success" size="sm" className="mt-2">
          {kpiData.revenueGrowth} vs. mês anterior
        </Badge>

        <div className="mt-auto pt-5 w-full">
          <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-brand-50/70 dark:bg-slate-800/50 p-3">
            {quickActions.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 py-3 shadow-soft text-slate-700 dark:text-slate-200 hover:text-brand-700 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </Card>

      {/* ===== Meios de pagamento ===== */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Vendas por Meio de Pagamento</CardTitle>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-50 flex items-center justify-center" title="Buscar">
              <Search className="w-4 h-4" />
            </button>
            <button className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Este mês
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardHeader>

        <ul className="space-y-1">
          {paymentStats.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.method}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.tone}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.method}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 max-w-[220px] h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${item.percent}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{item.percent}% do total</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  + {formatCurrency(item.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ===== Margem bruta (gauge) ===== */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Margem Bruta</CardTitle>
          <button className="text-slate-400 hover:text-slate-600" title="Mais opções">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </CardHeader>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Gauge percent={kpiData.grossMarginPercent} />
          <span className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-4 py-2 text-xs text-slate-500">
            Lucro bruto:{' '}
            <strong className="text-slate-800 dark:text-slate-100">{formatCurrency(kpiData.grossProfit)}</strong>
          </span>
        </div>
      </Card>

      {/* ===== Atividade de vendas (tabela) ===== */}
      <Card className="lg:col-span-3">
        <CardHeader className="flex-wrap gap-3">
          <CardTitle>Atividade de Vendas</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar..."
                className="h-8 w-48 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500"
              />
            </div>
            <button className="h-8 px-3 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filtrar
            </button>
            <Link
              to="/sales"
              className="h-8 px-3 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </Link>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                <th className="py-3 pl-4 rounded-l-xl">Venda</th>
                <th className="py-3">Data/Hora</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Itens</th>
                <th className="py-3">Pagamento</th>
                <th className="py-3">Status</th>
                <th className="py-3 pr-4 text-right rounded-r-xl">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pl-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-brand-700 dark:text-brand-300">
                      <Receipt className="w-3.5 h-3.5" />#{sale.id}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">{sale.time}</td>
                  <td className="py-3.5 font-medium text-slate-800 dark:text-slate-100">{sale.client}</td>
                  <td className="py-3.5 text-slate-500">{sale.items} itens</td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">{sale.method}</td>
                  <td className="py-3.5">
                    <Badge variant={sale.status === 'COMPLETED' ? 'success' : sale.status === 'QUOTE' ? 'info' : 'danger'} size="sm">
                      <FileCheck className="w-3 h-3" />
                      {sale.fiscal}
                    </Badge>
                  </td>
                  <td className="py-3.5 pr-4 text-right font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(sale.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 flex flex-col justify-center">
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        {icon}
        {label}
      </span>
      <span className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </div>
  );
}

function Gauge({ percent }: { percent: number }) {
  const value = Math.max(0, Math.min(100, percent));
  const label = value >= 35 ? 'Nível Saudável' : value >= 20 ? 'Nível Atenção' : 'Nível Crítico';
  const arc = 'M 20 110 A 90 90 0 0 1 200 110';

  return (
    <div className="relative w-[220px] h-[124px]">
      <svg viewBox="0 0 220 124" className="w-full h-full">
        <path d={arc} fill="none" strokeWidth="26" className="stroke-slate-100 dark:stroke-slate-800" />
        <path
          d={arc}
          fill="none"
          strokeWidth="26"
          pathLength={100}
          strokeDasharray={`${value} 100`}
          className="stroke-brand-600 dark:stroke-brand-400 transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
          {formatNumber(value, 1)}
          <span className="text-xs font-semibold">%</span>
        </div>
        <div className="text-xs font-semibold text-brand-700 dark:text-brand-300">{label}</div>
      </div>
    </div>
  );
}
