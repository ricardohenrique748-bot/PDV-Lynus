import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/utils/formatters';
import {
  Barcode,
  Search,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  DollarSign,
  QrCode,
  CreditCard,
  Printer,
  XCircle,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDataStore } from '@/store/useDataStore';
import { toast } from '@/components/ui/Toast';
import { Select } from '@/components/ui/Select';

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
  unit: string;
  total: number;
}

export function POSPage() {
  const { currentCompany, currentBranch } = useTenant();
  const { profile } = useAuth();

  const { products, customers, createSale } = useDataStore();

  // Estados do PDV
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ id: string; total: number } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PIX' | 'CASH' | 'CARD' | 'SPLIT'>('PIX');
  const [cart, setCart] = useState<CartItem[]>([]);

  const customer = customers.find((c) => c.id === customerId);
  const customerName = customer?.name ?? 'Consumidor Final';

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Atalhos de Teclado no PDV (F3 cliente, F12 finalizar, Esc fechar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) setIsCheckoutOpen(true);
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsCustomerOpen(true);
      } else if (e.key === 'Escape') {
        if (isCheckoutOpen) setIsCheckoutOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen]);

  // Cálculos de Totais
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discount = 0.00;
  const netTotal = subtotal - discount;

  const stockOf = (id: string) => products.find((p) => p.id === id)?.stock ?? 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    // Suporta multiplicador: "3*7894900010015" adiciona 3 unidades
    const match = raw.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    const qty = match ? Math.max(1, parseInt(match[1], 10)) : 1;
    const term = (match ? match[2] : raw).toLowerCase();

    const product =
      products.find((p) => p.barcode === term || p.code.toLowerCase() === term) ||
      products.find((p) => p.name.toLowerCase().includes(term));

    if (!product) {
      toast.error(`Produto "${raw}" não encontrado.`);
      return;
    }

    const inCart = cart.find((i) => i.id === product.id)?.quantity ?? 0;
    if (inCart + qty > product.stock) {
      toast.error(`Estoque insuficiente de "${product.name}" (saldo ${product.stock}).`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty, total: +((i.quantity + qty) * i.price).toFixed(2) } : i
        );
      }
      return [
        {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          quantity: qty,
          unit: product.unit,
          total: +(product.price * qty).toFixed(2),
        },
        ...prev,
      ];
    });
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const item = cart.find((i) => i.id === id);
    if (item && delta > 0 && item.quantity + delta > stockOf(id)) {
      toast.error(`Estoque insuficiente (saldo ${stockOf(id)}).`);
      return;
    }
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: newQty, total: +(newQty * item.price).toFixed(2) };
          }
          return item;
        })
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const paymentLabels = { PIX: 'PIX', CASH: 'Dinheiro', CARD: 'Cartão Crédito', SPLIT: 'Pagamento Múltiplo' } as const;

  const handleFinalizeSale = () => {
    const sale = createSale({
      customerId: customer?.id ?? null,
      client: customerName,
      seller: profile?.full_name || 'Operador',
      payment: paymentLabels[selectedPaymentMethod],
      items: cart.map((i) => ({ productId: i.id, name: i.name, quantity: i.quantity, price: i.price, total: i.total })),
      status: 'COMPLETED',
    });
    setLastSale({ id: sale.id, total: sale.total });
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
    // Limpa carrinho após venda realizada
    setCart([]);
    setCustomerId('');
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-4 max-w-7xl mx-auto">
      {/* Barra de Status do Caixa / Turno */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 text-white shadow-soft">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Caixa 01 - ABERTO</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Operador: <strong>{profile?.full_name || 'Operador'}</strong></span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Turno iniciado às 08:00</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="sm">NFC-e Conectada</Badge>
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-7 text-xs">
              Sair do PDV
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid Central do PDV */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Painel Esquerdo: Entrada de Produto e Lista do Carrinho (8 colunas) */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm min-h-0">
          {/* Formulário de Bipagem de Código de Barras */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={barcodeInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Bipe o código de barras ou digite o nome do produto..."
                className="h-12 text-base font-medium pl-11"
                leftIcon={<Barcode className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="h-12 px-6 font-bold" leftIcon={<Search className="w-4 h-4" />}>
              Adicionar
            </Button>
          </form>

          {/* Tabela de Itens do Carrinho */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3">Descrição</th>
                  <th className="py-3 px-3 text-center">Qtd.</th>
                  <th className="py-3 px-3 text-right">Preço Unit.</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <Barcode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">O carrinho está vazio.</p>
                      <p className="text-[11px]">Bipe um produto para iniciar a venda.</p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.barcode}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold w-6 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Atalhos Rápidos no Rodapé */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span><span className="kbd-shortcut mr-1">F2</span> Nova Venda</span>
              <span><span className="kbd-shortcut mr-1">F4</span> Desconto</span>
              <span><span className="kbd-shortcut mr-1">F8</span> Sangria</span>
              <span><span className="kbd-shortcut mr-1">F9</span> Suprimento</span>
            </div>
            <div>
              <span><span className="kbd-shortcut mr-1">F12</span> Finalizar Pagamento</span>
            </div>
          </div>
        </div>

        {/* Painel Direito: Resumo Financeiro e Finalização (4 colunas) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Identificação do Cliente */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500 uppercase">Cliente</span>
              <button type="button" onClick={() => setIsCustomerOpen(true)} className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                Alterar (F3)
              </button>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                {customerName}
              </span>
            </div>
          </div>

          {/* Card Principal de Totalização */}
          <div className="flex-1 p-6 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-xl shadow-brand-900/20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Subtotal ({cart.length} itens):</span>
                <span className="font-semibold text-slate-200">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Descontos:</span>
                <span className="font-semibold text-emerald-400">- {formatCurrency(discount)}</span>
              </div>

              <div className="pt-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                  Total a Pagar
                </span>
                <div className="text-4xl font-black text-emerald-400 tracking-tight mt-1">
                  {formatCurrency(netTotal)}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-6">
              <Button
                variant="success"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full h-14 text-base font-extrabold shadow-lg shadow-emerald-600/30"
                shortcut="F12"
                leftIcon={<DollarSign className="w-5 h-5" />}
              >
                PAGAMENTO (F12)
              </Button>

              <Button
                variant="ghost"
                size="md"
                disabled={cart.length === 0}
                onClick={() => setCart([])}
                className="w-full text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancelar Venda Atual
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento Múltiplo / Checkout */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Finalizar Venda — Seleção de Pagamento"
        description="Selecione a forma de pagamento desejada ou combine múltiplas modalidades."
        size="lg"
      >
        <div className="space-y-6 pt-2">
          {/* Seletor de Meio de Pagamento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('PIX')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                selectedPaymentMethod === 'PIX'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <QrCode className="w-6 h-6" />
              <span>PIX Instantâneo</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('CASH')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                selectedPaymentMethod === 'CASH'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <DollarSign className="w-6 h-6" />
              <span>Dinheiro</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('CARD')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                selectedPaymentMethod === 'CARD'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span>Cartão Débito/Crédito</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('SPLIT')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                selectedPaymentMethod === 'SPLIT'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
              <span>Combinado (Misto)</span>
            </button>
          </div>

          {/* Detalhes do Pagamento Selecionado */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Valor Total da Venda:</span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {formatCurrency(netTotal)}
              </span>
            </div>

            {selectedPaymentMethod === 'PIX' && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-lg border">
                  <QrCode className="w-10 h-10 text-slate-700 dark:text-slate-200" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">QR Code PIX Dinâmico</p>
                  <p className="text-slate-500">Chave configurada para liquidação instantânea.</p>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'CASH' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Input label="Valor Recebido" defaultValue={netTotal.toFixed(2)} />
                <Input label="Troco a Devolver" disabled defaultValue="R$ 0,00" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Voltar ao Carrinho
            </Button>
            <Button variant="success" size="lg" onClick={handleFinalizeSale} leftIcon={<CheckCircle2 className="w-5 h-5" />}>
              Confirmar e Emitir NFC-e
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Sucesso */}
      <Modal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title="Venda Concluída com Sucesso!"
        size="sm"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Venda #{lastSale?.id} Registrada</h4>
            <p className="text-2xl font-extrabold text-brand-700 dark:text-brand-300 mt-1">{formatCurrency(lastSale?.total ?? 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Estoque atualizado e venda disponível em Vendas &amp; Pedidos.</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="primary" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Imprimir Comprovante / DANFE
            </Button>
            <Button variant="outline" onClick={() => { setIsSuccessOpen(false); barcodeInputRef.current?.focus(); }}>
              Nova Venda (F2)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Seleção de Cliente (F3) */}
      <Modal isOpen={isCustomerOpen} onClose={() => setIsCustomerOpen(false)} title="Cliente da Venda" description="Vendas a prazo exigem cliente cadastrado." size="sm">
        <div className="space-y-4">
          <Select
            label="Cliente"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={[{ value: '', label: 'Consumidor Final' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setIsCustomerOpen(false);
                barcodeInputRef.current?.focus();
              }}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
