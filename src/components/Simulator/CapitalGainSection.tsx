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
}

export const CapitalGainSection: React.FC<CapitalGainSectionProps> = ({
  creditoAcessado,
  contemplationMonth,
  installmentType,
  product,
  administrator
}) => {
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

  // Calcular dados do ganho de capital
  const capitalGainData = useMemo(() => {
    if (!creditoAcessado) return null;

    const baseCredit = creditoAcessado;
    let somaParcelasPagas = 0;
    const parcelasData = [];

    // Calcular parcelas pagas até a contemplação
    for (let month = 1; month <= contemplationMonth; month++) {
      const credito = baseCredit; // Simplificado para este cálculo
      const valorParcela = calculateInstallmentValue(credito, month, false);
      somaParcelasPagas += valorParcela;
      
      parcelasData.push({
        mes: month,
        valorParcela,
        somaAcumulada: somaParcelasPagas
      });
    }

    // Calcular valores do ganho de capital
    const valorAgio = creditoAcessado * (agioPercent / 100);
    const valorLucro = valorAgio - somaParcelasPagas;
    const roiOperacao = somaParcelasPagas > 0 ? (valorAgio / somaParcelasPagas) * 100 : 0;

    // Gerar dados para o gráfico
    const chartData = [];
    let lucroAcumulado = 0;
    
    for (let month = 1; month <= contemplationMonth; month++) {
      const parcela = parcelasData[month - 1];
      lucroAcumulado = valorAgio - parcela.somaAcumulada;
      
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
      chartData
    };
  }, [creditoAcessado, contemplationMonth, installmentType, agioPercent, product, administrator]);

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
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-green-600 dark:text-green-400">Valor do Ágio</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(capitalGainData.valorAgio)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Soma das Parcelas Pagas</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(capitalGainData.somaParcelasPagas)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Valor do Lucro</div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {formatCurrency(capitalGainData.valorLucro)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-purple-600 dark:text-purple-400">ROI da Operação</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {capitalGainData.roiOperacao.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
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
                  <Bar dataKey="lucro" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 