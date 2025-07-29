
import { useState, useCallback, useMemo } from 'react';
import { SimulatorData } from '@/types/simulator';
import { calculateConsortium, calculateAirbnb, calculateCommercialProperty, calculatePatrimonialEvolution } from '@/utils/calculations';
import { calculateAdvancedConsortium, calculateHalfInstallment, AdvancedCalculationResult } from '@/utils/advancedCalculations';

export const useCalculations = (data: SimulatorData) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Cálculos avançados com taxas
  const advancedConsortiumData = useMemo((): AdvancedCalculationResult | null => {
    try {
      return calculateAdvancedConsortium(data);
    } catch (error) {
      return null;
    }
  }, [data]);

  const halfInstallmentData = useMemo((): AdvancedCalculationResult | null => {
    if (!advancedConsortiumData) return null;
    try {
      return calculateHalfInstallment(advancedConsortiumData);
    } catch (error) {
      return null;
    }
  }, [advancedConsortiumData]);

  // Cálculos legados (mantidos para compatibilidade)
  const consortiumData = useMemo(() => {
    try {
      return calculateConsortium(data);
    } catch (error) {
      return null;
    }
  }, [data]);

  const airbnbData = useMemo(() => {
    if (!consortiumData) return null;
    try {
      return calculateAirbnb(consortiumData);
    } catch (error) {
      return null;
    }
  }, [consortiumData]);

  const commercialData = useMemo(() => {
    if (!consortiumData) return null;
    try {
      return calculateCommercialProperty(consortiumData);
    } catch (error) {
      return null;
    }
  }, [consortiumData]);

  const evolutionData = useMemo(() => {
    try {
      return calculatePatrimonialEvolution(data);
    } catch (error) {
      return [];
    }
  }, [data]);

  const performCalculation = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!advancedConsortiumData) {
        throw new Error('Erro nos cálculos avançados');
      }
      
      return {
        advanced: advancedConsortiumData,
        halfInstallment: halfInstallmentData,
        consortium: consortiumData,
        airbnb: airbnbData,
        commercial: commercialData,
        evolution: evolutionData
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido nos cálculos';
      setCalculationError(errorMessage);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [advancedConsortiumData, halfInstallmentData, consortiumData, airbnbData, commercialData, evolutionData]);

  return {
    advancedConsortiumData,
    halfInstallmentData,
    consortiumData,
    airbnbData,
    commercialData,
    evolutionData,
    isCalculating,
    calculationError,
    performCalculation
  };
};
