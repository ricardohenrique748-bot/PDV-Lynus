import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, EmptyRow, thead } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { useDataStore, type Product } from '@/store/useDataStore';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { exportCsv } from '@/utils/exportCsv';
import { cn } from '@/utils/cn';
import { StatCard, InitialsAvatar } from '@/components/ui/StatCard';
import { Plus, Search, AlertTriangle, FileSpreadsheet, Pencil, PackagePlus, Trash2, Boxes, Wallet, TrendingUp } from 'lucide-react';

type ProductForm = {
  id?: string;
  name: string;
  barcode: string;
  category: string;
  unit: string;
  cost: string;
  price: string;
  stock: string;
  minStock: string;
};

const emptyForm: ProductForm = { name: '', barcode: '', category: '', unit: 'UN', cost: '', price: '', stock: '0', minStock: '0' };
const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;

export function InventoryPage() {
  const { products, saveProduct, deleteProduct, adjustStock } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);

  const [form, setForm] = useState<ProductForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState('');
  const [stockMode, setStockMode] = useState<'IN' | 'OUT'>('IN');

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (q && ![p.name, p.code, p.barcode].some((f) => f.toLowerCase().includes(q))) return false;
      if (category && p.category !== category) return false;
      if (onlyLow && p.stock > p.minStock) return false;
      return true;
    });
  }, [products, searchTerm, category, onlyLow]);

  const lowCount = products.filter((p) => p.stock <= p.minStock).length;
  const stockValue = products.reduce((a, p) => a + p.cost * Math.max(0, p.stock), 0);
  const saleValue = products.reduce((a, p) => a + p.price * Math.max(0, p.stock), 0);
  const avgMargin = products.length ? products.reduce((a, p) => a + (p.price ? ((p.price - p.cost) / p.price) * 100 : 0), 0) / products.length : 0;

  const openEdit = (p: Product) =>
    setForm({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      category: p.category,
      unit: p.unit,
      cost: String(p.cost),
      price: String(p.price),
      stock: String(p.stock),
      minStock: String(p.minStock),
    });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Informe a descrição';
    if (!form.category.trim()) errs.category = 'Informe a categoria';
    if (num(form.price) <= 0) errs.price = 'Preço deve ser maior que zero';
    if (form.barcode && products.some((p) => p.barcode === form.barcode && p.id !== form.id))
      errs.barcode = 'Código de barras já cadastrado';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const saved = saveProduct({
      id: form.id,
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),
      unit: form.unit,
      cost: num(form.cost),
      price: num(form.price),
      stock: Math.round(num(form.stock)),
      minStock: Math.round(num(form.minStock)),
    });
    toast.success(form.id ? `Produto ${saved.code} atualizado.` : `Produto ${saved.code} cadastrado.`);
    setForm(null);
  };

  const handleDelete = () => {
    if (!form?.id) return;
    if (!confirm(`Excluir o produto "${form.name}"?`)) return;
    deleteProduct(form.id);
    toast.info('Produto excluído.');
    setForm(null);
  };

  const handleStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockTarget) return;
    const qty = Math.round(num(stockDelta));
    if (qty <= 0) return toast.error('Informe uma quantidade maior que zero.');
    const delta = stockMode === 'IN' ? qty : -qty;
    if (stockTarget.stock + delta < 0) return toast.error('A saída deixaria o estoque negativo.');
    adjustStock(stockTarget.id, delta);
    toast.success(`${stockMode === 'IN' ? 'Entrada' : 'Saída'} de ${qty} ${stockTarget.unit} registrada.`);
    setStockTarget(null);
  };

  const handleExport = () => {
    exportCsv(
      'produtos-estoque',
      ['Código', 'Código de Barras', 'Descrição', 'Categoria', 'Unidade', 'Custo', 'Preço', 'Margem %', 'Saldo', 'Estoque Mínimo'],
      filtered.map((p) => [
        p.code,
        p.barcode,
        p.name,
        p.category,
        p.unit,
        p.cost,
        p.price,
        p.price ? ((p.price - p.cost) / p.price) * 100 : 0,
        String(p.stock),
        String(p.minStock),
      ])
    );
    toast.success(`${filtered.length} produtos exportados.`);
  };

  const set = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catálogo de Produtos & Estoque"
        description="Controle de saldos, preços de venda, margem e estoque mínimo"
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />} onClick={handleExport}>
              Exportar Excel
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setErrors({});
                setForm(emptyForm);
              }}
            >
              Cadastrar Produto
            </Button>
          </>
        }
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Produtos cadastrados" value={products.length} icon={Boxes} hint={`${categories.length} categorias`} />
        <StatCard label="Valor em estoque (custo)" value={formatCurrency(stockValue)} icon={Wallet} tone="sky" hint={`Venda potencial ${formatCurrency(saleValue)}`} />
        <StatCard
          label="Estoque baixo"
          value={`${lowCount} ${lowCount === 1 ? 'item' : 'itens'}`}
          icon={AlertTriangle}
          tone={lowCount ? 'amber' : 'emerald'}
          hint={onlyLow ? 'Filtro ativo — clique para remover' : 'Clique para filtrar'}
          onClick={() => setOnlyLow((v) => !v)}
          active={onlyLow}
        />
        <StatCard label="Margem média" value={`${avgMargin.toFixed(1)}%`} icon={TrendingUp} tone="emerald" hint="Sobre o preço de venda" />
      </div>

      {/* Busca e Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição, código interno ou código de barras..."
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: '', label: 'Todas as Categorias' }, ...categories.map((c) => ({ value: c, label: c }))]}
          />
          <button
            type="button"
            onClick={() => setOnlyLow((v) => !v)}
            aria-pressed={onlyLow}
            className={cn(
              'h-10 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border whitespace-nowrap',
              onlyLow
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300'
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            Apenas Estoque Baixo
          </button>
        </div>
      </Card>

      {/* Tabela de Produtos */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <CardTitle>Produtos</CardTitle>
          <CardDescription>
            {filtered.length} de {products.length} produtos exibidos
          </CardDescription>
        </div>

        <div className="overflow-x-auto px-3 pb-3">
          <table className="w-full text-left text-[13px] min-w-[860px]">
            <thead>
              <tr className={thead}>
                <th className="py-3 pl-4 rounded-l-xl">Produto</th>
                <th className="py-3">Categoria</th>
                <th className="py-3 text-right">Custo</th>
                <th className="py-3 text-right pr-6">Preço de Venda</th>
                <th className="py-3 w-44">Estoque</th>
                <th className="py-3">Status</th>
                <th className="py-3 pr-4 text-right rounded-r-xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && <EmptyRow colSpan={7} message="Nenhum produto encontrado com esses filtros." />}
              {filtered.map((item) => {
                const isLow = item.stock <= item.minStock;
                const isOut = item.stock <= 0;
                const margin = item.price ? ((item.price - item.cost) / item.price) * 100 : 0;
                // Barra cheia = 3x o estoque mínimo
                const ref = Math.max(item.minStock * 3, 1);
                const pct = Math.min(100, (item.stock / ref) * 100);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar text={item.name} seed={item.category} />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[320px]">{item.name}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            {item.code} · {item.barcode || 'sem EAN'} · {item.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-slate-500">{formatCurrency(item.cost)}</td>
                    <td className="py-3.5 text-right pr-6">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{formatCurrency(item.price)}</div>
                      <div className={cn('text-xs font-medium', margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-red-600')}>
                        {margin.toFixed(1)}% margem
                      </div>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-baseline justify-between pr-2">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100">{formatNumber(item.stock, 0)}</span>
                        <span className="text-[11px] text-slate-500">mín. {item.minStock}</span>
                      </div>
                      <div className="mt-1.5 mr-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500')}
                          style={{ width: `${Math.max(pct, isOut ? 0 : 4)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5">
                      {isOut ? (
                        <Badge variant="danger">Sem estoque</Badge>
                      ) : isLow ? (
                        <Badge variant="warning">
                          <AlertTriangle className="w-3 h-3" />
                          Estoque baixo
                        </Badge>
                      ) : (
                        <Badge variant="success">Normal</Badge>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Movimentar estoque"
                          onClick={() => {
                            setStockTarget(item);
                            setStockDelta('');
                            setStockMode('IN');
                          }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <PackagePlus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title="Editar produto"
                          onClick={() => {
                            setErrors({});
                            openEdit(item);
                          }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-brand-700 hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Cadastro / Edição */}
      <Modal
        isOpen={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Editar Produto' : 'Cadastrar Produto'}
        description="Os dados ficam disponíveis imediatamente no PDV."
        size="lg"
      >
        {form && (
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Descrição *" value={form.name} onChange={set('name')} error={errors.name} autoFocus />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Código de Barras (EAN)" value={form.barcode} onChange={set('barcode')} error={errors.barcode} inputMode="numeric" />
              <Input label="Categoria *" value={form.category} onChange={set('category')} error={errors.category} list="categorias" />
              <datalist id="categorias">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <Select
                label="Unidade"
                value={form.unit}
                onChange={set('unit')}
                options={['UN', 'KG', 'LT', 'CX', 'PCT', 'MT'].map((u) => ({ value: u, label: u }))}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Custo (R$)" value={form.cost} onChange={set('cost')} inputMode="decimal" />
              <Input label="Preço Venda (R$) *" value={form.price} onChange={set('price')} error={errors.price} inputMode="decimal" />
              <Input label="Saldo Atual" value={form.stock} onChange={set('stock')} inputMode="numeric" />
              <Input label="Estoque Mínimo" value={form.minStock} onChange={set('minStock')} inputMode="numeric" />
            </div>
            {num(form.price) > 0 && (
              <p className="text-xs text-slate-500">
                Margem calculada:{' '}
                <strong className="text-emerald-600">
                  {(((num(form.price) - num(form.cost)) / num(form.price)) * 100).toFixed(1)}%
                </strong>
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              {form.id ? (
                <Button type="button" variant="ghost" className="text-red-600" leftIcon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
                  Excluir
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setForm(null)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Produto</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Movimentação de Estoque */}
      <Modal
        isOpen={!!stockTarget}
        onClose={() => setStockTarget(null)}
        title="Movimentar Estoque"
        description={stockTarget ? `${stockTarget.code} • ${stockTarget.name} — saldo atual ${stockTarget.stock} ${stockTarget.unit}` : ''}
        size="sm"
      >
        <form onSubmit={handleStock} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(['IN', 'OUT'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setStockMode(m)}
                className={cn(
                  'h-9 rounded-lg text-xs font-semibold transition-colors',
                  stockMode === m ? 'bg-white dark:bg-slate-900 shadow-soft text-brand-700 dark:text-brand-200' : 'text-slate-500'
                )}
              >
                {m === 'IN' ? 'Entrada' : 'Saída / Perda'}
              </button>
            ))}
          </div>
          <Input label="Quantidade" value={stockDelta} onChange={(e) => setStockDelta(e.target.value)} inputMode="numeric" autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setStockTarget(null)}>
              Cancelar
            </Button>
            <Button type="submit">Confirmar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
