import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Calendar, Layers, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';

export function ReportsPage() {
  const reports = [
    { title: 'Relatório Completo de Vendas', desc: 'Filtros por período, vendedor, forma de pagamento e cancelamentos.', icon: TrendingUp },
    { title: 'Movimentações de Estoque & Kárdex', desc: 'Entradas, saídas, perdas, transferências e custo médio.', icon: Layers },
    { title: 'Curva ABC de Produtos', desc: 'Classificação por representatividade no faturamento e margem bruta.', icon: BarChart3 },
    { title: 'Fluxo de Caixa & Extrato Consolidado', desc: 'Entradas e saídas realizadas versus previsões futuras.', icon: DollarSign },
    { title: 'Comissões de Vendedores', desc: 'Apuração detalhada por percentual cadastrado ou margem atingida.', icon: Users },
    { title: 'Espelho Fiscal & Livro de Registro', desc: 'Resumo de notas fiscais emitidas, canceladas e inutilizadas.', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Central de Relatórios & Inteligência Gerencial
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Exportação de dados consolidados em formatos PDF, Excel (.xlsx) e CSV
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.title} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{r.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <Button variant="outline" size="sm" className="w-full text-xs" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Gerar PDF
                </Button>
                <Button variant="secondary" size="sm" className="w-full text-xs" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Excel (.xlsx)
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

