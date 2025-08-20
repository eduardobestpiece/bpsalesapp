import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { PatrimonyChart } from './PatrimonyChart';
import { generateConsortiumInstallments } from '@/utils/consortiumInstallments';
import { DetailTable } from './DetailTable';
import { InstallmentsChart } from './InstallmentsChart';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FullScreenModal } from '../ui/FullScreenModal';
import { useSimulatorContext } from '@/components/Layout/SimulatorLayout';
import { useCompany } from '@/contexts/CompanyContext';

type Leverage = Database['public']['Tables']['leverages']['Row'];

function formatCurrency(value: string | number) {
  const v = typeof value === 'string' ? value.replace(/\D/g, '') : value;
  const num = Number(v) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// MOCK: valor do crédito e embutido do topo da página (substituir por prop/contexto real depois)
const VALOR_CREDITO = 1540000;
const EMBUTIDO_ADMIN = 0.1; // 10% (mock, substituir pelo valor real da administradora)
const LANCE_SEM_EMBUTIDO = false; // Troque para true para simular "Sem embutido"

export const NovaAlavancagemPatrimonial = ({ 
  product,
  administrator,
  contemplationMonth,
  selectedCredits = [],
  creditoAcessado,
  embutido = 'sem',
  installmentType = 'full',
  customAdminTaxPercent,
  customReserveFundPercent,
  customAnnualUpdateRate,
  maxEmbeddedPercentage,
  agioPercent = 17, // Adicionar agioPercent como prop
  creditoAcessadoContemplacao = 0, 
  parcelaAfterContemplacao = 0, 
  somaParcelasAteContemplacao = 0, 
  mesContemplacao = 0,
  parcelaInicial = 0,
  prazoTotal = 240,
  periodoCompra = 3 // NOVO: período de compra em meses
}: { 
  product: any,
  administrator: any,
  contemplationMonth: number,
  selectedCredits?: any[],
  creditoAcessado: number,
  embutido?: string,
  installmentType?: string,
  customAdminTaxPercent?: number,
  customReserveFundPercent?: number,
  customAnnualUpdateRate?: number,
  maxEmbeddedPercentage?: number,
  agioPercent?: number, // Adicionar agioPercent ao tipo
  creditoAcessadoContemplacao: number, 
  parcelaAfterContemplacao: number, 
  somaParcelasAteContemplacao: number, 
  mesContemplacao: number,
  parcelaInicial: number,
  prazoTotal: number,
  periodoCompra?: number // NOVO: período de compra em meses
}) => {
  const simCtx = useSimulatorContext();
  const { selectedCompanyId } = useCompany();
  
  // Estados dos filtros
  const [alavancas, setAlavancas] = useState<Leverage[]>([]);
  const [alavancaSelecionada, setAlavancaSelecionada] = useState<string>('');
  const [valorAlavanca, setValorAlavanca] = useState<string>('R$ 500.000,00');
  const [tipoAlavancagem, setTipoAlavancagem] = useState('simples');
  const [loading, setLoading] = useState(false);
  const [periodoCompraLocal, setPeriodoCompraLocal] = useState<number>(periodoCompra || 3); // Usar prop se disponível, senão padrão 3
  // Novo: intervalo entre contemplações (em meses)
  // Calcular automaticamente: Mês Contemplação + Período de Compra
  const intervaloContemplacaoLocal = mesContemplacao + periodoCompraLocal;
  const [chartDataState, setChartDataState] = useState<any[]>([]);
  const [installmentsChartData, setInstallmentsChartData] = useState<any[]>([]);
  const [showLegend, setShowLegend] = useState(false);
  const [showAlavancagemModal, setShowAlavancagemModal] = useState(false);
  
  // Estados locais para os campos do modal
  const [localDailyPercentage, setLocalDailyPercentage] = useState<number>(0);
  const [localManagementPercentage, setLocalManagementPercentage] = useState<number>(0);
  const [localOccupancyRate, setLocalOccupancyRate] = useState<number>(0);
  const [localTotalExpenses, setLocalTotalExpenses] = useState<number>(0);
  
  // Sincronizar estados locais com a alavanca selecionada
  useEffect(() => {
    const currentAlavanca = alavancas.find(a => a.id === alavancaSelecionada);
    if (currentAlavanca) {
      setLocalDailyPercentage(currentAlavanca.daily_percentage || 0);
      setLocalManagementPercentage(currentAlavanca.management_percentage || 0);
      setLocalOccupancyRate(currentAlavanca.occupancy_rate || 0);
      setLocalTotalExpenses(currentAlavanca.total_expenses || 0);
    }
  }, [alavancaSelecionada, alavancas]);

  // Carregar configurações do contexto ao montar (se houver)
  useEffect(() => {
    if (simCtx.leverageConfig) {
      setAlavancaSelecionada(simCtx.leverageConfig.selectedLeverageId || '');
      if (simCtx.leverageConfig.leverageValue) setValorAlavanca(simCtx.leverageConfig.leverageValue);
      if (simCtx.leverageConfig.leverageType) setTipoAlavancagem(simCtx.leverageConfig.leverageType);
      if (typeof simCtx.leverageConfig.purchasePeriodMonths === 'number') setPeriodoCompraLocal(simCtx.leverageConfig.purchasePeriodMonths);
      if (typeof simCtx.leverageConfig.dailyPercentage === 'number') setLocalDailyPercentage(simCtx.leverageConfig.dailyPercentage);
      if (typeof simCtx.leverageConfig.managementPercentage === 'number') setLocalManagementPercentage(simCtx.leverageConfig.managementPercentage);
      if (typeof simCtx.leverageConfig.occupancyRate === 'number') setLocalOccupancyRate(simCtx.leverageConfig.occupancyRate);
      if (typeof simCtx.leverageConfig.totalExpenses === 'number') setLocalTotalExpenses(simCtx.leverageConfig.totalExpenses);
    }
  }, []);

  // Buscar alavancas do Supabase ao montar
  useEffect(() => {
    const fetchAlavancas = async () => {
      if (!selectedCompanyId) {
        setAlavancas([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leverages')
          .select('*')
          .eq('company_id', selectedCompanyId)
          .eq('is_archived', false)
          .order('name');
        
        if (error) {
        } else {
          setAlavancas(data || []);
          // Definir Airbnb como padrão se existir
          const airbnbAlavanca = data?.find(a => a.name.toLowerCase().includes('airbnb'));
          if (airbnbAlavanca) {
            setAlavancaSelecionada(airbnbAlavanca.id);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchAlavancas();
  }, [selectedCompanyId]);

  // Buscar dados da alavanca selecionada
  const alavanca = useMemo(() => alavancas.find(a => a.id === alavancaSelecionada), [alavancas, alavancaSelecionada]);

  // Função para calcular o crédito acessado no mês correto (contemplação + período de compra)
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
        const maxEmbeddedPercentage = administrator.maxEmbeddedPercentage ?? 25; // Usar o valor da administradora (mesmo se for 0)
        currentCredit = currentCredit - (currentCredit * maxEmbeddedPercentage / 100);
        embutidoAplicado = true;
      }
      

    }
    
    return currentCredit;
  };

  // Calcular o crédito acessado no mês correto (contemplação + período de compra)
  const mesAquisicaoCalculo = contemplationMonth + periodoCompraLocal;
  const creditoAcessadoCorreto = calculateCreditoAcessado(mesAquisicaoCalculo, product.nominalCreditValue);

  // Valor numérico da alavanca
  const valor = useMemo(() => {
    const clean = valorAlavanca.replace(/\D/g, '');
    return Number(clean) / 100;
  }, [valorAlavanca]);

  // Cálculos conforme regras fornecidas
  // Percentuais tratados como porcentagem - usar valores locais do modal se disponíveis
  const dailyPct = (localDailyPercentage || alavanca?.daily_percentage || 0) / 100;
  const occPct = (localOccupancyRate || alavanca?.occupancy_rate || 0) / 100;
  const mgmtPct = (localManagementPercentage || alavanca?.management_percentage || 0) / 100;
  const totalExpPct = (localTotalExpenses || alavanca?.total_expenses || 0) / 100;
  // Embutido da administradora (usar campo real_estate_percentage se existir, senão mock)
  const embutidoAdmin = (alavanca?.real_estate_percentage ?? 25) / 100;

  const valorDiaria = valor * dailyPct;
  const ocupacaoDias = 30 * occPct;
  // Taxa do Airbnb correta: ((Valor do Imóvel * Percentual da Diária) * Ocupação) * Percentual da Administradora
  const taxaAirbnb = valorDiaria * ocupacaoDias * mgmtPct;
  const custosTotais = valor * totalExpPct;

  // Número de imóveis corrigido: usar creditoAcessadoCorreto (mês contemplação + período de compra)
  const numeroImoveis = valor > 0 ? Math.floor(creditoAcessadoCorreto / valor) : 0; // Corrigido
  const patrimonioNaContemplacao = valor > 0 ? numeroImoveis * valor : 0;

  // Patrimônio ao final (usando valorização mensal equivalente)
  const contemplacaoMes = mesContemplacao > 0 ? mesContemplacao : 60; // fallback 60
  const mesesRestantes = prazoTotal - contemplacaoMes;
  const anosRestantes = Math.floor(mesesRestantes / 12);
  const taxaValorizacaoAnual = 0.06; // 6% ao ano
  
  // Calcular taxa mensal equivalente ao percentual anual
  const taxaMensal = Math.pow(1 + taxaValorizacaoAnual, 1 / 12) - 1;
  
  // Patrimônio ao final (usando valorização mensal equivalente)
  const patrimonioAoFinal = patrimonioNaContemplacao * Math.pow(1 + taxaMensal, prazoTotal - mesContemplacao + 1);
  
  // Ganhos mensais (fórmula corrigida)
  const ganhosMensais = ((patrimonioNaContemplacao * dailyPct * ocupacaoDias) - (patrimonioNaContemplacao * totalExpPct + ((patrimonioNaContemplacao * dailyPct * ocupacaoDias) * mgmtPct)));

  // Lógica para alavancagem escalonada
  const isAlavancagemEscalonada = tipoAlavancagem === 'escalonada';
  
  // Calcular contemplações múltiplas para alavancagem escalonada
  const calcularContemplacoesEscalonadas = () => {
    if (!isAlavancagemEscalonada) return { patrimonioTotal: patrimonioAoFinal, rendaPassiva: ganhosMensais, contemplacoes: [{ mes: mesContemplacao, patrimonio: patrimonioNaContemplacao }] };
    

    
    const contemplacoes = [];
    let mesAtual = mesContemplacao;
    let cotaIndex = 0;
    let cotas = [];
    
    // Calcular quantas contemplações cabem no prazo total
    while (mesAtual <= prazoTotal && cotaIndex < 5) { // Limitar a 5 cotas para evitar muitas contemplações
      contemplacoes.push({ mes: mesAtual });
      
      // Calcular o crédito acessado para esta contemplação específica
      const creditoAcessadoCota = calculateCreditoAcessado(mesAtual, product.nominalCreditValue);
      const numeroImoveisCota = valor > 0 ? Math.floor(creditoAcessadoCota / valor) : 0;
      const patrimonioCota = valor > 0 ? numeroImoveisCota * valor : 0;
      
      // Cada nova contemplação adiciona um novo crédito
      cotas.push({ 
        mesContemplacao: mesAtual, 
        patrimonioInicial: patrimonioCota,
        creditoInicial: creditoAcessadoCota,
        numeroImoveis: numeroImoveisCota
      });
      
      // Próxima contemplação: mês seguinte à aquisição do patrimônio atual
      const mesAquisicaoAtual = mesAtual + periodoCompraLocal;
      const proximoMesContemplacao = mesAquisicaoAtual + 1;
      
      mesAtual = proximoMesContemplacao; // Voltar ao comportamento original
      cotaIndex++;
    }
    
    // Para cada mês, somar patrimônio/rendimentos/fluxo de caixa de todas as cotas já contempladas
    const chartData = [];
    let acumuloCaixa = 0;
    let valorizacaoAcumulada = 0;
    let custoTotalAcumulado = 0;
    let parcelasPagasAcumulado = 0;
    
    for (let mes = 1; mes <= prazoTotal + 1; mes++) {
      let patrimonioMes = 0;
      let ganhosMes = 0;
      let fluxoCaixaMes = 0;
      let valorizacaoMes = 0;
      let parcelaMes = 0;
      let isContemplation = !!contemplacoes.find(c => c.mes === mes);
      
      // Calcular custo total acumulado até este mês (incluindo novos créditos)
      let custoMes = 0;
      cotas.forEach((cota, index) => {
        if (mes >= cota.mesContemplacao) {
          // Adicionar custo inicial do crédito no mês de contemplação
          if (mes === cota.mesContemplacao) {
            custoMes += cota.creditoInicial;
          }
        }
      });
      custoTotalAcumulado += custoMes;
      
      // Lógica do patrimônio: só incrementa após o período de compra
      cotas.forEach((cota, index) => {
        const mesAquisicao = cota.mesContemplacao + periodoCompraLocal;
        if (mes >= mesAquisicao) {
          const mesesDesdeAquisicao = mes - mesAquisicao;
          const patrimonioCota = cota.patrimonioInicial * Math.pow(1 + taxaMensal, mesesDesdeAquisicao);
          patrimonioMes += patrimonioCota;
          
          // Rendimentos desta cota
          const rendimentosCota = ((patrimonioCota * dailyPct * ocupacaoDias) - (patrimonioCota * totalExpPct + ((patrimonioCota * dailyPct * ocupacaoDias) * mgmtPct)));
          ganhosMes += rendimentosCota;
          
          // Fluxo de caixa desta cota
          fluxoCaixaMes += rendimentosCota;
          
          // Valorização desta cota neste mês
          if (mesesDesdeAquisicao > 0) {
            const patrimonioCotaAnterior = cota.patrimonioInicial * Math.pow(1 + taxaMensal, mesesDesdeAquisicao - 1);
            valorizacaoMes += patrimonioCota - patrimonioCotaAnterior;
          }
        }
      });
      
      // Calcular parcelas de todos os créditos ativos
      cotas.forEach(cota => {
        const mesesDesdeContemplacao = mes - cota.mesContemplacao;
        if (mes === cota.mesContemplacao) {
          // Só a nova cota entra com a parcela inicial
          parcelaMes += parcelaInicial;
        } else if (mes > cota.mesContemplacao && mesesDesdeContemplacao < prazoTotal) {
          // Atualização da parcela exatamente no mês (cota.mesContemplacao + 1)
          if (mes === cota.mesContemplacao + 1) {
            parcelaMes += parcelaAfterContemplacao;
          } else {
            const anosDesdeContemplacaoCota = Math.floor((mes - cota.mesContemplacao - 1) / 12);
            const parcelaAtualizada = parcelaAfterContemplacao * Math.pow(1 + taxaValorizacaoAnual, anosDesdeContemplacaoCota);
            parcelaMes += parcelaAtualizada;
          }
        }
      });
      
      // Subtrair parcelas do fluxo de caixa
      fluxoCaixaMes -= parcelaMes;
      
      parcelasPagasAcumulado += parcelaMes;
      valorizacaoAcumulada += valorizacaoMes;
      acumuloCaixa += fluxoCaixaMes;
      
      chartData.push({
        month: mes,
        patrimony: patrimonioMes,
        income: ganhosMes,
        cashFlow: fluxoCaixaMes,
        isContemplation: isContemplation,
        patrimonioInicial: patrimonioMes,
        valorizacaoMes: valorizacaoMes,
        valorizacaoAcumulada: valorizacaoAcumulada,
        acumuloCaixa: acumuloCaixa,
        custoTotalAcumulado: custoTotalAcumulado,
        parcelaMes: parcelaMes,
        parcelasPagas: parcelasPagasAcumulado
      });
    }
    
    // Patrimônio ao final e renda passiva
    const patrimonioTotalFinal = chartData[chartData.length - 1].patrimony;
    const rendaPassivaFinal = chartData[chartData.length - 1].cashFlow;
    
    return { patrimonioTotal: patrimonioTotalFinal, rendaPassiva: rendaPassivaFinal, contemplacoes, chartData };
  };

  // Usar chartData escalonado se aplicável
  const escalonadaResult = calcularContemplacoesEscalonadas();
  const chartData = isAlavancagemEscalonada ? escalonadaResult.chartData : gerarChartDataSimples();
  // Patrimônio ao final: sempre igual ao patrimônio do último mês do gráfico
  const patrimonioFinal = chartData.length > 0 ? chartData[chartData.length - 1].patrimony : 0;
  const rendimentosUltimoMes = isAlavancagemEscalonada ? escalonadaResult.rendaPassiva : ganhosMensais;
  const contemplacoes = isAlavancagemEscalonada ? escalonadaResult.contemplacoes : [{ mes: mesContemplacao, patrimonio: patrimonioNaContemplacao }];

  // Fluxo de Caixa Antes 240 meses
  const fluxoCaixaAntes = ganhosMensais - parcelaAfterContemplacao;

  // Parcela Pós-Contemplação
  const parcelaPosContemplacao = parcelaAfterContemplacao;

  // Renda passiva calculada com base no patrimônio ao final (valorizado) para alavancagem simples
  // Para alavancagem escalonada, usar o fluxo de caixa do último mês do gráfico
  const rendaPassiva = isAlavancagemEscalonada 
    ? (chartData.length > 0 ? chartData[chartData.length - 1].cashFlow : 0)
    : ((patrimonioFinal * dailyPct * ocupacaoDias) - (patrimonioFinal * totalExpPct + ((patrimonioFinal * dailyPct * ocupacaoDias) * mgmtPct)));

  // Fluxo de Caixa Pós 240 meses (agora "Renda passiva" - rendimentos do último mês)
  const rendimentosUltimoMesSimples = ((patrimonioAoFinal * dailyPct * ocupacaoDias) - (patrimonioAoFinal * totalExpPct + ((patrimonioAoFinal * dailyPct * ocupacaoDias) * mgmtPct)));
  const custosFinais = patrimonioAoFinal * totalExpPct;
  const fluxoCaixaApos = rendimentosUltimoMesSimples - custosFinais;

  // Pago do Próprio Bolso
  const pagoProprioBolso = somaParcelasAteContemplacao;

  // Handler para formatação monetária ao digitar
  function handleValorAlavancaChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length < 3) v = v.padStart(3, '0');
    const formatted = formatCurrency(v);
    console.debug('[Sim/Leverage] leverageValue ->', formatted);
    setValorAlavanca(formatted);
  }

  // Função para calcular parcela com atualização anual (mesma lógica da tabela)
  function calcularParcelaComAtualizacao(mes: number, parcelaInicial: number): number {
    if (mes <= 0) {
      return 0;
    }
    
    // Calcular quantos anos se passaram desde o início
    const anosDesdeInicio = Math.floor((mes - 1) / 12);
    
    // Aplicar atualização anual (6% ao ano)
    const parcelaAtualizada = parcelaInicial * Math.pow(1 + taxaValorizacaoAnual, anosDesdeInicio);
    
    return parcelaAtualizada;
  }

  // Função para calcular parcela pós-contemplação com atualização anual
  function calcularParcelaPosContemplacao(mes: number): number {
    if (mes <= mesContemplacao || mes > prazoTotal) {
      return 0;
    }
    
    // Calcular quantos anos se passaram desde a contemplação
    const anosDesdeContemplacao = Math.floor((mes - mesContemplacao - 1) / 12);
    
    // Usar parcelaAfterContemplacao como base (valor da tabela) e aplicar atualização anual
    const parcelaAtualizada = parcelaAfterContemplacao * Math.pow(1 + taxaValorizacaoAnual, anosDesdeContemplacao);
    
    return parcelaAtualizada;
  }

  // Função para gerar chartData no modo simples
  function gerarChartDataSimples() {
    const chartData = [];
    let patrimonio = 0;
    let rendimentoMensal = 0;
    let fluxoCaixaMensal = 0;
    let acumuloCaixa = 0;
    let valorizacaoAcumulada = 0;
    let parcelasPagasAcumulado = 0; // Inicializar em 0 e acumular mês a mês
    let saldoDevedor = 0;
    let valorParcelaFixo = 0;
    // Gerar array de parcelas idêntico ao da tabela, usando os mesmos parâmetros dinâmicos
    const parcelasTabela = generateConsortiumInstallments({
      product,
      administrator,
      contemplationMonth,
      selectedCredits,
      creditoAcessado,
      embutido,
      installmentType,
      customAdminTaxPercent,
      customReserveFundPercent,
      customAnnualUpdateRate,
      maxEmbeddedPercentage,
      specialEntryEnabled: simCtx.specialEntryEnabled
    });
    for (let mes = 1; mes <= prazoTotal + 1; mes++) {
      let ganhos = 0;
      let fluxoCaixa = 0;
      let valorizacaoMes = 0;
      // Parcela do mês: usar exatamente o valor da tabela
      const parcelaMes = parcelasTabela[mes - 1]?.valorParcela || 0;
      // --- Ajuste do mês da casinha ---
      const isAquisicao = mes === mesContemplacao + periodoCompraLocal;
      // Atualização anual: meses 13, 25, 37, ...
      const isAnnualUpdate = (mes - 1) % 12 === 0 && mes > 1;
      // Antes da contemplação
      if (mes <= mesContemplacao) {
        // Atualizar crédito anualmente
        if (mes === 1) {
          saldoDevedor = patrimonioNaContemplacao; // ou valor do crédito inicial
        }
        if (isAnnualUpdate) {
          saldoDevedor = saldoDevedor * (1 + taxaValorizacaoAnual);
        }
        // parcelaMes = saldoDevedor / prazoTotal; // Removido
        patrimonio = 0;
        ganhos = 0;
        fluxoCaixa = 0;
        valorizacaoMes = 0;
      } else {
        // Após contemplação
        // Atualização anual sobre saldo devedor
        const parcelasPagas = mes - 1;
        const prazoRestante = prazoTotal - (mes - 1);
        if (mes === mesContemplacao + 1) {
          // Primeiro mês após contemplação: saldo devedor inicial
          // saldoDevedor já vem do mês anterior
          // parcelaMes = saldoDevedor / prazoRestante; // Removido
          valorParcelaFixo = parcelaMes;
        } else if (isAnnualUpdate) {
          saldoDevedor = saldoDevedor * (1 + taxaValorizacaoAnual);
          // parcelaMes = saldoDevedor / prazoRestante; // Removido
          valorParcelaFixo = parcelaMes;
        } else {
          // parcelaMes = valorParcelaFixo; // Removido
        }
        // Patrimônio só é adquirido no mês correto
        if (mes < mesContemplacao + periodoCompraLocal) {
          patrimonio = 0;
          ganhos = 0;
          fluxoCaixa = 0;
          valorizacaoMes = 0;
        } else if (mes === mesContemplacao + periodoCompraLocal) {
          patrimonio = patrimonioNaContemplacao;
          rendimentoMensal = ((patrimonio * dailyPct * ocupacaoDias) - (patrimonio * totalExpPct + ((patrimonio * dailyPct * ocupacaoDias) * mgmtPct)));
          ganhos = rendimentoMensal;
          fluxoCaixaMensal = rendimentoMensal - parcelaMes;
          fluxoCaixa = fluxoCaixaMensal;
          valorizacaoMes = 0;
        } else {
          const patrimonioAnterior = patrimonio;
          patrimonio = patrimonio * (1 + taxaMensal);
          valorizacaoMes = patrimonio - patrimonioAnterior;
          valorizacaoAcumulada += valorizacaoMes;
          rendimentoMensal = ((patrimonio * dailyPct * ocupacaoDias) - (patrimonio * totalExpPct + ((patrimonio * dailyPct * ocupacaoDias) * mgmtPct)));
          ganhos = rendimentoMensal;
          if (mes > prazoTotal) {
            fluxoCaixaMensal = rendimentoMensal;
          } else {
            fluxoCaixaMensal = rendimentoMensal - parcelaMes;
          }
          fluxoCaixa = fluxoCaixaMensal;
        }
      }
      parcelasPagasAcumulado += parcelaMes;
      acumuloCaixa += fluxoCaixa;
      // Novo campo: parcelaTabelaMes, igual ao valor da tabela
      const parcelaTabelaMes = parcelasTabela[mes - 1]?.installmentValue || 0;
      
      chartData.push({
        month: mes,
        patrimony: patrimonio,
        income: ganhos,
        cashFlow: fluxoCaixa,
        isContemplation: isAquisicao,
        patrimonioInicial: patrimonioNaContemplacao,
        valorizacaoMes: valorizacaoMes,
        valorizacaoAcumulada: valorizacaoAcumulada,
        acumuloCaixa: acumuloCaixa,
        // parcelaMes: parcelaMes, // REMOVER campo antigo
        parcelaTabelaMes: parcelaTabelaMes, // NOVO campo
        parcelasPagas: parcelasPagasAcumulado
      });
    }
    return chartData;
  }

  // Pegar o acúmulo de caixa do último mês do gráfico
  const acumuloCaixaFinal = chartData.length > 0 ? chartData[chartData.length - 1].acumuloCaixa : 0;

  // Pago do Próprio Bolso (% do patrimônio inicial) - Ajustado para considerar acúmulo de caixa
  const pagoProprioBolsoPercent = patrimonioNaContemplacao > 0 ? ((pagoProprioBolso - acumuloCaixaFinal) / patrimonioNaContemplacao) * 100 : 0;
  // Pago pelo Inquilino (% do patrimônio inicial)
  const pagoPeloInquilinoPercent = patrimonioNaContemplacao > 0 ? ((patrimonioNaContemplacao - (pagoProprioBolso - acumuloCaixaFinal)) / patrimonioNaContemplacao) * 100 : 0;

  // Cálculo dos novos campos de resultado
  // Investimento: soma das parcelas até o mês da aquisição do patrimônio / Patrimônio na Contemplação
  const mesAquisicao = mesContemplacao + periodoCompraLocal;
  const investimentoNumerador = chartData && chartData.length > 0 ? chartData.filter(row => row.month <= mesAquisicao).reduce((acc, row) => acc + (row.parcelaTabelaMes || 0), 0) : 0;
  const investimentoDenominador = patrimonioNaContemplacao || 1;
  const investimento = investimentoNumerador / investimentoDenominador;

  // Corrigir: pegar o fluxo de caixa do maior mês do gráfico
  const ultimoMes = chartData && chartData.length > 0 ? Math.max(...chartData.map(row => row.month ?? row.mes ?? 0)) : 0;
  const fluxoCaixaUltimoMes = chartData && chartData.length > 0 ? (chartData.find(row => (row.month ?? row.mes ?? 0) === ultimoMes)?.fluxoCaixa || 0) : 0;
  const pagoPeloInquilino = ((patrimonioNaContemplacao - investimentoNumerador) + fluxoCaixaUltimoMes) / investimentoDenominador;

  // Atualizar gráficos instantaneamente ao mudar valorAlavanca
  useEffect(() => {
    // Forçar atualização dos gráficos ao mudar valorAlavanca
    setChartDataState([]); // Limpa para garantir atualização
    setInstallmentsChartData([]);
  }, [valorAlavanca]);

  // Atualizar cálculos sempre que campos do modal mudarem
  useEffect(() => {
    // Forçar atualização dos gráficos e resultados
    setChartDataState([]);
    setInstallmentsChartData([]);
  }, [localDailyPercentage, localManagementPercentage, localOccupancyRate, localTotalExpenses]);

  // Função utilitária para salvar no contexto
  const persistInContext = () => {
    simCtx.setLeverageConfig({
      selectedLeverageId: alavancaSelecionada,
      leverageValue: valorAlavanca,
      leverageType: tipoAlavancagem as 'simples' | 'escalonada',
      purchasePeriodMonths: periodoCompraLocal,
      dailyPercentage: localDailyPercentage,
      managementPercentage: localManagementPercentage,
      occupancyRate: localOccupancyRate,
      totalExpenses: localTotalExpenses,
    });
  };

  return (
    <div className="space-y-8">
      {/* Seção unificada - Alavancagem patrimonial */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alavancagem patrimonial</CardTitle>
          <Button variant="ghost" size="icon" title="Configurações de alavancagem" onClick={() => { console.debug('[Sim/Leverage] abrir modal alavancagem'); setShowAlavancagemModal(true); }}>
            <Settings size={20} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Selecione a alavancagem</label>
            <Select value={alavancaSelecionada} onValueChange={(val) => { console.debug('[Sim/Leverage] selectedLeverageId ->', val); setAlavancaSelecionada(val); }} disabled={loading || alavancas.length === 0}>
              <SelectTrigger className="brand-radius select-trigger-brand">
                <SelectValue placeholder={loading ? 'Carregando...' : 'Escolha uma alavanca'} />
              </SelectTrigger>
              <SelectContent>
                {alavancas.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className="dropdown-item-brand">{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor da alavanca</label>
            <Input type="text" value={valorAlavanca} onChange={handleValorAlavancaChange} placeholder="R$ 0,00" inputMode="numeric" className="brand-radius field-secondary-focus no-ring-focus" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de alavancagem</label>
            <Select value={tipoAlavancagem} onValueChange={(val) => { console.debug('[Sim/Leverage] leverageType ->', val); setTipoAlavancagem(val); }}>
              <SelectTrigger className="w-full brand-radius select-trigger-brand">
                <SelectValue placeholder="Selecione o tipo de alavancagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples" className="dropdown-item-brand">Alavancagem simples</SelectItem>
                <SelectItem value="escalonada" disabled className="text-gray-400 cursor-not-allowed">Alavancagem escalonada (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Período de Compra (meses)</label>
            <Input
              type="number"
              min={1}
              value={periodoCompraLocal}
              onChange={e => { const num = Number(e.target.value); console.debug('[Sim/Leverage] purchasePeriodMonths ->', num); setPeriodoCompraLocal(num); }}
              className="w-full brand-radius field-secondary-focus no-ring-focus"
            />
            {tipoAlavancagem === 'escalonada' && (
              <div className="text-xs text-gray-500 mt-1">
                Intervalo entre contemplações: {mesContemplacao} + {periodoCompraLocal} = {intervaloContemplacaoLocal} meses
              </div>
            )}
          </div>
          </div>

          {/* Informações da alavanca */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>Valor da diária: <span className="font-bold">{valorDiaria ? valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>{numeroImoveis > 1 && <span className="ml-2 text-xs text-gray-400">({(valorDiaria * numeroImoveis).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>}</div>
          <div>Ocupação: <span className="font-bold">{ocupacaoDias ? `${ocupacaoDias} dias` : '-'}</span></div>
            <div>Taxa do Airbnb: <span className="font-bold">{taxaAirbnb ? taxaAirbnb.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>{numeroImoveis > 1 && <span className="ml-2 text-xs text-gray-400">({(taxaAirbnb * numeroImoveis).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>}</div>
            <div>Custos totais: <span className="font-bold">{custosTotais ? custosTotais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>{numeroImoveis > 1 && <span className="ml-2 text-xs text-gray-400">({(custosTotais * numeroImoveis).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>}</div>
            <div>Ganhos mensais: <span className="font-bold">{ganhosMensais ? ganhosMensais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>{numeroImoveis > 1 && <span className="ml-2 text-xs text-gray-400">({(ganhosMensais * numeroImoveis).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>}</div>
          <div>Número de imóveis: <span className="font-bold">{numeroImoveis}</span></div>
          </div>

          {/* Resultados */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resultados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Patrimônio na Contemplação</Label>
                <div className="text-2xl font-bold text-blue-900 dark:text-white">
                  {patrimonioNaContemplacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              
              <div className="space-y-2 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Parcela Pós-Contemplação</Label>
                <div className="text-2xl font-bold text-green-900 dark:text-white">
                  {parcelaPosContemplacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              
              <div className="space-y-2 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Ganhos Mensais</Label>
                <div className="text-2xl font-bold text-purple-900 dark:text-white">
                  {rendimentosUltimoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              
              <div className="space-y-2 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Fluxo de Caixa</Label>
                <div className="text-2xl font-bold text-orange-900 dark:text-white">
                  {fluxoCaixaAntes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              
              <div className="space-y-2 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Patrimônio final</Label>
                <div className="text-2xl font-bold text-indigo-900 dark:text-white">
                  {patrimonioFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </div>
              </div>
              
              <div className="space-y-2 p-4 bg-gradient-to-r from-teal-50 to-teal-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Renda passiva</Label>
                <div className="text-2xl font-bold text-teal-900 dark:text-white">
                  {rendaPassiva.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-2 p-4 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                    <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Investimento</Label>
                    <div className="text-2xl font-bold text-pink-900 dark:text-white">
                      {(investimento * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Investimento total: {investimentoNumerador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="space-y-2 p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-[#1F1F1F] dark:to-[#161616] rounded-lg border brand-radius" style={{ borderColor: 'var(--brand-secondary)' }}>
                    <Label className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Pago pelo inquilino</Label>
                    <div className="text-2xl font-bold text-amber-900 dark:text-white">
                      {(pagoPeloInquilino * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valor pago pelo inquilino: {(patrimonioNaContemplacao - investimentoNumerador).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Gráfico Evolução Patrimonial */}
          <div className="mt-6 overflow-x-auto lg:overflow-x-visible">
            <div className="min-w-[980px] h-96">
              <InstallmentsChart data={installmentsChartData} showLegend={true} />
            </div>
          </div>
        </CardContent>
      </Card>
      <DetailTable
        key={valorAlavanca}
        product={{ ...product, nominalCreditValue: valor }}
        administrator={administrator}
        contemplationMonth={contemplationMonth}
        selectedCredits={selectedCredits}
        creditoAcessado={creditoAcessado}
        embutido={embutido as 'com' | 'sem'}
        installmentType={installmentType}
        customAdminTaxPercent={customAdminTaxPercent}
        customReserveFundPercent={customReserveFundPercent}
        customAnnualUpdateRate={customAnnualUpdateRate}
        agioPercent={agioPercent}
        periodoCompra={periodoCompraLocal}
        valorAlavancaNum={valor}
        specialEntryEnabled={simCtx.specialEntryEnabled}
        onTableDataGenerated={(tableData) => {
          // Se for alavancagem escalonada, usar os dados calculados pela função escalonada
          if (isAlavancagemEscalonada) {
            const escalonadaResult = calcularContemplacoesEscalonadas();
            // Converter o formato dos dados para ser compatível com InstallmentsChart
            const chartDataFormatted = escalonadaResult.chartData.map(item => ({
              mes: item.month,
              valorParcela: item.parcelaMes || 0,
              somaParcelas: item.parcelasPagas || 0,
              patrimonio: item.patrimony || 0,
              patrimonioAnual: item.patrimony || 0, // Usar patrimony como patrimonioAnual
              receitaMes: item.income || 0,
              receitaMenosCustos: item.income || 0, // Usar income como receitaMenosCustos
              custos: 0, // Será calculado no tooltip
              rendaPassiva: item.cashFlow || 0,
              rendaPassivaAcumulada: item.acumuloCaixa || 0,
              fluxoCaixa: item.cashFlow || 0,
              patrimonioNaContemplacao: patrimonioNaContemplacao,
              valorAlavancaNum: valor
            }));
            setInstallmentsChartData(chartDataFormatted);
            return;
          }
          
          // Para alavancagem simples, usar a lógica original
          setChartDataState(tableData.map(row => ({ ...row, month: row.mes, parcelaTabelaMes: row.valorParcela })));
          // Montar dados para o novo gráfico
          let soma = 0;
          let somaParcelas = 0;
          let rendaPassivaAcumulada = 0;
          const patrimonioInicial = patrimonioNaContemplacao;
          const mesInicioPatrimonio = mesContemplacao + periodoCompraLocal;
          const taxaMensal = Math.pow(1 + 0.06, 1 / 12) - 1;
          const taxaAnual = 0.06;
          let patrimonioAnual = 0;
          let patrimonioMensal = 0;
          let receitaMenosCustosAcumulada = 0;
          const chartData = [];
          for (let i = 0; i < tableData.length; i++) {
            const row = tableData[i];
            soma += row.valorParcela;
            somaParcelas += row.valorParcela;
            // Patrimônio (anual)
            if (row.mes < mesInicioPatrimonio) {
              patrimonioAnual = 0;
            } else if (row.mes === mesInicioPatrimonio) {
              patrimonioAnual = patrimonioInicial;
            } else if (row.mes > mesInicioPatrimonio) {
              const mesesDesdeInicio = row.mes - mesInicioPatrimonio;
              if (mesesDesdeInicio > 0 && mesesDesdeInicio % 12 === 0) {
                patrimonioAnual = patrimonioAnual * (1 + taxaAnual);
              }
            }
            // Patrimônio (mensal)
            if (row.mes < mesInicioPatrimonio) {
              patrimonioMensal = 0;
            } else if (row.mes === mesInicioPatrimonio) {
              patrimonioMensal = patrimonioInicial;
            } else if (row.mes > mesInicioPatrimonio) {
              patrimonioMensal = patrimonioMensal * (1 + taxaMensal);
            }
            // Parâmetros para cálculo - usar valores locais do modal se disponíveis
            const percentualDiaria = (localDailyPercentage || alavanca?.daily_percentage || 0) / 100;
            const taxaOcupacao = (localOccupancyRate || alavanca?.occupancy_rate || 0) / 100;
            const despesasTotais = (localTotalExpenses || alavanca?.total_expenses || 0) / 100;
            const percentualAdmin = (localManagementPercentage || alavanca?.management_percentage || 0) / 100;
            // Receita do mês
            const receitaMes = patrimonioAnual * percentualDiaria * (30 * taxaOcupacao);
            // Custos
            const custos = (patrimonioAnual * despesasTotais) + (patrimonioAnual * percentualDiaria * (30 * taxaOcupacao) * percentualAdmin);
            // Receita - Custos
            const receitaMenosCustos = receitaMes - custos;
            // Renda passiva e acumulada só após aquisição do patrimônio
            let rendaPassiva = 0;
            if (row.mes >= mesInicioPatrimonio) {
              rendaPassiva = receitaMes - (custos + row.valorParcela);
            }
            if (row.mes < mesInicioPatrimonio) {
              rendaPassivaAcumulada = 0;
            } else {
              rendaPassivaAcumulada += rendaPassiva;
            }
            receitaMenosCustosAcumulada += receitaMenosCustos;
            // Fluxo de caixa: soma acumulada de Receita - Custos menos soma das parcelas
            const fluxoCaixa = receitaMenosCustosAcumulada - somaParcelas;
            chartData.push({
              ...row,
              month: row.mes,
              parcelaTabelaMes: row.valorParcela,
              somaParcelas: soma,
              patrimonio: patrimonioMensal, // já existente
              patrimonioAnual,
              receitaMes,
              receitaMenosCustos,
              custos,
              rendaPassiva,
              rendaPassivaAcumulada,
              fluxoCaixa,
              patrimonioNaContemplacao,
              valorAlavancaNum: valor,
            });
          }
          if (tableData.length < prazoTotal + 1) {
            for (let m = tableData.length + 1; m <= prazoTotal + 1; m++) {
              if (m < mesInicioPatrimonio) {
                patrimonioAnual = 0;
                patrimonioMensal = 0;
              } else if (m === mesInicioPatrimonio) {
                patrimonioAnual = patrimonioInicial;
                patrimonioMensal = patrimonioInicial;
              } else if (m > mesInicioPatrimonio) {
                patrimonioMensal = patrimonioMensal * (1 + taxaMensal);
                const mesesDesdeInicio = m - mesInicioPatrimonio;
                if (mesesDesdeInicio > 0 && mesesDesdeInicio % 12 === 0) {
                  patrimonioAnual = patrimonioAnual * (1 + taxaAnual);
                }
              }
              // Parâmetros para cálculo - usar valores locais do modal se disponíveis
              const percentualDiaria = (localDailyPercentage || alavanca?.daily_percentage || 0) / 100;
              const taxaOcupacao = (localOccupancyRate || alavanca?.occupancy_rate || 0) / 100;
              const despesasTotais = (localTotalExpenses || alavanca?.total_expenses || 0) / 100;
              const percentualAdmin = (localManagementPercentage || alavanca?.management_percentage || 0) / 100;
              // Receita do mês
              const receitaMes = patrimonioAnual * percentualDiaria * (30 * taxaOcupacao);
              // Custos
              const custos = (patrimonioAnual * despesasTotais) + (patrimonioAnual * percentualDiaria * (30 * taxaOcupacao) * percentualAdmin);
              // Receita - Custos
              const receitaMenosCustos = receitaMes - custos;
              // Renda passiva e acumulada só após aquisição do patrimônio
              let rendaPassiva = 0;
              if (m >= mesInicioPatrimonio) {
                rendaPassiva = receitaMes - custos;
              }
              if (m < mesInicioPatrimonio) {
                rendaPassivaAcumulada = 0;
              } else {
                rendaPassivaAcumulada += rendaPassiva;
              }
              receitaMenosCustosAcumulada += receitaMenosCustos;
              // Fluxo de caixa: soma acumulada de Receita - Custos menos soma das parcelas
              const fluxoCaixa = receitaMenosCustosAcumulada - somaParcelas;
              chartData.push({
                mes: m,
                valorParcela: 0,
                somaParcelas: soma,
                patrimonio: patrimonioMensal,
                patrimonioAnual,
                receitaMes,
                receitaMenosCustos,
                custos,
                rendaPassiva,
                rendaPassivaAcumulada,
                fluxoCaixa,
                patrimonioNaContemplacao,
                valorAlavancaNum: valor,
              });
            }
          }
          setInstallmentsChartData(chartData);
        }}
      />
      <FullScreenModal
        isOpen={showAlavancagemModal}
        onClose={() => setShowAlavancagemModal(false)}
        title="Configurações de Alavancagem"
        actions={
          <Button onClick={() => {
            // Aplicar os valores locais nos cálculos principais
            if (alavanca) {
              alavanca.daily_percentage = localDailyPercentage;
              alavanca.management_percentage = localManagementPercentage;
              alavanca.occupancy_rate = localOccupancyRate;
              alavanca.total_expenses = localTotalExpenses;
            }
            console.debug('[Sim/Leverage/Modal] salvar ->', { alavancaSelecionada, valorAlavanca, tipoAlavancagem, periodoCompraLocal, localDailyPercentage, localManagementPercentage, localOccupancyRate, localTotalExpenses });
            // Persistir no contexto global
            persistInContext();
            setShowAlavancagemModal(false);
          }} variant="brandPrimaryToSecondary" className="brand-radius">
            Salvar
          </Button>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Selecione a alavancagem</label>
            <Select value={alavancaSelecionada} onValueChange={(val) => { console.debug('[Sim/Leverage/Modal] selectedLeverageId ->', val); setAlavancaSelecionada(val); }} disabled={loading || alavancas.length === 0}>
              <SelectTrigger className="brand-radius select-trigger-brand">
                <SelectValue placeholder={loading ? 'Carregando...' : 'Escolha uma alavanca'} />
              </SelectTrigger>
              <SelectContent>
                {alavancas.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className="dropdown-item-brand">{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor da alavanca</label>
            <Input type="text" value={valorAlavanca} onChange={handleValorAlavancaChange} placeholder="R$ 0,00" inputMode="numeric" className="brand-radius field-secondary-focus no-ring-focus" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de alavancagem</label>
            <Select value={tipoAlavancagem} onValueChange={(val) => { console.debug('[Sim/Leverage/Modal] leverageType ->', val); setTipoAlavancagem(val); }}>
              <SelectTrigger className="w-full brand-radius select-trigger-brand">
                <SelectValue placeholder="Selecione o tipo de alavancagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples" className="dropdown-item-brand">Alavancagem simples</SelectItem>
                <SelectItem value="escalonada" className="dropdown-item-brand">Alavancagem escalonada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Período de Compra (meses)</label>
            <Input
              type="number"
              min={1}
              value={periodoCompraLocal}
              onChange={e => { const num = Number(e.target.value); console.debug('[Sim/Leverage/Modal] purchasePeriodMonths ->', num); setPeriodoCompraLocal(num); }}
              className="w-full brand-radius field-secondary-focus no-ring-focus"
            />
          </div>
          
          {/* Novos campos de configuração da alavanca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Percentual da Diária (%)</label>
              <Input
                type="number"
                value={localDailyPercentage}
                onChange={(e) => { const num = Number(e.target.value); console.debug('[Sim/Leverage/Modal] dailyPercentage ->', num); setLocalDailyPercentage(num); }}
                placeholder="0,00"
                min={0}
                max={100}
                step={0.01}
                className="w-full brand-radius field-secondary-focus no-ring-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Percentual da Administradora (%)</label>
              <Input
                type="number"
                value={localManagementPercentage}
                onChange={(e) => { const num = Number(e.target.value); console.debug('[Sim/Leverage/Modal] managementPercentage ->', num); setLocalManagementPercentage(num); }}
                placeholder="0,00"
                min={0}
                max={100}
                step={0.01}
                className="w-full brand-radius field-secondary-focus no-ring-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Taxa de Ocupação (%)</label>
              <Input
                type="number"
                value={localOccupancyRate}
                onChange={(e) => { const num = Number(e.target.value); console.debug('[Sim/Leverage/Modal] occupancyRate ->', num); setLocalOccupancyRate(num); }}
                placeholder="0,00"
                min={0}
                max={100}
                step={0.01}
                className="w-full brand-radius field-secondary-focus no-ring-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor das Despesas Totais (%)</label>
              <Input
                type="number"
                value={localTotalExpenses}
                onChange={(e) => { const num = Number(e.target.value); console.debug('[Sim/Leverage/Modal] totalExpenses ->', num); setLocalTotalExpenses(num); }}
                placeholder="0,00"
                min={0}
                max={100}
                step={0.01}
                className="w-full brand-radius field-secondary-focus no-ring-focus"
              />
            </div>
          </div>
        </div>
      </FullScreenModal>
    </div>
  );
}; 