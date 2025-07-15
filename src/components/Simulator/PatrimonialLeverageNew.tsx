
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { LeverageTypes } from './LeverageTypes';
import { SingleLeverage } from './SingleLeverage';
import { ScaledLeverage } from './ScaledLeverage';
import { LeverageSelector } from './LeverageSelector';
import { Administrator, Product } from '@/types/entities';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface LeverageData {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  daily_percentage?: number;
  rental_percentage?: number;
  occupancy_rate?: number;
  total_expenses?: number;
  fixed_property_value?: number;
}

interface PropertyData {
  type: 'short-stay' | 'commercial' | 'residential';
  dailyRate?: number;
  monthlyRent?: number;
  occupancyRate?: number;
  fixedCosts: number;
  appreciationRate: number;
}

interface PatrimonialLeverageNewProps {
  administrator?: Administrator;
  product?: Product;
  simulationData: {
    administrator: string;
    consortiumType: 'property' | 'vehicle';
    installmentType: string;
    value: number;
    term: number;
    updateRate: number;
    searchType: 'contribution' | 'credit';
    bidType?: string;
  };
  creditoAcessado?: number | null;
}

// Dados padrão baseados na documentação
const DEFAULT_ADMINISTRATOR: Administrator = {
  id: 'default-admin',
  name: 'Administradora Padrão',
  updateIndex: 'IPCA',
  updateMonth: 8,
  updateGracePeriod: 12,
  maxEmbeddedPercentage: 15,
  availableBidTypes: [
    { id: 'SORTEIO', name: 'Contemplação por Sorteio', params: {} },
    { id: 'LIVRE', name: 'Lance Livre', params: { minBidPct: 5, maxBidPct: 50, allowsEmbedded: true } }
  ]
};

const DEFAULT_PRODUCT: Product = {
  id: 'default-product',
  administratorId: 'default-admin',
  name: 'Plano Imobiliário 240x',
  nominalCreditValue: 300000,
  termMonths: 240,
  adminTaxPct: 25,
  reserveFundPct: 3,
  insurancePct: 2,
  reducedPercentage: 75,
  advanceInstallments: 0
};

