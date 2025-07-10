
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ReactInputMask from 'react-input-mask';

interface SalesRecommendationsInputsProps {
  funnel: any;
  salesValue: string;
  recommendationsCount: number;
  onSalesValueChange: (value: string) => void;
  onRecommendationsCountChange: (count: number) => void;
  disabled: boolean;
  isAutoLoading: boolean;
}

export const SalesRecommendationsInputs = ({
  funnel,
  salesValue,
  recommendationsCount,
  onSalesValueChange,
  onRecommendationsCountChange,
  disabled,
  isAutoLoading
}: SalesRecommendationsInputsProps) => {
  if (!funnel) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Valor das Vendas */}
      <div>
        <Label htmlFor="sales_value">
          Valor das Vendas (R$) {funnel.sales_value_mode === 'sistema' && '(Sistema)'}
        </Label>
        <ReactInputMask
          mask="999.999,99"
          value={salesValue}
          onChange={(e) => onSalesValueChange(e.target.value)}
          disabled={disabled || funnel.sales_value_mode === 'sistema' || isAutoLoading}
          placeholder="0,00"
        >
          {(inputProps: any) => <Input {...inputProps} />}
        </ReactInputMask>
      </div>

      {/* Número de Recomendações */}
      <div>
        <Label htmlFor="recommendations_count">
          Recomendações {funnel.recommendations_mode === 'sistema' && '(Sistema)'}
        </Label>
        <Input
          id="recommendations_count"
          type="number"
          min="0"
          value={recommendationsCount}
          onChange={(e) => onRecommendationsCountChange(parseInt(e.target.value) || 0)}
          disabled={disabled || funnel.recommendations_mode === 'sistema' || isAutoLoading}
        />
      </div>
    </div>
  );
};
