
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LeverageTypes } from './LeverageTypes';
import { SingleLeverage } from './SingleLeverage';
import { ScaledLeverage } from './ScaledLeverage';
import { LeverageSelector } from './LeverageSelector';
import { Administrator, Product } from '@/types/entities';
import { Label } from '@/components/ui/label';

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
  administrator: Administrator;
  product: Product;
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

export const PatrimonialLeverageNew = ({ simulationData }: PatrimonialLeverageNewProps) => {
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
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Alavancagem Patrimonial</h2>
        <p className="text-muted-foreground">
          Simule diferentes estratégias de alavancagem patrimonial com consórcio
        </p>
      </div>

      {/* Características do Imóvel e Tipos de Alavanca na mesma linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Características do Imóvel */}
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Características do Imóvel</Label>
            <LeverageSelector
              selectedLeverage={selectedLeverage}
              onLeverageChange={handleLeverageChange}
              onLeverageData={handleLeverageData}
            />
            
            {leverageData && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">{leverageData.name}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Tipo: {leverageData.type}</div>
                  {leverageData.subtype && <div>Subtipo: {leverageData.subtype}</div>}
                  {leverageData.occupancy_rate && <div>Taxa Ocupação: {leverageData.occupancy_rate}%</div>}
                  {leverageData.total_expenses && <div>Custos: R$ {leverageData.total_expenses}</div>}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tipo de Alavanca */}
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de Alavancagem</Label>
            <LeverageTypes 
              selectedType={leverageType}
              onTypeChange={setLeverageType}
            />
          </div>
        </Card>
      </div>

      {/* Conteúdo baseado no tipo de alavancagem */}
      {leverageData ? (
        leverageType === 'single' ? (
          <SingleLeverage 
            administrator={DEFAULT_ADMINISTRATOR}
            product={DEFAULT_PRODUCT}
            propertyData={propertyData}
            installmentType={simulationData.installmentType as 'full' | 'half' | 'reduced'}
            simulationData={simulationData}
          />
        ) : (
          <ScaledLeverage 
            administrator={DEFAULT_ADMINISTRATOR}
            product={DEFAULT_PRODUCT}
            propertyData={propertyData}
            installmentType={simulationData.installmentType as 'full' | 'half' | 'reduced'}
            simulationData={simulationData}
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
