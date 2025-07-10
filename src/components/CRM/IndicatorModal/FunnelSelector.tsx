
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FunnelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  funnels: any[] | undefined;
  isFunnelsLoading: boolean;
  funnelsError: any;
  disabled: boolean;
}

export const FunnelSelector = ({ 
  value, 
  onValueChange, 
  funnels, 
  isFunnelsLoading, 
  funnelsError, 
  disabled 
}: FunnelSelectorProps) => {
  return (
    <div>
      <Label htmlFor="funnel_id">Funil *</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um funil" />
        </SelectTrigger>
        <SelectContent>
          {funnelsError ? (
            <div className="px-4 py-2 text-red-500 text-sm">
              Erro ao carregar funis: {funnelsError.message || 'Erro desconhecido'}
            </div>
          ) : isFunnelsLoading ? (
            <div className="px-4 py-2 text-muted-foreground text-sm">
              Carregando funis...
            </div>
          ) : funnels && funnels.length > 0 ? (
            funnels.map((funnel) => (
              <SelectItem key={funnel.id} value={funnel.id}>
                {funnel.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-4 py-2 text-muted-foreground text-sm">
              Nenhum funil disponível para seleção.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
