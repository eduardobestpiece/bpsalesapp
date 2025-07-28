import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DetailTableProps {
  product: any;
  administrator: any;
  contemplationMonth: number;
  selectedCredits?: any[]; // Créditos selecionados pelo usuário
  creditoAcessado?: number; // Crédito acessado total
  embutido?: 'com' | 'sem'; // Estado do embutido
  installmentType?: string; // Tipo de parcela: 'full', 'half', 'reduced' ou ID da redução
  customAdminTaxPercent?: number; // Taxa de administração customizada
  customReserveFundPercent?: number; // Fundo de reserva customizado
  customAnnualUpdateRate?: number; // Taxa de atualização anual customizada
  agioPercent?: number; // NOVO: percentual de ágio
  periodoCompra?: number; // NOVO: período de compra em meses
  valorAlavancaNum?: number; // NOVO: valor numérico da alavanca
  onFirstRowData?: (data: { credit: number, installmentValue: number }) => void; // Callback para expor dados da primeira linha
  onContemplationRowData?: (data: { creditAccessed: number, month: number, parcelaAfter?: number, somaParcelasAteContemplacao?: number, mesContemplacao?: number }) => void; // Callback para expor dados da linha de contemplação
  onTableDataGenerated?: (tableData: any[]) => void; // Callback para sincronizar dados com outros componentes
}

