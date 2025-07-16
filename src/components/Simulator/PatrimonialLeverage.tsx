
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { EntityConfiguration } from './EntityConfiguration';
import { AdvancedResultsPanel } from './AdvancedResultsPanel';
import { DetailDrawer } from './DetailDrawer';
import { useSimulatorSync } from '@/hooks/useSimulatorSync';

export const PatrimonialLeverage = () => {
  const {
    administrator,
    setAdministrator,
    product,
    setProduct,
    property,
    setProperty,
    contemplationMonth,
    setContemplationMonth,
    installmentType,
    setInstallmentType,
    simulationData,
    updateSimulationMode,
    updateSimulationValue,
    updateInstallments,
    updateInstallmentType
  } = useSimulatorSync();
  
  const [showResults, setShowResults] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Atualiza os cálculos em tempo real quando os dados mudam
  useEffect(() => {
    if (showResults) {
      // Recalcula os resultados quando os dados mudam
      setShowResults(false);
      setTimeout(() => setShowResults(true), 0);
    }
  }, [administrator, product, property, contemplationMonth, installmentType]);

  const handleCalculate = () => {
    // Sincroniza os dados antes de calcular
    updateSimulationValue(product.nominalCreditValue);
    updateInstallments(product.termMonths);
    updateInstallmentType(installmentType);
    
    setShowResults(true);
  };

  // Cálculo dos ganhos mensais (short-stay)
  // 1. Valor da diária: patrimonioNaContemplacao * 0,06%
  const valorDiaria = patrimonioNaContemplacao * 0.0006;
  // 2. Ocupação: 30 * 70%
  const diasOcupacao = 30 * 0.7;
  // 3. Valor mensal: dias ocupados * valor da diária
  const valorMensal = valorDiaria * diasOcupacao;
  // 4. Taxa do Airbnb: valor mensal * 15%
  const taxaAirbnb = valorMensal * 0.15;
  // 5. Custos do imóvel: patrimonioNaContemplacao * 0.0035
  const custosImovel = patrimonioNaContemplacao * 0.0035;
  // 6. Custos totais: taxa do Airbnb + custos do imóvel
  const custosTotais = taxaAirbnb + custosImovel;
  // 7. Ganhos mensais: valor mensal - custos totais
  const ganhosMensais = valorMensal - custosTotais;

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
