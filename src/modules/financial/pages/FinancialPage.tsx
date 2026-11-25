import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, EmptyRow, thead } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { useDataStore, todayKey, type EntryType, type FinancialEntry } from '@/store/useDataStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportCsv } from '@/utils/exportCsv';
import { cn } from '@/utils/cn';
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Landmark,
  CheckCircle,
  Clock,
  AlertCircle,
  RotateCcw,
  Trash2,
  Download,
  Search,
} from 'lucide-react';

type Tab = 'RECEIVABLE' | 'PAYABLE' | 'CASH_FLOW';

type EntryForm = {
  type: EntryType;
  party: string;
  customerId: string;
  description: string;
  due: string;
  amount: string;
  paid: boolean;
};

const newEntryForm = (type: EntryType): EntryForm => ({
  type,
  party: '',
  customerId: '',
  description: '',
  due: todayKey(),
  amount: '',
  paid: false,
});

export function FinancialPage() {
  const { entries, customers, banks, saveEntry, settleEntry, reopenEntry, deleteEntry, saveBank, deleteBank } = useDataStore();

  const [activeTab, setActiveTab] = useState<Tab>('RECEIVABLE');
  const [statusFilter, setStatusFilter] = useState<'' | 'PENDING' | 'PAID' | 'OVERDUE'>('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<EntryForm | null>(null);
  const [formError, setFormError] = useState('');
  const [isBanksOpen, setIsBanksOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ bank: '', agency: '', account: '', balance: '' });

  const today = todayKey();
  const isOverdue = (e: FinancialEntry) => e.status === 'PENDING' && e.due < today;

  const totals = useMemo(() => {
    const open = (t: EntryType) => entries.filter((e) => e.type === t && e.status === 'PENDING').reduce((a, e) => a + e.amount, 0);
    const bankTotal = banks.reduce((a, b) => a + b.balance, 0);
    const receivable = open('RECEIVABLE');
    const payable = open('PAYABLE');
    return { receivable, payable, bankTotal, projected: bankTotal + receivable - payable };
  }, [entries, banks]);

  const list = useMemo(() => {
    if (activeTab === 'CASH_FLOW') return [];
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => e.type === activeTab)
      .filter((e) => !q || e.party.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      .filter((e) => {
        if (statusFilter === 'OVERDUE') return isOverdue(e);
        return !statusFilter || e.status === statusFilter;
      })
      .sort((a, b) => (a.status === b.status ? a.due.localeCompare(b.due) : a.status === 'PENDING' ? -1 : 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, activeTab, search, statusFilter, today]);

  // Fluxo de caixa: movimentos liquidados em ordem cronológica com saldo acumulado
  const cashFlow = useMemo(() => {
    const moves = entries
      .filter((e) => e.status === 'PAID')
      .sort((a, b) => (a.paidAt || a.due).localeCompare(b.paidAt || b.due));
    let running = 0;
    const rows = moves.map((e) => {
      const value = e.type === 'RECEIVABLE' ? e.amount : -e.amount;
      running += value;
      return { ...e, value, running };
    });
    const inflow = rows.filter((r) => r.value > 0).reduce((a, r) => a + r.value, 0);
    const outflow = rows.filter((r) => r.value < 0).reduce((a, r) => a - r.value, 0);
    return { rows: rows.reverse(), inflow, outflow };
  }, [entries]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const amount = parseFloat(form.amount.replace(',', '.')) || 0;
    const customer = customers.find((c) => c.id === form.customerId);
    const party = form.type === 'RECEIVABLE' && customer ? customer.name : form.party.trim();
    if (!party) return setFormError(form.type === 'RECEIVABLE' ? 'Informe o cliente.' : 'Informe o fornecedor.');
    if (!form.description.trim()) return setFormError('Informe a descrição.');
    if (amount <= 0) return setFormError('Informe um valor maior que zero.');
    if (!form.due) return setFormError('Informe o vencimento.');

    saveEntry({
      type: form.type,
      party,
      customerId: form.type === 'RECEIVABLE' ? customer?.id ?? null : null,
      description: form.description.trim(),
      due: form.due,
      amount,
      status: form.paid ? 'PAID' : 'PENDING',
      paidAt: form.paid ? today : null,
    });
    toast.success(`Lançamento de ${formatCurrency(amount)} registrado.`);
    setActiveTab(form.type);
    setForm(null);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bank.trim()) return toast.error('Informe o banco.');
    saveBank({
      bank: bankForm.bank.trim(),
      agency: bankForm.agency.trim(),
      account: bankForm.account.trim(),
      balance: parseFloat(bankForm.balance.replace(',', '.')) || 0,
    });
    setBankForm({ bank: '', agency: '', account: '', balance: '' });
    toast.success('Conta bancária adicionada.');
  };

  const handleExport = () => {
    if (activeTab === 'CASH_FLOW') {
      exportCsv(
        'fluxo-de-caixa',
        ['Data', 'Tipo', 'Cliente/Fornecedor', 'Descrição', 'Valor', 'Saldo Acumulado'],
        cashFlow.rows.map((r) => [formatDate(r.paidAt || r.due), r.type === 'RECEIVABLE' ? 'Entrada' : 'Saída', r.party, r.description, r.value, r.running])
      );
    } else {
      exportCsv(
        activeTab === 'RECEIVABLE' ? 'contas-a-receber' : 'contas-a-pagar',
        [activeTab === 'RECEIVABLE' ? 'Cliente' : 'Fornecedor', 'Descrição', 'Vencimento', 'Status', 'Valor', 'Pago em'],
        list.map((e) => [e.party, e.description, formatDate(e.due), e.status === 'PAID' ? 'Liquidado' : isOverdue(e) ? 'Vencido' : 'Em Aberto', e.amount, e.paidAt ? formatDate(e.paidAt) : ''])
      );
    }
    toast.success('Arquivo exportado.');
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'RECEIVABLE', label: 'Contas a Receber', count: entries.filter((e) => e.type === 'RECEIVABLE' && e.status === 'PENDING').length },
    { id: 'PAYABLE', label: 'Contas a Pagar', count: entries.filter((e) => e.type === 'PAYABLE' && e.status === 'PENDING').length },
    { id: 'CASH_FLOW', label: 'Fluxo de Caixa' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestão Financeira & Fluxo de Caixa"
        description="Contas a pagar, contas a receber, contas bancárias e previsão"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Landmark className="w-4 h-4" />} onClick={() => setIsBanksOpen(true)}>
              Contas Bancárias
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setFormError('');
                setForm(newEntryForm(activeTab === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE'));
              }}
            >
              Novo Lançamento
            </Button>
          </>
        }
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Contas a Receber (aberto)" value={totals.receivable} tone="text-emerald-600" icon={<ArrowUpCircle className="w-4 h-4 text-emerald-500" />} onClick={() => setActiveTab('RECEIVABLE')} />
        <SummaryCard label="Contas a Pagar (aberto)" value={totals.payable} tone="text-red-600" icon={<ArrowDownCircle className="w-4 h-4 text-red-500" />} onClick={() => setActiveTab('PAYABLE')} />
        <SummaryCard
          label="Saldo Líquido Projetado"
          value={totals.projected}
          tone={totals.projected >= 0 ? 'text-brand-700 dark:text-brand-300' : 'text-red-600'}
          icon={<DollarSign className="w-4 h-4 text-brand-500" />}
          hint={`Bancos ${formatCurrency(totals.bankTotal)} + receber − pagar`}
          onClick={() => setIsBanksOpen(true)}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-white dark:bg-slate-900 shadow-soft">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-4 h-9 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2',
                activeTab === t.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {t.label}
              {!!t.count && <span className="text-[10px] px-1.5 rounded-md bg-white dark:bg-slate-800 text-slate-500">{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== 'CASH_FLOW' && (
            <>
              <div className="w-56">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." leftIcon={<Search className="w-4 h-4" />} />
              </div>
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  options={[
                    { value: '', label: 'Todos status' },
                    { value: 'PENDING', label: 'Em aberto' },
                    { value: 'OVERDUE', label: 'Vencidos' },
                    { value: 'PAID', label: 'Liquidados' },
                  ]}
                />
              </div>
            </>
          )}
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {activeTab === 'CASH_FLOW' ? (
        <Card>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat label="Entradas liquidadas" value={formatCurrency(cashFlow.inflow)} tone="text-emerald-600" />
            <MiniStat label="Saídas liquidadas" value={formatCurrency(cashFlow.outflow)} tone="text-red-600" />
            <MiniStat label="Resultado" value={formatCurrency(cashFlow.inflow - cashFlow.outflow)} tone="text-brand-700 dark:text-brand-300" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className={thead}>
                  <th className="py-3 pl-4 rounded-l-xl">Data</th>
                  <th className="py-3">Cliente / Fornecedor</th>
                  <th className="py-3">Descrição</th>
                  <th className="py-3 text-right">Valor</th>
                  <th className="py-3 pr-4 text-right rounded-r-xl">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cashFlow.rows.length === 0 && <EmptyRow colSpan={5} message="Nenhuma movimentação liquidada ainda." />}
                {cashFlow.rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 font-mono text-slate-600 dark:text-slate-300">{formatDate(r.paidAt || r.due)}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-100">{r.party}</td>
                    <td className="py-3 text-slate-500">{r.description}</td>
                    <td className={`py-3 text-right font-bold ${r.value > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {r.value > 0 ? '+ ' : '− '}
                      {formatCurrency(Math.abs(r.value))}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold">{formatCurrency(r.running)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className={thead}>
                  <th className="py-3 pl-4 rounded-l-xl">{activeTab === 'RECEIVABLE' ? 'Cliente' : 'Fornecedor'}</th>
                  <th className="py-3">Descrição</th>
                  <th className="py-3">Vencimento</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Valor</th>
                  <th className="py-3 pr-4 text-center rounded-r-xl">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.length === 0 && <EmptyRow colSpan={6} message="Nenhum lançamento encontrado." />}
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pl-4 font-semibold text-slate-800 dark:text-slate-100">{item.party}</td>
                    <td className="py-3 text-slate-500">{item.description}</td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{formatDate(item.due)}</td>
                    <td className="py-3">
                      {item.status === 'PAID' ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3" /> Liquidado {item.paidAt ? `em ${formatDate(item.paidAt)}` : ''}
                        </Badge>
                      ) : isOverdue(item) ? (
                        <Badge variant="danger" size="sm">
                          <AlertCircle className="w-3 h-3" /> Vencido
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <Clock className="w-3 h-3" /> Em Aberto
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.amount)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-center gap-1">
                        {item.status === 'PENDING' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => {
                              settleEntry(item.id);
                              toast.success(`${activeTab === 'RECEIVABLE' ? 'Recebimento' : 'Pagamento'} de ${formatCurrency(item.amount)} baixado.`);
                            }}
                          >
                            Baixar
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            onClick={() => {
                              reopenEntry(item.id);
                              toast.info('Baixa estornada.');
                            }}
                          >
                            Estornar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-600"
                          title="Excluir lançamento"
                          onClick={() => {
                            if (!confirm(`Excluir "${item.description}"?`)) return;
                            deleteEntry(item.id);
                            toast.info('Lançamento excluído.');
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Novo lançamento */}
      <Modal isOpen={!!form} onClose={() => setForm(null)} title="Novo Lançamento" size="md">
        {form && (
          <form onSubmit={handleSaveEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(['RECEIVABLE', 'PAYABLE'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={cn(
                    'h-9 rounded-lg text-xs font-semibold transition-colors',
                    form.type === t ? 'bg-white dark:bg-slate-900 shadow-soft ' + (t === 'RECEIVABLE' ? 'text-emerald-700' : 'text-red-600') : 'text-slate-500'
                  )}
                >
                  {t === 'RECEIVABLE' ? 'A Receber' : 'A Pagar'}
                </button>
              ))}
            </div>

            {form.type === 'RECEIVABLE' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Cliente cadastrado"
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  options={[{ value: '', label: 'Outro (digitar)' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
                />
                {!form.customerId && <Input label="Nome do cliente" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />}
              </div>
            ) : (
              <Input label="Fornecedor" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} autoFocus />
            )}

            <Input label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Boleto 1234, Aluguel, Parcela 01/03" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Valor (R$)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} inputMode="decimal" />
              <Input label="Vencimento" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              Já está liquidado (baixar hoje)
            </label>
            {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Lançamento</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Contas bancárias */}
      <Modal isOpen={isBanksOpen} onClose={() => setIsBanksOpen(false)} title="Contas Bancárias" description={`Saldo total: ${formatCurrency(totals.bankTotal)}`} size="lg">
        <div className="space-y-4">
          <ul className="space-y-2">
            {banks.length === 0 && <li className="text-xs text-slate-400">Nenhuma conta cadastrada.</li>}
            {banks.map((b) => (
              <li key={b.id} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                <span className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-600 flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{b.bank}</p>
                  <p className="text-xs text-slate-500">
                    Ag. {b.agency || '—'} • C/C {b.account || '—'}
                  </p>
                </div>
                <span className="text-sm font-bold">{formatCurrency(b.balance)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  title="Remover conta"
                  onClick={() => {
                    if (!confirm(`Remover a conta ${b.bank}?`)) return;
                    deleteBank(b.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddBank} className="grid grid-cols-2 sm:grid-cols-[1fr_100px_120px_120px_auto] gap-2 items-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Input label="Banco" value={bankForm.bank} onChange={(e) => setBankForm({ ...bankForm, bank: e.target.value })} />
            <Input label="Agência" value={bankForm.agency} onChange={(e) => setBankForm({ ...bankForm, agency: e.target.value })} />
            <Input label="Conta" value={bankForm.account} onChange={(e) => setBankForm({ ...bankForm, account: e.target.value })} />
            <Input label="Saldo (R$)" value={bankForm.balance} onChange={(e) => setBankForm({ ...bankForm, balance: e.target.value })} inputMode="decimal" />
            <Button type="submit" leftIcon={<Plus className="w-4 h-4" />}>
              Adicionar
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

function SummaryCard({ label, value, tone, icon, hint, onClick }: { label: string; value: number; tone: string; icon: React.ReactNode; hint?: string; onClick?: () => void }) {
  return (
    <Card hoverEffect className="cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`text-2xl font-extrabold mt-2 ${tone}`}>{formatCurrency(value)}</div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </Card>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${tone}`}>{value}</p>
    </div>
  );
}
