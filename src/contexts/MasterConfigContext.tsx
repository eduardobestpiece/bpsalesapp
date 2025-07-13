
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  status: 'active' | 'archived';
}

interface MasterConfigContextType {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  companies: Company[];
  loadingCompanies: boolean;
  userRole: 'master' | 'admin' | 'submaster' | null;
  canAccessModule: (module: string) => boolean;
  canEditEntity: (entity: string) => boolean;
}

const MasterConfigContext = createContext<MasterConfigContextType | undefined>(undefined);

export const useMasterConfig = () => {
  const context = useContext(MasterConfigContext);
  if (context === undefined) {
    throw new Error('useMasterConfig must be used within a MasterConfigProvider');
  }
  return context;
};

export const MasterConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [userRole, setUserRole] = useState<'master' | 'admin' | 'submaster' | null>(null);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
      
      // Auto-select first company if none selected
      if (data && data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Erro ao carregar empresas',
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchUserRole = async () => {
    try {
      // In a real implementation, this would come from authentication context
      // For now, defaulting to 'master' for development
      setUserRole('master');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const canAccessModule = (module: string): boolean => {
    if (userRole === 'master') return true;
    if (userRole === 'admin') {
      return ['administrators', 'products', 'installment_types', 'bid_types', 'entry_types', 'leverages'].includes(module);
    }
    if (userRole === 'submaster') {
      return ['installment_reductions'].includes(module);
    }
    return false;
  };

  const canEditEntity = (entity: string): boolean => {
    if (userRole === 'master') return true;
    if (userRole === 'admin') return true;
    if (userRole === 'submaster') {
      return entity === 'installment_reductions';
    }
    return false;
  };

  useEffect(() => {
    fetchCompanies();
    fetchUserRole();
  }, []);

  return (
    <MasterConfigContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId,
        companies,
        loadingCompanies,
        userRole,
        canAccessModule,
        canEditEntity,
      }}
    >
      {children}
    </MasterConfigContext.Provider>
  );
};
