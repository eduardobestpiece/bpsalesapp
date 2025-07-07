
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalculationStatusProps {
  isCalculating: boolean;
  error: string | null;
  hasResults: boolean;
}

export const CalculationStatus = ({ isCalculating, error, hasResults }: CalculationStatusProps) => {
  if (isCalculating) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        <AlertDescription className="text-amber-800">
          Calculando simulação... Aguarde um momento.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Erro na simulação: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (hasResults) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Simulação calculada com sucesso!
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
