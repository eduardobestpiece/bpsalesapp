
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { PeriodOption } from './types';

interface PeriodSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  periodOptions: PeriodOption[];
  disabled: boolean;
}

export const PeriodSelector = ({ 
  value, 
  onValueChange, 
  periodOptions, 
  disabled 
}: PeriodSelectorProps) => {
  return (
    <div>
      <Label htmlFor="period_date">Período *</Label>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
        required
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um período" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.length > 0 ? (
            periodOptions.map((option) => {
              const IconComponent = option.isMissing ? XCircle : 
                                  option.isAllowed ? CheckCircle : AlertCircle;
              const iconColor = option.isMissing ? "text-red-500" : 
                               option.isAllowed ? "text-green-500" : "text-yellow-500";
              
              return (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <IconComponent className={`h-4 w-4 ${iconColor}`} />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })
          ) : (
            <div className="px-4 py-2 text-muted-foreground text-sm">
              Nenhum período disponível para seleção.
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
