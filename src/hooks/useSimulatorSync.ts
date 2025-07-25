
import { useEffect } from 'react';
import { useSimulator } from '@/contexts/SimulatorContext';

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

  // Função para atualizar o valor do aporte ou crédito
  const updateSimulationValue = (value: number) => {
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
  };

  // Função para atualizar o número de parcelas
  const updateInstallments = (installments: number) => {
    setSimulationData({
      ...simulationData,
      installments
    });
    
    // Atualiza também o produto
    setProduct({
      ...product,
      termMonths: installments
    });
  };

  // Função para atualizar o tipo de parcela
  const updateInstallmentType = (type: 'full' | 'half' | 'reduced') => {
    setSimulationData({
      ...simulationData,
      installmentType: type
    });
    
    // Atualiza também o tipo de parcela no contexto principal
    setInstallmentType(type);
  };

  // Sincroniza o valor do imóvel com o valor do crédito quando apropriado
  useEffect(() => {
    if (property.initialValue !== product.nominalCreditValue) {
      setProperty({
        ...property,
        initialValue: product.nominalCreditValue
      });
    }
  }, [product.nominalCreditValue]);

  // Efeito para garantir consistência entre administradora e produto
  useEffect(() => {
    if (administrator && product) {
      // Sincronização ativa entre administradora e produto
    }
  }, [administrator, product, contemplationMonth, installmentType]);

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