export const DetailTable = ({ 
  product, 
  administrator, 
  contemplationMonth, 
  selectedCredits = [], 
  creditoAcessado = 0,
  embutido = 'sem',
  installmentType = 'full',
  customAdminTaxPercent,
  customReserveFundPercent,
  customAnnualUpdateRate,
  agioPercent = 17, // padrão 17%
  periodoCompra,
  valorAlavancaNum,
  onFirstRowData,
  onContemplationRowData,
  onTableDataGenerated
}: DetailTableProps) => {
  const [showConfig, setShowConfig] = useState(false);
  // Remover o estado e input de maxMonths
  // const [maxMonths, setMaxMonths] = useState(100);
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    mes: true,
    credito: true,
    creditoAcessado: true,
    taxaAdministracao: false,
    fundoReserva: false,
    valorParcela: true,
    saldoDevedor: false,
    agio: false,
    lucro: false,
    roi: false,
    // lucroMes: false, // removido
  });

  // Refs para sincronizar scroll horizontal
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Refs para colunas do cabeçalho e corpo
  const thRefs = useRef<(HTMLTableCellElement | null)[]>([]);
  const tdRefs = useRef<(HTMLTableCellElement | null)[]>([]);
  const [colWidths, setColWidths] = useState<number[]>([]);

  // Ref para a linha de contemplação e última linha
  const contemplationRowRef = useRef<HTMLTableRowElement>(null);
  const lastRowRef = useRef<HTMLTableRowElement>(null);
  const [highlightContemplation, setHighlightContemplation] = useState(false);

  // Sincronizar scroll horizontal
  useEffect(() => {
    const header = headerRef.current;
    const body = bodyRef.current;
    if (!header || !body) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      return () => {
        if (target.scrollLeft !== source.scrollLeft) {
          target.scrollLeft = source.scrollLeft;
        }
      };
    };
    const onHeaderScroll = syncScroll(header, body);
    const onBodyScroll = syncScroll(body, header);
    header.addEventListener('scroll', onHeaderScroll);
    body.addEventListener('scroll', onBodyScroll);
    return () => {
      header.removeEventListener('scroll', onHeaderScroll);
      body.removeEventListener('scroll', onBodyScroll);
    };
  }, []);

  // Medir larguras das colunas após renderização
  useLayoutEffect(() => {
    // Resetar larguras antes de medir
    setColWidths([]);
    // Usar setTimeout para garantir que o DOM está atualizado
    setTimeout(() => {
      const ths = thRefs.current;
      const tds = tdRefs.current;
      const widths = ths.map((th, i) => {
        const thWidth = th ? th.offsetWidth : 0;
        const tdWidth = tds[i] ? tds[i].offsetWidth : 0;
        return Math.max(thWidth, tdWidth, 80); // 80px mínimo
      });
      setColWidths(widths);
    }, 0);
  }, [tableData, visibleColumns]); // garantir dependência de visibleColumns

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
    // Usar valores customizados se disponíveis, senão usar os valores padrão
    const adminTaxRate = customAdminTaxPercent !== undefined ? customAdminTaxPercent / 100 : (administrator.administrationRate || 0.27);
    const reserveFundRate = customReserveFundPercent !== undefined ? customReserveFundPercent / 100 : 0.01; // 1% padrão
    
    // Se for parcela cheia, retorna o cálculo simples
    if (installmentType === 'full') {
      const totalCredit = isAfterContemplation ? creditoAcessado : credit;
      const adminTax = totalCredit * adminTaxRate;
      const reserveFund = totalCredit * reserveFundRate;
      return (totalCredit + adminTax + reserveFund) / (product.termMonths || 240);
    }

    // Para parcelas especiais, usar valores padrão se não conseguir buscar do banco
    // Isso evita problemas de performance e loops infinitos
    const reductionPercent = 0.5; // 50% de redução padrão
    const applications = ['installment']; // Aplicar apenas no crédito por padrão

    // Calcular componentes com redução conforme a fórmula especificada
    let principal = credit;
    let adminTax = credit * adminTaxRate;
    let reserveFund = credit * reserveFundRate;

    // Para parcelas especiais após contemplação, usar o crédito acessado
    if (isAfterContemplation) {
      principal = creditoAcessado;
      adminTax = creditoAcessado * adminTaxRate;
      reserveFund = creditoAcessado * reserveFundRate;
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

  // Função para calcular parcela pós contemplação
  const calculatePostContemplationInstallment = (creditoAcessado: number, parcelasPagas: number) => {
    const prazoRestante = (product.termMonths || 240) - parcelasPagas;
    const adminTaxRate = customAdminTaxPercent !== undefined ? customAdminTaxPercent / 100 : (administrator.administrationRate || 0.27);
    const reserveFundRate = customReserveFundPercent !== undefined ? customReserveFundPercent / 100 : 0.01; // 1% padrão
    const saldoDevedor = creditoAcessado + (creditoAcessado * adminTaxRate) + (creditoAcessado * reserveFundRate);
    return saldoDevedor / prazoRestante;
  };

  // Função para gerar dados da tabela
  const generateTableData = () => {
    
    setIsLoading(true);
    const data = [];
    // const totalMonths = Math.min(maxMonths, product.termMonths || 240);
    const totalMonths = product.termMonths || 240;
    
    // Determinar o valor base do crédito
    const baseCredit = selectedCredits.length > 0 
      ? selectedCredits.reduce((sum, credit) => sum + (credit.value || 0), 0)
      : creditoAcessado || 0;
    
    let saldoDevedorAcumulado = 0;
    let valorBaseInicial = 0; // Valor base para cálculo antes da contemplação
    let creditoAcessadoContemplacao = 0; // Valor do crédito acessado no mês de contemplação
    let valorParcelaFixo = 0; // Valor fixo da parcela após contemplação
    let receitaMenosCustosAcumulada = 0;
    let somaParcelasAcumulada = 0;
    for (let month = 1; month <= totalMonths; month++) {
      const credito = calculateCreditValue(month, baseCredit);
      const creditoAcessado = calculateCreditoAcessado(month, baseCredit);
      
      // Calcular taxa de administração e fundo de reserva
      let taxaAdmin, fundoReserva;
      
      // Usar valores customizados se disponíveis, senão usar os valores padrão da administradora
      const adminTaxRate = customAdminTaxPercent !== undefined ? customAdminTaxPercent / 100 : (administrator.administrationRate || 0.27);
      const reserveFundRate = customReserveFundPercent !== undefined ? customReserveFundPercent / 100 : 0.01; // 1% padrão
      
      if (month <= contemplationMonth) {
        // Antes da contemplação: calcula sobre o crédito normal
        taxaAdmin = credito * adminTaxRate;
        fundoReserva = credito * reserveFundRate;
      } else {
        // Após a contemplação: calcula sobre o crédito acessado da contemplação
        if (creditoAcessadoContemplacao === 0) {
          // Se ainda não temos o valor da contemplação, calcula baseado no mês de contemplação
          const creditoContemplacao = calculateCreditValue(contemplationMonth, baseCredit);
          const creditoAcessadoContemplacaoTemp = calculateCreditoAcessado(contemplationMonth, baseCredit);
          creditoAcessadoContemplacao = creditoAcessadoContemplacaoTemp;
        }
        
        taxaAdmin = creditoAcessadoContemplacao * adminTaxRate;
        fundoReserva = creditoAcessadoContemplacao * reserveFundRate;
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
            // Usar valor customizado se disponível, senão usar o valor padrão
            const annualUpdateRate = customAnnualUpdateRate !== undefined ? customAnnualUpdateRate : (administrator.inccRate || 6);
            saldoDevedorAcumulado = saldoAnterior + (saldoAnterior * annualUpdateRate / 100) - parcelaAnterior;
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
      
      // Ágio = creditoAcessado (da linha) * (agioPercent / 100)
      // Aqui, garantir que está usando o creditoAcessado da linha, não da prop global
      const agioLinha = creditoAcessado * (agioPercent / 100); // creditoAcessado aqui é o da linha
      
      // Debug para verificar valores do ágio
      if (month === 1) {
        console.log('🔍 [ÁGIO DEBUG]', {
          creditoAcessado,
          agioPercent,
          agioLinha,
          calculo: `${creditoAcessado} * (${agioPercent} / 100) = ${agioLinha}`
        });
      }
      // Soma das parcelas pagas até o mês atual
      const somaParcelasPagas = data.reduce((sum, row) => sum + row.valorParcela, 0) + valorParcela;
      // Lucro = Ágio - soma das parcelas pagas até o mês
      const lucro = agioLinha - somaParcelasPagas;
      // ROI = Lucro / soma das parcelas pagas até o mês
      const roi = somaParcelasPagas !== 0 ? lucro / somaParcelasPagas : 0;
      
      // Receita do mês (simples): crédito * alguma taxa, ou lógica do gráfico
      // Custos do mês (simples): crédito * alguma taxa, ou lógica do gráfico
      // Aqui, para exemplo, vamos usar receita e custos como zero (ajuste conforme sua lógica real)
      const receitaMes = 0; // Substitua pela lógica real
      const custos = 0; // Substitua pela lógica real
      const receitaMenosCustos = receitaMes - custos;
      receitaMenosCustosAcumulada += receitaMenosCustos;
      somaParcelasAcumulada += valorParcela;
      const fluxoCaixa = receitaMenosCustosAcumulada - somaParcelasAcumulada;
      
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
        agio: agioLinha,
        lucro,
        roi,
        isContemplationMonth,
        fluxoCaixa // NOVO campo
      });
    }
    
    setTableData(data);
    setIsLoading(false);
    
    // Notificar dados da tabela para outros componentes
    if (onTableDataGenerated) {
      onTableDataGenerated(data);
    }
    
    // Após gerar o array completo
    return data;
  };

  // Executar cálculo quando as dependências mudarem
  useEffect(() => {
    generateTableData();
  }, [product, administrator, contemplationMonth, selectedCredits, creditoAcessado, installmentType, customAdminTaxPercent, customReserveFundPercent, customAnnualUpdateRate, agioPercent, periodoCompra, valorAlavancaNum]);

  // Notificar dados da primeira linha quando disponíveis
  useEffect(() => {
    if (onFirstRowData && tableData.length > 0) {
      const firstRow = tableData[0];
      onFirstRowData({
        credit: firstRow.credito,
        installmentValue: firstRow.valorParcela
      });
    }
  }, [tableData, onFirstRowData]);

  // Notificar dados da linha de contemplação e linha seguinte quando disponíveis
  useEffect(() => {
    if (typeof window !== 'undefined' && tableData.length > 0) {
      const contemplacaoIdx = tableData.findIndex(row => row.isContemplationMonth);
      const contemplacaoRow = tableData[contemplacaoIdx];
      const afterContemplacaoRow = tableData[contemplacaoIdx + 1];
      if (onContemplationRowData && contemplacaoRow) {
        onContemplationRowData({
          creditAccessed: contemplacaoRow.creditoAcessado,
          month: contemplacaoRow.mes,
          parcelaAfter: afterContemplacaoRow?.valorParcela || 0,
          somaParcelasAteContemplacao: tableData.slice(0, contemplacaoIdx + 1).reduce((sum, row) => sum + row.valorParcela, 0),
          mesContemplacao: contemplacaoRow.mes
        });
      }
    }
  }, [tableData, onContemplationRowData]);

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev]
    }));
  };

  // Gerar lista de colunas visíveis para indexação
  const visibleKeys = Object.keys(visibleColumns).filter((key) => visibleColumns[key as keyof typeof visibleColumns]);

  return (
    <Card id="detalhamento-consorcio" className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Detalhamento do Consórcio</CardTitle>
          <div className="flex items-center gap-2">
            <Target size={20} onClick={() => {
              if (contemplationRowRef.current) {
                contemplationRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightContemplation(true);
                setTimeout(() => setHighlightContemplation(false), 2000);
              }
            }} style={{ cursor: 'pointer' }} />
            <ChevronDown size={20} onClick={() => {
              if (lastRowRef.current) {
                lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }} style={{ cursor: 'pointer' }} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConfig(!showConfig)}
              style={{ backgroundColor: '#1E1E1E' }}
              aria-label="Configurar"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {showConfig && (
        <CardContent className="border-b">
          <div className="space-y-4">
            {/* Remover o campo de máximo de meses */}
            {/* <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Máximo de meses a exibir:</label>
              <input
                type="number"
                value={maxMonths}
                onChange={(e) => setMaxMonths(Number(e.target.value))}
                min="1"
                max={product.termMonths || 240}
                className="ml-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm w-24 bg-gray-800 dark:bg-gray-700 text-gray-100 dark:text-gray-100"
              />
            </div> */}
            
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
                    {key === 'agio' && 'Ágio'}
                    {key === 'lucro' && 'Lucro'}
                    {key === 'roi' && 'ROI'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      )}

      <CardContent>
        <div className="w-full overflow-x-auto border rounded-lg table-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Table className="min-w-max">
            <thead className="bg-[#131313] border-b border-gray-700 shadow-sm sticky top-0 z-10">
              <tr>
                {visibleKeys.map((key) => (
                  <th
                    key={key}
                    className="bg-[#131313] text-white font-semibold px-4 py-2 text-left"
                    style={{whiteSpace: 'nowrap', minWidth: 80}}
                  >
                    {key === 'mes' && 'Mês'}
                    {key === 'credito' && 'Crédito'}
                    {key === 'creditoAcessado' && 'Crédito Acessado'}
                    {key === 'taxaAdministracao' && 'Taxa de Administração'}
                    {key === 'fundoReserva' && 'Fundo de Reserva'}
                    {key === 'valorParcela' && 'Valor da Parcela'}
                    {key === 'saldoDevedor' && 'Saldo Devedor'}
                    {key === 'agio' && 'Ágio'}
                    {key === 'lucro' && 'Lucro'}
                    {key === 'roi' && 'ROI'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center py-8">
                    <p>Carregando dados...</p>
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={visibleKeys.length} className="text-center py-8">
                    <p>Nenhum dado disponível para exibir.</p>
                  </td>
                </tr>
              ) : (
                tableData.map((row, rowIdx) => (
                  <tr
                    key={row.mes}
                    ref={
                      row.isContemplationMonth ? contemplationRowRef :
                      rowIdx === tableData.length - 1 ? lastRowRef : undefined
                    }
                    className={
                      row.isContemplationMonth && highlightContemplation
                        ? "bg-yellow-200 dark:bg-yellow-900 animate-pulse"
                        : row.isContemplationMonth
                          ? "bg-green-100 dark:bg-green-900"
                          : ""
                    }
                  >
                    {visibleKeys.map((key) => (
                      <td
                        key={key}
                        className="px-4 py-2 text-left"
                        style={{whiteSpace: 'nowrap', minWidth: 80}}
                      >
                        {key === 'mes' && row.mes}
                        {key === 'credito' && formatCurrency(row.credito)}
                        {key === 'creditoAcessado' && formatCurrency(row.creditoAcessado)}
                        {key === 'taxaAdministracao' && formatCurrency(row.taxaAdministracao)}
                        {key === 'fundoReserva' && formatCurrency(row.fundoReserva)}
                        {key === 'valorParcela' && formatCurrency(row.valorParcela)}
                        {key === 'saldoDevedor' && formatCurrency(row.saldoDevedor)}
                        {key === 'agio' && formatCurrency(row.agio)}
                        {key === 'lucro' && formatCurrency(row.lucro)}
                        {key === 'roi' && `${(row.roi * 100).toFixed(2)}%`}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}; 