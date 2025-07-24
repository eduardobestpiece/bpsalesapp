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
  creditoAcessadoContemplacao = 0, 
  parcelaAfterContemplacao = 0, 
  somaParcelasAteContemplacao = 0, 
  mesContemplacao = 0,
  parcelaInicial = 0,
  prazoTotal = 240
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
  creditoAcessadoContemplacao: number, 
  parcelaAfterContemplacao: number, 
  somaParcelasAteContemplacao: number, 
  mesContemplacao: number,
  parcelaInicial: number,
  prazoTotal: number
}) => {
  // Estados dos filtros
  const [alavancas, setAlavancas] = useState<Leverage[]>([]);
  const [alavancaSelecionada, setAlavancaSelecionada] = useState<string>('');
  const [valorAlavanca, setValorAlavanca] = useState<string>('R$ 500.000,00');
  const [tipoAlavancagem, setTipoAlavancagem] = useState('simples');
  const [loading, setLoading] = useState(false);
  const [periodoCompra, setPeriodoCompra] = useState<number>(1);
  // Novo: intervalo entre contemplações (em meses)
  // Usar o valor do mês de contemplação como intervalo
  const intervaloContemplacao = mesContemplacao;
  const [chartDataState, setChartDataState] = useState<any[]>([]);
  const [installmentsChartData, setInstallmentsChartData] = useState<any[]>([]);
  const [showLegend, setShowLegend] = useState(false);

  // Buscar alavancas do Supabase ao montar
  useEffect(() => {
    const fetchAlavancas = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leverages')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Erro ao buscar alavancas:', error);
        } else {
          setAlavancas(data || []);
          // Definir Airbnb como padrão se existir
          const airbnbAlavanca = data?.find(a => a.name.toLowerCase().includes('airbnb'));
          if (airbnbAlavanca) {
            setAlavancaSelecionada(airbnbAlavanca.id);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar alavancas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlavancas();
  }, []);

  // Buscar dados da alavanca selecionada
  const alavanca = useMemo(() => alavancas.find(a => a.id === alavancaSelecionada), [alavancas, alavancaSelecionada]);

  // Valor numérico da alavanca
  const valor = useMemo(() => {
    const clean = valorAlavanca.replace(/\D/g, '');
    return Number(clean) / 100;
  }, [valorAlavanca]);

  // Cálculos conforme regras fornecidas
  // Percentuais tratados como porcentagem
  const dailyPct = (alavanca?.daily_percentage || 0) / 100;
  const occPct = (alavanca?.occupancy_rate || 0) / 100;
  const mgmtPct = (alavanca?.management_percentage || 0) / 100;
  const totalExpPct = (alavanca?.total_expenses || 0) / 100;
  // Embutido da administradora (usar campo real_estate_percentage se existir, senão mock)
  const embutidoAdmin = (alavanca?.real_estate_percentage ?? 25) / 100;

  const valorDiaria = valor * dailyPct;
  const ocupacaoDias = 30 * occPct;
  // Taxa do Airbnb correta: ((Valor do Imóvel * Percentual da Diária) * Ocupação) * Percentual da Administradora
  const taxaAirbnb = valorDiaria * ocupacaoDias * mgmtPct;
  const custosTotais = valor * totalExpPct;

  // Número de imóveis corrigido: usar creditoAcessadoContemplacao
  const numeroImoveis = valor > 0 ? Math.floor(creditoAcessadoContemplacao / valor) : 0; // Corrigido
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
    
    while (mesAtual <= prazoTotal && cotaIndex < 5) { // Limitar a 5 cotas para evitar muitas contemplações
      contemplacoes.push({ mes: mesAtual });
      // Cada nova contemplação adiciona um novo crédito com o mesmo valor inicial
      cotas.push({ 
        mesContemplacao: mesAtual, 
        patrimonioInicial: patrimonioNaContemplacao,
        creditoInicial: creditoAcessadoContemplacao // Valor do crédito inicial
      });
      mesAtual += intervaloContemplacao;
      cotaIndex++;
    }
    
    // Para cada mês, somar patrimônio/rendimentos/fluxo de caixa de todas as cotas já contempladas
    const chartData = [];
    let acumuloCaixa = 0;
    let valorizacaoAcumulada = 0;
    let custoTotalAcumulado = 0; // Custo total acumulado de todos os créditos
    let parcelasPagasAcumulado = 0; // Parcelas pagas acumuladas (inicializar em 0)
    
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
      cotas.forEach(cota => {
        const mesAquisicao = cota.mesContemplacao + periodoCompra;
        if (mes >= mesAquisicao) {
          const mesesDesdeAquisicao = mes - mesAquisicao;
          const patrimonioCota = cota.patrimonioInicial * Math.pow(1 + taxaMensal, mesesDesdeAquisicao);
          patrimonioMes += patrimonioCota;
          // Rendimentos desta cota
          const rendimentosCota = ((patrimonioCota * dailyPct * ocupacaoDias) - (patrimonioCota * totalExpPct + ((patrimonioCota * dailyPct * ocupacaoDias) * mgmtPct)));
          ganhosMes += rendimentosCota;
          // Fluxo de caixa desta cota
          if (mesesDesdeAquisicao < prazoTotal) {
            fluxoCaixaMes += rendimentosCota - parcelaMes;
          } else {
            fluxoCaixaMes += rendimentosCota;
          }
          // Valorização desta cota neste mês
          if (mesesDesdeAquisicao > 0) {
            const patrimonioCotaAnterior = cota.patrimonioInicial * Math.pow(1 + taxaMensal, mesesDesdeAquisicao - 1);
            valorizacaoMes += patrimonioCota - patrimonioCotaAnterior;
          }
        }
      });
      // Calcular parcelas de todos os créditos ativos
      parcelaMes = 0;
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
            parcelaMes += parcelaAfterContemplacao * Math.pow(1 + taxaValorizacaoAnual, anosDesdeContemplacaoCota);
          }
        }
      });
      
      parcelasPagasAcumulado += parcelaMes;
      valorizacaoAcumulada += valorizacaoMes;
      acumuloCaixa += fluxoCaixaMes;
      chartData.push({
        month: mes,
        patrimony: patrimonioMes,
        income: ganhosMes,
        cashFlow: fluxoCaixaMes,
        isContemplation: isContemplation,
        patrimonioInicial: patrimonioNaContemplacao,
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
    const rendaPassivaFinal = chartData[chartData.length - 1].cashFlow; // Usar fluxo de caixa como renda passiva
    return { patrimonioTotal: patrimonioTotalFinal, rendaPassiva: rendaPassivaFinal, contemplacoes, chartData };
  };

  // Usar chartData escalonado se aplicável
  const escalonadaResult = calcularContemplacoesEscalonadas();
  const patrimonioFinal = isAlavancagemEscalonada ? escalonadaResult.patrimonioTotal : patrimonioAoFinal;
  const rendimentosUltimoMes = isAlavancagemEscalonada ? escalonadaResult.rendaPassiva : ganhosMensais;
  const contemplacoes = isAlavancagemEscalonada ? escalonadaResult.contemplacoes : [{ mes: mesContemplacao, patrimonio: patrimonioNaContemplacao }];
  const chartData = isAlavancagemEscalonada ? escalonadaResult.chartData : gerarChartDataSimples();

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

  // Pago pelo Inquilino (placeholder, pois depende do prazo e lógica de ganhos mensais após contemplação)
  const pagoPeloInquilino = 0; // Implementar lógica se necessário

  // Handler para formatação monetária ao digitar
  function handleValorAlavancaChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length < 3) v = v.padStart(3, '0');
    setValorAlavanca(formatCurrency(v));
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
      maxEmbeddedPercentage
    });
    for (let mes = 1; mes <= prazoTotal + 1; mes++) {
      let ganhos = 0;
      let fluxoCaixa = 0;
      let valorizacaoMes = 0;
      // Parcela do mês: usar exatamente o valor da tabela
      const parcelaMes = parcelasTabela[mes - 1]?.valorParcela || 0;
      // --- Ajuste do mês da casinha ---
      const isAquisicao = mes === mesContemplacao + periodoCompra;
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
        if (mes < mesContemplacao + periodoCompra) {
          patrimonio = 0;
          ganhos = 0;
          fluxoCaixa = 0;
          valorizacaoMes = 0;
        } else if (mes === mesContemplacao + periodoCompra) {
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

  return (
    <div className="space-y-8">
      {/* Primeira seção - Filtros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filtros da Nova Alavancagem Patrimonial</CardTitle>
          <Button variant="ghost" size="icon" title="Detalhamento de alavancagem">
            <Settings size={20} />
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Selecione a alavancagem</label>
            <Select value={alavancaSelecionada} onValueChange={setAlavancaSelecionada} disabled={loading || alavancas.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Carregando...' : 'Escolha uma alavanca'} />
              </SelectTrigger>
              <SelectContent>
                {alavancas.map(opt => (
                  <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Valor da alavanca</label>
            <Input type="text" value={valorAlavanca} onChange={handleValorAlavancaChange} placeholder="R$ 0,00" inputMode="numeric" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de alavancagem</label>
            <Select value={tipoAlavancagem} onValueChange={setTipoAlavancagem}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tipo de alavancagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Alavancagem simples</SelectItem>
                <SelectItem value="escalonada" disabled style={{ color: '#aaa', cursor: 'not-allowed' }}>Alavancagem escalonada (em breve)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Período de Compra (meses)</label>
            <Input
              type="number"
              min={1}
              value={periodoCompra}
              onChange={e => setPeriodoCompra(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Segunda seção - Informações da alavanca */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Alavanca</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>Valor da diária: <span className="font-bold">{valorDiaria ? valorDiaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></div>
          <div>Ocupação: <span className="font-bold">{ocupacaoDias ? `${ocupacaoDias} dias` : '-'}</span></div>
          <div>Taxa do Airbnb: <span className="font-bold">{taxaAirbnb ? taxaAirbnb.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></div>
          <div>Custos totais: <span className="font-bold">{custosTotais ? custosTotais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></div>
          <div>Ganhos mensais: <span className="font-bold">{ganhosMensais ? ganhosMensais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></div>
          <div>Número de imóveis: <span className="font-bold">{numeroImoveis}</span></div>
        </CardContent>
      </Card>

      {/* Terceira seção - Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Card className="bg-muted border-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Patrimônio na Contemplação</div>
                <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{patrimonioNaContemplacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted border-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Patrimônio ao final</div>
                <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{patrimonioFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted border-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Ganhos Mensais</div>
                <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{rendimentosUltimoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted border-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Fluxo de Caixa Antes 240 meses</div>
                <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{fluxoCaixaAntes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-muted border-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Parcela Pós-Contemplação</div>
                <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{parcelaPosContemplacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted border-none">
                              <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Renda passiva</div>
                  <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{rendaPassiva.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </CardContent>
            </Card>
            <Card className="bg-muted border-none">
                              <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Pago do Próprio Bolso</div>
                  <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{pagoProprioBolsoPercent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</div>
                  <div className="text-xs text-muted-foreground">({(pagoProprioBolso - acumuloCaixaFinal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</div>
                </CardContent>
            </Card>
            <Card className="bg-muted border-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Pago pelo Inquilino</div>
                <div className="text-2xl font-bold" style={{ color: '#A86E57' }}>{pagoPeloInquilinoPercent.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</div>
                <div className="text-xs text-muted-foreground">({(patrimonioNaContemplacao - (pagoProprioBolso - acumuloCaixaFinal)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Quarta seção - Gráfico de evolução patrimonial */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gráfico de Parcelas do Mês e Soma das Parcelas</CardTitle>
          <button onClick={() => setShowLegend((v) => !v)} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
            <Settings size={16} className="text-gray-300" />
          </button>
        </CardHeader>
        <CardContent>
          <InstallmentsChart data={installmentsChartData} showLegend={showLegend} />
        </CardContent>
      </Card>
      <DetailTable
        product={product}
        administrator={administrator}
        contemplationMonth={contemplationMonth}
        selectedCredits={selectedCredits}
        creditoAcessado={creditoAcessado}
        embutido={embutido}
        installmentType={installmentType}
        customAdminTaxPercent={customAdminTaxPercent}
        customReserveFundPercent={customReserveFundPercent}
        customAnnualUpdateRate={customAnnualUpdateRate}
        maxEmbeddedPercentage={maxEmbeddedPercentage}
        creditoAcessadoContemplacao={creditoAcessadoContemplacao}
        parcelaAfterContemplacao={parcelaAfterContemplacao}
        somaParcelasAteContemplacao={somaParcelasAteContemplacao}
        mesContemplacao={mesContemplacao}
        parcelaInicial={parcelaInicial}
        prazoTotal={prazoTotal}
        onTableDataGenerated={(tableData) => {
          setChartDataState(tableData.map(row => ({ ...row, month: row.mes, parcelaTabelaMes: row.valorParcela })));
          // Montar dados para o novo gráfico
          let soma = 0;
          let somaParcelas = 0;
          let rendaPassivaAcumulada = 0;
          const patrimonioInicial = patrimonioNaContemplacao;
          const mesInicioPatrimonio = mesContemplacao + periodoCompra;
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
            // Parâmetros para cálculo
            const percentualDiaria = (alavanca?.daily_percentage || 0) / 100;
            const taxaOcupacao = (alavanca?.occupancy_rate || 0) / 100;
            const despesasTotais = (alavanca?.total_expenses || 0) / 100;
            const percentualAdmin = (alavanca?.management_percentage || 0) / 100;
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
              // Parâmetros para cálculo
              const percentualDiaria = (alavanca?.daily_percentage || 0) / 100;
              const taxaOcupacao = (alavanca?.occupancy_rate || 0) / 100;
              const despesasTotais = (alavanca?.total_expenses || 0) / 100;
              const percentualAdmin = (alavanca?.management_percentage || 0) / 100;
              // Receita do mês
              const receitaMes = patrimonioAnual * percentualDiaria * (30 * taxaOcupacao);
              // Custos
              const custos = (patrimonioAnual * despesasTotais) + (patrimonioAnual * percentualDiaria * (30 * taxaOcupacao) * percentualAdmin);
              // Receita - Custos
              const receitaMenosCustos = receitaMes - custos;
              // Renda passiva e acumulada só após aquisição do patrimônio
              let rendaPassiva = 0;
              if (m >= mesInicioPatrimonio) {
                rendaPassiva = receitaMes - (custos + 0);
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
              });
            }
          }
          setInstallmentsChartData(chartData);
        }}
      />
    </div>
  );
}; 