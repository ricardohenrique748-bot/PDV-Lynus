import React, { createContext, useContext, useEffect, useState } from 'react';
import { Company, Branch, UserSystemRole } from '@/types/database.types';
import { useAuth, TEST_USER_ID } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface TenantContextType {
  currentCompany: Company | null;
  currentBranch: Branch | null;
  currentRole: UserSystemRole;
  companies: Company[];
  branches: Branch[];
  setCurrentCompany: (company: Company) => void;
  setCurrentBranch: (branch: Branch) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Empresa e filial padrão demonstrativas para inicialização
const DEV_DEFAULT_COMPANY: Company = {
  id: 'c1111111-1111-1111-1111-111111111111',
  plan_id: 'p1111111-1111-1111-1111-111111111111',
  name: 'Lynustech Comércio e Automação LTDA',
  trade_name: 'Lynustech Varejo & Tech',
  tax_id: '12.345.678/0001-90',
  state_registration: '123.456.789.000',
  city_registration: '98765432',
  tax_regime: 1, // Simples Nacional
  email: 'contato@lynustech.com.br',
  phone: '(11) 3456-7890',
  postal_code: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  complement: 'Conjunto 501',
  neighborhood: 'Bela Vista',
  city_ibge_code: '3550308',
  city_name: 'São Paulo',
  state_code: 'SP',
  logo_url: null,
  subscription_status: 'ACTIVE',
  grace_period_days: 5,
  subscription_due_date: '2026-12-31',
  created_at: new Date().toISOString(),
};

const DEV_DEFAULT_BRANCH: Branch = {
  id: 'b1111111-1111-1111-1111-111111111111',
  company_id: DEV_DEFAULT_COMPANY.id,
  code: '001',
  name: 'Matriz - São Paulo Centro',
  tax_id: '12.345.678/0001-90',
  state_registration: '123.456.789.000',
  city_registration: '98765432',
  is_headquarters: true,
  postal_code: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city_ibge_code: '3550308',
  city_name: 'São Paulo',
  state_code: 'SP',
  is_active: true,
  created_at: new Date().toISOString(),
};

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(DEV_DEFAULT_COMPANY);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(DEV_DEFAULT_BRANCH);
  const [currentRole, setCurrentRole] = useState<UserSystemRole>('COMPANY_ADMIN');
  const [companies, setCompanies] = useState<Company[]>([DEV_DEFAULT_COMPANY]);
  const [branches, setBranches] = useState<Branch[]>([DEV_DEFAULT_BRANCH]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!isSupabaseConfigured || user.id === TEST_USER_ID) {
      setCurrentCompany(DEV_DEFAULT_COMPANY);
      setCurrentBranch(DEV_DEFAULT_BRANCH);
      setCompanies([DEV_DEFAULT_COMPANY]);
      setBranches([DEV_DEFAULT_BRANCH]);
      return;
    }

    const fetchUserTenants = async () => {
      setIsLoading(true);
      try {
        const { data: userCompanies } = await supabase
          .from('company_users')
          .select('company_id, role, default_branch_id, companies(*)')
          .eq('profile_id', user.id)
          .eq('is_active', true);

        if (userCompanies && userCompanies.length > 0) {
          const loadedCompanies = userCompanies.map((uc) => uc.companies).filter(Boolean) as unknown as Company[];
          setCompanies(loadedCompanies);

          const primary = userCompanies[0];
          setCurrentCompany(primary.companies as unknown as Company);
          setCurrentRole(primary.role as UserSystemRole);

          // Carrega filiais da empresa
          const { data: branchData } = await supabase
            .from('branches')
            .select('*')
            .eq('company_id', primary.company_id)
            .eq('is_active', true);

          if (branchData && branchData.length > 0) {
            setBranches(branchData);
            const defaultBranch = branchData.find((b) => b.id === primary.default_branch_id) || branchData[0];
            setCurrentBranch(defaultBranch);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar empresas do usuário:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTenants();
  }, [user]);

  return (
    <TenantContext.Provider
      value={{
        currentCompany,
        currentBranch,
        currentRole,
        companies,
        branches,
        setCurrentCompany,
        setCurrentBranch,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

