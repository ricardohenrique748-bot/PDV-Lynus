export type UserSystemRole = 
  | 'SUPERADMIN'
  | 'COMPANY_ADMIN'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'CASHIER'
  | 'SELLER'
  | 'FINANCIAL'
  | 'STOCKIST'
  | 'ACCOUNTANT';

export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';

export type PaymentMethodType = 
  | 'CASH'
  | 'PIX'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BOLETO'
  | 'BANK_TRANSFER'
  | 'STORE_CREDIT'
  | 'OTHER';

export type StockMovementType = 
  | 'PURCHASE_ENTRY'
  | 'SALE_EXIT'
  | 'SALE_RETURN'
  | 'LOSS_BREAKAGE'
  | 'INVENTORY_ADJUSTMENT'
  | 'BRANCH_TRANSFER_OUT'
  | 'BRANCH_TRANSFER_IN';

export type ShiftStatus = 'OPEN' | 'CLOSED' | 'AUDITED';

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELED' | 'EXCHANGED';

export type FinancialStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELED' | 'RENEGOTIATED';

export type FiscalDocType = 'NFE' | 'NFCE' | 'NFSE';

export type FiscalStatusEnum = 
  | 'DRAFT'
  | 'SENDING'
  | 'AUTHORIZED'
  | 'REJECTED'
  | 'CANCELED'
  | 'CORRECTED'
  | 'DENIED';

export interface PlatformPlan {
  id: string;
  name: string;
  slug: string;
  max_users: number;
  max_branches: number;
  has_pos: boolean;
  has_fiscal: boolean;
  has_dre: boolean;
  has_crm: boolean;
  monthly_price: number;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  plan_id: string;
  name: string;
  trade_name: string | null;
  tax_id: string;
  state_registration: string | null;
  city_registration: string | null;
  tax_regime: number; // 1: Simples, 2: Excesso, 3: Presumido, 4: Real
  email: string | null;
  phone: string | null;
  postal_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city_ibge_code: string;
  city_name: string;
  state_code: string;
  logo_url: string | null;
  subscription_status: SubscriptionStatus;
  grace_period_days: number;
  subscription_due_date: string | null;
  created_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  code: string;
  name: string;
  tax_id: string;
  state_registration: string | null;
  city_registration: string | null;
  is_headquarters: boolean;
  postal_code: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city_ibge_code: string | null;
  city_name: string | null;
  state_code: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  is_superadmin: boolean;
  created_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  profile_id: string;
  default_branch_id: string | null;
  role: UserSystemRole;
  custom_permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  company?: Company;
  profile?: Profile;
}

export interface Product {
  id: string;
  company_id: string;
  category_id: string | null;
  brand_id: string | null;
  tax_rule_id: string | null;
  internal_code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unit_of_measure: string;
  is_fractional: boolean;
  cost_price: number;
  sale_price: number;
  minimum_margin_percent: number;
  min_stock: number;
  max_stock: number;
  current_stock: number;
  image_url: string | null;
  ncm: string;
  cest: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PosTerminal {
  id: string;
  company_id: string;
  branch_id: string;
  terminal_number: number;
  description: string;
  printer_type: string;
  is_active: boolean;
  created_at: string;
}

export interface CashShift {
  id: string;
  company_id: string;
  branch_id: string;
  terminal_id: string;
  user_id: string;
  status: ShiftStatus;
  initial_cash: number;
  total_sales: number;
  total_supplies: number;
  total_bleedings: number;
  final_cash_expected: number;
  final_cash_counted: number | null;
  cash_difference: number | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface Sale {
  id: string;
  company_id: string;
  branch_id: string;
  shift_id: string | null;
  seller_id: string;
  customer_id: string | null;
  sale_number: number;
  idempotency_key: string;
  status: SaleStatus;
  gross_total: number;
  discount_total: number;
  additional_total: number;
  net_total: number;
  total_cost: number;
  commission_total: number;
  canceled_at: string | null;
  canceled_by: string | null;
  cancellation_reason: string | null;
  fiscal_status: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  company_id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_amount: number;
  total_amount: number;
  cfop: string;
  cst_csosn: string;
  ncm: string;
  canceled: boolean;
  created_at: string;
  product?: Product;
}

export interface SalePayment {
  id: string;
  company_id: string;
  sale_id: string;
  method: PaymentMethodType;
  installments_count: number;
  amount: number;
  fee_rate: number;
  net_amount: number;
  card_auth_code: string | null;
  due_date: string;
  created_at: string;
}

