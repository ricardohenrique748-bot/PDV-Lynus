import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  FileText,
  ShieldCheck,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Printer,
  XCircle,
  Settings,
  RefreshCw,
} from 'lucide-react';

export function FiscalPage() {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'CERTIFICATE' | 'TAX_RULES'>('MONITOR');

  const fiscalDocs = [
    {
      id: '1',
      type: 'NFC-e',
      model: '65',
      series: 1,
      number: 10492,
      accessKey: '35261112345678000190650010000104921000123456',
      protocol: '135260001982736',
      total: 189.50,
      status: 'AUTHORIZED',
      date: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'NF-e',
      model: '55',
      series: 1,
      number: 8901,
      accessKey: '35261112345678000190550010000089011000198765',
      protocol: '135260001982540',
      total: 1420.00,
      status: 'AUTHORIZED',
      date: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'NFC-e',
      model: '65',
      series: 1,
      number: 10489,
      accessKey: '35261112345678000190650010000104891000987654',
      protocol: '135260001981290',
      total: 320.90,
      status: 'AUTHORIZED',
      date: new Date().toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Módulo Fiscal & Integração SEFAZ
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Emissão de NF-e (Modelo 55), NFC-e (Modelo 65), Certificados A1 e Regras Tributárias
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            Ambiente: Produção
          </Badge>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Consultar SEFAZ
          </Button>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('MONITOR')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'MONITOR'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Monitor de Documentos Fiscais
        </button>
        <button
          onClick={() => setActiveTab('CERTIFICATE')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'CERTIFICATE'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Certificado Digital A1
        </button>
        <button
          onClick={() => setActiveTab('TAX_RULES')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'TAX_RULES'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Parâmetros Tributários (NCM / CFOP / CST)
        </button>
      </div>

      {activeTab === 'MONITOR' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Documentos Fiscais Emitidos</CardTitle>
              <CardDescription>Consulta de autorizações, DANFEs e XMLs oficiais</CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3">Série/Número</th>
                  <th className="pb-3">Chave de Acesso (44 Dígitos)</th>
                  <th className="pb-3">Protocolo</th>
                  <th className="pb-3 text-right">Valor Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fiscalDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <Badge variant="primary" size="sm">{doc.type}</Badge>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {doc.series} / {doc.number}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-500">
                      {doc.accessKey}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                      {doc.protocol}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(doc.total)}
                    </td>
                    <td className="py-3">
                      <Badge variant="success" size="sm">
                        <CheckCircle className="w-3 h-3" /> Autorizada
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Imprimir DANFE" leftIcon={<Printer className="w-3.5 h-3.5" />}>
                          DANFE
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Download XML" leftIcon={<FileCode className="w-3.5 h-3.5" />}>
                          XML
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'CERTIFICATE' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div>
              <CardTitle>Configuração do Certificado Digital A1</CardTitle>
              <CardDescription>
                Armazenamento protegido por cofre criptográfico para comunicação direta com a SEFAZ
              </CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Certificado A1 Ativo e Válido
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Expira em: <strong>14/11/2027</strong> • CNPJ: 12.345.678/0001-90
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">Instalado</Badge>
            </div>

            <div className="space-y-3 pt-2">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Atualizar Arquivo do Certificado (.pfx / .p12)
              </h5>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Clique para selecionar o certificado A1 ou arraste o arquivo aqui
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Formatos aceitos: .pfx, .p12 (Máx. 10MB)</p>
              </div>

              <Input label="Senha do Certificado Digital" type="password" placeholder="••••••••" />

              <Button variant="primary" className="w-full mt-2" leftIcon={<ShieldCheck className="w-4 h-4" />}>
                Salvar e Validar Certificado
              </Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'TAX_RULES' && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Regras de Tributação por Operação</CardTitle>
              <CardDescription>Configuração de CFOP, NCM, Alíquotas de ICMS, PIS e COFINS</CardDescription>
            </div>
            <Button variant="primary" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
              Nova Regra Fiscal
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3">Descrição da Regra</th>
                  <th className="pb-3 text-center">CFOP Padrão</th>
                  <th className="pb-3 text-center">CST / CSOSN</th>
                  <th className="pb-3 text-right">Alíquota ICMS</th>
                  <th className="pb-3 text-right">PIS / COFINS</th>
                  <th className="pb-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                    Venda Mercadoria Tributada Integralmente (Simples Nacional)
                  </td>
                  <td className="py-3 text-center font-mono">5.102</td>
                  <td className="py-3 text-center font-mono">102</td>
                  <td className="py-3 text-right font-mono text-slate-500">0,00%</td>
                  <td className="py-3 text-right font-mono text-slate-500">0,00%</td>
                  <td className="py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Editar</Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-bold text-slate-900 dark:text-slate-100">
                    Venda com Substituição Tributária (ICMS-ST Retido Anteriormente)
                  </td>
                  <td className="py-3 text-center font-mono">5.405</td>
                  <td className="py-3 text-center font-mono">500</td>
                  <td className="py-3 text-right font-mono text-slate-500">0,00%</td>
                  <td className="py-3 text-right font-mono text-slate-500">0,00%</td>
                  <td className="py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">Editar</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

