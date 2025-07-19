import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface CapitalGainSectionProps {
  creditoAcessado: number | null;
  contemplationMonth: number;
  installmentType: string;
  product: any;
  administrator: any;
  embutido?: 'com' | 'sem';
  selectedCredits?: any[]; // Adicionar selectedCredits
}

export const CapitalGainSection: React.FC<CapitalGainSectionProps> = ({
  creditoAcessado,
  contemplationMonth,
  installmentType,
  product,
  administrator,
  embutido = 'sem',
  selectedCredits = [] // Adicionar selectedCredits
}: CapitalGainSectionProps) => {
  const [agioPercent, setAgioPercent] = useState(5); // 5% padrão

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
          const inccRate = administrator.inccRate || 6; // Taxa INCC padrão
          currentCredit = currentCredit + (currentCredit * inccRate / 100);
        }
      }
      
      // Após contemplação, aplicar atualização mensal em todos os meses
      if (m > contemplationMonth) {
        const postContemplationRate = administrator.postContemplationAdjustment || 0;
        currentCredit = currentCredit + (currentCredit * postContemplationRate / 100);
      }
      
      // Aplicar redução do embutido no mês de contemplação se "Com embutido" estiver selecionado
      if (embutido === 'com' && m === contemplationMonth && !embutidoAplicado) {
        const maxEmbeddedPercentage = administrator.maxEmbeddedPercentage || 25; // 25% padrão
        currentCredit = currentCredit - (currentCredit * maxEmbeddedPercentage / 100);
        embutidoAplicado = true;
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
          const inccRate = administrator.inccRate || 6; // Taxa INCC padrão
          currentCredit = currentCredit + (currentCredit * inccRate / 100);
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
    
    let saldoDevedorAcumulado = 0;
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
          const creditoAcessadoContemplacaoTemp = calculateCreditoAcessado(contemplationMonth, baseCredit);
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
    
    // Encontrar o crédito acessado no mês de contemplação (R$ 1.297.758,00)
    const creditoAcessadoContemplacao = tableData[contemplationMonth - 1]?.creditoAcessado || 0;
    
    // Calcular soma das parcelas pagas até a contemplação
    const somaParcelasPagas = tableData
      .slice(0, contemplationMonth)
      .reduce((sum, row) => sum + row.valorParcela, 0);

    // Calcular valores do ganho de capital
    const valorAgio = creditoAcessadoContemplacao * (agioPercent / 100);
    const valorLucro = valorAgio - somaParcelasPagas;
    const roiOperacao = somaParcelasPagas > 0 ? (valorAgio / somaParcelasPagas) * 100 : 0;

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

  if (!creditoAcessado) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ganho de Capital</CardTitle>
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
        <CardTitle>Ganho de Capital</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Campo Ágio */}
        <div className="space-y-2">
          <Label htmlFor="agio-percent">Ágio (%)</Label>
          <Input
            id="agio-percent"
            type="number"
            value={agioPercent}
            onChange={(e) => setAgioPercent(Number(e.target.value))}
            min="0"
            max="100"
            step="0.1"
            className="w-32"
          />
        </div>

        {/* Cards com os dados */}
        {capitalGainData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-green-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-green-700 dark:text-[#A86F57] font-medium">Valor do Ágio</Label>
              <div className="text-2xl font-bold text-green-900 dark:text-white">
                {formatCurrency(capitalGainData.valorAgio)}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-blue-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-blue-700 dark:text-[#A86F57] font-medium">Soma das Parcelas Pagas</Label>
              <div className="text-2xl font-bold text-blue-900 dark:text-white">
                {formatCurrency(capitalGainData.somaParcelasPagas)}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-orange-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-orange-700 dark:text-[#A86F57] font-medium">Valor do Lucro</Label>
              <div className="text-2xl font-bold text-orange-900 dark:text-white">
                {formatCurrency(capitalGainData.valorLucro)}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border border-purple-200 dark:border-[#A86F57]/40">
              <Label className="text-sm text-purple-700 dark:text-[#A86F57] font-medium">ROI da Operação</Label>
              <div className="text-2xl font-bold text-purple-900 dark:text-white">
                {capitalGainData.roiOperacao.toFixed(2)}%
              </div>
            </div>
          </div>
        )}

        {/* Gráfico de Barras */}
        {capitalGainData && capitalGainData.chartData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evolução do Lucro por Mês</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capitalGainData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    label={{ value: 'Mês', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Lucro (R$)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Lucro']}
                    labelFormatter={(label) => `Mês ${label}`}
                  />
                  <Bar dataKey="lucro" fill="#A86E57" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 