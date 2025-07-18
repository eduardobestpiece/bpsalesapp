import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import React from 'react'; // Added missing import for React.useEffect

interface DetailTableProps {
  product: any;
  administrator: any;
  contemplationMonth: number;
  selectedCredits?: any[]; // Créditos selecionados pelo usuário
  creditoAcessado?: number; // Crédito acessado total
  embutido?: 'com' | 'sem'; // Estado do embutido
  installmentType?: string; // Tipo de parcela: 'full', 'half', 'reduced' ou ID da redução
}

export const DetailTable = ({ 
  product, 
  administrator, 
  contemplationMonth, 
  selectedCredits = [], 
  creditoAcessado = 0,
  embutido = 'sem',
  installmentType = 'full'
}: DetailTableProps) => {
  const [showConfig, setShowConfig] = useState(false);
  const [maxMonths, setMaxMonths] = useState(100);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    mes: true,
    credito: true,
    creditoAcessado: true,
    taxaAdministracao: true,
    fundoReserva: true,
    valorParcela: true,
    saldoDevedor: true,
    compraAgio: true,
    lucro: true,
    percentualLucro: true,
    lucroMes: true
  });

  // Função para calcular quando o crédito deve ser atualizado
  const shouldUpdateCredit = (month: number) => {
    // Lógica simples: atualização anual a cada 12 meses (mês 13, 25, 37, etc.)
    return (month - 1) % 12 === 0 && month > 12;
  };

  // Função para calcular o valor do crédito com atualizações
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

  // Função para calcular o crédito acessado com embutido
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
    
    // Debug: logar os valores para verificar
    console.log('🔍 [calculateSpecialInstallment] Debug:', {
      credit,
      principal,
      adminTax,
      reserveFund,
      reductionPercent,
      applications,
      result
    });
    
    return result;
  };

  // Função para calcular parcela pós contemplação
  const calculatePostContemplationInstallment = (creditoAcessado: number, parcelasPagas: number) => {
    const prazoRestante = (product.termMonths || 240) - parcelasPagas;
    const saldoDevedor = creditoAcessado + (creditoAcessado * (administrator.administrationRate || 0.27)) + (creditoAcessado * 0.01);
    return saldoDevedor / prazoRestante;
  };

  // Função para gerar dados da tabela
  const generateTableData = () => {
    setIsLoading(true);
    const data = [];
    const totalMonths = Math.min(maxMonths, product.termMonths || 240);
    
    // Determinar o valor base do crédito
    const baseCredit = selectedCredits.length > 0 
      ? selectedCredits.reduce((sum, credit) => sum + (credit.value || 0), 0)
      : creditoAcessado || 0;
    
    let saldoDevedorAcumulado = 0;
    let valorBaseInicial = 0; // Valor base para cálculo antes da contemplação
    let creditoAcessadoContemplacao = 0; // Valor do crédito acessado no mês de contemplação
    let valorParcelaFixo = 0; // Valor fixo da parcela após contemplação
    
    for (let month = 1; month <= totalMonths; month++) {
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
          // Se ainda não temos o valor da contemplação, calcula baseado no mês de contemplação
          const creditoContemplacao = calculateCreditValue(contemplationMonth, baseCredit);
          const creditoAcessadoContemplacaoTemp = calculateCreditoAcessado(contemplationMonth, baseCredit);
          creditoAcessadoContemplacao = creditoAcessadoContemplacaoTemp;
        }
        
        taxaAdmin = creditoAcessadoContemplacao * (administrator.administrationRate || 0.27);
        fundoReserva = creditoAcessadoContemplacao * 0.01; // 1%
      }
      
      // Calcular o saldo devedor
      if (month === 1) {
        // Primeiro mês: soma de Crédito + Taxa de Administração + Fundo de Reserva
        valorBaseInicial = credito + taxaAdmin + fundoReserva;
        saldoDevedorAcumulado = valorBaseInicial;
      } else if (month <= contemplationMonth) {
        // Antes da contemplação: (Crédito + Taxa + Fundo Reserva) - soma das parcelas anteriores
        const valorBase = credito + taxaAdmin + fundoReserva;
        const somaParcelasAnteriores = data.slice(0, month - 1).reduce((sum, row) => sum + row.valorParcela, 0);
        saldoDevedorAcumulado = valorBase - somaParcelasAnteriores;
      } else {
        // Após a contemplação: nova lógica baseada no crédito acessado
        if (month === contemplationMonth + 1) {
          // Primeiro mês após contemplação: saldo baseado no crédito acessado
          const valorBasePosContemplacao = creditoAcessadoContemplacao + taxaAdmin + fundoReserva;
          const somaParcelasAteContemplacao = data.slice(0, contemplationMonth).reduce((sum, row) => sum + row.valorParcela, 0);
          saldoDevedorAcumulado = valorBasePosContemplacao - somaParcelasAteContemplacao;
        } else {
          // Meses seguintes após contemplação
          const saldoAnterior = data[month - 2]?.saldoDevedor || 0;
          const parcelaAnterior = data[month - 2]?.valorParcela || 0;
          
          // Verificar se é um mês de atualização anual após contemplação
          const isAnnualUpdateAfterContemplation = (month - 1) % 12 === 0 && month > contemplationMonth;
          
          if (isAnnualUpdateAfterContemplation) {
            // Atualização anual sobre o próprio saldo devedor
            const inccRate = administrator.inccRate || 6;
            saldoDevedorAcumulado = saldoAnterior + (saldoAnterior * inccRate / 100) - parcelaAnterior;
          } else {
            // Mês normal após contemplação: saldo anterior menos parcela
            saldoDevedorAcumulado = saldoAnterior - parcelaAnterior;
          }
        }
      }
      
      // Calcular valor da parcela conforme as regras especificadas
      let valorParcela;
      
      if (month <= contemplationMonth) {
        // Antes da contemplação: usar regras da parcela (cheia ou especial)
        if (installmentType === 'full') {
          // Parcela cheia: (Valor do Crédito + Taxa de Administração + Fundo de Reserva) / Prazo
          valorParcela = (credito + taxaAdmin + fundoReserva) / (product.termMonths || 240);
        } else {
          // Parcela especial: aplicar reduções conforme configuração
          valorParcela = calculateSpecialInstallment(credito, month, false);
        }
      } else {
        // Após contemplação: REGRA IGUAL PARA AMBOS OS TIPOS
        // Saldo devedor / (Prazo - número de Parcelas pagas)
        const parcelasPagas = contemplationMonth;
        const prazoRestante = (product.termMonths || 240) - parcelasPagas;
        
        if (month === contemplationMonth + 1) {
          // Primeiro mês após contemplação: calcular parcela fixa baseada no saldo devedor
          valorParcela = saldoDevedorAcumulado / prazoRestante;
          valorParcelaFixo = valorParcela; // Fixar o valor para os próximos meses
        } else {
          // Meses seguintes: usar o valor fixo até próxima atualização
          valorParcela = valorParcelaFixo;
          
          // Verificar se é mês de atualização anual
          const isAnnualUpdate = (month - 1) % 12 === 0 && month > contemplationMonth;
          if (isAnnualUpdate) {
            // Recalcular parcela com saldo devedor atualizado
            const parcelasPagasAteAgora = month - 1;
            const prazoRestanteAtualizado = (product.termMonths || 240) - parcelasPagasAteAgora;
            
            // REGRA IGUAL PARA AMBOS OS TIPOS: saldo devedor / prazo restante
            valorParcela = saldoDevedorAcumulado / prazoRestanteAtualizado;
            valorParcelaFixo = valorParcela; // Atualizar valor fixo
          }
        }
      }
      
      const compraAgio = credito * 0.05; // 5%
      const lucro = credito - compraAgio;
      const percentualLucro = (lucro / compraAgio) * 100;
      const lucroMes = lucro / (product.termMonths || 240);
      
      // Destacar linha do mês de contemplação
      const isContemplationMonth = month === contemplationMonth;
      
      data.push({
        mes: month,
        credito,
        creditoAcessado,
        taxaAdministracao: taxaAdmin,
        fundoReserva,
        valorParcela,
        saldoDevedor: saldoDevedorAcumulado,
        compraAgio,
        lucro,
        percentualLucro,
        lucroMes,
        isContemplationMonth
      });
    }
    
    setTableData(data);
    setIsLoading(false);
    return data;
  };

  // Executar cálculo quando as dependências mudarem
  React.useEffect(() => {
    generateTableData();
  }, [product, administrator, contemplationMonth, selectedCredits, creditoAcessado, installmentType, maxMonths]);

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Detalhamento do Consórcio</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Configurar
            {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
      </CardHeader>

      {showConfig && (
        <CardContent className="border-b">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Máximo de meses a exibir:</label>
              <input
                type="number"
                value={maxMonths}
                onChange={(e) => setMaxMonths(Number(e.target.value))}
                min="1"
                max={product.termMonths || 240}
                className="ml-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-24 bg-gray-800 dark:bg-gray-700 text-gray-100 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Colunas visíveis:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(visibleColumns).map(([key, visible]) => (
                  <Badge
                    key={key}
                    variant={visible ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleColumn(key)}
                  >
                    {key === 'mes' && 'Mês'}
                    {key === 'credito' && 'Crédito'}
                    {key === 'creditoAcessado' && 'Crédito Acessado'}
                    {key === 'taxaAdministracao' && 'Taxa de Administração'}
                    {key === 'fundoReserva' && 'Fundo de Reserva'}
                    {key === 'valorParcela' && 'Valor da Parcela'}
                    {key === 'saldoDevedor' && 'Saldo Devedor'}
                    {key === 'compraAgio' && 'Compra do Ágio'}
                    {key === 'lucro' && 'Lucro'}
                    {key === 'percentualLucro' && 'Percentual de Lucro'}
                    {key === 'lucroMes' && 'Lucro ao Mês'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}

      <CardContent>
        <div className="w-full overflow-x-auto border rounded-lg" style={{ maxHeight: '400px' }}>
          <div className="min-w-max">
            <Table>
            <TableHeader className="sticky top-0 z-10" style={{ backgroundColor: '#131313' }}>
              <TableRow>
                {visibleColumns.mes && <TableHead>Mês</TableHead>}
                {visibleColumns.credito && <TableHead>Crédito</TableHead>}
                {visibleColumns.creditoAcessado && <TableHead>Crédito Acessado</TableHead>}
                {visibleColumns.taxaAdministracao && <TableHead>Taxa de Administração</TableHead>}
                {visibleColumns.fundoReserva && <TableHead>Fundo de Reserva</TableHead>}
                {visibleColumns.valorParcela && <TableHead>Valor da Parcela</TableHead>}
                {visibleColumns.saldoDevedor && <TableHead>Saldo Devedor</TableHead>}
                {visibleColumns.compraAgio && <TableHead>Compra do Ágio</TableHead>}
                {visibleColumns.lucro && <TableHead>Lucro</TableHead>}
                {visibleColumns.percentualLucro && <TableHead>Percentual de Lucro</TableHead>}
                {visibleColumns.lucroMes && <TableHead>Lucro ao Mês</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <p>Carregando dados...</p>
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <p>Nenhum dado disponível para exibir.</p>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => (
                  <TableRow 
                    key={row.mes}
                    className={row.isContemplationMonth ? "bg-green-100 dark:bg-green-900" : ""}
                  >
                    {visibleColumns.mes && <TableCell>{row.mes}</TableCell>}
                    {visibleColumns.credito && <TableCell>{formatCurrency(row.credito)}</TableCell>}
                    {visibleColumns.creditoAcessado && <TableCell>{formatCurrency(row.creditoAcessado)}</TableCell>}
                    {visibleColumns.taxaAdministracao && <TableCell>{formatCurrency(row.taxaAdministracao)}</TableCell>}
                    {visibleColumns.fundoReserva && <TableCell>{formatCurrency(row.fundoReserva)}</TableCell>}
                    {visibleColumns.valorParcela && <TableCell>{formatCurrency(row.valorParcela)}</TableCell>}
                    {visibleColumns.saldoDevedor && <TableCell>{formatCurrency(row.saldoDevedor)}</TableCell>}
                    {visibleColumns.compraAgio && <TableCell>{formatCurrency(row.compraAgio)}</TableCell>}
                    {visibleColumns.lucro && <TableCell>{formatCurrency(row.lucro)}</TableCell>}
                    {visibleColumns.percentualLucro && <TableCell>{row.percentualLucro}%</TableCell>}
                    {visibleColumns.lucroMes && <TableCell>{formatCurrency(row.lucroMes)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}; 