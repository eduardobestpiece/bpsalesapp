import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EntityConfiguration } from './EntityConfiguration';
import { AdvancedResultsPanel } from './AdvancedResultsPanel';
import { CapitalGain } from './CapitalGain';
import { DetailTable } from './DetailTable';
import { SimulatorMenu } from './SimulatorMenu';
import { useSimulatorSync } from '@/hooks/useSimulatorSync';

export const UnifiedSimulator = () => {
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
    updateSimulationValue,
    updateInstallments,
    updateInstallmentType
  } = useSimulatorSync();

  const [showResults, setShowResults] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    credit: true,
    leverage: true,
    capital: true,
    detail: true
  });

  // Estado para créditos selecionados
  const [selectedCredits, setSelectedCredits] = useState<any[]>([]);

  // Refs para navegação
  const creditSectionRef = useRef<HTMLDivElement>(null);
  const leverageSectionRef = useRef<HTMLDivElement>(null);
  const capitalSectionRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  const handleCalculate = () => {
    updateSimulationValue(product.nominalCreditValue);
    updateInstallments(product.termMonths);
    updateInstallmentType(installmentType);
    setShowResults(true);
  };

  const handleNavigate = (section: string) => {
    const refs = {
      settings: creditSectionRef,
      home: leverageSectionRef,
      dollar: capitalSectionRef,
      search: detailSectionRef
    };

    const ref = refs[section as keyof typeof refs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleSection = (section: string) => {
    if (section === 'all') {
      setVisibleSections({
        credit: true,
        leverage: true,
        capital: true,
        detail: true
      });
    } else {
      const sectionMap = {
        settings: 'credit',
        home: 'leverage',
        dollar: 'capital',
        search: 'detail'
      };

      const targetSection = sectionMap[section as keyof typeof sectionMap];
      if (targetSection) {
        setVisibleSections(prev => ({
          ...prev,
          [targetSection]: !prev[targetSection as keyof typeof prev]
        }));
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      <SimulatorMenu 
        onNavigate={handleNavigate}
        onToggleSection={handleToggleSection}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {visibleSections.credit && (
          <div ref={creditSectionRef} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Crédito Acessado</h2>
              <Badge variant="outline">Configurações</Badge>
            </div>

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

                <Button
                  onClick={handleCalculate}
                  className="w-full bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition-colors"
                >
                  Calcular Simulação Avançada
                </Button>
              </div>
            </Card>
          </div>
        )}

        {visibleSections.leverage && (
          <div ref={leverageSectionRef} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Alavancagem Patrimonial</h2>
              <Badge variant="outline">Resultados</Badge>
            </div>

            {showResults && (
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
            )}
          </div>
        )}

        {visibleSections.capital && (
          <div ref={capitalSectionRef} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Ganho de Capital</h2>
              <Badge variant="outline">Financeiro</Badge>
            </div>

            <CapitalGain />
          </div>
        )}

        {visibleSections.detail && (
          <div ref={detailSectionRef} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Detalhamento do Consórcio</h2>
              <Badge variant="outline">Tabela Mês a Mês</Badge>
            </div>

            <DetailTable 
              product={product}
              administrator={{
                ...administrator,
                updateMonth: administrator.updateMonth || 8, // Agosto
                gracePeriodDays: administrator.gracePeriodDays || 90, // 90 dias de carência
                inccRate: administrator.inccRate || 6, // Taxa INCC 6%
                postContemplationAdjustment: administrator.postContemplationAdjustment || 0.5 // Ajuste pós contemplação 0.5%
              }}
              contemplationMonth={contemplationMonth}
              selectedCredits={selectedCredits}
              creditoAcessado={product.nominalCreditValue}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 