import { useState, useEffect } from 'react';

// Chaves para armazenamento no localStorage
export const SIMULATOR_STORAGE_KEYS = {
  SEARCH_TYPE: 'monteo_simulator_search_type',
  VALUE: 'monteo_simulator_value',
  TERM: 'monteo_simulator_term',
  INSTALLMENT_TYPE: 'monteo_simulator_installment_type',
};

// Evento personalizado para sincronização entre abas
const SIMULATOR_SYNC_EVENT = 'monteo_simulator_sync';

// Interface para os dados do simulador
export interface SimulatorSyncData {
  searchType: 'contribution' | 'credit';
  value: number;
  term: number;
  installmentType: string;
}

/**
 * Hook para sincronizar dados do simulador entre diferentes componentes e abas
 * @param initialData Dados iniciais do simulador
 * @param onChange Callback chamado quando os dados são alterados
 * @returns Objeto com dados sincronizados e função para atualizar
 */
export const useSimulatorSync = (
  initialData: SimulatorSyncData,
  onChange?: (data: SimulatorSyncData) => void
) => {
  // Estado local para os dados sincronizados
  const [syncedData, setSyncedData] = useState<SimulatorSyncData>(() => {
    try {
      // Tentar carregar dados do localStorage
      const searchType = localStorage.getItem(SIMULATOR_STORAGE_KEYS.SEARCH_TYPE) as 'contribution' | 'credit' || initialData.searchType;
      const valueStr = localStorage.getItem(SIMULATOR_STORAGE_KEYS.VALUE);
      const termStr = localStorage.getItem(SIMULATOR_STORAGE_KEYS.TERM);
      const installmentType = localStorage.getItem(SIMULATOR_STORAGE_KEYS.INSTALLMENT_TYPE) || initialData.installmentType;
      
      return {
        searchType: searchType || 'contribution',
        value: valueStr ? Number(valueStr) : initialData.value,
        term: termStr ? Number(termStr) : initialData.term,
        installmentType: installmentType || 'full',
      };
    } catch (e) {
      console.error('Erro ao carregar dados do simulador do localStorage:', e);
      return initialData;
    }
  });

  // Efeito para salvar dados no localStorage quando mudarem
  useEffect(() => {
    try {
      localStorage.setItem(SIMULATOR_STORAGE_KEYS.SEARCH_TYPE, syncedData.searchType);
      localStorage.setItem(SIMULATOR_STORAGE_KEYS.VALUE, syncedData.value.toString());
      localStorage.setItem(SIMULATOR_STORAGE_KEYS.TERM, syncedData.term.toString());
      localStorage.setItem(SIMULATOR_STORAGE_KEYS.INSTALLMENT_TYPE, syncedData.installmentType);
      
      // Disparar evento personalizado para sincronizar outras instâncias
      const event = new CustomEvent(SIMULATOR_SYNC_EVENT, { 
        detail: { ...syncedData, source: 'useSimulatorSync' } 
      });
      window.dispatchEvent(event);
      
      // Chamar callback se fornecido
      if (onChange) {
        onChange(syncedData);
      }
    } catch (e) {
      console.error('Erro ao salvar dados do simulador no localStorage:', e);
    }
  }, [syncedData, onChange]);

  // Efeito para ouvir eventos de sincronização de outras instâncias
  useEffect(() => {
    const handleSyncEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const newData = customEvent.detail;
      
      // Verificar se o evento veio de outra instância
      if (newData && newData.source !== 'useSimulatorSync') {
        setSyncedData({
          searchType: newData.searchType,
          value: newData.value,
          term: newData.term,
          installmentType: newData.installmentType,
        });
      }
    };
    
    // Adicionar listener para o evento personalizado
    window.addEventListener(SIMULATOR_SYNC_EVENT, handleSyncEvent);
    
    // Remover listener ao desmontar
    return () => {
      window.removeEventListener(SIMULATOR_SYNC_EVENT, handleSyncEvent);
    };
  }, []);

  // Função para atualizar um campo específico
  const updateField = (field: keyof SimulatorSyncData, value: any) => {
    setSyncedData(prev => ({ ...prev, [field]: value }));
  };

  return {
    data: syncedData,
    updateField,
  };
};