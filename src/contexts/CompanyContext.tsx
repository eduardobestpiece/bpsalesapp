import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  children: ReactNode;
  defaultCompanyId?: string;
}

export const CompanyProvider = ({ children, defaultCompanyId = '' }: CompanyProviderProps) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(defaultCompanyId);

  return (
    <CompanyContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      {children}
    </CompanyContext.Provider>
  );
}; 