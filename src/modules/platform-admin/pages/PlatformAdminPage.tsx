import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Shield, Building2, Plus, Users, CheckCircle, AlertTriangle, ArrowUpRight } from 'lucide-react';

export function PlatformAdminPage() {
  const tenants = [
    { id: '1', name: 'Lynustech Comércio e Automação LTDA', plan: 'Enterprise', users: 8, maxUsers: 20, price: 599.00, status: 'ACTIVE', due: '2026-12-31' },
    { id: '2', name: 'Empório & Conveniência Central', plan: 'Pro Varejo', users: 3, maxUsers: 5, price: 299.00, status: 'ACTIVE', due: '2026-12-15' },
    { id: '3', name: 'Padaria e Confeitaria Trigo de Ouro', plan: 'Start', users: 2, maxUsers: 2, price: 149.00, status: 'PAST_DUE', due: '2026-11-08' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Administração Global da Plataforma SaaS
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de planos, licenciamento multiempresa e controle de mensalidades
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          Cadastrar Nova Empresa (Tenant)
        </Button>
      </div>

      {/* Métricas Globais da Plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">MRR (Receita Recorrente Mensal)</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(14870.00)}
          </div>
        </Card>
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">Empresas Ativas</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            48 empresas
          </div>
        </Card>
        <Card>
          <span className="text-xs font-bold uppercase text-slate-500">Inadimplência</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            2 pendentes
          </div>
        </Card>
      </div>

      {/* Tabela de Tenants */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Empresas Clientes Cadastradas</CardTitle>
            <CardDescription>Visão geral de planos e status financeiro das assinaturas</CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Empresa / Tenant</th>
                <th className="pb-3">Plano Contratado</th>
                <th className="pb-3 text-center">Usuários Ativos</th>
                <th className="pb-3 text-right">Mensalidade</th>
                <th className="pb-3">Vencimento</th>
                <th className="pb-3">Status Licença</th>
                <th className="pb-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                    {t.name}
                  </td>
                  <td className="py-3">
                    <Badge variant="primary" size="sm">{t.plan}</Badge>
                  </td>
                  <td className="py-3 text-center font-mono text-slate-600 dark:text-slate-300">
                    {t.users} / {t.maxUsers}
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(t.price)}
                  </td>
                  <td className="py-3 font-mono text-slate-500">
                    {formatDate(t.due)}
                  </td>
                  <td className="py-3">
                    {t.status === 'ACTIVE' ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3" /> Ativa
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm">
                        <AlertTriangle className="w-3 h-3" /> Inadimplente
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Gerenciar
                    </Button>
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

