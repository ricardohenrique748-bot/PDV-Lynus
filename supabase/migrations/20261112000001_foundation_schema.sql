-- ============================================================================
-- LYNUSSYSTEM ERP - MIGRATION 001: FUNDAÇÃO E INFRAESTRUTURA COMPLETA
-- ============================================================================

-- 1. Habilitar Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Enums do Sistema
DO $$ BEGIN
    CREATE TYPE user_system_role AS ENUM (
        'SUPERADMIN',
        'COMPANY_ADMIN',
        'MANAGER',
        'SUPERVISOR',
        'CASHIER',
        'SELLER',
        'FINANCIAL',
        'STOCKIST',
        'ACCOUNTANT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE account_nature AS ENUM (
        'REVENUE',
        'DEDUCTION',
        'COST',
        'EXPENSE',
        'ASSET',
        'LIABILITY'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE financial_status AS ENUM (
        'PENDING',
        'PARTIAL',
        'PAID',
        'CANCELED',
        'RENEGOTIATED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM (
        'CASH',
        'PIX',
        'DEBIT_CARD',
        'CREDIT_CARD',
        'BOLETO',
        'BANK_TRANSFER',
        'STORE_CREDIT',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_type AS ENUM (
        'PURCHASE_ENTRY',
        'SALE_EXIT',
        'SALE_RETURN',
        'LOSS_BREAKAGE',
        'INVENTORY_ADJUSTMENT',
        'BRANCH_TRANSFER_OUT',
        'BRANCH_TRANSFER_IN'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('OPEN', 'CLOSED', 'AUDITED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sale_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELED', 'EXCHANGED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE fiscal_doc_type AS ENUM ('NFE', 'NFCE', 'NFSE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE fiscal_status_enum AS ENUM (
        'DRAFT',
        'SENDING',
        'AUTHORIZED',
        'REJECTED',
        'CANCELED',
        'CORRECTED',
        'DENIED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Planos da Plataforma SaaS
CREATE TABLE IF NOT EXISTS platform_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    max_users INT NOT NULL DEFAULT 3,
    max_branches INT NOT NULL DEFAULT 1,
    has_pos BOOLEAN DEFAULT TRUE,
    has_fiscal BOOLEAN DEFAULT TRUE,
    has_dre BOOLEAN DEFAULT TRUE,
    has_crm BOOLEAN DEFAULT TRUE,
    monthly_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Empresas (Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES platform_plans(id),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    tax_id VARCHAR(18) UNIQUE NOT NULL,
    state_registration VARCHAR(30),
    city_registration VARCHAR(30),
    tax_regime INT NOT NULL DEFAULT 1, -- 1: Simples Nacional, 2: Simples Excesso, 3: Lucro Presumido, 4: Lucro Real
    email VARCHAR(150),
    phone VARCHAR(20),
    postal_code VARCHAR(10),
    street VARCHAR(200),
    number VARCHAR(20),
    complement VARCHAR(100),
    neighborhood VARCHAR(100),
    city_ibge_code VARCHAR(7) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    logo_url TEXT,
    subscription_status VARCHAR(30) DEFAULT 'ACTIVE',
    grace_period_days INT DEFAULT 5,
    subscription_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Filiais
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(18) NOT NULL,
    state_registration VARCHAR(30),
    city_registration VARCHAR(30),
    is_headquarters BOOLEAN DEFAULT FALSE,
    postal_code VARCHAR(10),
    street VARCHAR(200),
    number VARCHAR(20),
    neighborhood VARCHAR(100),
    city_ibge_code VARCHAR(7),
    city_name VARCHAR(100),
    state_code VARCHAR(2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 6. Perfis (Integrado ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    is_superadmin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Associação Empresa x Usuários x Papéis (RBAC)
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    default_branch_id UUID REFERENCES branches(id),
    role user_system_role NOT NULL DEFAULT 'SELLER',
    custom_permissions JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, profile_id)
);

-- 8. Log de Auditoria Imutável
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    user_id UUID REFERENCES profiles(id),
    entity_name VARCHAR(60) NOT NULL,
    entity_id VARCHAR(60) NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    justification TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_entity ON audit_logs(company_id, entity_name, entity_id);

-- 9. Categorias e Marcas
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30),
    parent_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Regras Fiscais Padrão
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    description VARCHAR(150) NOT NULL,
    cfop_internal VARCHAR(4) NOT NULL DEFAULT '5102',
    cfop_interstate VARCHAR(4) NOT NULL DEFAULT '6102',
    ncm VARCHAR(8) NOT NULL,
    cest VARCHAR(7),
    cst_csosn VARCHAR(4) NOT NULL,
    icms_rate NUMERIC(5,2) DEFAULT 0.00,
    icms_base_reduction NUMERIC(5,2) DEFAULT 0.00,
    pis_cst VARCHAR(2) DEFAULT '07',
    pis_rate NUMERIC(5,2) DEFAULT 0.00,
    cofins_cst VARCHAR(2) DEFAULT '07',
    cofins_rate NUMERIC(5,2) DEFAULT 0.00,
    ipi_cst VARCHAR(2),
    ipi_rate NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Produtos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id),
    brand_id UUID REFERENCES product_brands(id),
    tax_rule_id UUID REFERENCES tax_rules(id),
    internal_code VARCHAR(50) NOT NULL,
    barcode VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit_of_measure VARCHAR(6) NOT NULL DEFAULT 'UN',
    is_fractional BOOLEAN DEFAULT FALSE,
    cost_price NUMERIC(14,4) NOT NULL DEFAULT 0.0000,
    sale_price NUMERIC(14,4) NOT NULL DEFAULT 0.0000,
    minimum_margin_percent NUMERIC(6,2) DEFAULT 0.00,
    min_stock NUMERIC(12,3) DEFAULT 0.000,
    max_stock NUMERIC(12,3) DEFAULT 0.000,
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    image_url TEXT,
    ncm VARCHAR(8) NOT NULL,
    cest VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, internal_code)
);
CREATE INDEX IF NOT EXISTS idx_products_company_barcode ON products(company_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_company_name ON products(company_id, name);

-- 12. Saldo de Estoque por Filial
CREATE TABLE IF NOT EXISTS branch_stock_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    average_cost NUMERIC(14,4) NOT NULL DEFAULT 0.0000,
    reserved_quantity NUMERIC(12,3) NOT NULL DEFAULT 0.000,
    last_inventory_date TIMESTAMPTZ,
    UNIQUE(branch_id, product_id)
);

-- 13. Movimentações de Estoque (Kárdex)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    type stock_movement_type NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_cost NUMERIC(14,4) NOT NULL,
    balance_before NUMERIC(12,3) NOT NULL,
    balance_after NUMERIC(12,3) NOT NULL,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_branch ON stock_movements(product_id, branch_id, created_at DESC);

-- 14. Terminais de PDV e Caixas
CREATE TABLE IF NOT EXISTS pos_terminals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    terminal_number INT NOT NULL,
    description VARCHAR(100) NOT NULL,
    printer_type VARCHAR(30) DEFAULT 'THERMAL_80MM',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, terminal_number)
);

CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    terminal_id UUID NOT NULL REFERENCES pos_terminals(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    status shift_status NOT NULL DEFAULT 'OPEN',
    initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_sales NUMERIC(12,2) DEFAULT 0.00,
    total_supplies NUMERIC(12,2) DEFAULT 0.00,
    total_bleedings NUMERIC(12,2) DEFAULT 0.00,
    final_cash_expected NUMERIC(12,2) DEFAULT 0.00,
    final_cash_counted NUMERIC(12,2),
    cash_difference NUMERIC(12,2),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS cash_shift_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    authorized_by UUID REFERENCES profiles(id),
    type VARCHAR(20) NOT NULL, -- 'SUPPLY' ou 'BLEED'
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_type VARCHAR(2) NOT NULL DEFAULT 'PF',
    name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(18),
    state_registration VARCHAR(30),
    email VARCHAR(150),
    phone VARCHAR(20),
    credit_limit NUMERIC(12,2) DEFAULT 0.00,
    available_credit NUMERIC(12,2) DEFAULT 0.00,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT,
    postal_code VARCHAR(10),
    street VARCHAR(200),
    number VARCHAR(20),
    neighborhood VARCHAR(100),
    city_name VARCHAR(100),
    state_code VARCHAR(2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, tax_id)
);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_id, name);

