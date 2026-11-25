import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ============================================================
 * Base de dados local do Lynus PDV (persistida no navegador).
 * Compartilhada entre PDV, Vendas, Estoque, Clientes e Financeiro.
 * ============================================================ */

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  unit: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
}

export type PersonType = 'PF' | 'PJ';

export interface Customer {
  id: string;
  name: string;
  taxId: string;
  personType: PersonType;
  phone: string;
  email: string;
  city: string;
  creditLimit: number;
  balance: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export type SaleStatus = 'COMPLETED' | 'QUOTE' | 'CANCELLED';

export interface Sale {
  id: string;
  date: string;
  customerId: string | null;
  client: string;
  seller: string;
  payment: string;
  items: SaleItem[];
  total: number;
  status: SaleStatus;
}

export type EntryType = 'RECEIVABLE' | 'PAYABLE';

export interface FinancialEntry {
  id: string;
  type: EntryType;
  party: string;
  customerId?: string | null;
  saleId?: string | null;
  description: string;
  due: string; // AAAA-MM-DD
  amount: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string | null;
}

export interface BankAccount {
  id: string;
  bank: string;
  agency: string;
  account: string;
  balance: number;
}

/** Formas de pagamento que geram conta a receber (venda a prazo) */
export const CREDIT_PAYMENTS = ['Boleto 30D', 'Crediário'];
export const PAYMENT_METHODS = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Cartão Crédito 3x', 'Boleto 30D', 'Crediário'];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const todayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayKey(d);
};

/* -------------------- Dados iniciais -------------------- */

const seedProducts: Product[] = [
  { id: 'p1', code: 'PRD-001', barcode: '7894900010015', name: 'Refrigerante Coca-Cola 2L Pet', category: 'Bebidas', stock: 45, minStock: 20, cost: 7.2, price: 11.5, unit: 'UN' },
  { id: 'p2', code: 'PRD-002', barcode: '7896005800012', name: 'Café Torrado e Moído Pilão 500g', category: 'Mercearia', stock: 12, minStock: 15, cost: 13.5, price: 19.9, unit: 'UN' },
  { id: 'p3', code: 'PRD-003', barcode: '7891000100103', name: 'Leite Integral Longa Vida 1L', category: 'Laticínios', stock: 84, minStock: 30, cost: 3.4, price: 5.2, unit: 'UN' },
  { id: 'p4', code: 'PRD-004', barcode: '7891024132101', name: 'Açúcar Refinado União 1kg', category: 'Mercearia', stock: 8, minStock: 25, cost: 3.1, price: 4.8, unit: 'UN' },
  { id: 'p5', code: 'PRD-005', barcode: '7896015523101', name: 'Arroz Branco Tipo 1 5kg', category: 'Grãos', stock: 65, minStock: 20, cost: 21.0, price: 29.9, unit: 'UN' },
];

