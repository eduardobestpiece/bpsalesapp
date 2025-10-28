import React, { createContext, useContext, useState, useEffect } from 'react';

interface CompanyContextType {
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: React.ReactNode;
  defaultCompanyId?: string;
}

// ID da empresa Best Piece (BP Sales) como padrão
const DEFAULT_COMPANY_ID = '334bf60e-ad45-4d1e-a4dc-8f09a8c5a12b';

export const CompanyProvider = ({ children, defaultCompanyId = DEFAULT_COMPANY_ID }: CompanyProviderProps) => {
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>(() => {
    return localStorage.getItem('selectedCompanyId') || defaultCompanyId;
  });

  // Atualiza localStorage sempre que selectedCompanyId mudar
  useEffect(() => {
    if (selectedCompanyId) {
      localStorage.setItem('selectedCompanyId', selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Setter que também atualiza o localStorage e força reload da página
  const setSelectedCompanyId = (id: string) => {
    const previousCompanyId = selectedCompanyId;
    
    setSelectedCompanyIdState(id);
    if (id) {
      localStorage.setItem('selectedCompanyId', id);
    }
    
    // Se a empresa mudou e não é a primeira vez, forçar reload da página
    if (previousCompanyId && previousCompanyId !== id) {
      console.log('🔄 Empresa alterada - recarregando página para atualizar dados');
      console.log('🔄 Empresa anterior:', previousCompanyId);
      console.log('🔄 Nova empresa:', id);
      
      // Pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      {children}
    </CompanyContext.Provider>
  );
}; 