-- 16. Vendas
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES cash_shifts(id),
    seller_id UUID NOT NULL REFERENCES profiles(id),
    customer_id UUID REFERENCES customers(id),
    sale_number BIGSERIAL,
    idempotency_key VARCHAR(64) NOT NULL,
    status sale_status NOT NULL DEFAULT 'COMPLETED',
    gross_total NUMERIC(12,2) NOT NULL,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    additional_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_total NUMERIC(12,2) NOT NULL,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    commission_total NUMERIC(12,2) DEFAULT 0.00,
    canceled_at TIMESTAMPTZ,
    canceled_by UUID REFERENCES profiles(id),
    cancellation_reason TEXT,
    fiscal_status VARCHAR(30) DEFAULT 'NONE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_sales_company_created ON sales(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(14,4) NOT NULL,
    unit_cost NUMERIC(14,4) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL,
    cfop VARCHAR(4) NOT NULL,
    cst_csosn VARCHAR(4) NOT NULL,
    ncm VARCHAR(8) NOT NULL,
    canceled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method payment_method_type NOT NULL,
    installments_count INT DEFAULT 1,
    amount NUMERIC(12,2) NOT NULL,
    fee_rate NUMERIC(5,2) DEFAULT 0.00,
    net_amount NUMERIC(12,2) NOT NULL,
    card_auth_code VARCHAR(50),
    due_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Financeiro: Plano de Contas e Centros de Custo
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    nature account_nature NOT NULL,
    parent_id UUID REFERENCES chart_of_accounts(id),
    dre_group VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(10),
    agency_number VARCHAR(15),
    account_number VARCHAR(25),
    initial_balance NUMERIC(14,2) DEFAULT 0.00,
    current_balance NUMERIC(14,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tax_id VARCHAR(18) NOT NULL,
    trade_name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    contact_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, tax_id)
);

CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    account_plan_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    description VARCHAR(255) NOT NULL,
    document_number VARCHAR(50),
    installment_number INT DEFAULT 1,
    total_installments INT DEFAULT 1,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    original_amount NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    interest_amount NUMERIC(12,2) DEFAULT 0.00,
    fine_amount NUMERIC(12,2) DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL,
    status financial_status NOT NULL DEFAULT 'PENDING',
    receipt_attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payable_company_status ON accounts_payable(company_id, status, due_date);

CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    sale_id UUID REFERENCES sales(id),
    account_plan_id UUID NOT NULL REFERENCES chart_of_accounts(id),
    cost_center_id UUID REFERENCES cost_centers(id),
    description VARCHAR(255) NOT NULL,
    installment_number INT NOT NULL DEFAULT 1,
    total_installments INT NOT NULL DEFAULT 1,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    settlement_date DATE,
    original_amount NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    interest_amount NUMERIC(12,2) DEFAULT 0.00,
    fine_amount NUMERIC(12,2) DEFAULT 0.00,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    balance_due NUMERIC(12,2) NOT NULL,
    status financial_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receivable_company_status ON accounts_receivable(company_id, status, due_date);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    account_plan_id UUID REFERENCES chart_of_accounts(id),
    receivable_id UUID REFERENCES accounts_receivable(id),
    payable_id UUID REFERENCES accounts_payable(id),
    type VARCHAR(10) NOT NULL, -- 'INFLOW' ou 'OUTFLOW'
    amount NUMERIC(14,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciliation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Módulo Fiscal
CREATE TABLE IF NOT EXISTS branch_fiscal_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID UNIQUE NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    environment VARCHAR(20) NOT NULL DEFAULT 'HOMOLOGATION',
    nfe_series INT NOT NULL DEFAULT 1,
    nfe_last_number INT NOT NULL DEFAULT 0,
    nfce_series INT NOT NULL DEFAULT 1,
    nfce_last_number INT NOT NULL DEFAULT 0,
    nfce_csc_token VARCHAR(50),
    nfce_csc_id VARCHAR(10),
    certificate_vault_id VARCHAR(100),
    certificate_expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fiscal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id),
    doc_type fiscal_doc_type NOT NULL,
    series INT NOT NULL,
    number INT NOT NULL,
    access_key VARCHAR(44) UNIQUE,
    status fiscal_status_enum NOT NULL DEFAULT 'DRAFT',
    protocol_number VARCHAR(50),
    authorization_date TIMESTAMPTZ,
    xml_signed_url TEXT,
    xml_authorized_url TEXT,
    danfe_pdf_url TEXT,
    cancellation_protocol VARCHAR(50),
    cancellation_reason TEXT,
    correction_letter_sequence INT DEFAULT 0,
    last_correction_text TEXT,
    rejection_code VARCHAR(10),
    rejection_message TEXT,
    payload_sent JSONB,
    sefaz_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fiscal_docs_company_status ON fiscal_documents(company_id, doc_type, status);

