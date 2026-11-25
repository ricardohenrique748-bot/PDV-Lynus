import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { Download, Calendar, Filter, PieChart, TrendingUp, AlertCircle } from 'lucide-react';

export function DREPage() {
  // Dados de competência gerencial do período
  const dre = {
    grossRevenue: 148560.00,
    deductions: -2450.00,
    taxesOnSales: -8913.60,
    netRevenue: 137196.40,
    cmv: -74796.40,
    grossProfit: 62400.00,
    operatingExpenses: {
      administrative: -14200.00,
      commercial: -9500.00,
      personnel: -18300.00,
      total: -42000.00,
    },
    ebitda: 20400.00,
    financialResults: {
      expenses: -2400.00,
      revenues: 650.00,
      net: -1750.00,
    },
    netIncome: 18650.00,
  };

  const grossMargin = (dre.grossProfit / dre.netRevenue) * 100;
  const netMargin = (dre.netIncome / dre.netRevenue) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            DRE — Demonstração do Resultado do Exercício
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Apuração gerencial por Regime de Competência • Estrutura Contábil Padrão
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Exportar PDF
          </Button>
          <Button variant="secondary" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
            Competência: Mês Atual
          </Button>
        </div>
      </div>

      {/* Indicadores Chave de Rentabilidade */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">Receita Líquida</span>
          <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(dre.netRevenue)}
          </div>
        </Card>
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">Lucro Bruto</span>
          <div className="text-xl font-black text-brand-600 mt-1">
            {formatCurrency(dre.grossProfit)}
          </div>
          <span className="text-[11px] text-slate-400">Margem: {grossMargin.toFixed(1)}%</span>
        </Card>
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">EBITDA Gerencial</span>
          <div className="text-xl font-black text-purple-600 mt-1">
            {formatCurrency(dre.ebitda)}
          </div>
        </Card>
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">Resultado Líquido</span>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(dre.netIncome)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Margem: {netMargin.toFixed(1)}%</span>
        </Card>
      </div>

      {/* Tabela Estruturada da DRE */}
      <Card className="p-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Demonstrativo Consolidado de Resultados
            </h3>
            <p className="text-xs text-slate-400">Calculado a partir de vendas faturadas e despesas apropriadas</p>
          </div>
          <Badge variant="primary" size="md">Regime de Competência</Badge>
        </div>

        <div className="space-y-2 text-xs">
          {/* 1. Receita Bruta */}
          <div className="flex justify-between py-2 border-b font-bold text-slate-900 dark:text-slate-100">
            <span>1. RECEITA BRUTA DE VENDAS</span>
            <span>{formatCurrency(dre.grossRevenue)}</span>
          </div>

          {/* 2. Deduções */}
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(-) Devoluções e Cancelamentos</span>
            <span className="text-red-500">{formatCurrency(dre.deductions)}</span>
          </div>
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(-) Impostos sobre Faturamento (Simples / ICMS / PIS / COFINS)</span>
            <span className="text-red-500">{formatCurrency(dre.taxesOnSales)}</span>
          </div>

          {/* 3. Receita Líquida */}
          <div className="flex justify-between py-2 bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg font-bold text-slate-900 dark:text-slate-100">
            <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
            <span>{formatCurrency(dre.netRevenue)}</span>
          </div>

          {/* 4. CMV */}
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(-) Custo das Mercadorias Vendidas (CMV)</span>
            <span className="text-red-500">{formatCurrency(dre.cmv)}</span>
          </div>

          {/* 5. Lucro Bruto */}
          <div className="flex justify-between py-2 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-300 px-3 rounded-lg font-bold">
            <span>(=) LUCRO BRUTO (MARGEM BRUTA: {grossMargin.toFixed(1)}%)</span>
            <span>{formatCurrency(dre.grossProfit)}</span>
          </div>

          {/* 6. Despesas Operacionais */}
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(-) Despesas Administrativas</span>
            <span className="text-red-500">{formatCurrency(dre.operatingExpenses.administrative)}</span>
          </div>
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(-) Despesas Comerciais & Vendas</span>
            <span className="text-red-500">{formatCurrency(dre.operatingExpenses.commercial)}</span>
          </div>
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(-) Folha de Pagamento & Encargos</span>
            <span className="text-red-500">{formatCurrency(dre.operatingExpenses.personnel)}</span>
          </div>

          {/* 7. EBITDA */}
          <div className="flex justify-between py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 px-3 rounded-lg font-bold">
            <span>(=) EBITDA OPERACIONAL GERENCIAL</span>
            <span>{formatCurrency(dre.ebitda)}</span>
          </div>

          {/* 8. Resultado Financeiro */}
          <div className="flex justify-between py-1.5 pl-4 text-slate-600 dark:text-slate-400">
            <span>(+/-) Resultado Financeiro Líquido</span>
            <span className="text-red-500">{formatCurrency(dre.financialResults.net)}</span>
          </div>

          {/* 9. Lucro Líquido */}
          <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 px-4 rounded-xl font-black text-sm mt-4 border border-emerald-300 dark:border-emerald-700">
            <span>(=) RESULTADO LÍQUIDO DO EXERCÍCIO (MARGEM: {netMargin.toFixed(1)}%)</span>
            <span>{formatCurrency(dre.netIncome)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