export const PatrimonialLeverageNew = ({ 
  administrator = DEFAULT_ADMINISTRATOR, 
  product = DEFAULT_PRODUCT, 
  simulationData,
  creditoAcessado
}: PatrimonialLeverageNewProps) => {
  const [leverageType, setLeverageType] = useState<'single' | 'scaled'>('single');
  const [selectedLeverage, setSelectedLeverage] = useState<string>('');
  const [leverageData, setLeverageData] = useState<LeverageData | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    type: 'short-stay' as const,
    dailyRate: 150,
    occupancyRate: 80,
    fixedCosts: 800,
    appreciationRate: simulationData.updateRate || 8
  });
  // Valor base para cálculos: crédito acessado se disponível, senão valor digitado
  const valorBase = creditoAcessado && creditoAcessado > 0 ? creditoAcessado : simulationData.value;
  // Estado local para o campo de valor do imóvel (livre, inicia vazio)
  const [valorImovelManual, setValorImovelManual] = useState<number | ''>('');
  const [contemplationMonth, setContemplationMonth] = useState(6);
  // Estado para embutido
  const [embutido, setEmbutido] = useState<'com' | 'sem'>('com');

  // Determinar se a alavanca tem valor fixo
  const hasValorFixo = !!leverageData?.fixed_property_value;
  // Só mostrar campo valor imóvel se alavanca selecionada e não for valor fixo
  const showValorImovel = leverageData && !hasValorFixo;
  // Valor do imóvel considerado
  const valorImovel = hasValorFixo ? leverageData?.fixed_property_value || 0 : Number(valorImovelManual) || 0;
  // Percentual de embutido da administradora (0-1)
  const percentualEmbutido = (administrator?.maxEmbeddedPercentage || 0) / 100;
  // Percentual de despesas da alavanca (0-1)
  const percentualDespesas = (leverageData?.total_expenses || 0) / 100;
  // Percentual de ocupação da alavanca (0-1)
  const percentualOcupacao = (leverageData?.occupancy_rate || 0) / 100;

  // Valor base para cálculo de imóvel (considerando embutido)
  const valorImovelBase = embutido === 'com' ? valorImovel * (1 - percentualEmbutido) : valorImovel;
  // Número de imóveis (arredondado para cima)
  const numeroImoveis = useMemo(() => {
    if (!valorImovelBase || valorImovelBase === 0) return 0;
    return Math.ceil(valorBase / valorImovelBase);
  }, [valorBase, valorImovelBase]);
  // Despesas
  const despesas = useMemo(() => {
    if (!valorImovelBase || percentualDespesas === 0) return 0;
    return valorImovelBase * percentualDespesas;
  }, [valorImovelBase, percentualDespesas]);
  // Ocupação (em dias)
  const ocupacaoDias = useMemo(() => {
    if (!percentualOcupacao) return 0;
    return Math.round(30 * percentualOcupacao);
  }, [percentualOcupacao]);
  // Patrimônio na contemplação (para modalidade Aporte)
  const patrimonioContemplacao = useMemo(() => {
    if (simulationData.searchType === 'contribution') {
      return numeroImoveis * valorImovelBase;
    }
    return valorBase;
  }, [simulationData.searchType, numeroImoveis, valorImovelBase, valorBase]);

  // Atualizar valorização anual automaticamente baseado na taxa de atualização
  useEffect(() => {
    setPropertyData(prev => ({
      ...prev,
      appreciationRate: simulationData.updateRate || 8
    }));
  }, [simulationData.updateRate]);

  // Converter dados da alavanca para propertyData
  useEffect(() => {
    if (leverageData) {
      const newPropertyData: PropertyData = {
        type: leverageData.subtype === 'airbnb' ? 'short-stay' : 
              leverageData.subtype === 'commercial' ? 'commercial' : 'residential',
        appreciationRate: simulationData.updateRate || 8,
        fixedCosts: leverageData.total_expenses || 800,
      };

      if (leverageData.subtype === 'airbnb') {
        newPropertyData.dailyRate = leverageData.daily_percentage ? leverageData.daily_percentage * 10 : 150;
        newPropertyData.occupancyRate = leverageData.occupancy_rate || 80;
      } else {
        newPropertyData.monthlyRent = leverageData.rental_percentage ? leverageData.rental_percentage * 100 : 2500;
      }

      setPropertyData(newPropertyData);
    }
  }, [leverageData, simulationData.updateRate]);

  const handleLeverageChange = (leverageId: string) => {
    setSelectedLeverage(leverageId);
  };

  const handleLeverageData = (leverage: LeverageData | null) => {
    setLeverageData(leverage);
  };

  return (
    <div className="space-y-6">
      {/* Novo layout agrupado */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          {/* Esquerda: Características do Imóvel */}
          <div className="flex-1 min-w-[280px]">
            <div className="mb-2 text-lg font-bold">Características do Imóvel</div>
            <div className="flex gap-2 mb-2">
              <LeverageSelector
                selectedLeverage={selectedLeverage}
                onLeverageChange={setSelectedLeverage}
                onLeverageData={setLeverageData}
              />
              {showValorImovel && (
                <Input
                  type="number"
                  value={valorImovelManual}
                  onChange={e => setValorImovelManual(e.target.value === '' ? '' : Number(e.target.value))}
                  className="font-bold text-lg bg-gray-100 border-2 rounded-xl px-4 py-2 w-48"
                  style={{ minWidth: 180 }}
                  placeholder="Valor do imóvel"
                />
              )}
            </div>
            {/* Botões Com/Sem embutido */}
            <div className="flex gap-2 mb-2">
              <Button
                variant={embutido === 'com' ? 'default' : 'outline'}
                onClick={() => setEmbutido('com')}
              >
                Com embutido
              </Button>
              <Button
                variant={embutido === 'sem' ? 'default' : 'outline'}
                onClick={() => setEmbutido('sem')}
              >
                Sem embutido
              </Button>
            </div>
            {/* Informações do imóvel */}
            {leverageData && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                <div><b>Subtipo:</b> {leverageData?.subtype || '-'}</div>
                <div><b>Ocupação:</b> {ocupacaoDias} dias</div>
                <div><b>Despesas:</b> {despesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                <div><b>Número de imóveis:</b> {numeroImoveis}</div>
              </div>
            )}
          </div>
          {/* Direita: Exemplo de contemplação e botões */}
          <div className="flex-1 min-w-[320px] flex flex-col gap-4">
            <div className="mb-2 text-lg font-bold">Exemplo de contemplação</div>
            <div className="flex items-center gap-4 mb-2">
              <Slider
                value={[contemplationMonth]}
                onValueChange={v => setContemplationMonth(v[0])}
                min={6}
                max={product.termMonths}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={contemplationMonth}
                onChange={e => setContemplationMonth(Math.min(Math.max(6, Number(e.target.value)), product.termMonths))}
                min={6}
                max={product.termMonths}
                className="w-20 text-center border-2 rounded-xl"
              />
            </div>
            {/* Texto dinâmico de contemplação */}
            <div className="text-sm text-muted-foreground mb-2">
              {leverageType === 'single'
                ? `Contemplação em ${contemplationMonth} meses`
                : `Contemplação a cada ${contemplationMonth} meses`}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant={leverageType === 'single' ? 'default' : 'outline'}
                className={`flex-1 text-lg py-4 rounded-xl ${leverageType === 'single' ? '' : ''}`}
                onClick={() => setLeverageType('single')}
              >
                Alavancagem Simples
              </Button>
              <Button
                variant={leverageType === 'scaled' ? 'default' : 'outline'}
                className={`flex-1 text-lg py-4 rounded-xl ${leverageType === 'scaled' ? '' : ''}`}
                onClick={() => setLeverageType('scaled')}
              >
                Alavancagem Escalonada
              </Button>
            </div>
          </div>
        </div>
      </Card>
      {/* Conteúdo baseado no tipo de alavancagem */}
      {leverageData ? (
        leverageType === 'single' ? (
          <SingleLeverage 
            administrator={administrator}
            product={product}
            propertyData={propertyData}
            installmentType={simulationData.installmentType as 'full' | 'half' | 'reduced'}
            simulationData={{ ...simulationData, value: valorBase }}
            contemplationMonth={contemplationMonth}
            valorImovel={valorImovelBase}
            numeroImoveis={numeroImoveis}
            patrimonioContemplacao={patrimonioContemplacao}
          />
        ) : (
          <ScaledLeverage 
            administrator={administrator}
            product={product}
            propertyData={propertyData}
            installmentType={simulationData.installmentType as 'full' | 'half' | 'reduced'}
            simulationData={{ ...simulationData, value: valorBase }}
            contemplationMonth={contemplationMonth}
            valorImovel={valorImovelBase}
            numeroImoveis={numeroImoveis}
            patrimonioContemplacao={patrimonioContemplacao}
          />
        )
      ) : (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg">Selecione uma alavanca para visualizar os cálculos</p>
          </div>
        </Card>
      )}
    </div>
  );
};