-- ============================================================================
-- 19. FUNÇÕES DE SEGURANÇA E AUXILIARES (SECURITY DEFINER)
-- ============================================================================

-- Função para obter o company_id do usuário atual
CREATE OR REPLACE FUNCTION get_auth_company_id()
RETURNS UUID AS $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.company_users
    WHERE profile_id = auth.uid()
      AND is_active = TRUE
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN v_company_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Função para verificar se o usuário autenticado é superadministrador
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_super BOOLEAN;
BEGIN
    SELECT is_superadmin INTO v_is_super
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(v_is_super, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Função para obter o papel do usuário na empresa atual
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_system_role AS $$
DECLARE
    v_role user_system_role;
BEGIN
    SELECT role INTO v_role
    FROM public.company_users
    WHERE profile_id = auth.uid()
      AND company_id = get_auth_company_id()
      AND is_active = TRUE
    LIMIT 1;

    RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 20. HABILITAÇÃO UNIVERSAL DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_stock_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shift_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_fiscal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_documents ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão por isolamento de company_id
CREATE POLICY "company_isolation_companies" ON companies
    FOR ALL USING (id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_branches" ON branches
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "profiles_read_all" ON profiles
    FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (id = auth.uid() OR is_superadmin());

CREATE POLICY "company_users_isolation" ON company_users
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_products" ON products
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_categories" ON product_categories
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_brands" ON product_brands
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_tax_rules" ON tax_rules
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_stock_balances" ON branch_stock_balances
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_stock_movements" ON stock_movements
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_pos_terminals" ON pos_terminals
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_cash_shifts" ON cash_shifts
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_cash_movements" ON cash_shift_movements
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_customers" ON customers
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_sales" ON sales
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_sale_items" ON sale_items
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_sale_payments" ON sale_payments
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_chart_accounts" ON chart_of_accounts
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_cost_centers" ON cost_centers
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_bank_accounts" ON bank_accounts
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_suppliers" ON suppliers
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_accounts_payable" ON accounts_payable
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_accounts_receivable" ON accounts_receivable
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_financial_tx" ON financial_transactions
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_fiscal_configs" ON branch_fiscal_configs
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_fiscal_documents" ON fiscal_documents
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

CREATE POLICY "company_isolation_audit_logs" ON audit_logs
    FOR ALL USING (company_id = get_auth_company_id() OR is_superadmin());

-- ============================================================================
-- 21. CARGA INICIAL (SEED) DE PLANOS E DADOS ESTRUTURAIS
-- ============================================================================

INSERT INTO platform_plans (name, slug, max_users, max_branches, has_pos, has_fiscal, has_dre, has_crm, monthly_price)
VALUES 
    ('Start', 'start', 2, 1, TRUE, FALSE, FALSE, TRUE, 149.00),
    ('Pro Varejo', 'pro-varejo', 5, 2, TRUE, TRUE, TRUE, TRUE, 299.00),
    ('Enterprise', 'enterprise', 20, 10, TRUE, TRUE, TRUE, TRUE, 599.00)
ON CONFLICT (slug) DO NOTHING;

