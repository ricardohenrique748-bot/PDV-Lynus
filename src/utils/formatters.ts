/**
 * Utilitários de formatação e máscaras para o padrão brasileiro
 */

export function formatCurrency(value: number | string | null | undefined): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(numericValue)) return '0';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericValue);
}

export function formatPercent(value: number | string | null | undefined): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(numericValue)) return '0,00%';

  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue / 100);
}

export function formatTaxId(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');

  if (clean.length === 11) {
    // CPF: 000.000.000-00
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (clean.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return value;
}

export function formatZipCode(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return value;
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');

  if (clean.length === 11) {
    // Celular: (00) 00000-0000
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (clean.length === 10) {
    // Fixo: (00) 0000-0000
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return value;
}

export function formatDate(value: string | Date | null | undefined, includeTime = false): string {
  if (!value) return '-';
  // Datas puras (AAAA-MM-DD) são interpretadas no fuso local para não "voltar" um dia
  const date =
    typeof value === 'string'
      ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value)
      : value;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {}),
  }).format(date);
}

