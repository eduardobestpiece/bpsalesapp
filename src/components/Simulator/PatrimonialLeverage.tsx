
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { EntityConfiguration } from './EntityConfiguration';
import { AdvancedResultsPanel } from './AdvancedResultsPanel';
import { DetailDrawer } from './DetailDrawer';
import { Administrator, Product, Property } from '@/types/entities';

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

const DEFAULT_PROPERTY: Property = {
  id: 'default-property',
  type: 'short-stay',
  initialValue: 300000,
  dailyRate: 150,
  fixedMonthlyCosts: 800,
  occupancyRatePct: 80,
  annualAppreciationPct: 8,
  contemplationMonth: 24
};

export const PatrimonialLeverage = () => {
  const [administrator, setAdministrator] = useState<Administrator>(DEFAULT_ADMINISTRATOR);
  const [product, setProduct] = useState<Product>(DEFAULT_PRODUCT);
  const [property, setProperty] = useState<Property>(DEFAULT_PROPERTY);
  const [contemplationMonth, setContemplationMonth] = useState(24);
  const [installmentType, setInstallmentType] = useState<'full' | 'half' | 'reduced'>('full');
  const [showResults, setShowResults] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const handleCalculate = () => {
    setShowResults(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - Entity Configuration */}
      <Card className="p-6">
        <EntityConfiguration 
          onAdministratorChange={setAdministrator}
          onProductChange={setProduct}
          onPropertyChange={setProperty}
        />
        
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Mês de Contemplação:</span>
            <input
              type="number"
              value={contemplationMonth}
              onChange={(e) => setContemplationMonth(parseInt(e.target.value))}
              className="w-20 px-2 py-1 border rounded text-sm"
              min="1"
              max={product.termMonths}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Tipo de Parcela:</span>
            <select
              value={installmentType}
              onChange={(e) => setInstallmentType(e.target.value as 'full' | 'half' | 'reduced')}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="full">Parcela Cheia</option>
              <option value="half">Meia Parcela</option>
              <option value="reduced">Parcela Reduzida</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCalculate}
              className="flex-1 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors"
            >
              Calcular Simulação Avançada
            </button>
            
            <button
              onClick={() => setDetailDrawerOpen(true)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Detalhes
            </button>
          </div>
        </div>
      </Card>

      {/* Right Panel - Advanced Results */}
      <Card className="p-6">
        <AdvancedResultsPanel 
          administrator={administrator}
          product={product}
          property={property}
          contemplationMonth={contemplationMonth}
          installmentType={installmentType}
          showResults={showResults}
        />
      </Card>

      <DetailDrawer 
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />
    </div>
  );
};
