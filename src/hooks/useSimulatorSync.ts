
import { useEffect, useCallback, useRef } from 'react';
import { useSimulator } from '@/contexts/SimulatorContext';
import { useDebounce } from './useDebounce';

/**
 * Hook personalizado para sincronizar dados entre componentes do simulador
 * Este hook garante que alterações em campos como "Modalidade", "Valor do aporte", etc.
 * sejam refletidas em tempo real em todos os componentes que usam esses dados.
 * 
 * IMPORTANTE: Garantia de sincronização entre gráfico e tabela de detalhamento
 */
export const useSimulatorSync = () => {
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
    setSimulationData
  } = useSimulator();

  // Função para atualizar o modo de simulação (aporte ou crédito)
  const updateSimulationMode = (mode: 'aporte' | 'credito') => {
    setSimulationData({
      ...simulationData,
      mode
    });
  };

  // Debouncing para otimizar performance - aumentado para reduzir lentidão
  const debouncedSimulationData = useDebounce(simulationData, 800);
  
  // Referência para evitar loops infinitos
  const isUpdatingRef = useRef(false);

  // Função para atualizar o valor do aporte ou crédito com debouncing
  const updateSimulationValue = useCallback((value: number) => {
    if (isUpdatingRef.current) return;
    
    setSimulationData({
      ...simulationData,
      value
    });
    
    // Se o valor do crédito for alterado, atualiza também o produto
    if (simulationData.mode === 'credito') {
      setProduct({
        ...product,
        nominalCreditValue: value
      });
    }
  }, [simulationData, product, setSimulationData, setProduct]);

  // Função para atualizar o número de parcelas com debouncing
  const updateInstallments = useCallback((installments: number) => {
    if (isUpdatingRef.current) return;
    
    setSimulationData({
      ...simulationData,
      installments
    });
    
    // Atualiza também o produto
    setProduct({
      ...product,
      termMonths: installments
    });
  }, [simulationData, product, setSimulationData, setProduct]);

  // Função para atualizar o tipo de parcela
  const updateInstallmentType = (type: 'full' | 'half' | 'reduced') => {
    setSimulationData({
      ...simulationData,
      installmentType: type
    });
    
    // Atualiza também o tipo de parcela no contexto principal
    setInstallmentType(type);
  };

  // Sincronização otimizada com debouncing para evitar loops infinitos
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    isUpdatingRef.current = true;
    
    // Timeout para permitir que outras atualizações terminem
    const timeoutId = setTimeout(() => {
      if (property.initialValue !== product.nominalCreditValue) {
        setProperty({
          ...property,
          initialValue: product.nominalCreditValue
        });
      }
      isUpdatingRef.current = false;
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      isUpdatingRef.current = false;
    };
  }, [debouncedSimulationData, product.nominalCreditValue]);

  // Efeito simplificado para sincronização
  useEffect(() => {
    if (isUpdatingRef.current) return;
    // Sincronização básica sem operações pesadas
  }, [administrator?.id, product?.id, contemplationMonth, installmentType]);

  return {
    // Dados do contexto
    administrator,
    product,
    property,
    contemplationMonth,
    installmentType,
    simulationData,
    
    // Funções de atualização
    updateSimulationMode,
    updateSimulationValue,
    updateInstallments,
    updateInstallmentType,
    
    // Funções originais do contexto
    setAdministrator,
    setProduct,
    setProperty,
    setContemplationMonth,
    setInstallmentType,
    setSimulationData
  };
};
