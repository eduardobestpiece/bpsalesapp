
import { useState, useCallback, useMemo } from 'react';
import { SimulatorData } from '@/types/simulator';
import { calculateConsortium, calculateAirbnb, calculateCommercialProperty, calculatePatrimonialEvolution } from '@/utils/calculations';

export const useCalculations = (data: SimulatorData) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const consortiumData = useMemo(() => {
    try {
      return calculateConsortium(data);
    } catch (error) {
      console.error('Erro no cálculo do consórcio:', error);
      return null;
    }
  }, [data]);

  const airbnbData = useMemo(() => {
    if (!consortiumData) return null;
    try {
      return calculateAirbnb(consortiumData);
    } catch (error) {
      console.error('Erro no cálculo do Airbnb:', error);
      return null;
    }
  }, [consortiumData]);

  const commercialData = useMemo(() => {
    if (!consortiumData) return null;
    try {
      return calculateCommercialProperty(consortiumData);
    } catch (error) {
      console.error('Erro no cálculo da propriedade comercial:', error);
      return null;
    }
  }, [consortiumData]);

  const evolutionData = useMemo(() => {
    try {
      return calculatePatrimonialEvolution(data);
    } catch (error) {
      console.error('Erro no cálculo da evolução patrimonial:', error);
      return [];
    }
  }, [data]);

  const performCalculation = useCallback(async () => {
    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      // Simular delay para UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!consortiumData || !airbnbData) {
        throw new Error('Erro nos cálculos base');
      }
      
      return {
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
  }, [consortiumData, airbnbData, commercialData, evolutionData]);

  return {
    consortiumData,
    airbnbData,
    commercialData,
    evolutionData,
    isCalculating,
    calculationError,
    performCalculation
  };
};
