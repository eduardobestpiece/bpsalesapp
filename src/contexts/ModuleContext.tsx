
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Module = 'simulator' | 'crm';

interface ModuleContextType {
  currentModule: Module;
  setModule: (module: Module) => void;
  isSimulatorModule: boolean;
  isCrmModule: boolean;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const useModule = () => {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
};

interface ModuleProviderProps {
  children: ReactNode;
}

export const ModuleProvider = ({ children }: ModuleProviderProps) => {
  const [currentModule, setCurrentModule] = useState<Module>('simulator');

  const setModule = (module: Module) => {
    setCurrentModule(module);
  };

  const contextValue: ModuleContextType = {
    currentModule,
    setModule,
    isSimulatorModule: currentModule === 'simulator',
    isCrmModule: currentModule === 'crm',
  };

  return (
    <ModuleContext.Provider value={contextValue}>
      {children}
    </ModuleContext.Provider>
  );
};
