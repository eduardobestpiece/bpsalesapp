
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface LeverageTypesProps {
  selectedType: 'single' | 'scaled';
  onTypeChange: (type: 'single' | 'scaled') => void;
}

export const LeverageTypes = ({ selectedType, onTypeChange }: LeverageTypesProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className={`cursor-pointer transition-all ${
        selectedType === 'single' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
      }`}>
        <CardContent className="p-6">
          <Button
            variant={selectedType === 'single' ? 'default' : 'outline'}
            onClick={() => onTypeChange('single')}
            className="w-full h-auto flex flex-col items-center gap-3 p-6"
          >
            <TrendingUp className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Alavancagem Única</div>
              <div className="text-sm opacity-80 mt-1">
                Uma propriedade contemplada
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card className={`cursor-pointer transition-all ${
        selectedType === 'scaled' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
      }`}>
        <CardContent className="p-6">
          <Button
            variant={selectedType === 'scaled' ? 'default' : 'outline'}
            onClick={() => onTypeChange('scaled')}
            className="w-full h-auto flex flex-col items-center gap-3 p-6"
          >
            <BarChart3 className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold">Alavancagem Escalonada</div>
              <div className="text-sm opacity-80 mt-1">
                Múltiplas propriedades ao longo do tempo
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
