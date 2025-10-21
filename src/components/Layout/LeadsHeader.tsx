import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus } from 'lucide-react';
import { useCrmAuth } from '@/contexts/CrmAuthContext';

interface LeadsHeaderProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onAddLead: () => void;
  onOpenFilters: () => void;
}

export const LeadsHeader = ({ 
  searchTerm, 
  onSearchTermChange, 
  onAddLead, 
  onOpenFilters 
}: LeadsHeaderProps) => {
  const { userRole } = useCrmAuth();

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-end space-x-4">
          {/* Campo de pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome, sobrenome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          {/* Botão de Filtros */}
          <Button
            variant="outline"
            onClick={onOpenFilters}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>+ Filtros</span>
          </Button>
          
          {/* Botão de Adicionar Lead */}
          <Button
            onClick={onAddLead}
            disabled={userRole === 'submaster'}
            variant="brandPrimaryToSecondary"
            className="brand-radius flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Lead</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
