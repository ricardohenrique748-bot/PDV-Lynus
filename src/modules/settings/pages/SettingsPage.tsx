import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Building2, GitBranch, Users, Printer, Shield, Save, Check } from 'lucide-react';

export function SettingsPage() {
  const { currentCompany, currentBranch } = useTenant();
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'BRANCHES' | 'USERS' | 'PRINTERS'>('COMPANY');

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Configurações da Empresa & Acessos
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gestão cadastral, filiais, usuários, controle de permissões e periféricos do PDV
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('COMPANY')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'COMPANY'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Dados da Empresa
        </button>
        <button
          onClick={() => setActiveTab('BRANCHES')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'BRANCHES'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Filiais Cadastradas
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'USERS'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Usuários & Permissões (RBAC)
        </button>
        <button
          onClick={() => setActiveTab('PRINTERS')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'PRINTERS'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Impressão & PDV
        </button>
      </div>

      {activeTab === 'COMPANY' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div>
              <CardTitle>Dados Cadastrais da Empresa</CardTitle>
              <CardDescription>Informações fiscais e de identificação jurídica</CardDescription>
            </div>
          </CardHeader>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Razão Social" defaultValue={currentCompany?.name} />
              <Input label="Nome Fantasia" defaultValue={currentCompany?.trade_name || ''} />
              <Input label="CNPJ / CPF" defaultValue={currentCompany?.tax_id} />
              <Input label="Inscrição Estadual" defaultValue={currentCompany?.state_registration || ''} />
              <Input label="E-mail de Contato" defaultValue={currentCompany?.email || ''} />
              <Input label="Telefone Comercial" defaultValue={currentCompany?.phone || ''} />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Endereço da Sede
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="CEP" defaultValue={currentCompany?.postal_code || ''} />
                <div className="sm:col-span-2">
                  <Input label="Logradouro" defaultValue={currentCompany?.street || ''} />
                </div>
                <Input label="Número" defaultValue={currentCompany?.number || ''} />
                <Input label="Bairro" defaultValue={currentCompany?.neighborhood || ''} />
                <Input label="Cidade / UF" defaultValue={`${currentCompany?.city_name} - ${currentCompany?.state_code}`} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'USERS' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Usuários da Empresa</CardTitle>
              <CardDescription>Atribuição de perfis de acesso e controle por módulo</CardDescription>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Convidar Usuário
            </Button>
          </CardHeader>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3">Nome / Usuário</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">Perfil Atribuído</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100">Administrador Master</td>
                <td className="py-3 text-slate-500">admin@lynustech.com.br</td>
                <td className="py-3">
                  <Badge variant="primary" size="sm">Administrador da Empresa</Badge>
                </td>
                <td className="py-3">
                  <Badge variant="success" size="sm">Ativo</Badge>
                </td>
                <td className="py-3 text-center">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Permissões</Button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 font-bold text-slate-900 dark:text-slate-100">Operador de Frente de Caixa</td>
                <td className="py-3 text-slate-500">caixa@lynustech.com.br</td>
                <td className="py-3">
                  <Badge variant="secondary" size="sm">Operador de Caixa</Badge>
                </td>
                <td className="py-3">
                  <Badge variant="success" size="sm">Ativo</Badge>
                </td>
                <td className="py-3 text-center">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">Permissões</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {activeTab === 'PRINTERS' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div>
              <CardTitle>Configuração de Impressoras Térmicas</CardTitle>
              <CardDescription>Impressão de comprovantes de venda e DANFE NFC-e</CardDescription>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                  <Printer className="w-5 h-5 text-brand-600" />
                  <span>Impressora Térmica Não-Fiscal (80mm ESC/POS)</span>
                </div>
                <Badge variant="success" size="sm">Habilitado</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Impressão direta via navegador ou spooler de impressão local para comprovantes rápidos.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

