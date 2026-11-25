import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, EmptyRow, thead } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore, PAYMENT_METHODS, CREDIT_PAYMENTS, type Sale, type SaleItem } from '@/store/useDataStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { exportCsv, localDateKey } from '@/utils/exportCsv';
import { Plus, Download, Search, CheckCircle, XCircle, FileText, Trash2, FilterX, Eye, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { StatCard, InitialsAvatar } from '@/components/ui/StatCard';

const statusBadge: Record<Sale['status'], React.ReactNode> = {
  COMPLETED: (
    <Badge variant="success" size="sm">
      <CheckCircle className="w-3 h-3" /> Concluída
    </Badge>
  ),
  QUOTE: (
    <Badge variant="info" size="sm">
      <FileText className="w-3 h-3" /> Orçamento
    </Badge>
  ),
  CANCELLED: (
    <Badge variant="danger" size="sm">
      <XCircle className="w-3 h-3" /> Cancelada
    </Badge>
  ),
};

interface DraftLine {
  productId: string;
  quantity: string;
}

export function SalesPage() {
  const { profile } = useAuth();
  const { sales, products, customers, createSale, cancelSale, completeQuote } = useDataStore();

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = sales.find((s) => s.id === detailId) || null;

  // Nova venda
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [payment, setPayment] = useState('PIX');
  const [lines, setLines] = useState<DraftLine[]>([{ productId: '', quantity: '1' }]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (q && !s.id.includes(q) && !s.client.toLowerCase().includes(q)) return false;
      const day = localDateKey(s.date);
      if (from && day < from) return false;
      if (to && day > to) return false;
      if (status && s.status !== status) return false;
      return true;
    });
  }, [sales, search, from, to, status]);

  const totalCompleted = filtered.filter((s) => s.status === 'COMPLETED').reduce((a, s) => a + s.total, 0);
  const hasFilters = !!(search || from || to || status);
  const completedCount = filtered.filter((s) => s.status === 'COMPLETED').length;
  const quoteCount = sales.filter((s) => s.status === 'QUOTE').length;
  const todaySales = sales.filter((s) => s.status === 'COMPLETED' && localDateKey(s.date) === localDateKey(new Date().toISOString()));
  const todayCount = todaySales.length;
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);

  const draftItems: SaleItem[] = lines
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      const qty = Math.max(0, parseInt(l.quantity, 10) || 0);
      return p && qty ? { productId: p.id, name: p.name, quantity: qty, price: p.price, total: +(p.price * qty).toFixed(2) } : null;
    })
    .filter(Boolean) as SaleItem[];
  const draftTotal = draftItems.reduce((a, i) => a + i.total, 0);

  const openNew = () => {
    setCustomerId('');
    setPayment('PIX');
    setLines([{ productId: '', quantity: '1' }]);
    setIsNewOpen(true);
  };

  const submitSale = (mode: 'COMPLETED' | 'QUOTE') => {
    if (!draftItems.length) return toast.error('Adicione ao menos um produto.');
    if (CREDIT_PAYMENTS.includes(payment) && !customerId && mode === 'COMPLETED')
      return toast.error('Venda a prazo exige um cliente cadastrado.');
    if (mode === 'COMPLETED') {
      for (const item of draftItems) {
        const p = products.find((x) => x.id === item.productId)!;
        const totalQty = draftItems.filter((i) => i.productId === p.id).reduce((a, i) => a + i.quantity, 0);
        if (totalQty > p.stock) return toast.error(`Estoque insuficiente de "${p.name}" (saldo ${p.stock}).`);
      }
    }
    const customer = customers.find((c) => c.id === customerId);
    const sale = createSale({
      customerId: customer?.id ?? null,
      client: customer?.name ?? 'Consumidor Final',
      seller: profile?.full_name || 'Operador',
      payment,
      items: draftItems,
      status: mode,
    });
    toast.success(mode === 'QUOTE' ? `Orçamento #${sale.id} salvo.` : `Venda #${sale.id} registrada — ${formatCurrency(sale.total)}.`);
    setIsNewOpen(false);
  };

  const handleExport = () => {
    exportCsv(
      'vendas',
      ['Nº Venda', 'Data/Hora', 'Cliente', 'Vendedor', 'Pagamento', 'Status', 'Itens', 'Valor Total'],
      filtered.map((s) => [
        s.id,
        formatDate(s.date, true),
        s.client,
        s.seller,
        s.payment,
        { COMPLETED: 'Concluída', QUOTE: 'Orçamento', CANCELLED: 'Cancelada' }[s.status],
        String(s.items.reduce((a, i) => a + i.quantity, 0)),
        s.total,
      ])
    );
    toast.success(`${filtered.length} vendas exportadas.`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestão Comercial & Pedidos de Venda"
        description="Histórico completo de vendas, orçamentos e vendedores"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
              Exportar
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={openNew}>
              Novo Orçamento / Venda
            </Button>
          </>
        }
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Faturamento (filtro atual)" value={formatCurrency(totalCompleted)} icon={DollarSign} hint={`${completedCount} vendas concluídas`} />
        <StatCard label="Vendas hoje" value={formatCurrency(todayTotal)} icon={Receipt} tone="emerald" hint={`${todayCount} ${todayCount === 1 ? 'venda' : 'vendas'}`} />
        <StatCard label="Ticket médio" value={formatCurrency(completedCount ? totalCompleted / completedCount : 0)} icon={TrendingUp} tone="sky" />
        <StatCard
          label="Orçamentos em aberto"
          value={quoteCount}
          icon={FileText}
          tone="violet"
          hint={status === 'QUOTE' ? 'Filtro ativo — clique para remover' : 'Clique para filtrar'}
          onClick={() => setStatus((s) => (s === 'QUOTE' ? '' : 'QUOTE'))}
          active={status === 'QUOTE'}
        />
      </div>

      {/* Filtros (aplicados em tempo real) */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-2">
            <Input
              label="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Número da venda ou cliente..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Input type="date" label="Data Inicial" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" label="Data Final" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          <div className="flex gap-2">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: '', label: 'Todos' },
                { value: 'COMPLETED', label: 'Concluídas' },
                { value: 'QUOTE', label: 'Orçamentos' },
                { value: 'CANCELLED', label: 'Canceladas' },
              ]}
            />
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0"
              title="Limpar filtros"
              disabled={!hasFilters}
              onClick={() => {
                setSearch('');
                setFrom('');
                setTo('');
                setStatus('');
              }}
            >
              <FilterX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Vendas do Período</CardTitle>
            <CardDescription>
              {filtered.length} registros • Total concluído: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(totalCompleted)}</strong>
            </CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className={thead}>
                <th className="py-3 pl-4 rounded-l-xl">Nº Venda</th>
                <th className="py-3">Data/Hora</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Vendedor</th>
                <th className="py-3">Pagamento</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right">Valor Total</th>
                <th className="py-3 pr-4 rounded-r-xl" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && <EmptyRow colSpan={8} message="Nenhuma venda encontrada para os filtros informados." />}
              {filtered.map((sale) => (
                <tr
                  key={sale.id}
                  onClick={() => setDetailId(sale.id)}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 pl-4 font-mono font-bold text-brand-700 dark:text-brand-300">#{sale.id}</td>
                  <td className="py-3 text-slate-500">{formatDate(sale.date, true)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar text={sale.client} className="w-8 h-8 rounded-lg text-[11px]" />
                      <span className="font-medium text-slate-800 dark:text-slate-100">{sale.client}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{sale.seller}</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{sale.payment}</td>
                  <td className="py-3">{statusBadge[sale.status]}</td>
                  <td className={`py-3 text-right font-bold ${sale.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-400">
                    <Eye className="w-4 h-4 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detalhes da venda */}
      <Modal isOpen={!!detail} onClose={() => setDetailId(null)} title={detail ? `Venda #${detail.id}` : ''} description={detail ? `${formatDate(detail.date, true)} • ${detail.seller}` : ''} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <Info label="Cliente" value={detail.client} />
              <Info label="Pagamento" value={detail.payment} />
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-slate-400">Status</p>
                <div className="mt-1">{statusBadge[detail.status]}</div>
              </div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className={thead}>
                  <th className="py-2 pl-3 text-left rounded-l-xl">Produto</th>
                  <th className="py-2 text-center">Qtd.</th>
                  <th className="py-2 text-right">Unitário</th>
                  <th className="py-2 pr-3 text-right rounded-r-xl">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail.items.map((i, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 pl-3 font-medium text-slate-700 dark:text-slate-200">{i.name}</td>
                    <td className="py-2.5 text-center">{i.quantity}</td>
                    <td className="py-2.5 text-right">{formatCurrency(i.price)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{formatCurrency(i.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between rounded-xl bg-brand-50 dark:bg-brand-900/30 px-4 py-3">
              <span className="text-sm font-semibold text-brand-800 dark:text-brand-200">Total</span>
              <span className="text-lg font-extrabold text-brand-800 dark:text-brand-200">{formatCurrency(detail.total)}</span>
            </div>
            <div className="flex justify-end gap-2">
              {detail.status !== 'CANCELLED' && (
                <Button
                  variant="outline"
                  className="text-red-600"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  onClick={() => {
                    if (!confirm(detail.status === 'QUOTE' ? 'Descartar este orçamento?' : 'Cancelar esta venda? O estoque será devolvido e a conta a receber em aberto será removida.')) return;
                    cancelSale(detail.id);
                    toast.info(`Venda #${detail.id} cancelada.`);
                  }}
                >
                  {detail.status === 'QUOTE' ? 'Descartar' : 'Cancelar Venda'}
                </Button>
              )}
              {detail.status === 'QUOTE' && (
                <Button
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => {
                    const short = detail.items.find((i) => (products.find((p) => p.id === i.productId)?.stock ?? 0) < i.quantity);
                    if (short) return toast.error(`Estoque insuficiente de "${short.name}".`);
                    completeQuote(detail.id);
                    toast.success(`Orçamento #${detail.id} efetivado como venda.`);
                  }}
                >
                  Efetivar Venda
                </Button>
              )}
              <Button variant="secondary" onClick={() => setDetailId(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Nova venda / orçamento */}
      <Modal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Novo Orçamento / Venda" description="Vendas concluídas baixam o estoque; a prazo geram conta a receber." size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Cliente"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={[{ value: '', label: 'Consumidor Final' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select label="Forma de Pagamento" value={payment} onChange={(e) => setPayment(e.target.value)} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Itens</p>
            {lines.map((line, idx) => {
              const p = products.find((x) => x.id === line.productId);
              const qty = parseInt(line.quantity, 10) || 0;
              return (
                <div key={idx} className="grid grid-cols-[1fr_90px_110px_40px] gap-2 items-center">
                  <Select
                    value={line.productId}
                    onChange={(e) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, productId: e.target.value } : l)))}
                    options={[
                      { value: '', label: 'Selecione o produto...' },
                      ...products.map((x) => ({ value: x.id, label: `${x.name} — ${formatCurrency(x.price)} (saldo ${x.stock})` })),
                    ]}
                  />
                  <Input
                    value={line.quantity}
                    inputMode="numeric"
                    onChange={(e) => setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, quantity: e.target.value.replace(/\D/g, '') } : l)))}
                  />
                  <span className="text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{p ? formatCurrency(p.price * qty) : '—'}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remover item"
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setLines((ls) => [...ls, { productId: '', quantity: '1' }])}>
              Adicionar item
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-300">{formatCurrency(draftTotal)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => submitSale('QUOTE')}>
                Salvar Orçamento
              </Button>
              <Button onClick={() => submitSale('COMPLETED')} leftIcon={<CheckCircle className="w-4 h-4" />}>
                Concluir Venda
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}
