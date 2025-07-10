
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MonthYearSelectorProps {
  monthOptions: number[];
  yearOptions: number[];
  monthReference: number | null;
  yearReference: number | null;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  disabled: boolean;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthYearSelector = ({
  monthOptions,
  yearOptions,
  monthReference,
  yearReference,
  onMonthChange,
  onYearChange,
  disabled
}: MonthYearSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="month_reference">Mês *</Label>
        <Select 
          value={monthReference ? monthReference.toString() : ''} 
          onValueChange={(value) => onMonthChange(parseInt(value))}
          disabled={disabled || monthOptions.length === 0}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {MONTH_NAMES[month - 1]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="year_reference">Ano *</Label>
        <Select 
          value={yearReference ? yearReference.toString() : ''} 
          onValueChange={(value) => onYearChange(parseInt(value))}
          disabled={disabled || yearOptions.length === 0}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o ano" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
