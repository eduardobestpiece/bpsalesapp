
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PropertyCharacteristics } from './PropertyCharacteristics';
import { LeverageTypes } from './LeverageTypes';
import { SingleLeverage } from './SingleLeverage';
import { ScaledLeverage } from './ScaledLeverage';
import { Administrator, Product } from '@/types/entities';

// Define the PropertyData interface locally to match PropertyCharacteristics
interface PropertyData {
  type: 'short-stay' | 'commercial' | 'residential';
  dailyRate?: number;
  monthlyRent?: number;
  occupancyRate?: number;
  fixedCosts: number;
  appreciationRate: number;
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

export const PatrimonialLeverageNew = () => {
  const [leverageType, setLeverageType] = useState<'single' | 'scaled'>('single');
  const [installmentType, setInstallmentType] = useState<'full' | 'half' | 'reduced'>('full');
  const [propertyData, setPropertyData] = useState<PropertyData>({
    type: 'short-stay' as const,
    dailyRate: 150,
    occupancyRate: 80,
    fixedCosts: 800,
    appreciationRate: 8
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Alavancagem Patrimonial</h2>
        <p className="text-muted-foreground">
          Simule diferentes estratégias de alavancagem patrimonial com consórcio
        </p>
      </div>

      {/* Características do Imóvel */}
      <PropertyCharacteristics 
        propertyData={propertyData}
        onPropertyChange={setPropertyData}
      />

      {/* Tipo de Alavancagem */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipo de Alavancagem</h3>
        <LeverageTypes 
          selectedType={leverageType}
          onTypeChange={setLeverageType}
        />
      </Card>

      {/* Configuração de Parcela */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tipo de Parcela</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setInstallmentType('full')}
            className={`p-4 rounded-lg border-2 transition-all ${
              installmentType === 'full' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Parcela Cheia</div>
            <div className="text-sm text-muted-foreground">100% do crédito</div>
          </button>
          
          <button
            onClick={() => setInstallmentType('half')}
            className={`p-4 rounded-lg border-2 transition-all ${
              installmentType === 'half' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Meia Parcela</div>
            <div className="text-sm text-muted-foreground">50% do crédito</div>
          </button>
          
          <button
            onClick={() => setInstallmentType('reduced')}
            className={`p-4 rounded-lg border-2 transition-all ${
              installmentType === 'reduced' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold">Parcela Reduzida</div>
            <div className="text-sm text-muted-foreground">75% do crédito</div>
          </button>
        </div>
      </Card>

      {/* Conteúdo baseado no tipo de alavancagem */}
      {leverageType === 'single' ? (
        <SingleLeverage 
          administrator={DEFAULT_ADMINISTRATOR}
          product={DEFAULT_PRODUCT}
          propertyData={propertyData}
          installmentType={installmentType}
        />
      ) : (
        <ScaledLeverage 
          administrator={DEFAULT_ADMINISTRATOR}
          product={DEFAULT_PRODUCT}
          propertyData={propertyData}
          installmentType={installmentType}
        />
      )}
    </div>
  );
};
