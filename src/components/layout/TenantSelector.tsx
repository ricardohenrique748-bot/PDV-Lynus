import React, { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Building2, GitBranch, ChevronDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function TenantSelector() {
  const { currentCompany, currentBranch, companies, branches, setCurrentCompany, setCurrentBranch } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentCompany) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 h-10 px-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-soft hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
              {currentCompany.trade_name || currentCompany.name}
            </span>
            <Badge variant="primary" size="sm">
              {currentCompany.tax_regime === 1 ? 'Simples' : 'Lucro'}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <GitBranch className="w-3 h-3" />
            <span className="truncate max-w-[130px]">{currentBranch?.name || 'Filial Principal'}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl z-50 p-2 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Empresas Disponíveis
            </div>
            <div className="space-y-1 mb-2">
              {companies.map((comp) => {
                const isSelected = comp.id === currentCompany.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setCurrentCompany(comp);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="font-medium truncate">{comp.trade_name || comp.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{comp.tax_id}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {branches.length > 1 && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Filiais da Empresa
                </div>
                <div className="space-y-1">
                  {branches.map((branch) => {
                    const isSelected = branch.id === currentBranch?.id;
                    return (
                      <button
                        key={branch.id}
                        onClick={() => {
                          setCurrentBranch(branch);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{branch.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

