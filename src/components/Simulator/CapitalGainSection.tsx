import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Settings } from 'lucide-react';

interface CapitalGainSectionProps {
  creditoAcessado: number | null;
  contemplationMonth: number;
  installmentType: string;
  product: any;
  administrator: any;
  embutido?: 'com' | 'sem';
  selectedCredits?: any[]; // Adicionar selectedCredits
  customAnnualUpdateRate?: number; // Taxa de atualização anual customizada
  agioPercent: number;
  setAgioPercent: (value: number) => void;
  onRoiChange?: (roi: number) => void;
  periodoCompra?: number; // NOVO: período de compra em meses
}

// Constantes para o tooltip personalizado
const gray1 = '#ededed';
const gray2 = '#e5e5e5';
const fundo = '#131313';
const marrom = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary') || 'var(--brand-primary)';

// CustomTooltip para o gráfico de barras
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: fundo, borderRadius: 16, border: '1px solid #444', padding: 16, color: gray1, minWidth: 200 }}>
        <div style={{ color: marrom, fontWeight: 700, marginBottom: 8 }}>Mês: {label}</div>
        {payload.map((entry: any, idx: number) => (
          <div key={entry.dataKey} style={{ color: idx % 2 === 0 ? gray1 : gray2, fontWeight: 500, marginBottom: 2 }}>
            <span style={{ color: idx % 2 === 0 ? gray1 : gray2, fontWeight: 700 }}>{entry.name}</span>: <span style={{ color: idx % 2 === 0 ? gray1 : gray2 }}>{typeof entry.value === 'number' ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CapitalGainSection: React.FC<CapitalGainSectionProps> = ({
  creditoAcessado,
  contemplationMonth,
  installmentType,
  product,
  administrator,
  embutido = 'sem',
  selectedCredits = [], // Adicionar selectedCredits
  customAnnualUpdateRate,
  agioPercent,
  setAgioPercent,
  onRoiChange,
  periodoCompra
}: CapitalGainSectionProps) => {
  // Remover o estado local de agioPercent, usar prop

  // Função para calcular valor da parcela (mesma lógica do DetailTable)
  const calculateInstallmentValue = (credit: number, month: number, isAfterContemplation: boolean = false) => {
    if (installmentType === 'full') {
      const totalCredit = isAfterContemplation ? creditoAcessado || 0 : credit;
      const adminTax = totalCredit * (administrator.administrationRate || 0.27);
      const reserveFund = totalCredit * 0.01;
      return (totalCredit + adminTax + reserveFund) / (product.termMonths || 240);
    }

    // Parcela especial
    const reductionPercent = 0.5;
    const principal = credit * (1 - reductionPercent);
    const adminTax = credit * (administrator.administrationRate || 0.27);
    const reserveFund = credit * 0.01;

    return (principal + adminTax + reserveFund) / (product.termMonths || 240);
  };

  // Função para calcular o crédito acessado (mesma lógica do DetailTable)
  const calculateCreditoAcessado = (month: number, baseCredit: number) => {
    if (baseCredit === 0) return 0;
    
    let currentCredit = baseCredit;
    let embutidoAplicado = false;
    
    // Para o primeiro mês, retorna o valor base sem atualização
    if (month === 1) {
      return currentCredit;
    }
    
    // Calcular as atualizações mês a mês
    for (let m = 2; m <= month; m++) {
      // Verificar se é um mês de atualização anual (13, 25, 37, etc.)
      const isAnnualUpdate = (m - 1) % 12 === 0;
      
      if (isAnnualUpdate) {
        // Verificar se já passou do mês de contemplação
        if (m > contemplationMonth) {
          // Após contemplação: atualização mensal pelo ajuste pós contemplação
          const postContemplationRate = administrator.postContemplationAdjustment || 0;
          currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
        } else {
          // Antes da contemplação: atualização anual pelo INCC
          // Usar valor customizado se disponível, senão usar o valor padrão
          const annualUpdateRate = customAnnualUpdateRate !== undefined ? customAnnualUpdateRate : (administrator.inccRate || 6);
          currentCredit = currentCredit + (currentCredit * annualUpdateRate / 100);
        }
      }
      
      // Aplicar redução do embutido no mês de contemplação se "Com embutido" estiver selecionado
      if (embutido === 'com' && m === contemplationMonth && !embutidoAplicado) {
        const maxEmbeddedPercentage = administrator.maxEmbeddedPercentage ?? 25; // Usar o valor da administradora (mesmo se for 0)
        currentCredit = currentCredit - (currentCredit * maxEmbeddedPercentage / 100);
        embutidoAplicado = true;
      }
      
      // Após contemplação, aplicar atualização mensal em todos os meses
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      }
      

    }
    
    return currentCredit;
  };

  // Função para calcular o valor do crédito com atualizações (mesma lógica do DetailTable)
  const calculateCreditValue = (month: number, baseCredit: number) => {
    if (baseCredit === 0) return 0;
    
    let currentCredit = baseCredit;
    
    // Para o primeiro mês, retorna o valor base sem atualização
    if (month === 1) {
      return currentCredit;
    }
    
    // Calcular as atualizações mês a mês
    for (let m = 2; m <= month; m++) {
      // Verificar se é um mês de atualização anual (13, 25, 37, etc.)
      const isAnnualUpdate = (m - 1) % 12 === 0;
      
      if (isAnnualUpdate) {
        // Verificar se já passou do mês de contemplação
        if (m > contemplationMonth) {
          // Após contemplação: atualização mensal pelo ajuste pós contemplação
          const postContemplationRate = administrator.postContemplationAdjustment || 0;
          currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
        } else {
          // Antes da contemplação: atualização anual pelo INCC
          // Usar valor customizado se disponível, senão usar o valor padrão
          const annualUpdateRate = customAnnualUpdateRate !== undefined ? customAnnualUpdateRate : (administrator.inccRate || 6);
          currentCredit = currentCredit + (currentCredit * annualUpdateRate / 100);
        }
      }
      
      // Após contemplação, aplicar atualização mensal em todos os meses
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      }
    }
    
    return currentCredit;
  };

  // Função para calcular parcela especial (versão síncrona)
  const calculateSpecialInstallment = (credit: number, month: number, isAfterContemplation: boolean = false) => {
    // Se for parcela cheia, retorna o cálculo simples
    if (installmentType === 'full') {
      const totalCredit = isAfterContemplation ? creditoAcessado : credit;
      const adminTax = totalCredit * (administrator.administrationRate || 0.27);
      const reserveFund = totalCredit * 0.01; // 1%
      return (totalCredit + adminTax + reserveFund) / (product.termMonths || 240);
    }

    // Para parcelas especiais, usar valores padrão se não conseguir buscar do banco
    // Isso evita problemas de performance e loops infinitos
    const reductionPercent = 0.5; // 50% de redução padrão
    const applications = ['installment']; // Aplicar apenas no crédito por padrão

    // Calcular componentes com redução conforme a fórmula especificada
    let principal = credit;
    let adminTax = credit * (administrator.administrationRate || 0.27);
    let reserveFund = credit * 0.01;

    // Para parcelas especiais após contemplação, usar o crédito acessado
    if (isAfterContemplation) {
      principal = creditoAcessado;
      adminTax = creditoAcessado * (administrator.administrationRate || 0.27);
      reserveFund = creditoAcessado * 0.01;
    }

    // Aplicar reduções conforme configuração usando a fórmula correta
    // Fórmula: (Crédito * (1 - redução)) + Taxa de Administração + Fundo de Reserva
    if (applications.includes('installment')) {
      principal = principal * (1 - reductionPercent); // Crédito * (1 - redução)
    }
    // Taxa de administração e fundo de reserva NÃO são reduzidos
    // adminTax = adminTax (sem redução)
    // reserveFund = reserveFund (sem redução)

    const result = (principal + adminTax + reserveFund) / (product.termMonths || 240);
    
    return result;
  };

  // Função para calcular dados da tabela (mesma lógica do DetailTable)
  const calculateTableData = () => {
    const data = [];
    const totalMonths = contemplationMonth;
    
    // Determinar o valor base do crédito (mesma lógica do DetailTable)
    const baseCredit = selectedCredits.length > 0 
      ? selectedCredits.reduce((sum, credit) => sum + (credit.value || 0), 0)
      : creditoAcessado || 0;
    
    const saldoDevedorAcumulado = 0;
    let creditoAcessadoContemplacao = 0;
    
    for (let month = 1; month <= totalMonths; month++) {
      // Usar a mesma lógica do DetailTable
      const credito = calculateCreditValue(month, baseCredit);
      const creditoAcessado = calculateCreditoAcessado(month, baseCredit);
      
      // Calcular taxa de administração e fundo de reserva
      let taxaAdmin, fundoReserva;
      
      if (month <= contemplationMonth) {
        // Antes da contemplação: calcula sobre o crédito normal
        taxaAdmin = credito * (administrator.administrationRate || 0.27);
        fundoReserva = credito * 0.01; // 1%
      } else {
        // Após a contemplação: calcula sobre o crédito acessado da contemplação
        if (creditoAcessadoContemplacao === 0) {
          // Calcular baseado no mês de contemplação + período de compra
          const mesAquisicao = contemplationMonth + (product.periodoCompra || 0);
          const creditoAcessadoContemplacaoTemp = calculateCreditoAcessado(mesAquisicao, baseCredit);
          creditoAcessadoContemplacao = creditoAcessadoContemplacaoTemp;
        }
        
        taxaAdmin = creditoAcessadoContemplacao * (administrator.administrationRate || 0.27);
        fundoReserva = creditoAcessadoContemplacao * 0.01; // 1%
      }
      
      // Calcular valor da parcela
      let valorParcela;
      
      if (month <= contemplationMonth) {
        if (installmentType === 'full') {
          valorParcela = (credito + taxaAdmin + fundoReserva) / (product.termMonths || 240);
        } else {
          valorParcela = calculateSpecialInstallment(credito, month, false);
        }
      } else {
        // Após contemplação
        const parcelasPagas = contemplationMonth;
        const prazoRestante = (product.termMonths || 240) - parcelasPagas;
        valorParcela = saldoDevedorAcumulado / prazoRestante;
      }
      
      data.push({
        mes: month,
        credito,
        creditoAcessado,
        taxaAdministracao: taxaAdmin,
        fundoReserva,
        valorParcela,
        saldoDevedor: saldoDevedorAcumulado
      });
    }
    
    return data;
  };

  // Calcular dados do ganho de capital
  const capitalGainData = useMemo(() => {
    if (!creditoAcessado) return null;

    // Usar os dados reais da tabela
    const tableData = calculateTableData();
    
    // Encontrar o crédito acessado no mês de contemplação
    const creditoAcessadoContemplacao = tableData[contemplationMonth - 1]?.creditoAcessado || 0;
    
    // Calcular soma das parcelas pagas até a contemplação
    const somaParcelasPagas = tableData
      .slice(0, contemplationMonth)
      .reduce((sum, row) => sum + row.valorParcela, 0);

    // Calcular valores do ganho de capital
    const valorAgio = creditoAcessadoContemplacao * (agioPercent / 100);
    const valorLucro = valorAgio - somaParcelasPagas;
    // ROI = (Lucro / soma das parcelas pagas) * 100
    const roiOperacao = somaParcelasPagas > 0 ? (valorLucro / somaParcelasPagas) * 100 : 0;

    // Gerar dados para o gráfico
    const chartData = [];
    
    for (let month = contemplationMonth; month >= 1; month--) {
      const somaParcelasAteMes = tableData
        .slice(0, month)
        .reduce((sum, row) => sum + row.valorParcela, 0);
      
      const lucroAcumulado = valorAgio - somaParcelasAteMes;
      
      if (lucroAcumulado >= 0) {
        chartData.push({
          mes: month,
          lucro: lucroAcumulado
        });
      }
    }

    return {
      valorAgio,
      somaParcelasPagas,
      valorLucro,
      roiOperacao,
      chartData,
      creditoAcessadoContemplacao
    };
  }, [creditoAcessado, contemplationMonth, installmentType, agioPercent, product, administrator, embutido, selectedCredits]);

  useEffect(() => {
    if (capitalGainData && typeof onRoiChange === 'function') {
      onRoiChange(capitalGainData.roiOperacao);
    }
  }, [capitalGainData, onRoiChange]);

  // Estado para exibir/ocultar configurações
  const [showConfig, setShowConfig] = useState(false);
  // Estado local para edição do ágio - inicializar com o valor atual
  const [pendingAgio, setPendingAgio] = useState<number>(agioPercent);

  // Sincronizar pendingAgio com agioPercent quando ele mudar
  useEffect(() => {
    setPendingAgio(agioPercent);
  }, [agioPercent]);

  if (!creditoAcessado) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Alavancagem Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure o crédito acessado para visualizar os cálculos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Alavancagem Financeira</CardTitle>
          <button
            type="button"
            className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#232323]"
            aria-label="Configurações"
            onClick={() => setShowConfig((v) => !v)}
          >
            <Settings size={20} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campo Ágio - só aparece se showConfig estiver true */}
        {showConfig && (
          <div className="flex items-center gap-2">
            <Label>Ágio (%)</Label>
            <Input
              type="number"
              value={pendingAgio}
              onChange={e => { const num = Number(e.target.value); setPendingAgio(num); }}
              min={0}
              max={100}
              step={0.1}
              className="w-24 brand-radius field-secondary-focus no-ring-focus"
            />
            <button
              type="button"
              className="ml-2 underline cursor-pointer"
              style={{ color: 'var(--brand-primary)' }}
              onClick={() => { setAgioPercent(pendingAgio); }}
            >
              Aplicar
            </button>
          </div>
        )}

        {/* Cards com os dados */}
        {capitalGainData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 p-4 rounded-lg border bg-[#1F1F1F] brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
              <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Valor do Ágio</Label>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(capitalGainData.valorAgio)}
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-lg border bg-[#1F1F1F] brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
              <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Soma das Parcelas Pagas</Label>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(capitalGainData.somaParcelasPagas)}
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-lg border bg-[#1F1F1F] brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
              <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Valor do Lucro</Label>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(capitalGainData.valorLucro)}
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-lg border bg-[#1F1F1F] brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
              <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>ROI da Operação</Label>
              <div className="text-2xl font-bold text-white">
                {capitalGainData.roiOperacao.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Gráfico de Barras */}
        {capitalGainData && capitalGainData.chartData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evolução do Lucro por Mês</h3>
            <div className="overflow-x-auto lg:overflow-x-visible">
              <div className="min-w-[980px] h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capitalGainData.chartData} margin={{ top: 16, right: 40, left: 24, bottom: 50 }}>
                    <defs>
                      <linearGradient id="lucroGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--brand-primary)" />
                        <stop offset="100%" stopColor="var(--brand-secondary)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="rgba(200, 200, 200, 0.3)" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: '#9CA3AF' }}
                      tickMargin={10}
                    />
                    {(() => {
                      const maxLucro = Math.max(...capitalGainData.chartData.map((d: any) => Number(d.lucro) || 0));
                      const upper = Math.ceil(maxLucro * 1.1 / 1000) * 1000;
                      return (
                        <YAxis
                          width={130}
                          tick={{ fill: '#9CA3AF', textAnchor: 'end' }}
                          tickFormatter={(value) => formatCurrency(Number(value))}
                          tickMargin={10}
                          domain={[0, upper]}
                          allowDecimals={false}
                        />
                      );
                    })()}
                    <Tooltip 
                      content={<CustomTooltip />}
                    />
                    <Bar dataKey="lucro" fill="url(#lucroGradient)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 