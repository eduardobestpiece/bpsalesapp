import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useFunnels } from '@/hooks/useFunnels';
import { useCompany } from '@/contexts/CompanyContext';

interface LeadsFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedFunnelIds: string[];
  onSelectedFunnelIdsChange: (funnelIds: string[]) => void;
}

export const LeadsFilters = ({
  searchTerm,
  onSearchTermChange,
  selectedFunnelIds,
  onSelectedFunnelIdsChange
}: LeadsFiltersProps) => {
  const { selectedCompanyId } = useCompany();
  const { data: funnels = [] } = useFunnels(selectedCompanyId, 'active');
  const [funnelPopoverOpen, setFunnelPopoverOpen] = useState(false);

  const handleFunnelToggle = (funnelId: string) => {
    if (selectedFunnelIds.includes(funnelId)) {
      onSelectedFunnelIdsChange(selectedFunnelIds.filter(id => id !== funnelId));
    } else {
      onSelectedFunnelIdsChange([...selectedFunnelIds, funnelId]);
    }
  };

  const handleRemoveFunnel = (funnelId: string) => {
    onSelectedFunnelIdsChange(selectedFunnelIds.filter(id => id !== funnelId));
  };

  const clearAllFilters = () => {
    onSearchTermChange('');
    onSelectedFunnelIdsChange([]);
  };

  const selectedFunnels = funnels.filter(funnel => selectedFunnelIds.includes(funnel.id));
  const hasFilters = searchTerm || selectedFunnelIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Campo de pesquisa por nome */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar leads por nome..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Multi-select de funis */}
        <Popover open={funnelPopoverOpen} onOpenChange={setFunnelPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto justify-start"
            >
              {selectedFunnelIds.length === 0 ? (
                'Selecionar funis'
              ) : (
                `${selectedFunnelIds.length} funil${selectedFunnelIds.length > 1 ? 'is' : ''} selecionado${selectedFunnelIds.length > 1 ? 's' : ''}`
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Pesquisar funis..." />
              <CommandList>
                <CommandEmpty>Nenhum funil encontrado.</CommandEmpty>
                <CommandGroup>
                  {funnels.map((funnel) => (
                    <CommandItem
                      key={funnel.id}
                      onSelect={() => handleFunnelToggle(funnel.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedFunnelIds.includes(funnel.id)}
                          onChange={() => handleFunnelToggle(funnel.id)}
                        />
                        <span>{funnel.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Botão para limpar filtros */}
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Badges dos funis selecionados */}
      {selectedFunnels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Funis:</span>
          {selectedFunnels.map((funnel) => (
            <Badge key={funnel.id} variant="secondary" className="flex items-center gap-1">
              {funnel.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemoveFunnel(funnel.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}; 