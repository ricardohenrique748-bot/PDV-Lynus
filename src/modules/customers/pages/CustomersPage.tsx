import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, EmptyRow, thead } from '@/components/ui/PageHeader';
import { toast } from '@/components/ui/Toast';
import { useDataStore, type Customer, type PersonType } from '@/store/useDataStore';
import { formatCurrency, formatTaxId, formatPhone, formatDate } from '@/utils/formatters';
import { Plus, Search, Phone, Mail, MapPin, Pencil, Trash2, UserRound, Users, Wallet, CreditCard, AlertTriangle } from 'lucide-react';
import { StatCard, InitialsAvatar } from '@/components/ui/StatCard';

type CustomerForm = {
  id?: string;
  name: string;
  taxId: string;
  personType: PersonType;
  phone: string;
  email: string;
  city: string;
  creditLimit: string;
};

const emptyForm: CustomerForm = { name: '', taxId: '', personType: 'PF', phone: '', email: '', city: '', creditLimit: '0' };
const digits = (v: string) => v.replace(/\D/g, '');

export function CustomersPage() {
  const { customers, sales, entries, saveCustomer, deleteCustomer } = useDataStore();

  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CustomerForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({});
  const [profileId, setProfileId] = useState<string | null>(null);
  const profile = customers.find((c) => c.id === profileId) || null;
  const pfCount = customers.filter((c) => c.personType === 'PF').length;
  const totalDebt = customers.reduce((a, c) => a + c.balance, 0);
  const totalAvailable = customers.reduce((a, c) => a + Math.max(0, c.creditLimit - c.balance), 0);
  const highUsage = customers.filter((c) => c.creditLimit > 0 && c.balance / c.creditLimit >= 0.8).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qd = digits(q);
    return customers.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (qd && c.taxId.includes(qd)) || c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openEdit = (c: Customer) => {
    setErrors({});
    setForm({
      id: c.id,
      name: c.name,
      taxId: formatTaxId(c.taxId),
      personType: c.personType,
      phone: formatPhone(c.phone),
      email: c.email,
      city: c.city,
      creditLimit: String(c.creditLimit),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const errs: typeof errors = {};
    const tax = digits(form.taxId);
    if (!form.name.trim()) errs.name = 'Informe o nome / razão social';
    if (form.personType === 'PF' && tax.length !== 11) errs.taxId = 'CPF deve ter 11 dígitos';
    if (form.personType === 'PJ' && tax.length !== 14) errs.taxId = 'CNPJ deve ter 14 dígitos';
    if (!errs.taxId && customers.some((c) => c.taxId === tax && c.id !== form.id)) errs.taxId = 'Documento já cadastrado';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'E-mail inválido';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    saveCustomer({
      id: form.id,
      name: form.name.trim(),
      taxId: tax,
      personType: form.personType,
      phone: digits(form.phone),
      email: form.email.trim(),
      city: form.city.trim(),
      creditLimit: parseFloat(form.creditLimit.replace(',', '.')) || 0,
    });
    toast.success(form.id ? 'Cliente atualizado.' : 'Cliente cadastrado.');
    setForm(null);
  };

  const handleDelete = (c: Customer) => {
    if (c.balance > 0) return toast.error('Cliente possui saldo devedor e não pode ser excluído.');
    if (!confirm(`Excluir o cliente "${c.name}"?`)) return;
    deleteCustomer(c.id);
    setProfileId(null);
    toast.info('Cliente excluído.');
  };

  const set = (k: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  const customerSales = profile ? sales.filter((s) => s.customerId === profile.id) : [];
  const customerEntries = profile ? entries.filter((e) => e.customerId === profile.id && e.status === 'PENDING') : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes & Gestão de Crédito (CRM)"
        description="Cadastro de Pessoa Física e Jurídica, limites de crediário e histórico"
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setErrors({});
              setForm(emptyForm);
            }}
          >
            Cadastrar Cliente
          </Button>
        }
      />

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Clientes cadastrados" value={customers.length} icon={Users} hint={`${pfCount} PF · ${customers.length - pfCount} PJ`} />
        <StatCard label="Saldo devedor total" value={formatCurrency(totalDebt)} icon={Wallet} tone="red" />
        <StatCard label="Crédito disponível" value={formatCurrency(totalAvailable)} icon={CreditCard} tone="emerald" />
        <StatCard label="Acima de 80% do limite" value={highUsage} icon={AlertTriangle} tone={highUsage ? 'amber' : 'emerald'} hint="Atenção ao conceder crédito" />
      </div>

      <Card className="p-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, razão social, CPF/CNPJ ou e-mail..."
          leftIcon={<Search className="w-4 h-4" />}
        />
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className={thead}>
                <th className="py-3 pl-4 rounded-l-xl">Cliente / Razão Social</th>
                <th className="py-3">CPF / CNPJ</th>
                <th className="py-3">Contato</th>
                <th className="py-3">Cidade/UF</th>
                <th className="py-3 text-right">Limite de Crédito</th>
                <th className="py-3 text-right">Saldo Devedor</th>
                <th className="py-3 pr-4 text-center rounded-r-xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 && <EmptyRow colSpan={7} message="Nenhum cliente encontrado." />}
              {filtered.map((c) => {
                const usage = c.creditLimit ? (c.balance / c.creditLimit) * 100 : 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar text={c.name} />
                        <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{c.name}</span>
                        <Badge variant={c.personType === 'PJ' ? 'primary' : 'secondary'} size="sm">
                          {c.personType}
                        </Badge>
                      </div>
                      {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">{formatTaxId(c.taxId)}</td>
                    <td className="py-3 text-slate-500">{formatPhone(c.phone) || '—'}</td>
                    <td className="py-3 text-slate-500">{c.city || '—'}</td>
                    <td className="py-3 text-right font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(c.creditLimit)}</td>
                    <td className="py-3 text-right">
                      <span className={`font-bold ${usage >= 80 ? 'text-red-600' : 'text-slate-800 dark:text-slate-100'}`}>
                        {formatCurrency(c.balance)}
                      </span>
                      {c.creditLimit > 0 && <span className="block text-[11px] text-slate-500">{usage.toFixed(0)}% do limite</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" leftIcon={<UserRound className="w-3.5 h-3.5" />} onClick={() => setProfileId(c.id)}>
                          Perfil
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" leftIcon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEdit(c)}>
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cadastro / Edição */}
      <Modal isOpen={!!form} onClose={() => setForm(null)} title={form?.id ? 'Editar Cliente' : 'Cadastrar Cliente'} size="lg">
        {form && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
              <Select
                label="Tipo"
                value={form.personType}
                onChange={set('personType')}
                options={[
                  { value: 'PF', label: 'Pessoa Física' },
                  { value: 'PJ', label: 'Pessoa Jurídica' },
                ]}
              />
              <Input label={form.personType === 'PJ' ? 'Razão Social *' : 'Nome Completo *'} value={form.name} onChange={set('name')} error={errors.name} autoFocus />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={form.personType === 'PJ' ? 'CNPJ *' : 'CPF *'}
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: formatTaxId(digits(e.target.value).slice(0, 14)) })}
                error={errors.taxId}
                inputMode="numeric"
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(digits(e.target.value).slice(0, 11)) })}
                inputMode="tel"
              />
              <Input label="E-mail" type="email" value={form.email} onChange={set('email')} error={errors.email} />
              <Input label="Cidade - UF" value={form.city} onChange={set('city')} placeholder="São Paulo - SP" />
              <Input label="Limite de Crédito (R$)" value={form.creditLimit} onChange={set('creditLimit')} inputMode="decimal" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setForm(null)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Cliente</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Perfil */}
      <Modal isOpen={!!profile} onClose={() => setProfileId(null)} title={profile?.name} description={profile ? `${profile.personType === 'PJ' ? 'CNPJ' : 'CPF'} ${formatTaxId(profile.taxId)}` : ''} size="lg">
        {profile && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {formatPhone(profile.phone)}
                </span>
              )}
              {profile.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {profile.email}
                </span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {profile.city}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Limite de crédito" value={formatCurrency(profile.creditLimit)} />
              <Stat label="Saldo devedor" value={formatCurrency(profile.balance)} tone="text-red-600" />
              <Stat label="Crédito disponível" value={formatCurrency(Math.max(0, profile.creditLimit - profile.balance))} tone="text-emerald-600" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Títulos em aberto ({customerEntries.length})</p>
              {customerEntries.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum título em aberto.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {customerEntries.map((e) => (
                    <li key={e.id} className="flex justify-between py-2">
                      <span>
                        {e.description} <span className="text-slate-400">• vence {formatDate(e.due)}</span>
                      </span>
                      <strong>{formatCurrency(e.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Histórico de compras ({customerSales.length})</p>
              {customerSales.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhuma compra registrada.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs max-h-48 overflow-y-auto">
                  {customerSales.map((s) => (
                    <li key={s.id} className="flex justify-between py-2">
                      <span>
                        <span className="font-mono font-semibold text-brand-700 dark:text-brand-300">#{s.id}</span>{' '}
                        <span className="text-slate-400">• {formatDate(s.date, true)} • {s.payment}</span>
                        {s.status === 'CANCELLED' && <span className="text-red-500"> • cancelada</span>}
                        {s.status === 'QUOTE' && <span className="text-sky-600"> • orçamento</span>}
                      </span>
                      <strong>{formatCurrency(s.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" className="text-red-600" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => handleDelete(profile)}>
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Pencil className="w-4 h-4" />}
                  onClick={() => {
                    setProfileId(null);
                    openEdit(profile);
                  }}
                >
                  Editar
                </Button>
                <Button variant="secondary" onClick={() => setProfileId(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone = 'text-slate-800 dark:text-slate-100' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}
