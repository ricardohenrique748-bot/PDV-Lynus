import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';
import {
  Plus,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  PackageCheck,
  AlertTriangle,
  Search,
} from 'lucide-react';

type PurchaseStatus = 'RECEIVED' | 'PENDING' | 'CANCELED';

interface PurchaseItem {
  code: string;
  ean?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Purchase {
  id: string;
  nfeNumber: string;
  accessKey?: string;
  supplier: string;
  supplierCnpj?: string;
  date: string;
  status: PurchaseStatus;
  origin: 'XML' | 'MANUAL';
  items: PurchaseItem[];
  total: number;
}

const STORAGE_KEY = 'lynus.purchases';

const SEED: Purchase[] = [
  {
    id: '1',
    nfeNumber: '4490',
    supplier: 'Ambev S.A.',
    supplierCnpj: '07526557000100',
    date: new Date().toISOString(),
    status: 'RECEIVED',
    origin: 'XML',
    total: 4890,
    items: [
      { code: '1001', description: 'Cerveja Lata 350ml (cx 12)', unit: 'CX', quantity: 20, unitPrice: 54.5, total: 1090 },
      { code: '1002', description: 'Refrigerante 2L', unit: 'UN', quantity: 15, unitPrice: 253.33, total: 3800 },
    ],
  },
  {
    id: '2',
    nfeNumber: '1288',
    supplier: 'M. Dias Branco Alimentos',
    date: new Date().toISOString(),
    status: 'RECEIVED',
    origin: 'XML',
    total: 2450,
    items: [
      { code: '2001', description: 'Biscoito Recheado 140g (cx 48)', unit: 'CX', quantity: 10, unitPrice: 145, total: 1450 },
      { code: '2002', description: 'Macarrão Espaguete 500g (fd 20)', unit: 'FD', quantity: 8, unitPrice: 125, total: 1000 },
    ],
  },
];

function loadPurchases(): Purchase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Purchase[];
  } catch {
    /* ignore */
  }
  return SEED;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const num = (v: string | null | undefined) => {
  const n = parseFloat((v ?? '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

/** Lê um XML de NF-e (nfeProc ou NFe) e extrai cabeçalho e itens. */
function parseNfeXml(xmlText: string): Purchase {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    throw new Error('Arquivo XML inválido ou corrompido.');
  }
  const first = (parent: Document | Element, tag: string) => parent.getElementsByTagNameNS('*', tag)[0] ?? null;
  const text = (parent: Document | Element | null, tag: string) =>
    parent ? first(parent, tag)?.textContent?.trim() ?? '' : '';

  const infNFe = first(doc, 'infNFe');
  if (!infNFe) throw new Error('O arquivo não é um XML de NF-e (tag infNFe não encontrada).');

  const ide = first(infNFe, 'ide');
  const emit = first(infNFe, 'emit');
  const icmsTot = first(infNFe, 'ICMSTot');

  const items: PurchaseItem[] = Array.from(infNFe.getElementsByTagNameNS('*', 'det')).map((det) => {
    const prod = first(det, 'prod');
    const quantity = num(text(prod, 'qCom'));
    const unitPrice = num(text(prod, 'vUnCom'));
    const total = num(text(prod, 'vProd')) || quantity * unitPrice;
    const ean = text(prod, 'cEAN');
    return {
      code: text(prod, 'cProd'),
      ean: ean && ean !== 'SEM GTIN' ? ean : undefined,
      description: text(prod, 'xProd'),
      unit: text(prod, 'uCom') || 'UN',
      quantity,
      unitPrice,
      total,
    };
  });

  if (!items.length) throw new Error('Nenhum item (det) encontrado na NF-e.');

  const emission = text(ide, 'dhEmi') || text(ide, 'dEmi');
  return {
    id: newId(),
    nfeNumber: text(ide, 'nNF'),
    accessKey: (infNFe.getAttribute('Id') ?? '').replace(/^NFe/, '') || undefined,
    supplier: text(emit, 'xNome') || text(emit, 'xFant') || 'Fornecedor não identificado',
    supplierCnpj: text(emit, 'CNPJ') || text(emit, 'CPF') || undefined,
    date: emission ? new Date(emission).toISOString() : new Date().toISOString(),
    status: 'RECEIVED',
    origin: 'XML',
    items,
    total: num(text(icmsTot, 'vNF')) || items.reduce((s, i) => s + i.total, 0),
  };
}

function StatusBadge({ status }: { status: PurchaseStatus }) {
  if (status === 'RECEIVED')
    return (
      <Badge variant="success" size="sm">
        <CheckCircle className="w-3 h-3" /> Recebido & Estocado
      </Badge>
    );
  if (status === 'PENDING')
    return (
      <Badge variant="warning" size="sm">
        <Clock className="w-3 h-3" /> Pedido em Aberto
      </Badge>
    );
  return (
    <Badge variant="danger" size="sm">
      <XCircle className="w-3 h-3" /> Cancelado
    </Badge>
  );
}

function ItemsTable({ items }: { items: PurchaseItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-semibold">
          <tr>
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Descrição</th>
            <th className="px-3 py-2 text-center">Un</th>
            <th className="px-3 py-2 text-right">Qtd</th>
            <th className="px-3 py-2 text-right">Vl. Unit.</th>
            <th className="px-3 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((it, idx) => (
            <tr key={idx}>
              <td className="px-3 py-2 font-mono text-slate-500">{it.code || '—'}</td>
              <td className="px-3 py-2 text-slate-800 dark:text-slate-200">
                {it.description}
                {it.ean && <span className="block text-[10px] text-slate-400 font-mono">EAN {it.ean}</span>}
              </td>
              <td className="px-3 py-2 text-center">{it.unit}</td>
              <td className="px-3 py-2 text-right">{formatNumber(it.quantity, 2)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(it.unitPrice)}</td>
              <td className="px-3 py-2 text-right font-semibold">{formatCurrency(it.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DraftItem {
  description: string;
  quantity: string;
  unitPrice: string;
}
const emptyDraftItem: DraftItem = { description: '', quantity: '1', unitPrice: '' };

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(loadPurchases);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [xmlPreview, setXmlPreview] = useState<Purchase | null>(null);
  const [viewing, setViewing] = useState<Purchase | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);

  const [orderSupplier, setOrderSupplier] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderItems, setOrderItems] = useState<DraftItem[]>([{ ...emptyDraftItem }]);
  const [orderError, setOrderError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    } catch {
      /* ignore */
    }
  }, [purchases]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) => p.supplier.toLowerCase().includes(q) || p.nfeNumber.toLowerCase().includes(q)
    );
  }, [purchases, search]);

  // ---------- Importar XML ----------
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = parseNfeXml(await file.text());
      setXmlPreview(parsed);
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Falha ao ler o XML.' });
    }
  };

  const duplicate = xmlPreview?.accessKey
    ? purchases.some((p) => p.accessKey === xmlPreview.accessKey)
    : false;

  const confirmXml = () => {
    if (!xmlPreview || duplicate) return;
    setPurchases((prev) => [xmlPreview, ...prev]);
    setNotice({
      type: 'success',
      text: `NF #${xmlPreview.nfeNumber} importada: ${xmlPreview.items.length} itens lançados no estoque.`,
    });
    setXmlPreview(null);
  };

  // ---------- Novo pedido ----------
  const resetOrder = () => {
    setOrderSupplier('');
    setOrderNumber('');
    setOrderItems([{ ...emptyDraftItem }]);
    setOrderError('');
  };

  const orderTotal = orderItems.reduce((s, i) => s + num(i.quantity) * num(i.unitPrice), 0);

  const updateDraft = (idx: number, field: keyof DraftItem, value: string) =>
    setOrderItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const saveOrder = () => {
    const validItems = orderItems.filter((i) => i.description.trim() && num(i.quantity) > 0);
    if (!orderSupplier.trim()) return setOrderError('Informe o fornecedor.');
    if (!validItems.length) return setOrderError('Adicione ao menos um item com descrição e quantidade.');

    const items: PurchaseItem[] = validItems.map((i, idx) => {
      const quantity = num(i.quantity);
      const unitPrice = num(i.unitPrice);
      return {
        code: String(idx + 1).padStart(3, '0'),
        description: i.description.trim(),
        unit: 'UN',
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      };
    });

    const purchase: Purchase = {
      id: newId(),
      nfeNumber: orderNumber.trim() || `PC-${String(purchases.length + 1).padStart(4, '0')}`,
      supplier: orderSupplier.trim(),
      date: new Date().toISOString(),
      status: 'PENDING',
      origin: 'MANUAL',
      items,
      total: items.reduce((s, i) => s + i.total, 0),
    };
    setPurchases((prev) => [purchase, ...prev]);
    setNotice({ type: 'success', text: `Pedido ${purchase.nfeNumber} criado para ${purchase.supplier}.` });
    setOrderOpen(false);
    resetOrder();
  };

  // ---------- Conferência ----------
  const setStatus = (id: string, status: PurchaseStatus) => {
    setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    setViewing((v) => (v && v.id === id ? { ...v, status } : v));
    setNotice({
      type: 'success',
      text: status === 'RECEIVED' ? 'Recebimento confirmado e estoque atualizado.' : 'Pedido cancelado.',
    });
  };

  const removePurchase = (p: Purchase) => {
    if (!window.confirm(`Excluir o registro ${p.nfeNumber} de ${p.supplier}?`)) return;
    setPurchases((prev) => prev.filter((x) => x.id !== p.id));
    setViewing(null);
    setNotice({ type: 'success', text: 'Registro excluído.' });
  };

  return (
    <div className="space-y-6">
      <input ref={fileRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={handleFile} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Compras & Entrada de Mercadorias
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Importação de XML de NF-e de Fornecedores e Alimentação Automática de Estoque
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Upload className="w-4 h-4" />}
            onClick={() => fileRef.current?.click()}
          >
            Importar XML NF-e
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetOrder();
              setOrderOpen(true);
            }}
          >
            Novo Pedido de Compra
          </Button>
        </div>
      </div>

      {notice && (
        <div
          className={
            notice.type === 'success'
              ? 'flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-300'
              : 'flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300'
          }
        >
          {notice.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      <Card>
        <CardHeader className="flex-col sm:flex-row items-start sm:items-center gap-3">
          <div>
            <CardTitle>Histórico de Entradas e Compras</CardTitle>
            <CardDescription>Notas fiscais de entrada processadas no estoque</CardDescription>
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar fornecedor ou NF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-9"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="px-3 pb-3">NF-e / Pedido</th>
                <th className="px-3 pb-3">Fornecedor</th>
                <th className="px-3 pb-3">Data Entrada</th>
                <th className="px-3 pb-3 text-center">Itens</th>
                <th className="px-3 pb-3 text-right">Valor Total</th>
                <th className="px-3 pb-3">Status</th>
                <th className="px-3 pb-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Nenhuma entrada encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {p.origin === 'XML' ? `NF #${p.nfeNumber}` : p.nfeNumber}
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.supplier}</td>
                  <td className="px-3 py-3 text-slate-500">{formatDate(p.date)}</td>
                  <td className="px-3 py-3 text-center">{p.items.length}</td>
                  <td className="px-3 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(p.total)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setViewing(p)}>
                      Conferência
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pré-visualização do XML importado */}
      <Modal
        isOpen={!!xmlPreview}
        onClose={() => setXmlPreview(null)}
        title={xmlPreview ? `Importar NF-e #${xmlPreview.nfeNumber}` : ''}
        description="Confira os dados lidos do XML antes de dar entrada no estoque"
        size="xl"
      >
        {xmlPreview && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Fornecedor</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{xmlPreview.supplier}</p>
                {xmlPreview.supplierCnpj && <p className="font-mono text-slate-500">{xmlPreview.supplierCnpj}</p>}
              </div>
              <div>
                <p className="text-slate-400">Emissão</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(xmlPreview.date)}</p>
              </div>
              <div>
                <p className="text-slate-400">Valor da Nota</p>
                <p className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(xmlPreview.total)}</p>
              </div>
            </div>
            {xmlPreview.accessKey && (
              <p className="text-[10px] font-mono text-slate-400 break-all">Chave: {xmlPreview.accessKey}</p>
            )}
            {duplicate && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4" /> Esta NF-e já foi importada anteriormente.
              </div>
            )}
            <ItemsTable items={xmlPreview.items} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setXmlPreview(null)}>
                Cancelar
              </Button>
              <Button
                variant="success"
                size="sm"
                disabled={duplicate}
                leftIcon={<PackageCheck className="w-4 h-4" />}
                onClick={confirmXml}
              >
                Dar Entrada no Estoque
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Novo pedido de compra */}
      <Modal
        isOpen={orderOpen}
        onClose={() => setOrderOpen(false)}
        title="Novo Pedido de Compra"
        description="O pedido fica em aberto até a conferência do recebimento"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fornecedor"
              placeholder="Razão social do fornecedor"
              value={orderSupplier}
              onChange={(e) => setOrderSupplier(e.target.value)}
            />
            <Input
              label="Nº do Pedido (opcional)"
              placeholder="Gerado automaticamente"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Itens</p>
            {orderItems.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    placeholder="Descrição do produto"
                    value={it.description}
                    onChange={(e) => updateDraft(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Qtd"
                    value={it.quantity}
                    onChange={(e) => updateDraft(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Valor unit."
                    value={it.unitPrice}
                    onChange={(e) => updateDraft(idx, 'unitPrice', e.target.value)}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    disabled={orderItems.length === 1}
                    onClick={() => setOrderItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setOrderItems((prev) => [...prev, { ...emptyDraftItem }])}
            >
              Adicionar item
            </Button>
          </div>

          {orderError && <p className="text-xs font-medium text-red-600 dark:text-red-400">{orderError}</p>}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-500">
              Total: <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(orderTotal)}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOrderOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={saveOrder}>
                Salvar Pedido
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Conferência */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Conferência — ${viewing.origin === 'XML' ? `NF #${viewing.nfeNumber}` : viewing.nfeNumber}` : ''}
        description={viewing?.supplier}
        size="xl"
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <StatusBadge status={viewing.status} />
              <span className="text-slate-500">Data: {formatDate(viewing.date)}</span>
              <span className="text-slate-500">Origem: {viewing.origin === 'XML' ? 'XML NF-e' : 'Pedido manual'}</span>
              {viewing.supplierCnpj && <span className="font-mono text-slate-500">CNPJ {viewing.supplierCnpj}</span>}
            </div>
            {viewing.accessKey && (
              <p className="text-[10px] font-mono text-slate-400 break-all">Chave: {viewing.accessKey}</p>
            )}
            <ItemsTable items={viewing.items} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500">
                {viewing.items.length} itens ·{' '}
                {formatNumber(viewing.items.reduce((s, i) => s + i.quantity, 0), 0)} unidades · Total{' '}
                <span className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(viewing.total)}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => removePurchase(viewing)}
                >
                  Excluir
                </Button>
                {viewing.status === 'PENDING' && (
                  <>
                    <Button variant="danger" size="sm" onClick={() => setStatus(viewing.id, 'CANCELED')}>
                      Cancelar Pedido
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={<PackageCheck className="w-4 h-4" />}
                      onClick={() => setStatus(viewing.id, 'RECEIVED')}
                    >
                      Confirmar Recebimento
                    </Button>
                  </>
                )}
                {viewing.status !== 'PENDING' && (
                  <Button variant="outline" size="sm" onClick={() => setViewing(null)}>
                    Fechar
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