const seedCustomers: Customer[] = [
  { id: 'c1', name: 'Mercado Bom Preço LTDA', taxId: '12345678000190', personType: 'PJ', phone: '1134567890', email: 'compras@bompreco.com.br', city: 'São Paulo - SP', creditLimit: 10000, balance: 1420 },
  { id: 'c2', name: 'Carlos Eduardo Souza', taxId: '12345678901', personType: 'PF', phone: '11987654321', email: 'carlos.souza@email.com', city: 'São Paulo - SP', creditLimit: 2500, balance: 0 },
  { id: 'c3', name: 'Juliana Mendes Silva', taxId: '98765432100', personType: 'PF', phone: '11912345678', email: 'juliana.mendes@email.com', city: 'Guarulhos - SP', creditLimit: 1500, balance: 106.96 },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const seedSales: Sale[] = [
  { id: '10492', date: hoursAgo(1), customerId: null, client: 'Consumidor Final', seller: 'Lucas Vendedor', payment: 'PIX', status: 'COMPLETED', total: 189.5, items: [{ productId: 'p5', name: 'Arroz Branco Tipo 1 5kg', quantity: 5, price: 29.9, total: 149.5 }, { productId: 'p4', name: 'Açúcar Refinado União 1kg', quantity: 5, price: 8, total: 40 }] },
  { id: '10491', date: hoursAgo(2), customerId: 'c1', client: 'Mercado Bom Preço LTDA', seller: 'Lucas Vendedor', payment: 'Boleto 30D', status: 'COMPLETED', total: 1420, items: [{ productId: 'p1', name: 'Refrigerante Coca-Cola 2L Pet', quantity: 100, price: 11.5, total: 1150 }, { productId: 'p3', name: 'Leite Integral Longa Vida 1L', quantity: 50, price: 5.4, total: 270 }] },
  { id: '10490', date: hoursAgo(3), customerId: 'c2', client: 'Carlos Eduardo Souza', seller: 'Ana Vendedora', payment: 'Dinheiro', status: 'COMPLETED', total: 45, items: [{ productId: 'p2', name: 'Café Torrado e Moído Pilão 500g', quantity: 2, price: 22.5, total: 45 }] },
  { id: '10489', date: hoursAgo(26), customerId: 'c3', client: 'Juliana Mendes Silva', seller: 'Ana Vendedora', payment: 'Cartão Crédito 3x', status: 'COMPLETED', total: 320.9, items: [{ productId: 'p5', name: 'Arroz Branco Tipo 1 5kg', quantity: 10, price: 29.9, total: 299 }, { productId: 'p3', name: 'Leite Integral Longa Vida 1L', quantity: 4, price: 5.475, total: 21.9 }] },
];

const seedEntries: FinancialEntry[] = [
  { id: 'f1', type: 'RECEIVABLE', party: 'Mercado Bom Preço LTDA', customerId: 'c1', saleId: '10491', description: 'Duplicata 10491/01', due: addDays(28), amount: 1420, status: 'PENDING' },
  { id: 'f2', type: 'RECEIVABLE', party: 'Juliana Mendes Silva', customerId: 'c3', description: 'Crediário Parcela 01/03', due: addDays(12), amount: 106.96, status: 'PENDING' },
  { id: 'f3', type: 'RECEIVABLE', party: 'Supermercado Progresso', description: 'Venda NF-e 8901', due: addDays(-7), amount: 3200, status: 'PAID', paidAt: addDays(-7) },
  { id: 'f4', type: 'PAYABLE', party: 'Ambev S.A.', description: 'Compra de Mercadorias Boleto 4490', due: addDays(8), amount: 4890, status: 'PENDING' },
  { id: 'f5', type: 'PAYABLE', party: 'Enel Distribuição SP', description: 'Energia Elétrica Matriz', due: addDays(3), amount: 1240.5, status: 'PENDING' },
  { id: 'f6', type: 'PAYABLE', party: 'Locadora Imobiliária', description: 'Aluguel Comercial Loja 01', due: addDays(-2), amount: 3500, status: 'PAID', paidAt: addDays(-2) },
];

const seedBanks: BankAccount[] = [
  { id: 'b1', bank: 'Banco do Brasil', agency: '1234-5', account: '67890-1', balance: 18250.4 },
  { id: 'b2', bank: 'Nubank PJ', agency: '0001', account: '9876543-2', balance: 6420.15 },
];

/* -------------------- Store -------------------- */

export interface NewSaleInput {
  customerId: string | null;
  client: string;
  seller: string;
  payment: string;
  items: SaleItem[];
  status: Extract<SaleStatus, 'COMPLETED' | 'QUOTE'>;
}

interface DataState {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  entries: FinancialEntry[];
  banks: BankAccount[];

  saveProduct: (p: Omit<Product, 'id' | 'code'> & { id?: string; code?: string }) => Product;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;

  saveCustomer: (c: Omit<Customer, 'id' | 'balance'> & { id?: string; balance?: number }) => Customer;
  deleteCustomer: (id: string) => void;

  createSale: (input: NewSaleInput) => Sale;
  completeQuote: (id: string) => void;
  cancelSale: (id: string) => void;

  saveEntry: (e: Omit<FinancialEntry, 'id' | 'status'> & { id?: string; status?: FinancialEntry['status'] }) => void;
  settleEntry: (id: string) => void;
  reopenEntry: (id: string) => void;
  deleteEntry: (id: string) => void;

  saveBank: (b: Omit<BankAccount, 'id'> & { id?: string }) => void;
  deleteBank: (id: string) => void;

  resetDemo: () => void;
}

const initialData = () => ({
  products: seedProducts,
  customers: seedCustomers,
  sales: seedSales,
  entries: seedEntries,
  banks: seedBanks,
});

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => {
      /** Aplica baixa (delta negativo) ou devolução (positivo) de estoque para os itens */
      const moveStock = (items: SaleItem[], sign: 1 | -1) =>
        set((s) => ({
          products: s.products.map((p) => {
            const qty = items.filter((i) => i.productId === p.id).reduce((a, i) => a + i.quantity, 0);
            return qty ? { ...p, stock: p.stock + sign * qty } : p;
          }),
        }));

      const changeBalance = (customerId: string | null | undefined, delta: number) => {
        if (!customerId) return;
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId ? { ...c, balance: Math.max(0, +(c.balance + delta).toFixed(2)) } : c
          ),
        }));
      };

      /** Efeitos de uma venda concluída: estoque + conta a receber (se a prazo) */
      const applyCompletedSale = (sale: Sale) => {
        moveStock(sale.items, -1);
        if (CREDIT_PAYMENTS.includes(sale.payment)) {
          set((s) => ({
            entries: [
              {
                id: uid(),
                type: 'RECEIVABLE',
                party: sale.client,
                customerId: sale.customerId,
                saleId: sale.id,
                description: `${sale.payment === 'Crediário' ? 'Crediário' : 'Duplicata'} venda #${sale.id}`,
                due: addDays(30),
                amount: sale.total,
                status: 'PENDING',
              },
              ...s.entries,
            ],
          }));
          changeBalance(sale.customerId, sale.total);
        }
      };

      return {
        ...initialData(),

        saveProduct: (input) => {
          const existing = input.id ? get().products.find((p) => p.id === input.id) : undefined;
          if (existing) {
            const updated = { ...existing, ...input, id: existing.id, code: existing.code };
            set((s) => ({ products: s.products.map((p) => (p.id === existing.id ? updated : p)) }));
            return updated;
          }
          const nextNum =
            get().products.reduce((max, p) => Math.max(max, parseInt(p.code.replace(/\D/g, ''), 10) || 0), 0) + 1;
          const created: Product = { ...input, id: uid(), code: `PRD-${String(nextNum).padStart(3, '0')}` };
          set((s) => ({ products: [...s.products, created] }));
          return created;
        },

        deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

        adjustStock: (id, delta) =>
          set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, stock: p.stock + delta } : p)) })),

        saveCustomer: (input) => {
          const existing = input.id ? get().customers.find((c) => c.id === input.id) : undefined;
          if (existing) {
            const updated = { ...existing, ...input, id: existing.id, balance: existing.balance };
            set((s) => ({ customers: s.customers.map((c) => (c.id === existing.id ? updated : c)) }));
            return updated;
          }
          const created: Customer = { ...input, id: uid(), balance: input.balance ?? 0 };
          set((s) => ({ customers: [...s.customers, created] }));
          return created;
        },

        deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

        createSale: (input) => {
          const nextId = get().sales.reduce((max, s) => Math.max(max, parseInt(s.id, 10) || 0), 10000) + 1;
          const sale: Sale = {
            ...input,
            id: String(nextId),
            date: new Date().toISOString(),
            total: +input.items.reduce((a, i) => a + i.total, 0).toFixed(2),
          };
          set((s) => ({ sales: [sale, ...s.sales] }));
          if (sale.status === 'COMPLETED') applyCompletedSale(sale);
          return sale;
        },

        completeQuote: (id) => {
          const sale = get().sales.find((s) => s.id === id);
          if (!sale || sale.status !== 'QUOTE') return;
          const completed = { ...sale, status: 'COMPLETED' as const, date: new Date().toISOString() };
          set((s) => ({ sales: s.sales.map((x) => (x.id === id ? completed : x)) }));
          applyCompletedSale(completed);
        },

        cancelSale: (id) => {
          const sale = get().sales.find((s) => s.id === id);
          if (!sale || sale.status === 'CANCELLED') return;
          if (sale.status === 'COMPLETED') {
            moveStock(sale.items, 1);
            const pending = get().entries.filter((e) => e.saleId === id && e.status === 'PENDING');
            pending.forEach((e) => changeBalance(e.customerId, -e.amount));
            set((s) => ({ entries: s.entries.filter((e) => !(e.saleId === id && e.status === 'PENDING')) }));
          }
          set((s) => ({ sales: s.sales.map((x) => (x.id === id ? { ...x, status: 'CANCELLED' } : x)) }));
        },

        saveEntry: (input) => {
          if (input.id && get().entries.some((e) => e.id === input.id)) {
            set((s) => ({ entries: s.entries.map((e) => (e.id === input.id ? { ...e, ...input, id: e.id } : e)) }));
            return;
          }
          const entry: FinancialEntry = { ...input, id: uid(), status: input.status ?? 'PENDING' };
          set((s) => ({ entries: [entry, ...s.entries] }));
          if (entry.type === 'RECEIVABLE' && entry.status === 'PENDING') changeBalance(entry.customerId, entry.amount);
        },

        settleEntry: (id) => {
          const entry = get().entries.find((e) => e.id === id);
          if (!entry || entry.status === 'PAID') return;
          set((s) => ({
            entries: s.entries.map((e) => (e.id === id ? { ...e, status: 'PAID', paidAt: todayKey() } : e)),
          }));
          if (entry.type === 'RECEIVABLE') changeBalance(entry.customerId, -entry.amount);
        },

        reopenEntry: (id) => {
          const entry = get().entries.find((e) => e.id === id);
          if (!entry || entry.status === 'PENDING') return;
          set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, status: 'PENDING', paidAt: null } : e)) }));
          if (entry.type === 'RECEIVABLE') changeBalance(entry.customerId, entry.amount);
        },

        deleteEntry: (id) => {
          const entry = get().entries.find((e) => e.id === id);
          if (entry?.type === 'RECEIVABLE' && entry.status === 'PENDING') changeBalance(entry.customerId, -entry.amount);
          set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
        },

        saveBank: (input) => {
          if (input.id) {
            set((s) => ({ banks: s.banks.map((b) => (b.id === input.id ? { ...b, ...input, id: b.id } : b)) }));
            return;
          }
          set((s) => ({ banks: [...s.banks, { ...input, id: uid() }] }));
        },

        deleteBank: (id) => set((s) => ({ banks: s.banks.filter((b) => b.id !== id) })),

        resetDemo: () => set(initialData()),
      };
    },
    { name: 'lynus_pdv_data_v1', version: 1 }
  )
);
