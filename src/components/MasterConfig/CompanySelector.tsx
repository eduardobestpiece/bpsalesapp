
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useMasterConfig } from '@/contexts/MasterConfigContext';

export const CompanySelector: React.FC = () => {
  const { selectedCompanyId, setSelectedCompanyId, companies, loadingCompanies } = useMasterConfig();

  if (loadingCompanies) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
        <Building2 className="w-4 h-4" />
        <span className="text-sm">Carregando empresas...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="w-4 h-4 text-gray-600" />
      <Select value={selectedCompanyId || ''} onValueChange={setSelectedCompanyId}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecione uma empresa" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
