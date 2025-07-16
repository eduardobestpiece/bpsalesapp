import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Interface para os dados de contemplação
interface ContemplationExample {
  frequency: number;
  type: 'simple' | 'scaled';
  withEmbedded: boolean;
}

// Interface para os dados de simulação
interface SimulationData {
  mode: 'aporte' | 'credito';
  value: number;
  installments: number;
  installmentType: 'full' | 'half' | 'reduced';
}

// Interface para o contexto
interface SimulatorContextType {
  administrator: Administrator;
  setAdministrator: (admin: Administrator) => void;
  product: Product;
  setProduct: (product: Product) => void;
  property: Property;
  setProperty: (property: Property) => void;
  contemplationMonth: number;
  setContemplationMonth: (month: number) => void;
  installmentType: 'full' | 'half' | 'reduced';
  setInstallmentType: (type: 'full' | 'half' | 'reduced') => void;
  contemplationExample: ContemplationExample;
  setContemplationExample: (example: ContemplationExample) => void;
  simulationData: SimulationData;
  setSimulationData: (data: SimulationData) => void;
}

// Criação do contexto
const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (context === undefined) {
    throw new Error('useSimulator deve ser usado dentro de um SimulatorProvider');
  }
  return context;
};

// Chaves para o localStorage
const STORAGE_KEYS = {
  ADMINISTRATOR: 'simulator_administrator',
  PRODUCT: 'simulator_product',
  PROPERTY: 'simulator_property',
  CONTEMPLATION_MONTH: 'simulator_contemplation_month',
  INSTALLMENT_TYPE: 'simulator_installment_type',
  CONTEMPLATION_EXAMPLE: 'simulator_contemplation_example',
  SIMULATION_DATA: 'simulator_simulation_data',
};

// Provider do contexto
export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Função para carregar dados do localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Erro ao carregar dados do localStorage para ${key}:`, error);
      return defaultValue;
    }
  };

  // Estados com persistência no localStorage
  const [administrator, setAdministratorState] = useState<Administrator>(
    () => loadFromStorage(STORAGE_KEYS.ADMINISTRATOR, DEFAULT_ADMINISTRATOR)
  );
  
  const [product, setProductState] = useState<Product>(
    () => loadFromStorage(STORAGE_KEYS.PRODUCT, DEFAULT_PRODUCT)
  );
  
  const [property, setPropertyState] = useState<Property>(
    () => loadFromStorage(STORAGE_KEYS.PROPERTY, DEFAULT_PROPERTY)
  );
  
  const [contemplationMonth, setContemplationMonthState] = useState<number>(
    () => loadFromStorage(STORAGE_KEYS.CONTEMPLATION_MONTH, 24)
  );
  
  const [installmentType, setInstallmentTypeState] = useState<'full' | 'half' | 'reduced'>(
    () => loadFromStorage(STORAGE_KEYS.INSTALLMENT_TYPE, 'full')
  );
  
  const [contemplationExample, setContemplationExampleState] = useState<ContemplationExample>(
    () => loadFromStorage(STORAGE_KEYS.CONTEMPLATION_EXAMPLE, {
      frequency: 60,
      type: 'simple',
      withEmbedded: true
    })
  );
  
  const [simulationData, setSimulationDataState] = useState<SimulationData>(
    () => loadFromStorage(STORAGE_KEYS.SIMULATION_DATA, {
      mode: 'aporte',
      value: 0,
      installments: 240,
      installmentType: 'full'
    })
  );

  // Funções para atualizar os estados e salvar no localStorage
  const setAdministrator = (admin: Administrator) => {
    setAdministratorState(admin);
    localStorage.setItem(STORAGE_KEYS.ADMINISTRATOR, JSON.stringify(admin));
  };

  const setProduct = (product: Product) => {
    setProductState(product);
    localStorage.setItem(STORAGE_KEYS.PRODUCT, JSON.stringify(product));
  };

  const setProperty = (property: Property) => {
    setPropertyState(property);
    localStorage.setItem(STORAGE_KEYS.PROPERTY, JSON.stringify(property));
  };

  const setContemplationMonth = (month: number) => {
    setContemplationMonthState(month);
    localStorage.setItem(STORAGE_KEYS.CONTEMPLATION_MONTH, JSON.stringify(month));
  };

  const setInstallmentType = (type: 'full' | 'half' | 'reduced') => {
    setInstallmentTypeState(type);
    localStorage.setItem(STORAGE_KEYS.INSTALLMENT_TYPE, JSON.stringify(type));
  };

  const setContemplationExample = (example: ContemplationExample) => {
    setContemplationExampleState(example);
    localStorage.setItem(STORAGE_KEYS.CONTEMPLATION_EXAMPLE, JSON.stringify(example));
  };

  const setSimulationData = (data: SimulationData) => {
    setSimulationDataState(data);
    localStorage.setItem(STORAGE_KEYS.SIMULATION_DATA, JSON.stringify(data));
  };

  return (
    <SimulatorContext.Provider
      value={{
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
        contemplationExample,
        setContemplationExample,
        simulationData,
        setSimulationData,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};