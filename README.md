# LynusSystem ERP | Automação Comercial & PDV

Sistema Integrado de Gestão Empresarial (ERP) Multiempresa com Ponto de Venda (PDV), Gestão Comercial, Financeiro, Fiscal (NF-e/NFC-e) e Contabilidade Gerencial (DRE).

## 🚀 Tecnologias

- **Frontend:** React 18 + Vite + TypeScript
- **Estilização & Design System:** Tailwind CSS + Lucide Icons
- **Backend & Autenticação:** Supabase (PostgreSQL 15+, Supabase Auth, Storage, Edge Functions)
- **Segurança & Multi-tenancy:** Row Level Security (RLS) mandatória em 100% das tabelas
- **Gerenciamento de Estado:** TanStack Query v5 + Zustand (motor do PDV)
- **Integridade Transacional:** Stored Procedures PostgreSQL ACID (`fn_pos_process_checkout`)

---

## 📁 Estrutura do Projeto

```
lynus-erp/
├── supabase/
│   └── migrations/              # DDLs, Funções RLS e Seeds
├── src/
│   ├── app/                     # Rotas e Inicialização de Provedores
│   ├── components/              # UI Primitives & Design System
│   │   ├── layout/              # Sidebar, Header, TenantSelector
│   │   └── ui/                  # Button, Input, Select, Card, Badge, Modal
│   ├── contexts/                # AuthContext, TenantContext, ThemeContext
│   ├── modules/
│   │   ├── auth/                # Login corporativo e recuperação de acesso
│   │   ├── dashboard/           # Painel Executivo com KPIs gerenciais
│   │   ├── pos/                 # Frente de Caixa PDV com atalhos de teclado
│   │   ├── sales/               # Gestão comercial e orçamentos
│   │   ├── inventory/           # Catálogo de produtos, Kárdex e estoque
│   │   ├── purchases/           # Compras e importação de XML de fornecedores
│   │   ├── customers/           # CRM e análise de limites de crédito
│   │   ├── financial/           # Contas a Pagar/Receber e Fluxo de Caixa
│   │   ├── dre/                 # DRE por Regime de Competência
│   │   ├── fiscal/              # Monitor NF-e/NFC-e e Certificado A1
│   │   ├── reports/             # Central de Relatórios (PDF e Excel)
│   │   ├── settings/            # Cadastro de Empresa, Filiais e Usuários RBAC
│   │   └── platform-admin/      # Gestão SaaS de Planos e Licenças
│   ├── types/                   # Tipagens TypeScript do Banco de Dados
│   └── utils/                   # Formatadores (BRL, CNPJ, CPF, datas)
```

---

## 🛠️ Como Executar o Projeto

1. Instalar as dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente (`.env`):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

3. Executar o servidor de desenvolvimento:
```bash
npm run dev
```

4. Gerar build de produção:
```bash
npm run build
```

---

## 🛡️ Níveis de Acesso (RBAC)
1. `SUPERADMIN`: Gestão global da plataforma SaaS.
2. `COMPANY_ADMIN`: Administrador da empresa e filiais.
3. `MANAGER`: Gerente geral.
4. `SUPERVISOR`: Supervisor de turno e autorizador de descontos/cancelamentos.
5. `CASHIER`: Operador de frente de caixa.
6. `SELLER`: Vendedor externo e balcão.
7. `FINANCIAL`: Contas a pagar, receber e tesouraria.
8. `STOCKIST`: Entradas e movimentações de estoque.
9. `ACCOUNTANT`: Contador e auditor de DRE e arquivos fiscais.

